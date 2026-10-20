import { IVariableFxImage, VariableFxBitmap, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { variableFxRect, VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { IVariableFxPrebake, VariableFxConfig } from '../../VariableFxConfig';
import { LevelDetailsNumberPainter } from './LevelDetailsNumbers';

export interface ILevelBadgeAssets
{
    background: IVariableFxImage;
    darkening: IVariableFxImage;
    frame: IVariableFxImage;
    lighting: IVariableFxImage;
    numbers: IVariableFxImage;
}

interface ILevelBadgeLayers
{
    background: VariableFxBitmap;
    frame: VariableFxBitmap;
    darkening: VariableFxBitmap;
    lighting: VariableFxBitmap;
}

/** A badge drawn for one digit count and colour. */
export interface ILevelBadgeRender
{
    bitmap: VariableFxBitmap;
    ownsLayers: boolean;
    layers: ILevelBadgeLayers;
}

/**
 * AIR's LevelBadgePainter: the badge cut from its assets, widened per digit count (21 px for one
 * digit, 6 + 8 per digit + 5 otherwise, three-sliced 10 / 10), its frame tinted in the level
 * colour, the level in the large number sheet (8 px per digit, from x 7 for one digit, 6 for more),
 * then shaded with the darkening and lighting layers.
 */
export class LevelBadgePainter
{
    public static CACHED_DIGIT_COUNT: number = 5;
    public static DIGIT_WIDTH: number = 8;
    public static NUMBER_Y: number = 5;
    public static SINGLE_DIGIT_NUMBER_X: number = 7;
    public static MULTI_DIGIT_NUMBER_X: number = 6;
    public static SINGLE_DIGIT_FRAME_WIDTH: number = 21;
    public static RIGHT_PADDING: number = 5;
    public static SLICE_LEFT_WIDTH: number = 10;
    public static SLICE_RIGHT_WIDTH: number = 10;

    private _layers: Map<number, ILevelBadgeLayers> = new Map();
    private _sources: { background: VariableFxBitmap, darkening: VariableFxBitmap, frame: VariableFxBitmap, lighting: VariableFxBitmap };
    private _numbers: IVariableFxImage;

    constructor(assets: ILevelBadgeAssets, region: { x: number, y: number, width: number, height: number })
    {
        this._numbers = assets.numbers;
        this._sources = {
            background: (assets.background ? LevelBadgePainter.crop(assets.background, region) : null),
            darkening: LevelBadgePainter.crop(assets.darkening, region),
            frame: LevelBadgePainter.crop(assets.frame, region),
            lighting: LevelBadgePainter.crop(assets.lighting, region)
        };
    }

    public resolveFrameWidth(digits: number): number
    {
        const count = Math.max(1, (digits | 0));

        return ((count === 1) ? LevelBadgePainter.SINGLE_DIGIT_FRAME_WIDTH : (LevelBadgePainter.MULTI_DIGIT_NUMBER_X + (count * LevelBadgePainter.DIGIT_WIDTH) + LevelBadgePainter.RIGHT_PADDING));
    }

    /** The badge for `digits` digits with its frame tinted `argb`. */
    public createRender(digits: number, argb: number): ILevelBadgeRender
    {
        const count = Math.max(1, (digits | 0));
        const cached = (count <= LevelBadgePainter.CACHED_DIGIT_COUNT);
        let layers = (cached ? this._layers.get(count) : null);

        if(!layers)
        {
            layers = this.createLayers(count);

            if(cached) this._layers.set(count, layers);
        }

        const bitmap = VariableFxBitmap.create(layers.background.width, layers.background.height);
        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);
        composer.drawLayer(layers.background, 0, 0, VariableFxBlendMode.NORMAL, 255);
        composer.drawTintedLayer(layers.frame, 0, 0, argb, VariableFxBlendMode.NORMAL, 255);

        return { bitmap, ownsLayers: !cached, layers };
    }

    public disposeRender(render: ILevelBadgeRender): void
    {
        if(!render) return;

        render.bitmap?.dispose();

        if(render.ownsLayers) LevelBadgePainter.disposeLayers(render.layers);
    }

    public drawBadge(composer: VariableFxBitmapComposer, render: ILevelBadgeRender, text: string, x: number, y: number): void
    {
        composer.drawLayer(render.bitmap, x, y, VariableFxBlendMode.NORMAL, 255);
        this.drawDigits(composer, text, x, y);
        composer.drawLayer(render.layers.darkening, x, y, VariableFxBlendMode.MULTIPLY, 255);
        composer.drawLayer(render.layers.lighting, x, y, VariableFxBlendMode.ADD, 255);
    }

    public dispose(): void
    {
        for(const layers of this._layers.values()) LevelBadgePainter.disposeLayers(layers);

        this._layers.clear();
        this._sources.background?.dispose();
        this._sources.darkening.dispose();
        this._sources.frame.dispose();
        this._sources.lighting.dispose();
    }

    private drawDigits(composer: VariableFxBitmapComposer, text: string, x: number, y: number): void
    {
        const start = ((text.length === 1) ? LevelBadgePainter.SINGLE_DIGIT_NUMBER_X : LevelBadgePainter.MULTI_DIGIT_NUMBER_X);

        for(let index = 0; index < text.length; index++)
        {
            const digit = (Number(text.charAt(index)) | 0);
            const digitX = (x + start + (index * LevelBadgePainter.DIGIT_WIDTH));
            const digitY = (y + LevelBadgePainter.NUMBER_Y);

            composer.drawLayer(this._numbers, (digitX - (digit * LevelBadgePainter.DIGIT_WIDTH)), digitY, VariableFxBlendMode.NORMAL, 255, variableFxRect(digitX, digitY, LevelBadgePainter.DIGIT_WIDTH, this._numbers.height));
        }
    }

    private createLayers(digits: number): ILevelBadgeLayers
    {
        const width = this.resolveFrameWidth(digits);
        const height = this._sources.frame.height;
        const background = VariableFxBitmap.create(width, height);
        const frame = VariableFxBitmap.create(width, height);
        const darkening = VariableFxBitmap.create(width, height);
        const lighting = VariableFxBitmap.create(width, height);
        const slice = (target: VariableFxBitmap, source: VariableFxBitmap) => new VariableFxBitmapComposer(target).drawThreeSlice(source, LevelBadgePainter.SLICE_LEFT_WIDTH, LevelBadgePainter.SLICE_RIGHT_WIDTH, target.width, 0, 0, VariableFxBlendMode.NORMAL, 255);

        new VariableFxBitmapComposer(background).clear(0);

        if(this._sources.background) slice(background, this._sources.background);

        slice(background, this._sources.frame);

        new VariableFxBitmapComposer(frame).clear(0);
        slice(frame, this._sources.frame);
        new VariableFxBitmapComposer(darkening).clear(0);
        slice(darkening, this._sources.darkening);
        new VariableFxBitmapComposer(lighting).clear(0);
        slice(lighting, this._sources.lighting);

        return { background, frame, darkening, lighting };
    }

    private static crop(image: IVariableFxImage, region: { x: number, y: number, width: number, height: number }): VariableFxBitmap
    {
        const bitmap = VariableFxBitmap.create(region.width, region.height);
        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);
        composer.drawLayer(image, -(region.x | 0), -(region.y | 0), VariableFxBlendMode.NORMAL, 255);

        return bitmap;
    }

    private static disposeLayers(layers: ILevelBadgeLayers): void
    {
        layers.background.dispose();
        layers.frame.dispose();
        layers.darkening.dispose();
        layers.lighting.dispose();
    }
}

