import { IRoomObject, IRoomPlane, IRoomRenderingCanvas, IVector3D, RoomObjectCategory, RoomObjectSpriteData } from '@octane/api';
import { RenderRoomMessageComposer } from '@octane/communication';
import { Vector3d } from '@octane/utils';
import { Point, Rectangle } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { PlaneDrawingData, RoomRenderScene } from '@octane/room';

const spriteData = (values: Partial<RoomObjectSpriteData>): RoomObjectSpriteData => Object.assign(new RoomObjectSpriteData(), { color: '16777215', alpha: 255, blendMode: 'normal' }, values);

// A plain isometric projection, enough to place the test plane.
const geometry = {
    scale: 64,
    getScreenPoint: (v: IVector3D) => new Point(((v.x * 32) - (v.y * 32)), (((v.x * 16) + (v.y * 16)) - (v.z * 32)))
};

const makeCanvas = (sprites: RoomObjectSpriteData[]) => ({
    id: 1,
    width: 800,
    height: 600,
    screenOffsetX: 10,
    screenOffsetY: 20,
    geometry,
    getSortableSpriteList: () => sprites,
    getPlaneSortableSprites: () => [ { sprite: { id: 7 }, z: 60.5 } ]
}) as unknown as IRoomRenderingCanvas;

const wallPlane = {
    uniqueId: 7,
    type: 1,
    location: new Vector3d(0, 0, 0),
    leftSide: new Vector3d(0, 2, 0),
    rightSide: new Vector3d(0, 0, 2),
    color: 0xFFFFFF,
    getDrawingDatas: () =>
    {
        const data = new PlaneDrawingData(null, 0xAABBCC, true);

        data.addAssetColumn([ 'wall_texture_64_0_wall_color_basic', '' ]);

        return [ data ];
    }
} as unknown as IRoomPlane;

const makeEngine = (avatarParts: RoomObjectSpriteData[]) =>
{
    const avatar = { id: 5, visualization: { getSpriteList: () => avatarParts.map(part => Object.assign(new RoomObjectSpriteData(), part)) } } as unknown as IRoomObject;
    const room = { id: -1, visualization: { planes: [ wallPlane ] } } as unknown as IRoomObject;

    return {
        activeRoomId: 12,
        getRoomObjects: (roomId: number, category: number) => ((category === RoomObjectCategory.UNIT) ? [ avatar ] : []),
        getRoomObject: (roomId: number, objectId: number, category: number) => ((category === RoomObjectCategory.ROOM) ? room : null),
        getRoomObjectScreenLocation: () => new Point(400, 300)
    };
};

const canvasSprites = () => [
    spriteData({ objectId: 3, name: 'chair_64_a_2_0', x: 300, y: 220, z: 50.5, width: 40, height: 60, objectType: 'chair', flipH: true }),
    spriteData({ objectId: 5, name: 'avatar_5', x: 370, y: 190, z: 40.25, width: 64, height: 110 }),
    spriteData({ objectId: 9, name: 'tile_cursor_64_a_0_0', x: 320, y: 300, z: 45, width: 64, height: 32 }),
    spriteData({ objectId: 4, name: 'plant_64_a_0_0', x: 0, y: 0, z: 10, width: 10, height: 10 }),
    spriteData({ objectId: 6, name: 'rare_dragonlamp_64_a_0_0@3', x: 500, y: 250, z: 30, width: 40, height: 90, objectType: 'rare_dragonlamp', blendMode: 'add', alpha: 128 }),
    spriteData({ objectId: 8, name: 'http://photos.example/12_34_small.png', x: 450, y: 210, z: 20, width: 32, height: 32, skew: 0.5, frame: true })
];

const bodyPart = () => [ spriteData({ name: 'h_std_bd_1_2_0', x: -20, y: -80, z: -0, width: 30, height: 50, color: '0xffcc99', alpha: undefined, blendMode: undefined }) ];

