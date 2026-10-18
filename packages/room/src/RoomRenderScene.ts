import { IPlaneDrawingData, IRoomObject, IRoomObjectSpriteVisualization, IRoomPlane, IRoomRenderingCanvas, RoomObjectCategory, RoomObjectSpriteData } from '@octane/api';
import { Vector3d } from '@octane/utils';
import { Point, Rectangle } from 'pixi.js';
import { PlaneDrawingData } from './object/visualization/room/PlaneDrawingData';

// What the scene builder needs from the room engine.
export interface IRoomRenderSceneEngine
{
    activeRoomId: number;
    getRoomObject(roomId: number, objectId: number, category: number): IRoomObject;
    getRoomObjects(roomId: number, category: number): IRoomObject[];
    getRoomObjectScreenLocation(roomId: number, objectId: number, objectType: number, canvasId?: number): Point;
}

export interface IRoomRenderSceneOptions
{
    imageLibraryUrl?: string;
    groupBadgeUrl?: string;
    // The palette's source attribute for a "<asset>@<palette>" sprite of this object type (AIR getPaletteXML(..).@source).
    getPaletteSource?: (objectType: string, paletteName: string) => string;
}

interface ISortedPlane
{
    plane: IRoomPlane;
    z: number;
}

const MANNEQUIN_TYPE: string = 'boutique_mannequin1';
const MANNEQUIN_MAGIC_X_OFFSET: number = 1;
const MANNEQUIN_MAGIC_Y_OFFSET: number = -16;
const AVATAR_WATER_EFFECT_MAGIC_Y_OFFSET: number = -52;
const MAX_EXTERNAL_IMAGE_COUNT: number = 30;
// A group badge named by its code, for a server that draws it (no group.badge.url imager).
export const GROUP_BADGE_PREFIX: string = 'group_badge:';

// AS3 int(): toward zero, 32 bits.
const toInt = (value: number): number => (Math.trunc(Number(value) || 0) | 0);

/**
 * Behaviour from the AIR client (the scene builder in com.sulake.habbo.room.utils, decompiled as §_-i18§):
 * collects the sprites and planes inside a screen rectangle as the JSON scene the camera sends to the server.
 * One instance builds one scene: getFurniData first, then getRoomPlanes, like AIR's getRenderRoomMessage.
 */
export class RoomRenderScene
{
    private _engine: IRoomRenderSceneEngine;
    private _options: IRoomRenderSceneOptions;
    private _firstSpriteZ: number = NaN;
    private _spriteCount: number = 0;
    private _externalImageCount: number = 0;

    constructor(engine: IRoomRenderSceneEngine, options: IRoomRenderSceneOptions = {})
    {
        this._engine = engine;
        this._options = options;
    }

    public get spriteCount(): number
    {
        return this._spriteCount;
    }

    /** True when group.badge.url points at a badge imager: a URL with %imagerdata% in it, not the bare placeholder. */
    public static hasGroupBadgeImager(groupBadgeUrl: string): boolean
    {
        if(!groupBadgeUrl) return false;

        const url = groupBadgeUrl.trim();

        return (url.indexOf('%imagerdata%') >= 0) && (url !== '%imagerdata%');
    }

    public static sortQuadPoints(p1: Point, p2: Point, p3: Point, p4: Point): Point[]
    {
        const points: Point[] = [];

        if(p1.x === p2.x) points.push(p1, p3, p2, p4);
        else if(p1.x === p3.x) points.push(p1, p2, p3, p4);
        else if(((p2.x < p1.x) && (p2.y > p1.y)) || ((p2.x > p1.x) && (p2.y < p1.y))) points.push(p1, p3, p2, p4);
        else points.push(p1, p2, p3, p4);

        let swap: Point = null;

        if(points[0].x < points[1].x)
        {
            swap = points[0];
            points[0] = points[1];
            points[1] = swap;
            swap = points[2];
            points[2] = points[3];
            points[3] = swap;
        }

        if(points[0].y < points[2].y)
        {
            swap = points[0];
            points[0] = points[2];
            points[2] = swap;
            swap = points[1];
            points[1] = points[3];
            points[3] = swap;
        }

        return points;
    }

