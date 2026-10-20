import { GetAssetManager } from '@octane/assets';
import { Texture } from 'pixi.js';
import { IVariableFxImage } from './VariableFxBitmap';

/** Gives the painters AIR's fx assets by name (the room visualization library's bitmaps). */
export interface IVariableFxAssetProvider
{
    getBitmap(name: string): IVariableFxImage;
}

/**
 * The fx assets the room loads with its mandatory libraries (local://variablefx, the PNGs under
 * packages/assets/src/assets/variablefx/images, named as AIR names them). Each texture's decoded
 * image is drawn from directly.
 */
export class VariableFxAssetLibrary implements IVariableFxAssetProvider
{
    private static _instance: VariableFxAssetLibrary = null;

    private _images: Map<string, IVariableFxImage> = new Map();

    public static getInstance(): VariableFxAssetLibrary
    {
        if(!VariableFxAssetLibrary._instance) VariableFxAssetLibrary._instance = new VariableFxAssetLibrary();

        return VariableFxAssetLibrary._instance;
    }

    public getBitmap(name: string): IVariableFxImage
    {
        if(!name) return null;

        const cached = this._images.get(name);

        if(cached) return cached;

        const image = VariableFxAssetLibrary.fromTexture(GetAssetManager()?.getTexture(name) ?? null);

        if(image) this._images.set(name, image);

        return image;
    }

    public static fromTexture(texture: Texture): IVariableFxImage
    {
        const resource = (texture?.source as unknown as { resource?: CanvasImageSource })?.resource;

        if(!texture || !resource) return null;

        const width = (texture.source.pixelWidth || texture.width);
        const height = (texture.source.pixelHeight || texture.height);

        if((width <= 0) || (height <= 0)) return null;

        return { width, height, source: resource };
    }
}
