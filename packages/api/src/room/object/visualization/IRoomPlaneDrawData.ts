import { Matrix, Texture } from 'pixi.js';

/**
 * A baked piece of a room plane: the area around a door or window mask, or a whole landscape.
 * x, y, width and height are the plane pixels it covers; the texture's frame is that area inside
 * a source baked with up to 1 px of real neighbours, so linear sampling at its border matches a full bake.
 */
export interface IRoomPlanePatch
{
    x: number;
    y: number;
    width: number;
    height: number;
    texture: Texture;
}

/**
 * Everything a canvas needs to draw a room plane without a full-plane render texture. The plane is
 * a w x h bounding box (the size its baked texture used to have); the shader rebuilds each of those
 * would-be texels from the tile texture.
 */
export interface IRoomPlaneDrawData
{
    // Bumped whenever any other field changes.
    version: number;
    width: number;
    height: number;
    // False for planes drawn only from patches (landscapes, or a plane with too many masks).
    direct: boolean;
    tileTexture: Texture;
    // The tile covers its whole texture source: Pixi tiles it with a repeat sampler, not the tiling shader.
    tileSimple: boolean;
    // Plane pixel -> TilingSprite position normalised to 0..1 (the inverse of the bake's skew matrix).
    planeToTile: Matrix;
    // Pixi's tiling uniforms for that TilingSprite (TilingSpriteShader.updateUniforms).
    textureTransform: Matrix;
    mapCoord: Matrix;
    clampFrame: Float32Array;
    clampOffset: Float32Array;
    tileTint: number;
    // The plane had masks, so PlaneMaskFilter turned every pure black pixel transparent.
    blackIsTransparent: boolean;
    patches: IRoomPlanePatch[];
}
