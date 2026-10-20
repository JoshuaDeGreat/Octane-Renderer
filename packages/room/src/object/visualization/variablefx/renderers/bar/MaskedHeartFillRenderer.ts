import { IVariableFxImage, IVariableFxRect, VariableFxBitmap, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { variableFxRect, VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { IVariableFxPrebake, VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { BarVariableFxRendererBase } from './BarVariableFxRendererBase';
import { IVariableFxBarOverlay } from './ClassicProgressBarRenderer';

export interface IMaskedHeartAssets
{
    background: IVariableFxImage;
    bar: IVariableFxImage;
    endPointer: IVariableFxImage;
    mask: IVariableFxImage;
    metallic: IVariableFxImage;
    overlays: IVariableFxBarOverlay[];
}

/**
 * The single heart's frames, one per colour and filled width, made once per config (AIR's
 * MaskedHeartFillFramePrebake): the heart background, the fill tinted and clipped to the filled
 * width from 2 px in, the end pointer multiplied in where the heart's mask allows, then the
 * metallic layer and the shading inside the fill.
 */
export class MaskedHeartFillFramePrebake implements IVariableFxPrebake
{
    public static FILL_LEFT: number = 2;
    public static FILL_RIGHT: number = 2;
    public static END_POINTER_OFFSET_X: number = 1;
    public static END_POINTER_INSET_Y: number = 2;
    /** Frames kept; a colour fade makes a new one per step, so the oldest go. */
    public static MAX_FRAMES: number = 128;

    public readonly frameWidth: number;
    public readonly frameHeight: number;
    public readonly progressPixelWidth: number;

    private _frames: Map<string, VariableFxBitmap> = new Map();

    constructor(private _assets: IMaskedHeartAssets)
    {
        this.frameWidth = _assets.background.width;
        this.frameHeight = _assets.background.height;
        this.progressPixelWidth = Math.max(0, (this.frameWidth - MaskedHeartFillFramePrebake.FILL_LEFT - MaskedHeartFillFramePrebake.FILL_RIGHT));
    }

    public getFrame(argb: number, width: number): VariableFxBitmap
    {
        const filled = Math.max(0, Math.min(this.progressPixelWidth, (width | 0)));
        const key = `${ argb >>> 0 }:${ filled }`;
        let frame = this._frames.get(key);

        if(!frame)
        {
            frame = this.createFrame(argb, filled);

            this._frames.set(key, frame);

            while(this._frames.size > MaskedHeartFillFramePrebake.MAX_FRAMES)
            {
                const oldest = this._frames.keys().next().value;

                this._frames.get(oldest)?.dispose();
                this._frames.delete(oldest);
            }
        }

        return frame;
    }

    public dispose(): void
    {
        for(const frame of this._frames.values()) frame.dispose();

        this._frames.clear();
        this._assets = null;
    }

    private createFrame(argb: number, width: number): VariableFxBitmap
    {
        const bitmap = VariableFxBitmap.create(this.frameWidth, this.frameHeight);
        const composer = new VariableFxBitmapComposer(bitmap);
        const clip = ((width <= 0) ? null : variableFxRect(MaskedHeartFillFramePrebake.FILL_LEFT, 0, width, this.frameHeight));
        const assets = this._assets;

        composer.clear(0);
        composer.drawLayer(assets.background, 0, 0, VariableFxBlendMode.NORMAL, 255);

        if(clip)
        {
            composer.drawTintedLayer(assets.bar, 0, 0, argb, VariableFxBlendMode.NORMAL, 255, clip);
            this.drawEndPointer(composer, assets.endPointer, assets.mask, width);

            if(assets.metallic) composer.drawLayer(assets.metallic, 0, 0, VariableFxBlendMode.ADD, 255, clip);

            for(const overlay of assets.overlays) composer.drawLayer(overlay.layer, 0, 0, overlay.blendMode, 255, clip);
        }

        return bitmap;
    }

    /** The pointer on the fill's last column, cut by the heart's mask. */
    private drawEndPointer(composer: VariableFxBitmapComposer, pointer: IVariableFxImage, mask: IVariableFxImage, width: number): void
    {
        const column = (MaskedHeartFillFramePrebake.FILL_LEFT + width - 1);
        const maskX = ((mask.width >= this.frameWidth) ? 0 : (column - ((mask.width / 2) | 0)));
        const maskY = ((mask.height >= this.frameHeight) ? 0 : (((this.frameHeight - mask.height) / 2) | 0));
        const clip: IVariableFxRect = variableFxRect(column, MaskedHeartFillFramePrebake.END_POINTER_INSET_Y, 1, Math.max(0, (this.frameHeight - (MaskedHeartFillFramePrebake.END_POINTER_INSET_Y * 2))));

        composer.drawMaskedLayer(pointer, mask, (column - MaskedHeartFillFramePrebake.END_POINTER_OFFSET_X), 0, maskX, maskY, VariableFxBlendMode.MULTIPLY, 255, clip);
    }
}

/**
 * AIR's single heart (MaskedHeartFillRenderer, server renderer 11): a heart that fills from left
 * to right in the fill colour, with the metallic variants of its shading for a metallic colour.
 */
export class MaskedHeartFillRenderer extends BarVariableFxRendererBase
{
    public static ASSET_NAMES = {
        background: 'variablefx_masked_heart_fill_background',
        bar: 'variablefx_masked_heart_fill_bar',
        darkening: 'variablefx_masked_heart_fill_darkening',
        darkeningMetallic: 'variablefx_masked_heart_fill_darkening_metallic',
        endPointer: 'variablefx_masked_heart_fill_end_pointer',
        lighting: 'variablefx_masked_heart_fill_lighting',
        lightingMetallic: 'variablefx_masked_heart_fill_lighting_metallic',
        mask: 'variablefx_masked_heart_fill_mask',
        metallic: 'variablefx_masked_heart_fill_metallic'
    };

    private _prebake: MaskedHeartFillFramePrebake;

    constructor(context: VariableFxRendererContext)
    {
        super(context);

        this._prebake = context.config.getOrCreatePrebake(() => new MaskedHeartFillFramePrebake(this.resolveAssets()));
    }

    public get frameWidth(): number
    {
        return this._prebake.frameWidth;
    }

    public get frameHeight(): number
    {
        return this._prebake.frameHeight;
    }

    public get progressPixelWidth(): number
    {
        return this._prebake.progressPixelWidth;
    }

    protected renderFrame(now: number): void
    {
        const bitmap = this._frame.bitmap;

        if(!bitmap) return;

        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);
        composer.drawLayer(this._prebake.getFrame(this.fillArgb, this.renderedPixelWidth()), 0, 0, VariableFxBlendMode.NORMAL, 255);
    }

    private resolveAssets(): IMaskedHeartAssets
    {
        const metallic = VariableFxPaintColor.resolveConfigured(this._context.config.color, this._context.config.extra).metallic;
        const names = MaskedHeartFillRenderer.ASSET_NAMES;
        const description = 'masked heart fill';

        return {
            background: this.getLayer(names.background, description),
            bar: this.getLayer(names.bar, description),
            endPointer: this.getLayer(names.endPointer, description),
            mask: this.getLayer(names.mask, description),
            metallic: (metallic ? this.getLayer(names.metallic, description) : null),
            overlays: [
                { blendMode: VariableFxBlendMode.MULTIPLY, layer: this.getLayer((metallic ? names.darkeningMetallic : names.darkening), description) },
                { blendMode: VariableFxBlendMode.ADD, layer: this.getLayer((metallic ? names.lightingMetallic : names.lighting), description) }
            ]
        };
    }
}
