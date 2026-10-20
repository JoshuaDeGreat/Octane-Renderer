import { IVariableFxImage, IVariableFxRect, VariableFxBitmap, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { variableFxRect, VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { VariableFxConfiguredIcon, VariableFxIconOverlayLayout } from '../../rendering/VariableFxIcons';
import { VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { VariableFxWidth } from '../../VariableFxTypes';
import { BarVariableFxRendererBase, IVariableFxBarLayout, resolveBackgroundSliceLeftWidth, resolveBackgroundSliceRightWidth } from './BarVariableFxRendererBase';
import { VariableFxDataPrebake } from './ClassicProgressBarRenderer';

interface IStripedBarAssets
{
    background: IVariableFxImage;
    bar: IVariableFxImage;
    darkening: IVariableFxImage;
    lighting: IVariableFxImage;
    metallic: IVariableFxImage;
    stripe: IVariableFxImage;
}

interface IStripedBarOverlay
{
    blendMode: VariableFxBlendMode;
    layer: IVariableFxImage;
    sliceLeftWidth: number;
    sliceRightWidth: number;
}

interface IStripedBarPrebake
{
    assets: IStripedBarAssets;
    background: VariableFxBitmap;
    barEnd: VariableFxBitmap;
    bar: VariableFxBitmap;
    barShape: VariableFxBitmap;
    foreground: VariableFxBitmap;
    iconLayout: VariableFxIconOverlayLayout;
    layout: IVariableFxBarLayout;
    overlays: IStripedBarOverlay[];
    stripes: VariableFxBitmap;
    stripesShape: VariableFxBitmap;
}

/**
 * AIR's striped progress bar (StripedProgressBarRenderer, server renderer 3): the fill tinted and
 * shaded (the metallic variants of the shading for a metallic colour), with diagonal stripes in the
 * fill colour at half its brightness multiplied over it. The stripes move one pixel every 70 ms
 * (a 10 px period) while the bar has any fill. Widths 29 / 37 / 53 / 69 / 85 px.
 */
export class StripedProgressBarRenderer extends BarVariableFxRendererBase
{
    public static ASSET_NAMES = {
        background: 'variablefx_striped_bar_background',
        bar: 'variablefx_striped_bar_fill',
        darkening: 'variablefx_striped_bar_darkening',
        darkeningMetallic: 'variablefx_striped_bar_darkening_metallic',
        lighting: 'variablefx_striped_bar_lighting',
        lightingMetallic: 'variablefx_striped_bar_lighting_metallic',
        metallic: 'variablefx_striped_bar_metallic',
        stripe: 'variablefx_striped_bar_stripe'
    };

    public static FRAME_HEIGHT: number = 13;
    public static BORDER: number = 3;
    public static FILL_HEIGHT: number = 7;
    public static SLICE_WIDTH: number = 3;
    public static LIGHTING_SLICE_LEFT_WIDTH: number = 9;
    public static BAR_END_WIDTH: number = 2;
    public static BAR_END_MINIMUM_FILL_WIDTH: number = 4;
    public static STRIPE_PERIOD_PX: number = 10;
    public static STRIPE_STEP_MS: number = 70;
    public static STRIPE_VALUE_SCALE: number = 0.5;

    private _assets: IStripedBarAssets;
    private _background: VariableFxBitmap;
    private _barPrebake: VariableFxBitmap;
    private _barEndPrebake: VariableFxBitmap;
    private _barShape: VariableFxBitmap;
    private _foreground: VariableFxBitmap;
    private _iconLayout: VariableFxIconOverlayLayout;
    private _layout: IVariableFxBarLayout;
    private _overlays: IStripedBarOverlay[];
    private _stripesPrebake: VariableFxBitmap;
    private _stripesShape: VariableFxBitmap;
    private _dynamicBar: VariableFxBitmap = null;
    private _dynamicBarEnd: VariableFxBitmap = null;
    private _dynamicStripes: VariableFxBitmap = null;
    private _dynamicArgb: number = -1;
    private _dynamicStripesArgb: number = -1;
    private _renderedPhase: number = -1;

    constructor(context: VariableFxRendererContext)
    {
        super(context);

        const prebake = context.config.getOrCreatePrebake(() => this.createPrebake(context)).data;

        this._assets = prebake.assets;
        this._background = prebake.background;
        this._barEndPrebake = prebake.barEnd;
        this._barPrebake = prebake.bar;
        this._barShape = prebake.barShape;
        this._foreground = prebake.foreground;
        this._iconLayout = prebake.iconLayout;
        this._layout = prebake.layout;
        this._overlays = prebake.overlays;
        this._stripesPrebake = prebake.stripes;
        this._stripesShape = prebake.stripesShape;

        if(!this._barPrebake)
        {
            this._dynamicBar = VariableFxBitmap.create(this._iconLayout.frameWidth, this._iconLayout.frameHeight);
            this._dynamicBarEnd = VariableFxBitmap.create(StripedProgressBarRenderer.BAR_END_WIDTH, this._iconLayout.frameHeight);
        }

        if(!this._stripesPrebake) this._dynamicStripes = VariableFxBitmap.create(this._stripesShape.width, this._stripesShape.height);
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

    public get isContinuous(): boolean
    {
        return (this.renderedPixelWidth() > 0);
    }

    public get layout(): IVariableFxBarLayout
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
        this._dynamicBarEnd?.dispose();
        this._dynamicBarEnd = null;
        this._dynamicStripes?.dispose();
        this._dynamicStripes = null;
    }

    public static resolveFrameWidthFor(width: string): number
    {
        switch(width)
        {
            case VariableFxWidth.EXTRA_SMALL: return 29;
            case VariableFxWidth.SMALL: return 37;
            case VariableFxWidth.LARGE: return 69;
            case VariableFxWidth.EXTRA_LARGE: return 85;
            default: return 53;
        }
    }

    public static resolveLayout(width: string): IVariableFxBarLayout
    {
        const frameWidth = StripedProgressBarRenderer.resolveFrameWidthFor(width);

        return {
            width: frameWidth,
            height: StripedProgressBarRenderer.FRAME_HEIGHT,
            fillX: StripedProgressBarRenderer.BORDER,
            fillY: StripedProgressBarRenderer.BORDER,
            fillWidth: Math.max(0, (frameWidth - (StripedProgressBarRenderer.BORDER * 2))),
            fillHeight: StripedProgressBarRenderer.FILL_HEIGHT,
            sliceLeftWidth: StripedProgressBarRenderer.BORDER,
            sliceRightWidth: StripedProgressBarRenderer.BORDER
        };
    }

    /** How far the stripes have moved at `now`, 0 to 9 px. */
    public static stripePhase(now: number): number
    {
        if(now <= 0) return 0;

        return (Math.floor(now / StripedProgressBarRenderer.STRIPE_STEP_MS) % StripedProgressBarRenderer.STRIPE_PERIOD_PX);
    }

    protected renderFrame(now: number): void
    {
        const bitmap = this._frame.bitmap;

        if(!bitmap) return;

        const composer = new VariableFxBitmapComposer(bitmap);
        const width = this.renderedPixelWidth();

        composer.clear(0);
        composer.drawLayer(this._background, 0, 0, VariableFxBlendMode.NORMAL, 255);

        if(width > 0)
        {
            const clip = this.fillClip(width);

            composer.drawLayer(this.barBitmap(), 0, 0, VariableFxBlendMode.NORMAL, 255, clip);

            if(width >= StripedProgressBarRenderer.BAR_END_MINIMUM_FILL_WIDTH)
            {
                composer.drawLayer(this.barEndBitmap(), (this._iconLayout.contentX + this._layout.fillX + width - StripedProgressBarRenderer.BAR_END_WIDTH), 0, VariableFxBlendMode.NORMAL, 255, this.fillClip(this._layout.fillWidth));
            }

            composer.drawLayer(this.stripesBitmap(), (StripedProgressBarRenderer.stripePhase(now) - StripedProgressBarRenderer.STRIPE_PERIOD_PX), 0, VariableFxBlendMode.MULTIPLY, 255, clip);
        }

        if(this._foreground) composer.drawLayer(this._foreground, 0, 0, VariableFxBlendMode.NORMAL, 255);
    }

    protected hasExtraRenderChange(now: number): boolean
    {
        return ((this.renderedPixelWidth() > 0) && (StripedProgressBarRenderer.stripePhase(now) !== this._renderedPhase));
    }

    protected afterRender(now: number): void
    {
        this._renderedPhase = StripedProgressBarRenderer.stripePhase(now);
    }

    private createPrebake(context: VariableFxRendererContext): VariableFxDataPrebake<IStripedBarPrebake>
    {
        const layout = StripedProgressBarRenderer.resolveLayout(context.config.width);
        const assets = this.resolveAssets();
        const icon = VariableFxConfiguredIcon.resolve(context.config.extra, context.assets);
        const iconLayout = VariableFxConfiguredIcon.resolveBarIconOverlayLayout(layout.width, layout.height, icon, VariableFxConfiguredIcon.resolveAlignment(context.config.extra));
        const color = VariableFxPaintColor.resolveConfigured(context.config.color, context.config.extra);
        const overlays = this.resolveOverlays(assets);
        const dynamic = VariableFxPaintColor.isDynamic(context.config.color);
        const background = VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight);
        const barShape = VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight);
        const foreground = (iconLayout.hasIcon ? VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight) : null);
        const stripesShape = VariableFxBitmap.create((iconLayout.frameWidth + StripedProgressBarRenderer.STRIPE_PERIOD_PX + assets.stripe.width), iconLayout.frameHeight);
        const bar = (dynamic ? null : VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight));
        const barEnd = (dynamic ? null : VariableFxBitmap.create(StripedProgressBarRenderer.BAR_END_WIDTH, iconLayout.frameHeight));
        const stripes = (dynamic ? null : VariableFxBitmap.create(stripesShape.width, stripesShape.height));
        const x = iconLayout.contentX;
        const y = iconLayout.contentY;

        const backgroundComposer = new VariableFxBitmapComposer(background);

        backgroundComposer.clear(0);
        backgroundComposer.drawThreeSlice(assets.background, resolveBackgroundSliceLeftWidth(layout), resolveBackgroundSliceRightWidth(layout), layout.width, x, y, VariableFxBlendMode.NORMAL, 255);

        const shapeComposer = new VariableFxBitmapComposer(barShape);

        shapeComposer.clear(0);
        shapeComposer.drawThreeSlice(assets.bar, layout.sliceLeftWidth, layout.sliceRightWidth, layout.fillWidth, (x + layout.fillX), (y + layout.fillY), VariableFxBlendMode.NORMAL, 255);

        if(foreground && icon)
        {
            const foregroundComposer = new VariableFxBitmapComposer(foreground);

            foregroundComposer.clear(0);
            foregroundComposer.drawLayer(icon.bitmap, iconLayout.iconX, iconLayout.iconY, VariableFxBlendMode.NORMAL, 255);
        }

        const stripesComposer = new VariableFxBitmapComposer(stripesShape);

        stripesComposer.clear(0);

        for(let offset = 0; offset <= ((layout.fillWidth | 0) + StripedProgressBarRenderer.STRIPE_PERIOD_PX); offset += StripedProgressBarRenderer.STRIPE_PERIOD_PX)
        {
            stripesComposer.drawLayer(assets.stripe, (x + layout.fillX + offset), (y + layout.fillY), VariableFxBlendMode.NORMAL, 255);
        }

        if(bar && barEnd && stripes)
        {
            this.drawBarBitmap(bar, barEnd, ((0xFF000000 | color.rgb) >>> 0), barShape, assets, overlays, layout, iconLayout);
            this.drawStripesBitmap(stripes, ((0xFF000000 | StripedProgressBarRenderer.stripeRgb(color.rgb)) >>> 0), stripesShape);
        }

        return new VariableFxDataPrebake<IStripedBarPrebake>({ assets, background, barEnd, bar, barShape, foreground, iconLayout, layout, overlays, stripes, stripesShape }, () =>
        {
            background.dispose();
            barShape.dispose();
            stripesShape.dispose();
            bar?.dispose();
            barEnd?.dispose();
            foreground?.dispose();
            stripes?.dispose();
        });
    }

    private static stripeRgb(rgb: number): number
    {
        return VariableFxPaintColor.scaleValue(rgb, StripedProgressBarRenderer.STRIPE_VALUE_SCALE);
    }

    private barBitmap(): VariableFxBitmap
    {
        if(this._barPrebake) return this._barPrebake;

        this.redrawDynamicBar();

        return this._dynamicBar;
    }

    private barEndBitmap(): VariableFxBitmap
    {
        if(this._barEndPrebake) return this._barEndPrebake;

        this.redrawDynamicBar();

        return this._dynamicBarEnd;
    }

    private stripesBitmap(): VariableFxBitmap
    {
        if(this._stripesPrebake) return this._stripesPrebake;

        const argb = ((0xFF000000 | StripedProgressBarRenderer.stripeRgb(this.fillArgb & 0xFFFFFF)) >>> 0);

        if(this._dynamicStripesArgb !== (argb | 0))
        {
            this._dynamicStripesArgb = (argb | 0);

            this.drawStripesBitmap(this._dynamicStripes, argb, this._stripesShape);
        }

        return this._dynamicStripes;
    }

    private redrawDynamicBar(): void
    {
        const argb = this.fillArgb;

        if(this._dynamicArgb === (argb | 0)) return;

        this._dynamicArgb = (argb | 0);

        this.drawBarBitmap(this._dynamicBar, this._dynamicBarEnd, argb, this._barShape, this._assets, this._overlays, this._layout, this._iconLayout);
    }

    private drawBarBitmap(bar: VariableFxBitmap, barEnd: VariableFxBitmap, argb: number, shape: VariableFxBitmap, assets: IStripedBarAssets, overlays: IStripedBarOverlay[], layout: IVariableFxBarLayout, iconLayout: VariableFxIconOverlayLayout): void
    {
        const composer = new VariableFxBitmapComposer(bar);

        composer.clear(0);
        composer.drawTintedLayer(shape, 0, 0, argb, VariableFxBlendMode.NORMAL, 255);

        if(assets.metallic) this.drawFullFillLayer(composer, assets.metallic, VariableFxBlendMode.ADD, layout, iconLayout, StripedProgressBarRenderer.LIGHTING_SLICE_LEFT_WIDTH, StripedProgressBarRenderer.SLICE_WIDTH);

        for(const overlay of overlays) this.drawFullFillLayer(composer, overlay.layer, overlay.blendMode, layout, iconLayout, overlay.sliceLeftWidth, overlay.sliceRightWidth);

        const endComposer = new VariableFxBitmapComposer(barEnd);

        endComposer.clear(0);
        endComposer.drawLayer(bar, -(iconLayout.contentX + layout.fillX + (layout.fillWidth | 0) - StripedProgressBarRenderer.BAR_END_WIDTH), 0, VariableFxBlendMode.NORMAL, 255);
    }

    private drawStripesBitmap(bitmap: VariableFxBitmap, argb: number, shape: VariableFxBitmap): void
    {
        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);
        composer.drawTintedLayer(shape, 0, 0, argb, VariableFxBlendMode.NORMAL, 255);
    }

    private drawFullFillLayer(composer: VariableFxBitmapComposer, layer: IVariableFxImage, blend: VariableFxBlendMode, layout: IVariableFxBarLayout, iconLayout: VariableFxIconOverlayLayout, sliceLeftWidth: number, sliceRightWidth: number): void
    {
        composer.drawRepeatedThreeSlice(layer, sliceLeftWidth, sliceRightWidth, layout.fillWidth, (iconLayout.contentX + layout.fillX), (iconLayout.contentY + layout.fillY), blend, 255);
    }

    private fillClip(width: number): IVariableFxRect
    {
        return variableFxRect((this._iconLayout.contentX + this._layout.fillX), (this._iconLayout.contentY + this._layout.fillY), width, this._layout.fillHeight);
    }

    private resolveOverlays(assets: IStripedBarAssets): IStripedBarOverlay[]
    {
        return [
            { blendMode: VariableFxBlendMode.MULTIPLY, layer: assets.darkening, sliceLeftWidth: StripedProgressBarRenderer.SLICE_WIDTH, sliceRightWidth: StripedProgressBarRenderer.SLICE_WIDTH },
            { blendMode: VariableFxBlendMode.ADD, layer: assets.lighting, sliceLeftWidth: StripedProgressBarRenderer.LIGHTING_SLICE_LEFT_WIDTH, sliceRightWidth: StripedProgressBarRenderer.SLICE_WIDTH }
        ];
    }

    private resolveAssets(): IStripedBarAssets
    {
        const metallic = VariableFxPaintColor.resolveConfigured(this._context.config.color, this._context.config.extra).metallic;
        const names = StripedProgressBarRenderer.ASSET_NAMES;
        const description = 'striped progress bar';

        return {
            background: this.getLayer(names.background, description),
            bar: this.getLayer(names.bar, description),
            darkening: this.getLayer((metallic ? names.darkeningMetallic : names.darkening), description),
            lighting: this.getLayer((metallic ? names.lightingMetallic : names.lighting), description),
            metallic: (metallic ? this.getLayer(names.metallic, description) : null),
            stripe: this.getLayer(names.stripe, description)
        };
    }
}