const buildScene = () =>
{
    const scene = new RoomRenderScene(makeEngine(bodyPart()), {
        imageLibraryUrl: 'https://images.example/c_images/',
        groupBadgeUrl: 'https://images.example/badge/%imagerdata%.png',
        getPaletteSource: (objectType, paletteName) => ((objectType === 'rare_dragonlamp' && paletteName === '3') ? 'rare_dragonlamp_palette_3' : null)
    });
    const canvas = makeCanvas(canvasSprites());
    const rect = new Rectangle(300, 200, 320, 320);
    const sprites = scene.getFurniData(rect, canvas);
    const planes = scene.getRoomPlanes(rect, canvas, 0x000000);

    return { scene, sprites, planes };
};

describe('RoomRenderScene (AIR camera scene)', () =>
{
    it('sorts quad points like AIR sortQuadPoints', () =>
    {
        const sorted = RoomRenderScene.sortQuadPoints(new Point(0, 0), new Point(320, 0), new Point(0, 320), new Point(320, 320));

        expect(sorted.map(point => [ point.x, point.y ])).toEqual([ [ 320, 320 ], [ 0, 320 ], [ 320, 0 ], [ 0, 0 ] ]);

        const wall = RoomRenderScene.sortQuadPoints(new Point(110, 120), new Point(46, 152), new Point(110, 56), new Point(46, 88));

        expect(wall.map(point => [ point.x, point.y ])).toEqual([ [ 110, 120 ], [ 46, 152 ], [ 110, 56 ], [ 46, 88 ] ]);

        const crossed = RoomRenderScene.sortQuadPoints(new Point(10, 10), new Point(0, 20), new Point(20, 30), new Point(5, 40));

        expect(crossed.map(point => [ point.x, point.y ])).toEqual([ [ 5, 40 ], [ 0, 20 ], [ 20, 30 ], [ 10, 10 ] ]);
    });

    it('writes the sprites back to front, relative to the frame, with the avatar parts in place', () =>
    {
        const { sprites, scene } = buildScene();

        expect(JSON.parse(sprites)).toEqual([
            { name: 'chair_64_a_2_0', x: 10, y: 40, z: 50.5, flipH: true, color: 16777215 },
            { name: 'avatar_5', x: 80, y: 10, z: 40.25, color: 16777215 },
            { name: 'h_std_bd_1_2_0', x: 80, y: 24, z: 40.25, color: 0xFFCC99 },
            { paletteSourceName: 'rare_dragonlamp_palette_3', name: 'rare_dragonlamp_64_a_0_0', x: 210, y: 70, z: 30, alpha: 128, color: 16777215, blendMode: 'add' },
            { name: 'http://photos.example/12_34_small.png', x: 160, y: 30, z: 20, skew: 0.5, frame: true, color: 16777215, width: 32, height: 32 }
        ]);
        expect(scene.spriteCount).toBe(5);
    });

    it('moves water effect sprites up and leaves out one avatar on request', () =>
    {
        const parts = [ spriteData({ name: 'h_std_fx29_1_0_0', x: 0, y: 0, z: 0, width: 10, height: 10 }) ];
        const scene = new RoomRenderScene(makeEngine(parts));
        const canvas = makeCanvas([ spriteData({ objectId: 5, name: 'avatar_5', x: 370, y: 190, z: 40, width: 64, height: 110 }) ]);
        const rect = new Rectangle(0, 0, 800, 600);

        expect(JSON.parse(scene.getFurniData(rect, canvas)).find((entry: { name: string }) => entry.name === 'h_std_fx29_1_0_0').y).toBe(((190 + 110 - 16) - 52) + 20);
        expect(JSON.parse(new RoomRenderScene(makeEngine(parts)).getFurniData(rect, canvas, 5))).toEqual([]);
    });

    it('names the 31st external image "box" and resolves the image library and badge URLs', () =>
    {
        const sprites = [
            spriteData({ name: '%image.library.url%album1584/ACH_1.png', x: 300, y: 200, z: 200, width: 5, height: 5 }),
            spriteData({ name: '%group.badge.url%b0503Xs09114', x: 300, y: 200, z: 199, width: 5, height: 5 }),
            ...Array.from({ length: 30 }, (_, index) => spriteData({ name: `http://photos.example/${ index }.png`, x: 300, y: 200, z: 100 - index, width: 5, height: 5 }))
        ];

        const scene = new RoomRenderScene(makeEngine([]), { imageLibraryUrl: 'https://images.example/c_images/', groupBadgeUrl: 'https://images.example/badge/%imagerdata%.png' });
        const data = JSON.parse(scene.getFurniData(new Rectangle(300, 200, 320, 320), makeCanvas(sprites))) as { name: string }[];

        // Resolved library and badge images are external images too and count toward AIR's 30.
        expect(data[0].name).toBe('https://images.example/c_images/album1584/ACH_1.png');
        expect(data[1].name).toBe('https://images.example/badge/b0503Xs09114.png');
        expect(data[29].name).toBe('http://photos.example/27.png');
        expect(data[30].name).toBe('box');
        expect(data[31].name).toBe('box');
    });

    it('gives the background plane first, then the planes in the frame with their corners and depth', () =>
    {
        const { planes } = buildScene();

        expect(planes).toHaveLength(2);
        expect(planes[0].cornerPoints.map(point => [ point.x, point.y ])).toEqual([ [ 320, 320 ], [ 0, 320 ], [ 320, 0 ], [ 0, 0 ] ]);
        expect(planes[0].z).toBeCloseTo((60.5 + (5 * 1.776104) + 2.31743), 10);
        expect(planes[1].cornerPoints.map(point => [ point.x, point.y ])).toEqual([ [ 110, 120 ], [ 46, 152 ], [ 110, 56 ], [ 46, 88 ] ]);
        expect(planes[1].z).toBe(60.5);
        expect(planes[1].color).toBe(0xAABBCC);
    });

    it('feeds the composer the AIR scene string', () =>
    {
        const { sprites, planes } = buildScene();
        const composer = new RenderRoomMessageComposer();

        composer.assignRenderData(planes, sprites, '{}', 12, 0, 1700000000123);
        composer.compressData();

        expect(composer.renderDataString).toBe(SAMPLE_SCENE);
    });
});

