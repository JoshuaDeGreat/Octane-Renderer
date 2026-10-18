import { IRoomPlaneDrawData, IRoomPlanePatch } from '@octane/api';
import { Matrix, Texture, TilingSprite } from 'pixi.js';

export class RoomPlaneDrawData implements IRoomPlaneDrawData
{
    public version: number = 0;
    public width: number = 0;
    public height: number = 0;
    public direct: boolean = false;
    public tileTexture: Texture = null;
    public tileSimple: boolean = false;
    public planeToTile: Matrix = new Matrix();
    public textureTransform: Matrix = new Matrix();
    public mapCoord: Matrix = new Matrix();
    public clampFrame: Float32Array = new Float32Array(4);
    public clampOffset: Float32Array = new Float32Array(2);
    public tileTint: number = 0xFFFFFF;
    public blackIsTransparent: boolean = false;
    public patches: IRoomPlanePatch[] = [];

    /**
     * Takes the tiling from the TilingSprite the bake would have drawn through planeMatrix, with the
     * values Pixi itself derives for it (TilingSpriteShader.updateUniforms / setUvs).
     */
    public setTiling(tilingSprite: TilingSprite, planeMatrix: Matrix): void
    {
        const width = tilingSprite.width;
        const height = tilingSprite.height;
        const texture = tilingSprite.texture;
        const tileMatrix = tilingSprite.tileTransform.matrix;
        const textureMatrix = texture.textureMatrix;

        textureMatrix.update();

        this.tileTexture = texture;
        this.tileSimple = textureMatrix.isSimple;
        this.tileTint = tilingSprite.tint;

        this.planeToTile.copyFrom(planeMatrix).invert();
        this.planeToTile.scale((1 / width), (1 / height));

        this.textureTransform.set(
            ((tileMatrix.a * texture.width) / width),
            ((tileMatrix.b * texture.width) / height),
            ((tileMatrix.c * texture.height) / width),
            ((tileMatrix.d * texture.height) / height),
            (tileMatrix.tx / width),
            (tileMatrix.ty / height));
        this.textureTransform.invert();

        this.mapCoord.copyFrom(textureMatrix.mapCoord);
        this.clampFrame.set(textureMatrix.uClampFrame);
        this.clampOffset.set(textureMatrix.uClampOffset);
    }
}
