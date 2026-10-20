import { IVariableFxColorTransform, IVariableFxImage, IVariableFxRect, VariableFxBitmap, VariableFxBlendMode } from './VariableFxBitmap';

export const variableFxRect = (x: number, y: number, width: number, height: number): IVariableFxRect => ({ x: (x | 0), y: (y | 0), width: (width | 0), height: (height | 0) });

const clampOpacity = (opacity: number): number => ((opacity <= 0) ? 0 : ((opacity >= 255) ? 255 : opacity));

/** An opacity as a colour transform; none at full opacity. */
const opacityTransform = (opacity: number): IVariableFxColorTransform =>
{
    const alpha = clampOpacity(opacity);

    return ((alpha >= 255) ? null : { red: 1, green: 1, blue: 1, alpha: (alpha / 255) });
};

/** An ARGB tint as a colour transform: rgb multipliers, the alpha times the opacity. */
export const variableFxTintTransform = (argb: number, opacity: number = 255): IVariableFxColorTransform =>
{
    const alpha = clampOpacity(opacity);

    return {
        red: (((argb >>> 16) & 255) / 255),
        green: (((argb >>> 8) & 255) / 255),
        blue: ((argb & 255) / 255),
        alpha: ((((argb >>> 24) & 255) * alpha) / 65025)
    };
};

const withOpacity = (transform: IVariableFxColorTransform, opacity: number): IVariableFxColorTransform =>
{
    if(!transform) return opacityTransform(opacity);

    return { red: transform.red, green: transform.green, blue: transform.blue, alpha: (transform.alpha * (clampOpacity(opacity) / 255)) };
};

/**
 * AIR's VariableFxBitmapComposer: the drawing primitives every fx painter is built from. Layers
 * are drawn whole or as chunks of their source, three-sliced (the middle stretched or tiled) to a
 * width, tiled over a rect, tinted, and always kept inside the target and an optional clip.
 */
export class VariableFxBitmapComposer
{
    constructor(private readonly _bitmap: VariableFxBitmap)
    {}

    public get bitmap(): VariableFxBitmap
    {
        return this._bitmap;
    }

    public clear(argb: number = 0): void
    {
        this.fillRect(0, 0, this._bitmap.width, this._bitmap.height, argb);
    }

    public fillRect(x: number, y: number, width: number, height: number, argb: number): void
    {
        const bounds = this._bitmap.targetBounds(x, y, width, height);

        if((bounds.left >= bounds.right) || (bounds.top >= bounds.bottom)) return;

        this._bitmap.fillRect(bounds.left, bounds.top, (bounds.right - bounds.left), (bounds.bottom - bounds.top), argb);
    }

    public drawLayer(image: IVariableFxImage, x: number, y: number, blend: VariableFxBlendMode = VariableFxBlendMode.NORMAL, opacity: number = 255, clip: IVariableFxRect = null): void
    {
        const alpha = clampOpacity(opacity);

        if((alpha <= 0) || !image) return;
        if(clip && ((clip.width <= 0) || (clip.height <= 0))) return;

        this._bitmap.draw(image, 1, (x | 0), (y | 0), opacityTransform(alpha), blend, (clip ? variableFxRect(clip.x, clip.y, Math.max(0, clip.width), Math.max(0, clip.height)) : null));
    }

    public drawTintedLayer(image: IVariableFxImage, x: number, y: number, argb: number, blend: VariableFxBlendMode = VariableFxBlendMode.NORMAL, opacity: number = 255, clip: IVariableFxRect = null): void
    {
        if(!image) return;

        this._bitmap.draw(image, 1, (x | 0), (y | 0), variableFxTintTransform(argb, opacity), blend, (clip ? variableFxRect(clip.x, clip.y, Math.max(0, clip.width), Math.max(0, clip.height)) : null));
    }

    /**
     * Draws `image` at (`x`, `y`) with its alpha taken from the red channel of `mask` at
     * (`maskX`, `maskY`), inside `clip`.
     */
    public drawMaskedLayer(image: IVariableFxImage, mask: IVariableFxImage, x: number, y: number, maskX: number, maskY: number, blend: VariableFxBlendMode, opacity: number, clip: IVariableFxRect = null): void
    {
        if(!image || !mask) return;

        this._bitmap.drawAlphaMasked(image, x, y, mask, maskX, maskY, blend, opacity, clip);
    }

    /**
     * Draws `image` `width` wide: its left `leftWidth` px as they are, the middle stretched, the
     * right `rightWidth` px as they are. A tint applies to all three parts.
     */
    public drawThreeSlice(image: IVariableFxImage, leftWidth: number, rightWidth: number, width: number, x: number, y: number, blend: VariableFxBlendMode = VariableFxBlendMode.NORMAL, opacity: number = 255, clip: IVariableFxRect = null, tintArgb: number = null): void
    {
        if(!image) return;

        const left = Math.max(0, (leftWidth | 0));
        const right = Math.max(0, (rightWidth | 0));
        const total = Math.max(0, (width | 0));
        const sourceMiddle = Math.max(0, (image.width - left - right));
        const targetMiddle = Math.max(0, (total - left - right));
        const transform = ((tintArgb === null || tintArgb === undefined) ? opacityTransform(opacity) : variableFxTintTransform((tintArgb >>> 0), opacity));

        this.drawChunkWith(image, 0, 0, Math.min(left, total), image.height, x, y, blend, clip, transform);

        if((sourceMiddle > 0) && (targetMiddle > 0)) this.drawStretchedChunk(image, left, sourceMiddle, image.height, (x + left), y, targetMiddle, blend, clip, transform);

        const rightPart = Math.min(right, Math.max(0, (total - left - targetMiddle)));

        if(rightPart > 0) this.drawChunkWith(image, (image.width - rightPart), 0, rightPart, image.height, (x + total - rightPart), y, blend, clip, transform);
    }

