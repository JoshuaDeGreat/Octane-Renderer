import { IVariableFxImage, IVariableFxRect, VariableFxBitmap, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { variableFxRect, VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxWidth } from '../../VariableFxTypes';
import { BarVariableFxRendererBase, IVariableFxBarLayout, resolveBackgroundSliceLeftWidth, resolveBackgroundSliceRightWidth } from './BarVariableFxRendererBase';
import { VariableFxDataPrebake } from './ClassicProgressBarRenderer';
import { VariableFxSegmentedProgress } from './VariableFxSegmentedProgress';

interface IThermometerAssets
{
    background: IVariableFxImage;
    darkening: IVariableFxImage;
    fill: IVariableFxImage;
    lighting: IVariableFxImage;
    splitters: IVariableFxImage;
    top: IVariableFxImage;
}

interface IThermometerPrebake
{
    background: VariableFxBitmap;
    bar: VariableFxBitmap;
    darkening: VariableFxBitmap;
    layout: IVariableFxBarLayout;
    splitters: VariableFxBitmap;
}

/**
 * AIR's thermometer (ThermometerHealthPointsRenderer, server renderer 13): 5 px segments (4 / 6 /
 * 9 / 12 / 15 for extra small to extra large, or the config's segment count) in the fill asset's
 * own colour, a 1 px highlight, the darkening multiplied over the whole tube, rounded corners from
 * the top asset and 2 px splitters between the segments. No colour option.
 */
export class ThermometerHealthPointsRenderer extends BarVariableFxRendererBase
{
    public static ASSET_NAMES = {
        background: 'variablefx_thermometer_health_points_background',
        darkening: 'variablefx_thermometer_health_points_darkening',
        fill: 'variablefx_thermometer_health_points_fill',
        lighting: 'variablefx_thermometer_health_points_lighting',
        splitters: 'variablefx_thermometer_health_points_splitters',
        top: 'variablefx_thermometer_health_points_top'
    };

    public static SLICE_WIDTH: number = 3;
    public static DARKENING_SLICE_WIDTH: number = 4;
    public static FILL_X: number = 2;
    public static FILL_Y: number = 2;
    public static LIGHT_INSET_X: number = 3;
    public static LIGHT_Y: number = (ThermometerHealthPointsRenderer.FILL_Y + 1);
    public static LIGHT_SOURCE_X: number = 3;
    public static LIGHT_SOURCE_Y: number = (ThermometerHealthPointsRenderer.LIGHT_Y - ThermometerHealthPointsRenderer.FILL_Y);
    public static SEGMENT_WIDTH: number = 5;
    public static SPLITTER_WIDTH: number = 2;
    public static SPLITTER_SOURCE_Y: number = ThermometerHealthPointsRenderer.FILL_Y;

    private _background: VariableFxBitmap;
    private _bar: VariableFxBitmap;
    private _darkening: VariableFxBitmap;
    private _layout: IVariableFxBarLayout;
    private _splitters: VariableFxBitmap;

    constructor(context: VariableFxRendererContext)
    {
        super(context);

        const prebake = context.config.getOrCreatePrebake(() => this.createPrebake(context)).data;

        this._background = prebake.background;
        this._bar = prebake.bar;
        this._darkening = prebake.darkening;
        this._layout = prebake.layout;
        this._splitters = prebake.splitters;
    }

    public get frameWidth(): number
    {
        return (this._layout.width | 0);
    }

    public get frameHeight(): number
    {
        return (this._layout.height | 0);
    }

    public get progressPixelWidth(): number
    {
        return (this._layout.fillWidth | 0);
    }

    public get layout(): IVariableFxBarLayout
    {
        return this._layout;
    }

    public static resolveSegmentCount(width: string, configExtra: Record<string, string> = null): number
    {
        return VariableFxSegmentedProgress.resolveSegmentCount(width, configExtra, ThermometerHealthPointsRenderer.resolveDefaultSegmentCount);
    }

    public static resolveDefaultSegmentCount(width: string): number
    {
        switch(width)
        {
            case VariableFxWidth.EXTRA_SMALL: return 4;
            case VariableFxWidth.SMALL: return 6;
            case VariableFxWidth.LARGE: return 12;
            case VariableFxWidth.EXTRA_LARGE: return 15;
            default: return 9;
        }
    }

    public static resolveFrameWidth(width: string, configExtra: Record<string, string> = null): number
    {
        return ((ThermometerHealthPointsRenderer.resolveSegmentCount(width, configExtra) * ThermometerHealthPointsRenderer.SEGMENT_WIDTH) + (ThermometerHealthPointsRenderer.FILL_X * 2) + 1);
    }

    public static resolveLayout(width: string, configExtra: Record<string, string>, background: IVariableFxImage): IVariableFxBarLayout
    {
        const frameWidth = ThermometerHealthPointsRenderer.resolveFrameWidth(width, configExtra);

        return {
            width: frameWidth,
            height: background.height,
            fillX: ThermometerHealthPointsRenderer.FILL_X,
            fillY: ThermometerHealthPointsRenderer.FILL_Y,
            fillWidth: Math.max(0, (frameWidth - (ThermometerHealthPointsRenderer.FILL_X * 2))),
            fillHeight: Math.max(1, (background.height - (ThermometerHealthPointsRenderer.FILL_Y * 2))),
            sliceLeftWidth: ThermometerHealthPointsRenderer.SLICE_WIDTH,
            sliceRightWidth: ThermometerHealthPointsRenderer.SLICE_WIDTH
        };
    }

    protected renderFrame(now: number): void
    {
        const bitmap = this._frame.bitmap;

        if(!bitmap) return;

        const composer = new VariableFxBitmapComposer(bitmap);
        const width = this.renderedPixelWidth();

        composer.clear(0);
        composer.drawLayer(this._background, 0, 0, VariableFxBlendMode.NORMAL, 255);

        if(width > 0) composer.drawLayer(this._bar, 0, 0, VariableFxBlendMode.NORMAL, 255, this.fillClip(width));

        composer.drawLayer(this._darkening, 0, 0, VariableFxBlendMode.MULTIPLY, 255);
        composer.drawLayer(this._splitters, 0, 0, VariableFxBlendMode.NORMAL, 255);
    }

    private createPrebake(context: VariableFxRendererContext): VariableFxDataPrebake<IThermometerPrebake>
    {
        const assets = this.resolveAssets();
        const layout = ThermometerHealthPointsRenderer.resolveLayout(context.config.width, context.config.extra, assets.background);
        const background = VariableFxBitmap.create(layout.width, layout.height);
        const bar = VariableFxBitmap.create(layout.width, layout.height);
        const darkening = VariableFxBitmap.create(layout.width, layout.height);
        const splitters = VariableFxBitmap.create(layout.width, layout.height);

        const backgroundComposer = new VariableFxBitmapComposer(background);

        backgroundComposer.clear(0);
        backgroundComposer.drawThreeSlice(assets.background, resolveBackgroundSliceLeftWidth(layout), resolveBackgroundSliceRightWidth(layout), layout.width, 0, 0, VariableFxBlendMode.NORMAL, 255);

        const barComposer = new VariableFxBitmapComposer(bar);

        barComposer.clear(0);

        if((layout.fillWidth > 0) && (assets.fill.width > 0) && (assets.fill.height > 0))
        {
            barComposer.drawTiledChunk(assets.fill, variableFxRect(0, 0, 1, 1), layout.fillX, layout.fillY, layout.fillWidth, layout.fillHeight, VariableFxBlendMode.NORMAL, 255);
        }

        this.drawLighting(barComposer, assets.lighting, layout.fillWidth, layout);

        const darkeningComposer = new VariableFxBitmapComposer(darkening);

        darkeningComposer.clear(0);
        darkeningComposer.drawThreeSlice(assets.darkening, ThermometerHealthPointsRenderer.DARKENING_SLICE_WIDTH, ThermometerHealthPointsRenderer.DARKENING_SLICE_WIDTH, layout.fillWidth, layout.fillX, layout.fillY, VariableFxBlendMode.NORMAL, 255);

        const splittersComposer = new VariableFxBitmapComposer(splitters);

        splittersComposer.clear(0);
        this.drawCorners(splittersComposer, assets.top, layout);
        this.drawSplitters(splittersComposer, assets.splitters, layout);

        return new VariableFxDataPrebake<IThermometerPrebake>({ background, bar, darkening, layout, splitters }, () =>
        {
            background.dispose();
            bar.dispose();
            darkening.dispose();
            splitters.dispose();
        });
    }

    private drawLighting(composer: VariableFxBitmapComposer, lighting: IVariableFxImage, width: number, layout: IVariableFxBarLayout): void
    {
        const length = Math.min((width - ThermometerHealthPointsRenderer.LIGHT_INSET_X), ((layout.fillWidth | 0) - (ThermometerHealthPointsRenderer.LIGHT_INSET_X * 2)));

        if((length <= 0) || (lighting.width < (ThermometerHealthPointsRenderer.LIGHT_SOURCE_X + 1)) || (lighting.height < (ThermometerHealthPointsRenderer.LIGHT_SOURCE_Y + 1))) return;

        composer.drawTiledChunk(lighting, variableFxRect(ThermometerHealthPointsRenderer.LIGHT_SOURCE_X, ThermometerHealthPointsRenderer.LIGHT_SOURCE_Y, 1, 1), (layout.fillX + ThermometerHealthPointsRenderer.LIGHT_INSET_X), ThermometerHealthPointsRenderer.LIGHT_Y, length, 1, VariableFxBlendMode.ADD, 255);
    }

    /** The four corner pixels of the tube, taken from the top asset's corners. */
    private drawCorners(composer: VariableFxBitmapComposer, top: IVariableFxImage, layout: IVariableFxBarLayout): void
    {
        const sourceLeft = Math.min(ThermometerHealthPointsRenderer.FILL_X, (top.width - 1));
        const sourceRight = Math.max(0, (top.width - ThermometerHealthPointsRenderer.FILL_X - 1));
        const sourceTop = Math.min(ThermometerHealthPointsRenderer.FILL_Y, (top.height - 1));
        const sourceBottom = Math.max(0, (top.height - ThermometerHealthPointsRenderer.FILL_Y - 1));
        const left = layout.fillX;
        const right = ((layout.width | 0) - layout.fillX - 1);
        const upper = layout.fillY;
        const lower = (layout.fillY + (layout.fillHeight | 0) - 1);
        const pixel = (sx: number, sy: number, x: number, y: number) => composer.drawTiledChunk(top, variableFxRect(sx, sy, 1, 1), x, y, 1, 1, VariableFxBlendMode.NORMAL, 255);

        pixel(sourceLeft, sourceTop, left, upper);
        pixel(sourceLeft, sourceBottom, left, lower);
        pixel(sourceRight, sourceTop, right, upper);
        pixel(sourceRight, sourceBottom, right, lower);
    }

    private drawSplitters(composer: VariableFxBitmapComposer, splitters: IVariableFxImage, layout: IVariableFxBarLayout): void
    {
        const height = Math.min((layout.fillHeight | 0), (splitters.height - ThermometerHealthPointsRenderer.SPLITTER_SOURCE_Y));
        const width = Math.min(ThermometerHealthPointsRenderer.SPLITTER_WIDTH, splitters.width);
        const clip = this.fillClip(layout.fillWidth, layout);

        if((width <= 0) || (height <= 0)) return;

        for(let x = ThermometerHealthPointsRenderer.SEGMENT_WIDTH; x <= ((layout.fillWidth | 0) - ThermometerHealthPointsRenderer.SEGMENT_WIDTH - 1); x += ThermometerHealthPointsRenderer.SEGMENT_WIDTH)
        {
            composer.drawTiledChunk(splitters, variableFxRect(0, ThermometerHealthPointsRenderer.SPLITTER_SOURCE_Y, width, height), (layout.fillX + x), layout.fillY, width, layout.fillHeight, VariableFxBlendMode.NORMAL, 255, clip);
        }
    }

    private fillClip(width: number, layout: IVariableFxBarLayout = this._layout): IVariableFxRect
    {
        return variableFxRect(layout.fillX, layout.fillY, width, layout.fillHeight);
    }

    private resolveAssets(): IThermometerAssets
    {
        const names = ThermometerHealthPointsRenderer.ASSET_NAMES;
        const description = 'thermometer health points';

        return {
            background: this.getLayer(names.background, description),
            darkening: this.getLayer(names.darkening, description),
            fill: this.getLayer(names.fill, description),
            lighting: this.getLayer(names.lighting, description),
            splitters: this.getLayer(names.splitters, description),
            top: this.getLayer(names.top, description)
        };
    }
}
