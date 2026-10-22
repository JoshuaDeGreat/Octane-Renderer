import { Texture } from 'pixi.js';

/** One drawn layer of a group badge: a part texture at its cell position, the first layer of a part tinted. */
export interface GroupBadgeLayer
{
    texture: Texture;
    x: number;
    y: number;
    tint: number | null;
}

type Canvas2D = HTMLCanvasElement | OffscreenCanvas;

export type CanvasFactory = (width: number, height: number) => Canvas2D | null;

export const createBadgeCanvas: CanvasFactory = (width, height) =>
{
    if(typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    return canvas;
};

/** The decoded image behind a texture (ImageBitmap / HTMLImageElement / canvas), or null when only the GPU has it. */
const getDrawableSource = (texture: Texture): CanvasImageSource | null =>
{
    const resource = (texture?.source as { resource?: unknown } | undefined)?.resource;

    if(!resource) return null;

    if((typeof ImageBitmap !== 'undefined') && (resource instanceof ImageBitmap)) return resource;
    if((typeof HTMLImageElement !== 'undefined') && (resource instanceof HTMLImageElement)) return resource;
    if((typeof HTMLCanvasElement !== 'undefined') && (resource instanceof HTMLCanvasElement)) return resource;
    if((typeof OffscreenCanvas !== 'undefined') && (resource instanceof OffscreenCanvas)) return resource;

    return null;
};

const toCssColor = (color: number): string => `#${ (color & 0xFFFFFF).toString(16).padStart(6, '0') }`;

/**
 * Draws a group badge on a 2D canvas: no GPU render and no read back, so the image a window shows is the canvas
 * itself. A tinted layer is multiplied by its colour and keeps its own alpha, as a Pixi sprite tint does.
 * Returns null when a part image is not drawable here; the caller then falls back to the GPU path.
 */
export const drawGroupBadge = (layers: GroupBadgeLayer[], width: number, height: number, createCanvas: CanvasFactory = createBadgeCanvas): Canvas2D | null =>
{
    if(!layers.length) return null;

    const canvas = createCanvas(width, height);
    const context = canvas?.getContext('2d');

    if(!canvas || !context) return null;

    context.imageSmoothingEnabled = false;

    for(const layer of layers)
    {
        const source = getDrawableSource(layer.texture);

        if(!source) return null;

        const { x: frameX, y: frameY, width: frameWidth, height: frameHeight } = layer.texture.frame;

        if(layer.tint === null || (layer.tint & 0xFFFFFF) === 0xFFFFFF)
        {
            context.drawImage(source, frameX, frameY, frameWidth, frameHeight, layer.x, layer.y, frameWidth, frameHeight);
            continue;
        }

        const tinted = createCanvas(frameWidth, frameHeight);
        const tintContext = tinted?.getContext('2d');

        if(!tinted || !tintContext) return null;

        tintContext.imageSmoothingEnabled = false;
        tintContext.drawImage(source, frameX, frameY, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
        tintContext.globalCompositeOperation = 'multiply';
        tintContext.fillStyle = toCssColor(layer.tint);
        tintContext.fillRect(0, 0, frameWidth, frameHeight);
        tintContext.globalCompositeOperation = 'destination-in';
        tintContext.drawImage(source, frameX, frameY, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);

        context.drawImage(tinted, layer.x, layer.y);
    }

    return canvas;
};