    /** As drawThreeSlice, with the middle tiled instead of stretched. */
    public drawRepeatedThreeSlice(image: IVariableFxImage, leftWidth: number, rightWidth: number, width: number, x: number, y: number, blend: VariableFxBlendMode = VariableFxBlendMode.NORMAL, opacity: number = 255, clip: IVariableFxRect = null): void
    {
        if(!image) return;

        const left = Math.max(0, (leftWidth | 0));
        const right = Math.max(0, (rightWidth | 0));
        const total = Math.max(0, (width | 0));
        const sourceMiddle = Math.max(0, (image.width - left - right));
        const targetMiddle = Math.max(0, (total - left - right));

        this.drawChunk(image, 0, 0, Math.min(left, total), image.height, x, y, blend, opacity, clip);

        if((sourceMiddle > 0) && (targetMiddle > 0)) this.drawTiledChunk(image, variableFxRect(left, 0, sourceMiddle, image.height), (x + left), y, targetMiddle, image.height, blend, opacity, clip);

        const rightPart = Math.min(right, Math.max(0, (total - left - targetMiddle)));

        if(rightPart > 0) this.drawChunk(image, (image.width - rightPart), 0, rightPart, image.height, (x + total - rightPart), y, blend, opacity, clip);
    }

    /** Repeats the `chunk` of `image` over the `width` x `height` rect at (`x`, `y`), inside `clip`. */
    public drawTiledChunk(image: IVariableFxImage, chunk: IVariableFxRect, x: number, y: number, width: number, height: number, blend: VariableFxBlendMode = VariableFxBlendMode.NORMAL, opacity: number = 255, clip: IVariableFxRect = null): void
    {
        if(!image) return;

        const chunkX = (chunk.x | 0);
        const chunkY = (chunk.y | 0);
        const chunkWidth = Math.max(0, (chunk.width | 0));
        const chunkHeight = Math.max(0, (chunk.height | 0));
        const ox = (x | 0);
        const oy = (y | 0);
        const bounds = this._bitmap.targetBounds(ox, oy, Math.max(0, (width | 0)), Math.max(0, (height | 0)), clip);

        if((chunkWidth <= 0) || (chunkHeight <= 0) || (bounds.left >= bounds.right) || (bounds.top >= bounds.bottom)) return;

        const startX = (ox + (Math.floor((bounds.left - ox) / chunkWidth) * chunkWidth));
        const startY = (oy + (Math.floor((bounds.top - oy) / chunkHeight) * chunkHeight));
        const area = variableFxRect(bounds.left, bounds.top, (bounds.right - bounds.left), (bounds.bottom - bounds.top));

        for(let tileY = startY; tileY < bounds.bottom; tileY += chunkHeight)
        {
            for(let tileX = startX; tileX < bounds.right; tileX += chunkWidth) this.drawChunk(image, chunkX, chunkY, chunkWidth, chunkHeight, tileX, tileY, blend, opacity, area);
        }
    }

    /** Draws the `width` x `height` chunk of `image` at (`sourceX`, `sourceY`) to (`x`, `y`). */
    public drawChunk(image: IVariableFxImage, sourceX: number, sourceY: number, width: number, height: number, x: number, y: number, blend: VariableFxBlendMode = VariableFxBlendMode.NORMAL, opacity: number = 255, clip: IVariableFxRect = null, transform: IVariableFxColorTransform = null): void
    {
        this.drawChunkWith(image, sourceX, sourceY, width, height, x, y, blend, clip, withOpacity(transform, opacity));
    }

    private drawChunkWith(image: IVariableFxImage, sourceX: number, sourceY: number, width: number, height: number, x: number, y: number, blend: VariableFxBlendMode, clip: IVariableFxRect, transform: IVariableFxColorTransform): void
    {
        const sx = (sourceX | 0);
        const sy = (sourceY | 0);
        const dx = (x | 0);
        const dy = (y | 0);
        const bounds = this._bitmap.targetBounds(dx, dy, width, height, clip);
        const area = variableFxRect(bounds.left, bounds.top, (bounds.right - bounds.left), (bounds.bottom - bounds.top));

        if((area.width <= 0) || (area.height <= 0) || (width <= 0) || (height <= 0)) return;

        this._bitmap.draw(image, 1, (dx - sx), (dy - sy), transform, blend, area);
    }

    private drawStretchedChunk(image: IVariableFxImage, sourceX: number, sourceWidth: number, height: number, x: number, y: number, width: number, blend: VariableFxBlendMode, clip: IVariableFxRect, transform: IVariableFxColorTransform): void
    {
        const sx = (sourceX | 0);
        const sw = (sourceWidth | 0);
        const h = (height | 0);
        const w = (width | 0);
        const dx = (x | 0);
        const dy = (y | 0);
        const scale = ((sw <= 0) ? 1 : (w / sw));
        const bounds = this._bitmap.targetBounds(dx, dy, w, h, clip);
        const area = variableFxRect(bounds.left, bounds.top, (bounds.right - bounds.left), (bounds.bottom - bounds.top));

        if((area.width <= 0) || (area.height <= 0) || (sw <= 0) || (h <= 0) || (w <= 0)) return;

        this._bitmap.draw(image, scale, (dx - (sx * scale)), dy, transform, blend, area);
    }
}