    // flash.geom.Rectangle.intersects: empty rectangles never intersect.
    private static intersects(a: Rectangle, b: Rectangle): boolean
    {
        if((a.width <= 0) || (a.height <= 0) || (b.width <= 0) || (b.height <= 0)) return false;

        return ((a.x < (b.x + b.width)) && (b.x < (a.x + a.width)) && (a.y < (b.y + b.height)) && (b.y < (a.y + a.height)));
    }

    private static isSpriteInViewPort(sprite: RoomObjectSpriteData, rect: Rectangle, canvas: IRoomRenderingCanvas): boolean
    {
        const bounds = new Rectangle((sprite.x + toInt(canvas.screenOffsetX)), (sprite.y + toInt(canvas.screenOffsetY)), sprite.width, sprite.height);

        return RoomRenderScene.intersects(bounds, rect);
    }

    private static getSpriteList(object: IRoomObject): RoomObjectSpriteData[]
    {
        const visualization = (object && object.visualization) as unknown as IRoomObjectSpriteVisualization;

        if(!visualization || (typeof visualization.getSpriteList !== 'function')) return null;

        return visualization.getSpriteList();
    }

    private addMannequinSprites(sprites: RoomObjectSpriteData[]): RoomObjectSpriteData[]
    {
        const result: RoomObjectSpriteData[] = [];

        for(const sprite of sprites)
        {
            if((sprite.objectType === MANNEQUIN_TYPE) && sprite.name && (sprite.name.indexOf('mannequin_') === 0))
            {
                const object = this._engine.getRoomObject(this._engine.activeRoomId, sprite.objectId, RoomObjectCategory.FLOOR);
                const parts = (object ? RoomRenderScene.getSpriteList(object) : null);

                if(parts)
                {
                    for(const part of parts)
                    {
                        part.x = toInt(part.x + sprite.x + (sprite.width / 2) + MANNEQUIN_MAGIC_X_OFFSET);
                        part.y = toInt(part.y + sprite.y + sprite.height + MANNEQUIN_MAGIC_Y_OFFSET);
                        part.z = (part.z + sprite.z);

                        result.push(part);
                    }
                }
            }
            else
            {
                result.push(sprite);
            }
        }

        return result;
    }

    /**
     * AIR getFurniData: the canvas sprites plus every avatar's figure parts (getSpriteList), moved into place, sorted
     * back to front, cut to the rectangle and written as the "sprites" JSON array. excludedObjectId leaves one avatar
     * out (AIR passes the own user's room index when the photo must not show it).
     */
    public getFurniData(rect: Rectangle, canvas: IRoomRenderingCanvas, excludedObjectId: number = -1): string
    {
        const roomId = this._engine.activeRoomId;
        let sprites: RoomObjectSpriteData[] = [ ...(canvas.getSortableSpriteList() || []) ];
        const canvasSprites = [ ...sprites ];
        const units = (this._engine.getRoomObjects(roomId, RoomObjectCategory.UNIT) || []);

        for(const unit of units)
        {
            if(!unit || (unit.id === excludedObjectId)) continue;

            const parts = RoomRenderScene.getSpriteList(unit);

            if(!parts) continue;

            let z = 0;
            let y = 0;

            for(const sprite of canvasSprites)
            {
                if(sprite.name === ('avatar_' + unit.id))
                {
                    z = sprite.z;
                    y = toInt((sprite.y + sprite.height) - (canvas.geometry.scale / 4));
                    break;
                }
            }

            const location = this._engine.getRoomObjectScreenLocation(roomId, unit.id, RoomObjectCategory.UNIT, canvas.id);

            if(!location) continue;

            if(y === 0) y = toInt(location.y);

            for(const part of parts)
            {
                part.x = toInt(part.x + (location.x - toInt(canvas.screenOffsetX)));
                part.y = toInt(part.y + y);
                part.z = (part.z + z);

                if(part.name && ((part.name.indexOf('h_std_fx29_') === 0) || (part.name.indexOf('h_std_fx185_') === 0))) part.y += AVATAR_WATER_EFFECT_MAGIC_Y_OFFSET;

                sprites.push(part);
            }
        }

        sprites = this.addMannequinSprites(sprites);

        // AIR sorts by z, highest first; equal depths keep their order here.
        sprites = sprites
            .map((sprite, index) => ({ sprite, index }))
            .sort((a, b) =>
            {
                const az = a.sprite.z;
                const bz = b.sprite.z;

                if(az < bz) return 1;
                if(az > bz) return -1;

                return (a.index - b.index);
            })
            .map(entry => entry.sprite);

        const result: Record<string, unknown>[] = [];

        for(const sprite of sprites)
        {
            if(!sprite.name || !sprite.name.length) continue;

            if(sprite.name.indexOf('tile_cursor_') === 0) continue;

            if(!RoomRenderScene.isSpriteInViewPort(sprite, rect, canvas)) continue;

            if((excludedObjectId >= 0) && (sprite.objectId === excludedObjectId)) continue;

            result.push(this.getSpriteDataObject(sprite, rect, canvas));

            if(!this._firstSpriteZ) this._firstSpriteZ = sprite.z;

            this._spriteCount++;
        }

        return JSON.stringify(result);
    }

