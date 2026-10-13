import { CanvasSource, Texture } from 'pixi.js';

/**
 * Habbo's .hab furniture and clothes have no small size (furni size 32, avatar "sh"). Zoomed out, the renderer
 * then draws the large sprites at half size. A pixel-art texture scaled by 0.5 with nearest sampling keeps every
 * other pixel, which breaks outlines. This builds a real half-size sprite instead: every 2x2 block becomes one
 * pixel, keeping hard edges and the dark outline pixels, which is what Habbo's own small art looks like.
 */

/**
 * A block keeps its darkest pixel (an outline) when at least two of its pixels are this dark and the block has
 * this much contrast: a 1px outline always covers two pixels of a 2x2 block (also the 2:1 isometric lines), while
 * dark detail in artwork (paintings) is mostly single pixels and is averaged, so it keeps its colours.
 */
const OUTLINE_MAX_LIGHT = 72;
const OUTLINE_CONTRAST = 60;

/** The half-size offset of a room sprite: flipped sprites grow to the left of their offset, so they round up. */
export const halfSizeOffset = (offset: number, flipped: boolean): number => (flipped ? Math.ceil(offset / 2) : Math.floor(offset / 2));

/** Transparent columns/rows added in front, so the 2x2 blocks line up with even positions around the object. */
export const halfSizePadding = (offset: number): number => (((offset % 2) + 2) % 2);

export interface IHalfSizePixels
{
    data: Uint8ClampedArray<ArrayBuffer>;
    width: number;
    height: number;
}

/** RGBA pixels at half size; padX/padY transparent pixels are added on the left/top first. */
export function halvePixels(source: Uint8ClampedArray, width: number, height: number, padX: number = 0, padY: number = 0): IHalfSizePixels
{
    const halfWidth = Math.ceil((width + padX) / 2);
    const halfHeight = Math.ceil((height + padY) / 2);
    const data = new Uint8ClampedArray(halfWidth * halfHeight * 4);
    const block: number[] = [];

    for(let y = 0; y < halfHeight; y++)
    {
        for(let x = 0; x < halfWidth; x++)
        {
            block.length = 0;

            for(let dy = 0; dy < 2; dy++)
            {
                const sy = ((y * 2) + dy - padY);

                if((sy < 0) || (sy >= height)) continue;

                for(let dx = 0; dx < 2; dx++)
                {
                    const sx = ((x * 2) + dx - padX);

                    if((sx < 0) || (sx >= width)) continue;

                    const index = ((sy * width) + sx) * 4;

                    if(source[index + 3] > 0) block.push(index);
                }
            }

            // One stray pixel in four is dropped, like the edges of Habbo's own 32 sprites.
            if(block.length < 2) continue;

            const target = ((y * halfWidth) + x) * 4;
            let darkest = block[0];
            let minLight = 256;
            let maxLight = -1;
            let darkPixels = 0;

            for(const index of block)
            {
                const light = ((0.299 * source[index]) + (0.587 * source[index + 1]) + (0.114 * source[index + 2]));

                if(light < minLight)
                {
                    minLight = light;
                    darkest = index;
                }

                if(light > maxLight) maxLight = light;
                if(light < OUTLINE_MAX_LIGHT) darkPixels++;
            }

            if((darkPixels >= 2) && ((maxLight - minLight) > OUTLINE_CONTRAST))
            {
                data[target] = source[darkest];
                data[target + 1] = source[darkest + 1];
                data[target + 2] = source[darkest + 2];
                data[target + 3] = source[darkest + 3];

                continue;
            }

            let r = 0, g = 0, b = 0, a = 0;

            for(const index of block)
            {
                r += source[index];
                g += source[index + 1];
                b += source[index + 2];
                a += source[index + 3];
            }

            data[target] = Math.round(r / block.length);
            data[target + 1] = Math.round(g / block.length);
            data[target + 2] = Math.round(b / block.length);
            data[target + 3] = Math.round(a / block.length);
        }
    }

    return { data, width: halfWidth, height: halfHeight };
}

type PixelArtSource = Texture['source'] & { octaneFixedScaleMode?: boolean };

/** Furniture sprite sheets are pinned to nearest sampling when they are loaded (AssetManager); photos stay linear. */
export const isPixelArtTexture = (texture: Texture): boolean =>
{
    const source = texture?.source as PixelArtSource;

    return !!source?.octaneFixedScaleMode && (source.scaleMode === 'nearest');
};

const halfSizeTextures = new WeakMap<Texture, Map<number, Texture | null>>();

/**
 * The half-size version of a sprite, made once per texture and padding. Null when the pixels cannot be read
 * (no canvas, a GPU-only texture); the caller then scales the full-size sprite as before.
 */
export function getHalfSizeTexture(texture: Texture, padX: number, padY: number): Texture | null
{
    if(!texture || texture.destroyed || !texture.source) return null;

    let variants = halfSizeTextures.get(texture);
    const key = (padX + (padY * 2));

    if(variants?.has(key)) return variants.get(key);

    if(!variants)
    {
        variants = new Map();
        halfSizeTextures.set(texture, variants);

        // The half-size textures live as long as the sprite sheet they were made from.
        texture.source.once?.('destroy', () =>
        {
            for(const half of variants.values()) half?.destroy(true);

            variants.clear();
        });
    }

    const half = createHalfSizeTexture(texture, padX, padY);

    variants.set(key, half);

    return half;
}

function createHalfSizeTexture(texture: Texture, padX: number, padY: number): Texture | null
{
    const resource = (texture.source as { resource?: unknown }).resource as CanvasImageSource | undefined;
    const frame = texture.frame;

    if(!resource || !frame || (frame.width <= 0) || (frame.height <= 0) || (typeof document === 'undefined')) return null;

    try
    {
        const width = Math.round(frame.width);
        const height = Math.round(frame.height);
        const input = document.createElement('canvas');

        input.width = width;
        input.height = height;

        const inputContext = input.getContext('2d', { willReadFrequently: true });

        if(!inputContext) return null;

        inputContext.drawImage(resource, frame.x, frame.y, frame.width, frame.height, 0, 0, width, height);

        const halved = halvePixels(inputContext.getImageData(0, 0, width, height).data, width, height, padX, padY);
        const output = document.createElement('canvas');

        output.width = Math.max(1, halved.width);
        output.height = Math.max(1, halved.height);

        const outputContext = output.getContext('2d');

        if(!outputContext) return null;

        outputContext.putImageData(new ImageData(halved.data, halved.width, halved.height), 0, 0);

        const source = new CanvasSource({ resource: output, scaleMode: 'nearest' }) as unknown as PixelArtSource;

        source.octaneFixedScaleMode = true;

        return new Texture({ source });
    }
    catch
    {
        // e.g. a cross-origin image that cannot be read back.
        return null;
    }
}
