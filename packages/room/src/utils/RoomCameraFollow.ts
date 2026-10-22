import { Point, Rectangle } from 'pixi.js';
import { RoomCamera } from './RoomCamera';

// The arithmetic of the room camera: where it may aim, how much room the followed object has on the canvas, and when it moves.

/** Where the camera may aim, given the bounds of the room: held back at its edges, or centred when the room is smaller than the canvas. */
export interface CameraTargetClamp
{
    offsetPoint: Point;
    targetZ: number;
    limitedX: boolean;
    limitedY: boolean;
    centeredX: boolean;
    centeredY: boolean;
}

export const clampCameraTarget = (
    offsetPoint: Point,
    targetZ: number,
    canvasRectangle: Rectangle,
    scaleX: number,
    scaleY: number,
    halfCanvasWidthInTiles: number,
    halfCanvasHeightInTiles: number,
    boundLeft: number,
    boundTop: number,
    boundRight: number,
    boundBottom: number
): CameraTargetClamp =>
{
    let limitedX = false;
    let limitedY = false;
    let centeredX = false;
    let centeredY = false;
    const boundsWidth = Math.round(((boundRight - boundLeft) * scaleX));

    if(boundsWidth < canvasRectangle.width)
    {
        targetZ = 2;
        offsetPoint.x = ((boundRight + boundLeft) / 2);
        centeredX = true;
    }
    else
    {
        if(offsetPoint.x > (boundRight - halfCanvasWidthInTiles))
        {
            offsetPoint.x = (boundRight - halfCanvasWidthInTiles);
            limitedX = true;
        }
        if(offsetPoint.x < (boundLeft + halfCanvasWidthInTiles))
        {
            offsetPoint.x = (boundLeft + halfCanvasWidthInTiles);
            limitedX = true;
        }
    }
    const boundsHeight = Math.round(((boundBottom - boundTop) * scaleY));
    if(boundsHeight < canvasRectangle.height)
    {
        targetZ = 2;
        offsetPoint.y = ((boundBottom + boundTop) / 2);
        centeredY = true;
    }
    else
    {
        if(offsetPoint.y > (boundBottom - halfCanvasHeightInTiles))
        {
            offsetPoint.y = (boundBottom - halfCanvasHeightInTiles);
            limitedY = true;
        }
        if(offsetPoint.y < (boundTop + halfCanvasHeightInTiles))
        {
            offsetPoint.y = (boundTop + halfCanvasHeightInTiles);
            limitedY = true;
        }
        if(limitedY)
        {
            offsetPoint.y = (offsetPoint.y / (scaleY / scaleX));
        }
    }

    return { offsetPoint, targetZ, limitedX, limitedY, centeredX, centeredY };
};

/** The share of the canvas the followed object may leave before the camera moves, at the top, the bottom and the sides. */
export interface CameraMargins
{
    marginTopFraction: number;
    marginBottomFraction: number;
    marginXFraction: number;
}

export const getCameraMargins = (roomCamera: RoomCamera, width: number, height: number): CameraMargins =>
{
    let marginTopFraction = 0.35;
    let marginBottomFraction = 0.2;
    let marginXFraction = 0.2;
    if((marginXFraction * width) > 100)
    {
        marginXFraction = (100 / width);
    }
    if((marginTopFraction * height) > 150)
    {
        marginTopFraction = (150 / height);
    }
    if((marginBottomFraction * height) > 150)
    {
        marginBottomFraction = (150 / height);
    }
    if((((roomCamera.limitedLocationX) && (roomCamera.screenWd == width)) && (roomCamera.screenHt == height)))
    {
        marginXFraction = 0;
    }
    if((((roomCamera.limitedLocationY) && (roomCamera.screenWd == width)) && (roomCamera.screenHt == height)))
    {
        marginTopFraction = 0;
        marginBottomFraction = 0;
    }

    return { marginTopFraction, marginBottomFraction, marginXFraction };
};

/** Shrinks the canvas rectangle to the area inside the margins, and moves it so that it is centred on the followed object. */
export const applyCameraMargins = (canvasRectangle: Rectangle, { marginTopFraction, marginBottomFraction, marginXFraction }: CameraMargins): void =>
{
    const minWidth = 10;
    const minHeight = 10;

    canvasRectangle.width = (canvasRectangle.width * (1 - (marginXFraction * 2)));
    canvasRectangle.height = (canvasRectangle.height * (1 - (marginTopFraction + marginBottomFraction)));

    if(canvasRectangle.width < minWidth)
    {
        canvasRectangle.width = minWidth;
    }

    if(canvasRectangle.height < minHeight)
    {
        canvasRectangle.height = minHeight;
    }

    if((marginTopFraction + marginBottomFraction) > 0)
    {
        canvasRectangle.x += (-(canvasRectangle.width) / 2);
        canvasRectangle.y += (-(canvasRectangle.height) * (marginBottomFraction / (marginTopFraction + marginBottomFraction)));
    }
    else
    {
        canvasRectangle.x += (-(canvasRectangle.width) / 2);
        canvasRectangle.y += (-(canvasRectangle.height) / 2);
    }
};

/** Whether the camera gets a new target: the object left the area, the canvas or the room changed size, or a centred axis is no longer centred. */
export const needsNewCameraTarget = (
    screenPoint: Point,
    canvasRectangle: Rectangle,
    roomCamera: RoomCamera,
    centeredX: boolean,
    centeredY: boolean,
    width: number,
    height: number,
    bounds: Rectangle
): boolean =>
{
    return ((((((((screenPoint.x < canvasRectangle.left) || (screenPoint.x > canvasRectangle.right)) && (!(roomCamera.centeredLocX))) || (((screenPoint.y < canvasRectangle.top) || (screenPoint.y > canvasRectangle.bottom)) && (!(roomCamera.centeredLocY)))) || (((centeredX) && (!(roomCamera.centeredLocX))) && (!(roomCamera.screenWd == width)))) || (((centeredY) && (!(roomCamera.centeredLocY))) && (!(roomCamera.screenHt == height)))) || ((!(roomCamera.roomWd == bounds.width)) || (!(roomCamera.roomHt == bounds.height)))) || ((!(roomCamera.screenWd == width)) || (!(roomCamera.screenHt == height))));
};