    public getRoomRenderingModifiers(): string
    {
        return JSON.stringify({});
    }

    private getSpriteDataObject(sprite: RoomObjectSpriteData, rect: Rectangle, canvas: IRoomRenderingCanvas): Record<string, unknown>
    {
        const data: Record<string, unknown> = {};

        let name = sprite.name;
        let paletteName: string = null;

        if(name.indexOf('@') !== -1)
        {
            const parts = name.split('@');

            name = parts[0];
            paletteName = parts[1];
        }

        if(paletteName && sprite.objectType && this._options.getPaletteSource)
        {
            const source = this._options.getPaletteSource(sprite.objectType, paletteName);

            if((source !== null) && (source !== undefined)) data.paletteSourceName = (source + '');
        }

        name = name.replace('%image.library.url%', (this._options.imageLibraryUrl ?? ''));

        let isGroupBadge = false;

        if(name.indexOf('%group.badge.url%') !== -1)
        {
            name = name.replace('%group.badge.url%', '');

            // With a badge imager (group.badge.url with %imagerdata%) the name is its URL, as in AIR. Our client
            // builds group badges itself, so without one the server is told the badge code and draws the badge.
            if(RoomRenderScene.hasGroupBadgeImager(this._options.groupBadgeUrl)) name = this._options.groupBadgeUrl.replace('%imagerdata%', name);
            else
            {
                name = (GROUP_BADGE_PREFIX + name);
                isGroupBadge = true;
            }
        }

        data.name = name;
        data.x = ((sprite.x - rect.x) + toInt(canvas.screenOffsetX));
        data.y = ((sprite.y - rect.y) + toInt(canvas.screenOffsetY));
        data.z = sprite.z;

        if(sprite.alpha && (sprite.alpha.toString() !== '255')) data.alpha = sprite.alpha;

        if(sprite.flipH) data.flipH = sprite.flipH;

        if(sprite.skew) data.skew = sprite.skew;

        if(sprite.frame) data.frame = sprite.frame;

        if(sprite.color && sprite.color.length > 0) data.color = toInt(Number(sprite.color));

        if(sprite.blendMode && (sprite.blendMode !== 'normal')) data.blendMode = sprite.blendMode;

        if(name.indexOf('http') === 0)
        {
            data.width = sprite.width;
            data.height = sprite.height;

            this._externalImageCount++;

            if(this._externalImageCount > MAX_EXTERNAL_IMAGE_COUNT) data.name = 'box';
        }
        else if(isGroupBadge)
        {
            // The server draws the badge at the size the client drew it, like an external image.
            data.width = sprite.width;
            data.height = sprite.height;
        }

        if(sprite.posture) data.posture = sprite.posture;

        return data;
    }

