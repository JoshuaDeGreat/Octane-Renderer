import { IVariableFxImage, IVariableFxRect, VariableFxBitmap, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { variableFxRect, VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { VariableFxConfiguredIcon, VariableFxIconOverlayLayout } from '../../rendering/VariableFxIcons';
import { VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { VariableFxWidth } from '../../VariableFxTypes';
import { BarVariableFxRendererBase, IVariableFxBarLayout, resolveBackgroundSliceLeftWidth, resolveBackgroundSliceRightWidth } from './BarVariableFxRendererBase';
import { IVariableFxBarOverlay, resolveVariableFxBarOverlays, VariableFxDataPrebake } from './ClassicProgressBarRenderer';
import { VariableFxSegmentedProgress } from './VariableFxSegmentedProgress';

export interface IArrowBarLayout extends IVariableFxBarLayout
{
    arrowCount: number;
}

interface IArrowBarAssets
{
    background: IVariableFxImage;
    chunk: IVariableFxImage;
    darkening: IVariableFxImage;
    lighting: IVariableFxImage;
    metallic: IVariableFxImage;
    splitter: IVariableFxImage;
    splitterLeft: IVariableFxImage;
}

interface IArrowBarPrebake
{
    assets: IArrowBarAssets;
    background: VariableFxBitmap;
    bar: VariableFxBitmap;
    foreground: VariableFxBitmap;
    iconLayout: VariableFxIconOverlayLayout;
    layout: IArrowBarLayout;
    overlays: IVariableFxBarOverlay[];
}

/**
 * AIR's arrow progress bar (ArrowProgressBarRenderer, server renderer 4): 9 px arrows (3 / 4 / 6 /
 * 8 / 10 for extra small to extra large, or the config's segment count), each an 11 px chunk tinted
 * and shaded once and repeated, with the arrow splitters and the icon on top.
 */
export class ArrowProgressBarRenderer extends BarVariableFxRendererBase
{
    public static ASSET_NAMES = {
        background: 'variablefx_arrow_bar_background',
        chunk: 'variablefx_arrow_bar_chunk',
        darkening: 'variablefx_arrow_bar_darkening',
        lighting: 'variablefx_arrow_bar_lighting',
        metallic: 'variablefx_arrow_bar_metallic',
        splitter: 'variablefx_arrow_bar_splitter',
        splitterLeft: 'variablefx_arrow_bar_splitter_left'
    };

    public static FRAME_HEIGHT: number = 13;
    public static BORDER: number = 3;
    public static FILL_HEIGHT: number = 7;
    public static ARROW_WIDTH: number = 9;
    public static BAR_CHUNK_WIDTH: number = 11;
    public static FIRST_SPLITTER_X: number = 7;

    private _assets: IArrowBarAssets;
    private _background: VariableFxBitmap;
    private _barPrebake: VariableFxBitmap;
    private _foreground: VariableFxBitmap;
    private _iconLayout: VariableFxIconOverlayLayout;
    private _layout: IArrowBarLayout;
    private _overlays: IVariableFxBarOverlay[];
    private _dynamicBar: VariableFxBitmap = null;
    private _dynamicArgb: number = -1;

    constructor(context: VariableFxRendererContext)
    {
        super(context);

        const prebake = context.config.getOrCreatePrebake(() => this.createPrebake(context)).data;

        this._assets = prebake.assets;
        this._background = prebake.background;
        this._barPrebake = prebake.bar;
        this._foreground = prebake.foreground;
        this._iconLayout = prebake.iconLayout;
        this._layout = prebake.layout;
        this._overlays = prebake.overlays;

        if(!this._barPrebake) this._dynamicBar = VariableFxBitmap.create(this._iconLayout.frameWidth, this._iconLayout.frameHeight);
    }

    public get frameWidth(): number
    {
        return this._iconLayout.frameWidth;
    }

    public get frameHeight(): number
    {
        return this._iconLayout.frameHeight;
    }

    public get progressPixelWidth(): number
    {
        return (this._layout.fillWidth | 0);
    }

    public get layout(): IArrowBarLayout
    {
        return this._layout;
    }

    public get iconLayout(): VariableFxIconOverlayLayout
    {
        return this._iconLayout;
    }

    public dispose(): void
    {
        super.dispose();

        this._dynamicBar?.dispose();
        this._dynamicBar = null;
    }

    public static resolveArrowCount(width: string, configExtra: Record<string, string>): number
    {
        return VariableFxSegmentedProgress.resolveSegmentCount(width, configExtra, ArrowProgressBarRenderer.resolveDefaultArrowCount);
    }

    public static resolveDefaultArrowCount(width: string): number
    {
        switch(width)
        {
            case VariableFxWidth.EXTRA_SMALL: return 3;
            case VariableFxWidth.SMALL: return 4;
            case VariableFxWidth.LARGE: return 8;
            case VariableFxWidth.EXTRA_LARGE: return 10;
            default: return 6;
        }
    }

    public static resolveLayout(width: string, configExtra: Record<string, string>): IArrowBarLayout
    {
        const arrowCount = ArrowProgressBarRenderer.resolveArrowCount(width, configExtra);
        const fillWidth = (arrowCount * ArrowProgressBarRenderer.ARROW_WIDTH);

        return {
            arrowCount,
            width: (fillWidth + (ArrowProgressBarRenderer.BORDER * 2)),
            height: ArrowProgressBarRenderer.FRAME_HEIGHT,
            fillX: ArrowProgressBarRenderer.BORDER,
            fillY: ArrowProgressBarRenderer.BORDER,
            fillWidth,
            fillHeight: ArrowProgressBarRenderer.FILL_HEIGHT,
            sliceLeftWidth: ArrowProgressBarRenderer.BORDER,
            sliceRightWidth: ArrowProgressBarRenderer.BORDER
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

        if(width > 0) composer.drawLayer(this.barBitmap(), 0, 0, VariableFxBlendMode.NORMAL, 255, this.fillClip(width));

        composer.drawLayer(this._foreground, 0, 0, VariableFxBlendMode.NORMAL, 255);
    }

    private createPrebake(context: VariableFxRendererContext): VariableFxDataPrebake<IArrowBarPrebake>
    {
        const layout = ArrowProgressBarRenderer.resolveLayout(context.config.width, context.config.extra);
        const assets = this.resolveAssets();
        const icon = VariableFxConfiguredIcon.resolve(context.config.extra, context.assets);
        const iconLayout = VariableFxConfiguredIcon.resolveBarIconOverlayLayout(layout.width, layout.height, icon, VariableFxConfiguredIcon.resolveAlignment(context.config.extra));
        const color = VariableFxPaintColor.resolveConfigured(context.config.color, context.config.extra);
        const overlays = resolveVariableFxBarOverlays(color.metallic, assets.darkening, assets.lighting);
        const background = VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight);
        const foreground = VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight);
        const bar = (VariableFxPaintColor.isDynamic(context.config.color) ? null : VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight));
        const x = iconLayout.contentX;
        const y = iconLayout.contentY;

        const backgroundComposer = new VariableFxBitmapComposer(background);

        backgroundComposer.clear(0);
        backgroundComposer.drawThreeSlice(assets.background, resolveBackgroundSliceLeftWidth(layout), resolveBackgroundSliceRightWidth(layout), layout.width, x, y, VariableFxBlendMode.NORMAL, 255);

        const foregroundComposer = new VariableFxBitmapComposer(foreground);
        const fillClip = this.fillClip(layout.fillWidth, layout, iconLayout);

        foregroundComposer.clear(0);
        foregroundComposer.drawLayer(assets.splitterLeft, (x + layout.fillX), (y + layout.fillY), VariableFxBlendMode.NORMAL, 255, fillClip);

        for(let offset = ArrowProgressBarRenderer.FIRST_SPLITTER_X; offset < (layout.fillWidth | 0); offset += ArrowProgressBarRenderer.ARROW_WIDTH)
        {
            foregroundComposer.drawLayer(assets.splitter, (x + layout.fillX + offset), (y + layout.fillY), VariableFxBlendMode.NORMAL, 255, fillClip);
        }

        if(icon) foregroundComposer.drawLayer(icon.bitmap, iconLayout.iconX, iconLayout.iconY, VariableFxBlendMode.NORMAL, 255);

        if(bar) this.drawBarBitmap(bar, ((0xFF000000 | color.rgb) >>> 0), assets, overlays, layout, iconLayout);

        return new VariableFxDataPrebake<IArrowBarPrebake>({ assets, background, bar, foreground, iconLayout, layout, overlays }, () =>
        {
            background.dispose();
            foreground.dispose();
            bar?.dispose();
        });
    }

    private barBitmap(): VariableFxBitmap
    {
        if(this._barPrebake) return this._barPrebake;

        const argb = this.fillArgb;

        if(this._dynamicArgb !== (argb | 0))
        {
            this._dynamicArgb = (argb | 0);

            this.drawBarBitmap(this._dynamicBar, argb, this._assets, this._overlays, this._layout, this._iconLayout);
        }

        return this._dynamicBar;
    }

    private drawBarBitmap(bitmap: VariableFxBitmap, argb: number, assets: IArrowBarAssets, overlays: IVariableFxBarOverlay[], layout: IArrowBarLayout, iconLayout: VariableFxIconOverlayLayout): void
    {
        const chunk = this.createChunkBitmap(argb, assets, overlays);
        const clip = this.fillClip(layout.fillWidth, layout, iconLayout);
        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);

        for(let offset = 0; offset < (layout.fillWidth | 0); offset += ArrowProgressBarRenderer.ARROW_WIDTH)
        {
            composer.drawLayer(chunk, (iconLayout.contentX + layout.fillX + offset), (iconLayout.contentY + layout.fillY), VariableFxBlendMode.NORMAL, 255, clip);
        }

        chunk.dispose();
    }

    /** One arrow: the chunk tinted, the metallic layer added, then the shading. */
    private createChunkBitmap(argb: number, assets: IArrowBarAssets, overlays: IVariableFxBarOverlay[]): VariableFxBitmap
    {
        const chunk = VariableFxBitmap.create(ArrowProgressBarRenderer.BAR_CHUNK_WIDTH, ArrowProgressBarRenderer.FILL_HEIGHT);
        const composer = new VariableFxBitmapComposer(chunk);

        composer.clear(0);
        composer.drawTintedLayer(assets.chunk, 0, 0, argb, VariableFxBlendMode.NORMAL, 255);

        if(assets.metallic) composer.drawLayer(assets.metallic, 0, 0, VariableFxBlendMode.ADD, 255);

        for(const overlay of overlays) composer.drawLayer(overlay.layer, 0, 0, overlay.blendMode, 255);

        return chunk;
    }

    private fillClip(width: number, layout: IArrowBarLayout = this._layout, iconLayout: VariableFxIconOverlayLayout = this._iconLayout): IVariableFxRect
    {
        return variableFxRect((iconLayout.contentX + layout.fillX), (iconLayout.contentY + layout.fillY), ((width < 0) ? (layout.fillWidth | 0) : width), layout.fillHeight);
    }

    private resolveAssets(): IArrowBarAssets
    {
        const metallic = VariableFxPaintColor.resolveConfigured(this._context.config.color, this._context.config.extra).metallic;
        const names = ArrowProgressBarRenderer.ASSET_NAMES;
        const description = 'arrow progress bar';

        return {
            background: this.getLayer(names.background, description),
            chunk: this.getLayer(names.chunk, description),
            darkening: this.getLayer(names.darkening, description),
            lighting: this.getLayer(names.lighting, description),
            metallic: (metallic ? this.getLayer(names.metallic, description) : null),
            splitter: this.getLayer(names.splitter, description),
            splitterLeft: this.getLayer(names.splitterLeft, description)
        };
    }
}
