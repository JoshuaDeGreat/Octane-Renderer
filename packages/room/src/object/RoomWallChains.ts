import { IVector3D } from '@octane/api';
import { Point } from 'pixi.js';
import { TILE_HOLE } from './RoomHeightMap';
import { RoomWallData } from './RoomWallData';

// The wall chains of a room: which of them the room hides, the ones next to holes, and the lookup of a chain by its ends.

export function hidePeninsulaWallChains(wallData: RoomWallData): void
{
    let chainEnd: number;
    let turnDepth: number;
    let shouldHide: boolean;
    let hideIndex: number;
    let index = 0;
    const count: number = wallData.count;
    while(index < count)
    {
        const chainStart = index;

        chainEnd = index;
        turnDepth = 0;
        shouldHide = false;
        while(((!(wallData.getBorder(index))) && (index < count)))
        {
            if(wallData.getLeftTurn(index))
            {
                turnDepth++;
            }
            else
            {
                if(turnDepth > 0)
                {
                    turnDepth--;
                }
            }
            if(turnDepth > 1)
            {
                shouldHide = true;
            }
            chainEnd = index;
            index++;
        }
        if(shouldHide)
        {
            hideIndex = chainStart;
            while(hideIndex <= chainEnd)
            {
                wallData.setHideWall(hideIndex, true);
                hideIndex++;
            }
        }
        index++;
    }
}

export function resolveOriginalWallIndex(startPoint: Point, endPoint: Point, wallData: RoomWallData): number
{
    let corner: Point;
    let wallEnd: Point;
    let cornerMinY: number;
    let cornerMaxY: number;
    let cornerMinX: number;
    let cornerMaxX: number;
    const minY: number = Math.min(startPoint.y, endPoint.y);
    const maxY: number = Math.max(startPoint.y, endPoint.y);
    const minX: number = Math.min(startPoint.x, endPoint.x);
    const maxX: number = Math.max(startPoint.x, endPoint.x);
    const count: number = wallData.count;
    let index = 0;
    while(index < count)
    {
        corner = wallData.getCorner(index);
        wallEnd = wallData.getEndPoint(index);
        if(startPoint.x == endPoint.x)
        {
            if(((corner.x == startPoint.x) && (wallEnd.x == startPoint.x)))
            {
                cornerMinY = Math.min(corner.y, wallEnd.y);
                cornerMaxY = Math.max(corner.y, wallEnd.y);
                if(((cornerMinY <= minY) && (maxY <= cornerMaxY)))
                {
                    return index;
                }
            }
        }
        else
        {
            if(startPoint.y == endPoint.y)
            {
                if(((corner.y == startPoint.y) && (wallEnd.y == startPoint.y)))
                {
                    cornerMinX = Math.min(corner.x, wallEnd.x);
                    cornerMaxX = Math.max(corner.x, wallEnd.x);
                    if(((cornerMinX <= minX) && (maxX <= cornerMaxX)))
                    {
                        return index;
                    }
                }
            }
        }
        index++;
    }
    return -1;
}

export function hideOriginallyHiddenWalls(wallData: RoomWallData, originalWallData: RoomWallData): void
{
    let corner: Point;
    let endPoint: Point;
    let directionVector: IVector3D;
    let length: number;
    let originalIndex: number;
    const count: number = wallData.count;
    let index = 0;
    while(index < count)
    {
        if(!wallData.getHideWall(index))
        {
            corner = wallData.getCorner(index);
            endPoint = new Point(corner.x, corner.y);
            directionVector = RoomWallData.WALL_DIRECTION_VECTORS[wallData.getDirection(index)];
            length = wallData.getLength(index);
            endPoint.x = (endPoint.x + (directionVector.x * length));
            endPoint.y = (endPoint.y + (directionVector.y * length));
            originalIndex = resolveOriginalWallIndex(corner, endPoint, originalWallData);
            if(originalIndex >= 0)
            {
                if(originalWallData.getHideWall(originalIndex))
                {
                    wallData.setHideWall(index, true);
                }
            }
            else
            {
                wallData.setHideWall(index, true);
            }
        }
        index++;
    }
}

export function updateWallsNextToHoles(wallData: RoomWallData, getTileHeight: (x: number, y: number) => number): void
{
    let corner: Point;
    let direction: number;
    let length: number;
    let directionVector: IVector3D;
    let normalVector: IVector3D;
    let holeCount: number;
    let offset: number;
    const count: number = wallData.count;
    let index = 0;
    while(index < count)
    {
        if(!wallData.getHideWall(index))
        {
            corner = wallData.getCorner(index);
            direction = wallData.getDirection(index);
            length = wallData.getLength(index);
            directionVector = RoomWallData.WALL_DIRECTION_VECTORS[direction];
            normalVector = RoomWallData.WALL_NORMAL_VECTORS[direction];
            holeCount = 0;
            offset = 0;
            while(offset < length)
            {
                if(getTileHeight(((corner.x + (offset * directionVector.x)) - normalVector.x), ((corner.y + (offset * directionVector.y)) - normalVector.y)) == TILE_HOLE)
                {
                    if(((offset > 0) && (holeCount == 0)))
                    {
                        wallData.setLength(index, offset);
                        break;
                    }
                    holeCount++;
                }
                else
                {
                    if(holeCount > 0)
                    {
                        wallData.moveCorner(index, holeCount);
                        break;
                    }
                }
                offset++;
            }
            if(holeCount == length)
            {
                wallData.setHideWall(index, true);
            }
        }
        index++;
    }
}
