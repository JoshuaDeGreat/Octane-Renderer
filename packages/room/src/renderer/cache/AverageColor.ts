import { TextureUtils } from '@octane/utils';
import { Texture } from 'pixi.js';

/** RGBA pixels, four bytes each, not premultiplied. */
export type TexturePixelReader = (texture: Texture) => ArrayLike<number>;

const WHITE = 0xFFFFFF;

/**
 * Behaviour from the AIR client (Canvas.averageColor): the average red, green and blue of the pixels that are
 * not fully transparent, each truncated to an integer; white when there are none.
 */
export const averageColorOfPixels = (pixels: ArrayLike<number>): number =>
{
    if(!pixels || !pixels.length) return WHITE;

    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    for(let i = 0; (i + 3) < pixels.length; i += 4)
    {
        if(pixels[i + 3] <= 0) continue;

        red += pixels[i];
        green += pixels[i + 1];
        blue += pixels[i + 2];
        count++;
    }

    if(!count) return WHITE;

    return ((Math.trunc(red / count) << 16) | (Math.trunc(green / count) << 8) | Math.trunc(blue / count));
};

const readTexturePixels: TexturePixelReader = texture => TextureUtils.getPixels(texture)?.pixels ?? null;

let pixelReader: TexturePixelReader = readTexturePixels;
let averages: WeakMap<Texture, number> = new WeakMap();

/**
 * The average colour of a sprite's texture, read once per texture: the camera scene only asks it for a few small
 * sprites (AIR's MAX_SIZE_FOR_AVG_COLOR), and a badge or photo texture does not change.
 */
export const textureAverageColor = (texture: Texture): number =>
{
    if(!texture || (texture === Texture.EMPTY) || texture.destroyed) return WHITE;

    const cached = averages.get(texture);

    if(cached !== undefined) return cached;

    let average = WHITE;

    try
    {
        average = averageColorOfPixels(pixelReader(texture));
    }
    catch
    {
        // No renderer (or a lost context): AIR's answer for a missing picture.
        return WHITE;
    }

    averages.set(texture, average);

    return average;
};

/** Tests swap the GPU read for plain pixels; passing nothing restores it. */
export const setTexturePixelReader = (reader: TexturePixelReader = null): void =>
{
    pixelReader = reader ?? readTexturePixels;
    averages = new WeakMap();
};