/** What a level renderer bakes once per config: the badge painter and the bar's own config. */
export class LevelRendererPrebake implements IVariableFxPrebake
{
    public disposed: boolean = false;

    private _subConfig: VariableFxConfig = null;
    private _backgrounds: Map<number, VariableFxBitmap> = new Map();

    constructor(
        public readonly badgePainter: LevelBadgePainter,
        public readonly background: IVariableFxImage = null,
        public readonly numberPainter: LevelDetailsNumberPainter = null,
        private readonly _backgroundSlices: { left: number, right: number, height: number } = null)
    {}

    public getOrCreateSubConfig(create: () => VariableFxConfig): VariableFxConfig
    {
        if(!this._subConfig) this._subConfig = create();

        return this._subConfig;
    }

    /** The details panel's background for a digit count, three-sliced to `width`. */
    public getBackground(digits: number, width: number): { bitmap: VariableFxBitmap, owned: boolean }
    {
        const count = Math.max(1, (digits | 0));
        const total = Math.max(1, (width | 0));

        if(count > LevelBadgePainter.CACHED_DIGIT_COUNT) return { bitmap: this.createBackground(total), owned: true };

        let bitmap = this._backgrounds.get(count);

        if(!bitmap)
        {
            bitmap = this.createBackground(total);

            this._backgrounds.set(count, bitmap);
        }

        return { bitmap, owned: false };
    }

    public dispose(): void
    {
        if(this.disposed) return;

        this.disposed = true;
        this.badgePainter?.dispose();
        this.numberPainter?.dispose();

        for(const bitmap of this._backgrounds.values()) bitmap.dispose();

        this._backgrounds.clear();
        this._subConfig?.disposePrebake();
        this._subConfig = null;
    }

    private createBackground(width: number): VariableFxBitmap
    {
        const bitmap = VariableFxBitmap.create(width, this._backgroundSlices.height);
        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);
        composer.drawThreeSlice(this.background, this._backgroundSlices.left, this._backgroundSlices.right, width, 0, 0, VariableFxBlendMode.NORMAL, 255);

        return bitmap;
    }
}