    private makeBackgroundPlane(rect: Rectangle, color: number, planes: IPlaneDrawingData[]): IPlaneDrawingData
    {
        const corners = RoomRenderScene.sortQuadPoints(new Point(0, 0), new Point(rect.width, 0), new Point(0, rect.height), new Point(rect.width, rect.height));

        let z = 0;

        if(planes.length > 0)
        {
            z = Number(planes[0].z);

            if(this._firstSpriteZ) z = Math.max(this._firstSpriteZ, z);
        }
        else
        {
            z = (this._firstSpriteZ ? this._firstSpriteZ : 0);
        }

        z += ((this._spriteCount * 1.776104) + (planes.length * 2.31743));

        const plane = new PlaneDrawingData(null, color);

        plane.cornerPoints = corners;
        plane.z = z;

        return plane;
    }

    private sortRoomPlanes(planes: IRoomPlane[], canvas: IRoomRenderingCanvas): ISortedPlane[]
    {
        const byId: Map<number, ISortedPlane> = new Map();

        let z = 1;

        if(this._firstSpriteZ) z += this._firstSpriteZ;

        for(const plane of planes) byId.set(plane.uniqueId, { plane, z });

        // Highest z first; our plane sprites carry the plane's unique id as their id (AIR planeId).
        const planeSprites = [ ...(canvas.getPlaneSortableSprites() || []) ].sort((a, b) => (a.z - b.z)).reverse();
        const sorted: ISortedPlane[] = [];

        for(const planeSprite of planeSprites)
        {
            const sprite = planeSprite.sprite;

            if(!sprite) continue;

            const entry = byId.get(sprite.id);

            if(!entry) continue;

            byId.delete(sprite.id);

            entry.z = planeSprite.z;
            sorted.push(entry);
        }

        return sorted.concat([ ...byId.values() ]);
    }

    /**
     * AIR getRoomPlanes: every visible room plane that reaches into the rectangle, with its drawing data, corner
     * points relative to the rectangle and depth, after a background plane in the room background colour.
     */
    public getRoomPlanes(rect: Rectangle, canvas: IRoomRenderingCanvas, backgroundColor: number): IPlaneDrawingData[]
    {
        const result: IPlaneDrawingData[] = [];
        const roomObject = this._engine.getRoomObject(this._engine.activeRoomId, -1, RoomObjectCategory.ROOM);
        const visualization = (roomObject && roomObject.visualization) as unknown as { planes?: IRoomPlane[] };

        if(!visualization || !Array.isArray(visualization.planes)) return result;

        const geometry = canvas.geometry;
        const halfWidth = Math.trunc(canvas.width / 2);
        const halfHeight = Math.trunc(canvas.height / 2);
        const offsetX = toInt(canvas.screenOffsetX);
        const offsetY = toInt(canvas.screenOffsetY);

        for(const { plane, z } of this.sortRoomPlanes(visualization.planes, canvas))
        {
            const leftEnd = Vector3d.sum(plane.location, plane.leftSide);
            const p1 = geometry.getScreenPoint(plane.location);
            const p2 = geometry.getScreenPoint(leftEnd);
            const p3 = geometry.getScreenPoint(Vector3d.sum(plane.location, plane.rightSide));
            const p4 = geometry.getScreenPoint(Vector3d.sum(leftEnd, plane.rightSide));

            if(!p1 || !p2 || !p3 || !p4) continue;

            let outsideX = 0;
            let outsideY = 0;

            for(const point of [ p1, p2, p3, p4 ])
            {
                point.x += (halfWidth + offsetX - rect.x);
                point.y += (halfHeight + offsetY - rect.y);

                if(point.x < 0) outsideX--;
                else if(point.x >= rect.width) outsideX++;

                if(point.y < 0) outsideY--;
                else if(point.y >= rect.height) outsideY++;
            }

            if((Math.abs(outsideX) === 4) || (Math.abs(outsideY) === 4)) continue;

            const corners = RoomRenderScene.sortQuadPoints(p1, p2, p3, p4);

            for(const drawingData of (plane.getDrawingDatas(geometry) || []))
            {
                drawingData.cornerPoints = corners;
                drawingData.z = z;

                result.push(drawingData);
            }
        }

        result.unshift(this.makeBackgroundPlane(rect, backgroundColor, result));

        return result;
    }
}