// Status, timestamp and checksum checked against an independent port of the AS3 compressData.
const SAMPLE_SCENE = '{ "planes" : [{"z":71.69794999999999,"cornerPoints":[{"x":320,"y":320},{"x":0,"y":320},{"x":320,"y":0},{"x":0,"y":0}],"color":0,"bottomAligned":false,"texCols":[]},{"z":60.5,"cornerPoints":[{"x":110,"y":120},{"x":46,"y":152},{"x":110,"y":56},{"x":46,"y":88}],"color":11189196,"bottomAligned":true,"texCols":[{"assetNames":["wall_texture_64_0_wall_color_basic",""]}]}],"sprites" : [{"name":"chair_64_a_2_0","x":10,"y":40,"z":50.5,"flipH":true,"color":16777215},{"name":"avatar_5","x":80,"y":10,"z":40.25,"color":16777215},{"name":"h_std_bd_1_2_0","x":80,"y":24,"z":40.25,"color":16764057},{"paletteSourceName":"rare_dragonlamp_palette_3","name":"rare_dragonlamp_64_a_0_0","x":210,"y":70,"z":30,"alpha":128,"color":16777215,"blendMode":"add"},{"name":"http://photos.example/12_34_small.png","x":160,"y":30,"z":20,"skew":0.5,"frame":true,"color":16777215,"width":32,"height":32}],"modifiers" : {},"filters" : [],"roomid" : 12,"status" : 19,"timestamp" : 1700000000175,"checksum" : 51588 }';
