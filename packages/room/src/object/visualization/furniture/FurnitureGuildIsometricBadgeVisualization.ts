import { IGraphicAsset, IRoomObjectSprite, RoomObjectVariable } from '@octane/api';
import { TextureUtils } from '@octane/utils';
import { Matrix, Sprite, Texture } from 'pixi.js';
import { IsometricImageFurniVisualization } from './IsometricImageFurniVisualization';

export class FurnitureGuildIsometricBadgeVisualization extends IsometricImageFurniVisualization
{
    public static PRIMARY_COLOUR_SPRITE_TAG: string = 'COLOR1';
    public static SECONDARY_COLOUR_SPRITE_TAG: string = 'COLOR2';
    public static DEFAULT_COLOR_1: number = 0xEEEEEE;
    public static DEFAULT_COLOR_2: number = 0x4B4B4B;

    private _color1: number;
    private _color2: number;
    private _cachedAssetName: string;

    constructor()
    {
        super();

        this._cachedAssetName = null;
    }

    protected updateModel(scale: number): boolean
    {
        const flag = super.updateModel(scale);

        const assetName = this.object.model.getValue<string>(RoomObjectVariable.FURNITURE_GUILD_CUSTOMIZED_ASSET_NAME);

        if(assetName && assetName.length && assetName !== this._cachedAssetName)
        {
            const texture = this.getBitmapAsset(assetName);

            if(texture)
            {
                this._cachedAssetName = assetName;
                this.setThumbnailImages(texture);
            }
        }

        // class_2058.updateModel: a colour the stuff data did not give (NaN) falls back to the default; any parsed colour, black included, is used.
        this._color1 = FurnitureGuildIsometricBadgeVisualization.getGuildColor(this.object.model.getValue<number>(RoomObjectVariable.FURNITURE_GUILD_CUSTOMIZED_COLOR_1), FurnitureGuildIsometricBadgeVisualization.DEFAULT_COLOR_1);
        this._color2 = FurnitureGuildIsometricBadgeVisualization.getGuildColor(this.object.model.getValue<number>(RoomObjectVariable.FURNITURE_GUILD_CUSTOMIZED_COLOR_2), FurnitureGuildIsometricBadgeVisualization.DEFAULT_COLOR_2);

        return flag;
    }

    public static getGuildColor(color: number, defaultColor: number): number
    {
        return ((typeof color === 'number') && !isNaN(color)) ? color : defaultColor;
    }

    /**
     * class_1881.generateTransformedThumbnail: the badge is scaled to the width of the THUMBNAIL layer asset and
     * sheared onto the furni face, into a bitmap of exactly the asset's size (whatever falls outside is cut off).
     * Directions 0 and 4 slope down to the right, direction 2 up to the right, any other direction is a plain scale.
     * AIR draws the result unmirrored at the asset's place; our sprite keeps the asset's flipH, so for a mirrored
     * asset the drawing is mirrored first to show the same picture.
     */
    public static getThumbnailMatrix(direction: number, badgeWidth: number, assetWidth: number, flipH: boolean = false): Matrix
    {
        const scale = (assetWidth / badgeWidth);
        const matrix = new Matrix();

        switch(direction)
        {
            case 0:
            case 4:
                matrix.a = scale;
                matrix.b = (0.5 * scale);
                matrix.c = 0;
                matrix.d = (scale * 1.1);
                matrix.tx = 0;
                matrix.ty = 0;
                break;
            case 2:
                matrix.a = scale;
                matrix.b = (-0.5 * scale);
                matrix.c = 0;
                matrix.d = (scale * 1.1);
                matrix.tx = 0;
                matrix.ty = (0.5 * scale * badgeWidth);
                break;
            default:
                matrix.a = scale;
                matrix.b = 0;
                matrix.c = 0;
                matrix.d = scale;
                matrix.tx = 0;
                matrix.ty = 0;
        }

        if(flipH)
        {
            matrix.a = -matrix.a;
            matrix.c = -matrix.c;
            matrix.tx = (assetWidth - matrix.tx);
        }

        return matrix;
    }

    protected generateTransformedThumbnail(texture: Texture, asset: IGraphicAsset): Texture
    {
        const matrix = FurnitureGuildIsometricBadgeVisualization.getThumbnailMatrix(this.direction, texture.width, asset.width, asset.flipH);

        return TextureUtils.createAndWriteRenderTexture(asset.width, asset.height, new Sprite(texture), matrix);
    }

    protected getLayerColor(scale: number, layerId: number, colorId: number): number
    {
        const tag = this.getLayerTag(scale, this._direction, layerId);

        switch(tag)
        {
            case FurnitureGuildIsometricBadgeVisualization.PRIMARY_COLOUR_SPRITE_TAG: return this._color1;
            case FurnitureGuildIsometricBadgeVisualization.SECONDARY_COLOUR_SPRITE_TAG: return this._color2;
        }

        return super.getLayerColor(scale, layerId, colorId);
    }

    protected getLibraryAssetNameForSprite(asset: IGraphicAsset, sprite: IRoomObjectSprite): string
    {
        if(sprite.tag === FurnitureGuildIsometricBadgeVisualization.THUMBNAIL)
        {
            if(this.object && this.object.model.getValue<string>(RoomObjectVariable.FURNITURE_GUILD_CUSTOMIZED_ASSET_NAME))
            {
                return '%group.badge.url%' + this.object.model.getValue<string>(RoomObjectVariable.FURNITURE_GUILD_CUSTOMIZED_ASSET_NAME).replace('badge_', '');
            }
        }

        return super.getLibraryAssetNameForSprite(asset, sprite);
    }

    private getBitmapAsset(name: string)
    {
        const asset = this.asset.getAsset(name);

        if(!asset || !asset.texture) return null;

        return asset.texture;
    }
}
