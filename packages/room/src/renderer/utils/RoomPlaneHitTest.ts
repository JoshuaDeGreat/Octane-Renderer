import { IRoomPlaneDrawData, IRoomPlanePatch } from '@octane/api';
import { GetTextureContentVersion, TextureUtils } from '@octane/utils';
import { Point, Sprite, Texture } from 'pixi.js';

interface ITilePixels
{
    width: number;
    height: number;
    pixels: Uint8Array | Uint8ClampedArray;
}

interface IPatchAlpha
{
    texture: Texture;
    version: number;
    alpha: Uint8Array;
    width: number;
    height: number;
    scale: number;
}

// Tiles are a few KB each and shared by every plane of their type.
const TILE_PIXELS: WeakMap<Texture, ITilePixels> = new WeakMap();
const PATCH_ALPHA: WeakMap<IRoomPlanePatch, IPatchAlpha> = new WeakMap();
// Patches bigger than this (a plane baked whole) keep their alpha at a quarter size, like ExtendedSprite.
const PATCH_DOWNSCALE_PIXELS: number = (512 * 512);
const PATCH_DOWNSCALE: number = 4;
const POINT: Point = new Point();

const getTilePixels = (texture: Texture): ITilePixels =>
{
    if(!texture || !texture.source || texture.source.destroyed) return null;

    let tile = TILE_PIXELS.get(texture);

    if(!tile)
    {
        // Drawn through a sprite: extracting an image-backed texture directly reads its colours as black.
        const sprite = new Sprite(texture);

        try
        {
            const output = TextureUtils.getPixels({ target: sprite, resolution: 1 });

            if(!output || !output.pixels) return null;

            tile = { width: output.width, height: output.height, pixels: output.pixels };
        }
        catch (e)
        {
            return null;
        }
        finally
        {
            sprite.destroy();
        }

        TILE_PIXELS.set(texture, tile);
    }

    return tile;
};

const tintChannel = (value: number, tint: number, shift: number): number => Math.round((value * ((tint >> shift) & 0xFF)) / 255);

/**
 * The tile pixel at a plane pixel's centre: its alpha, or 0 outside the plane or where the bake's
 * mask filter cut a pure black pixel. Nearest texel, which is plenty for picking.
 */
const getTileAlpha = (data: IRoomPlaneDrawData, x: number, y: number): number =>
{
    data.planeToTile.apply(POINT.set((x + 0.5), (y + 0.5)), POINT);

    if((POINT.x < 0) || (POINT.y < 0) || (POINT.x >= 1) || (POINT.y >= 1)) return 0;

    const tile = getTilePixels(data.tileTexture);

    if(!tile) return 255;

    data.textureTransform.apply(POINT, POINT);

    const tileX = Math.min((tile.width - 1), Math.floor((POINT.x - Math.floor(POINT.x)) * tile.width));
    const tileY = Math.min((tile.height - 1), Math.floor((POINT.y - Math.floor(POINT.y)) * tile.height));
    const index = (((tileY * tile.width) + tileX) * 4);
    const alpha = tile.pixels[index + 3];

    if(data.blackIsTransparent && !tintChannel(tile.pixels[index], data.tileTint, 16) && !tintChannel(tile.pixels[index + 1], data.tileTint, 8) && !tintChannel(tile.pixels[index + 2], data.tileTint, 0)) return 0;

    return alpha;
};

const getPatchAlpha = (patch: IRoomPlanePatch, x: number, y: number): number =>
{
    const texture = patch.texture;
    const source = (texture && texture.source);

    if(!source || source.destroyed) return 0;

    const version = GetTextureContentVersion(source);

    let entry = PATCH_ALPHA.get(patch);

    if(!entry || (entry.texture !== texture) || (entry.version !== version))
    {
        const scale = (((source.pixelWidth * source.pixelHeight) > PATCH_DOWNSCALE_PIXELS) ? PATCH_DOWNSCALE : 1);
        const sourceTexture = new Texture({ source });
        const sprite = ((scale === 1) ? null : new Sprite(sourceTexture));

        try
        {
            // Through Pixi's extract: never bind the framebuffer ourselves (see ExtendedSprite).
            const output = (sprite ? TextureUtils.getPixels({ target: sprite, resolution: (source.resolution / scale) }) : TextureUtils.getPixels(sourceTexture));

            if(!output || !output.pixels) return 0;

            const count = (output.width * output.height);
            const alpha = new Uint8Array(count);

            for(let i = 0; i < count; i++) alpha[i] = output.pixels[(i * 4) + 3];

            entry = { texture, version, alpha, width: output.width, height: output.height, scale };

            PATCH_ALPHA.set(patch, entry);
        }
        catch (e)
        {
            return 0;
        }
        finally
        {
            if(sprite) sprite.destroy();

            sourceTexture.destroy(false);
        }
    }

    const sourceX = Math.floor(((x - patch.x) + texture.frame.x) / entry.scale);
    const sourceY = Math.floor(((y - patch.y) + texture.frame.y) / entry.scale);

    if((sourceX < 0) || (sourceY < 0) || (sourceX >= entry.width) || (sourceY >= entry.height)) return 0;

    return entry.alpha[sourceX + (sourceY * entry.width)];
};

/**
 * Hit test for a plane drawn from its draw data, in plane pixels (the old baked texture's space):
 * the same rounding and alpha test ExtendedSprite applied to that texture.
 */
export const RoomPlaneContainsPoint = (data: IRoomPlaneDrawData, localX: number, localY: number, alphaTolerance: number): boolean =>
{
    if(!data || (alphaTolerance > 255)) return false;

    const x = Math.round(localX);
    const y = Math.round(localY);

    if((x < 0) || (y < 0) || (x >= data.width) || (y >= data.height)) return false;

    if(alphaTolerance <= 0) return true;

    for(const patch of data.patches)
    {
        if((x >= patch.x) && (y >= patch.y) && (x < (patch.x + patch.width)) && (y < (patch.y + patch.height))) return (getPatchAlpha(patch, x, y) >= alphaTolerance);
    }

    if(!data.direct) return false;

    return (getTileAlpha(data, x, y) >= alphaTolerance);
};

/**
 * True when the plane covers everything behind it outside its patches: an opaque tile, and no
 * pure black pixel that the mask filter would turn transparent.
 */
export const IsRoomPlaneTileOpaque = (data: IRoomPlaneDrawData): boolean =>
{
    if(!data || !data.tileTexture) return false;

    const tile = getTilePixels(data.tileTexture);

    if(!tile) return false;

    const pixels = tile.pixels;

    for(let i = 0; i < pixels.length; i += 4)
    {
        if(pixels[i + 3] !== 255) return false;

        if(data.blackIsTransparent && !tintChannel(pixels[i], data.tileTint, 16) && !tintChannel(pixels[i + 1], data.tileTint, 8) && !tintChannel(pixels[i + 2], data.tileTint, 0)) return false;
    }

    return true;
};
