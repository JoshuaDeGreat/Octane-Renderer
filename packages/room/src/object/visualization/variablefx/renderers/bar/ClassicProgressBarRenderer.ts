import { IVariableFxImage, VariableFxBitmap, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { variableFxRect, VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { IVariableFxRect } from '../../rendering/VariableFxBitmap';
import { VariableFxConfiguredIcon, VariableFxIconOverlayLayout } from '../../rendering/VariableFxIcons';
import { IVariableFxPrebake, VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { VariableFxIconAlignment, VariableFxWidth } from '../../VariableFxTypes';
import { BarVariableFxRendererBase, IVariableFxBarLayout, resolveBackgroundSliceLeftWidth, resolveBackgroundSliceRightWidth } from './BarVariableFxRendererBase';

export interface IVariableFxBarAssetNames
{
    background: string;
    bar: string;
    darkening: string;
    lighting: string;
    metallic: string;
}

export interface IVariableFxBarOverlay
{
    blendMode: VariableFxBlendMode;
    layer: IVariableFxImage;
}

export interface IClassicBarAssets
{
    background: IVariableFxImage;
    bar: IVariableFxImage;
    metallic: IVariableFxImage;
    overlays: IVariableFxBarOverlay[];
}

/** The plain shading pass, and the metallic one that lights and darkens twice. */
export const resolveVariableFxBarOverlays = (metallic: boolean, darkening: IVariableFxImage, lighting: IVariableFxImage): IVariableFxBarOverlay[] =>
    (metallic
        ? [
            { blendMode: VariableFxBlendMode.ADD, layer: lighting },
            { blendMode: VariableFxBlendMode.MULTIPLY, layer: darkening },
            { blendMode: VariableFxBlendMode.ADD, layer: lighting },
            { blendMode: VariableFxBlendMode.MULTIPLY, layer: darkening }
        ]
        : [
            { blendMode: VariableFxBlendMode.MULTIPLY, layer: darkening },
            { blendMode: VariableFxBlendMode.ADD, layer: lighting }
        ]);

/** What a config bakes once: the background with the icon space, and the bar in a fixed colour. */
export class VariableFxDataPrebake<T> implements IVariableFxPrebake
{
    constructor(
        public data: T,
        private _dispose: () => void = null)
    {}

    public dispose(): void
    {
        if(this._dispose) this._dispose();

        this._dispose = null;
        this.data = null;
    }
}

interface IClassicBarPrebake
{
    assets: IClassicBarAssets;
    background: VariableFxBitmap;
    barEnd: VariableFxBitmap;
    bar: VariableFxBitmap;
    icon: VariableFxConfiguredIcon;
    iconLayout: VariableFxIconOverlayLayout;
    layout: IVariableFxBarLayout;
}

/**
 * AIR's classic progress bar (ClassicProgressBarRenderer, server renderer 0): a three-sliced
 * background, the fill three-sliced to the bar's width, tinted, shaded with the darkening and
 * lighting layers (twice and with the metallic layer for a metallic colour), drawn clipped to the
 * filled width with the bar's rounded end moved to the fill's edge, and an optional icon at its
 * left. Widths 29 / 45 / 61 / 77 / 93 px for extra small to extra large.
 */
export class ClassicProgressBarRenderer extends BarVariableFxRendererBase
{
    public static ASSET_NAMES: IVariableFxBarAssetNames = {
        background: 'variablefx_classic_bar_background',
        bar: 'variablefx_classic_bar_fill',
        darkening: 'variablefx_classic_bar_darkening',
        lighting: 'variablefx_classic_bar_lighting',
        metallic: 'variablefx_classic_bar_metallic'
    };

    public static INSETS = { fillX: 1, fillY: 1, sliceLeftWidth: 2, sliceRightWidth: 2 };
    public static OVERLAY_SLICE = { leftWidth: 3, rightWidth: 3 };

    protected _assets: IClassicBarAssets;
    protected _background: VariableFxBitmap;
    protected _icon: VariableFxConfiguredIcon;
    protected _iconLayout: VariableFxIconOverlayLayout;
    protected _layout: IVariableFxBarLayout;

    private _barPrebake: VariableFxBitmap;
    private _barEndPrebake: VariableFxBitmap;
    private _dynamicBar: VariableFxBitmap = null;
    private _dynamicBarEnd: VariableFxBitmap = null;
    private _dynamicArgb: number = -1;

    constructor(context: VariableFxRendererContext)
    {
        super(context);

        const prebake = context.config.getOrCreatePrebake(() => this.createPrebake(context)).data;

        this._assets = prebake.assets;
        this._background = prebake.background;
        this._barEndPrebake = prebake.barEnd;
        this._barPrebake = prebake.bar;
        this._icon = prebake.icon;
        this._iconLayout = prebake.iconLayout;
        this._layout = prebake.layout;

        if(!this._barPrebake)
        {
            this._dynamicBar = VariableFxBitmap.create(this._iconLayout.frameWidth, this._iconLayout.frameHeight);
            this._dynamicBarEnd = VariableFxBitmap.create(this.barEndWidthPx, this._layout.height);
        }
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

    public get layout(): IVariableFxBarLayout
    {
        return this._layout;
    }

    public get iconLayout(): VariableFxIconOverlayLayout
    {
        return this._iconLayout;
    }

    public get assetNames(): IVariableFxBarAssetNames
    {
        return ClassicProgressBarRenderer.ASSET_NAMES;
    }

    public get insets(): { fillX: number, fillY: number, sliceLeftWidth: number, sliceRightWidth: number }
    {
        return ClassicProgressBarRenderer.INSETS;
    }

    public get iconContentOffsetY(): number
    {
        return VariableFxConfiguredIcon.BAR_ICON_CONTENT_Y_OFFSET_PX;
    }

    public get layerDescription(): string
    {
        return 'classic progress bar';
    }

    public get overlaySlice(): { leftWidth: number, rightWidth: number }
    {
        return ClassicProgressBarRenderer.OVERLAY_SLICE;
    }

    public get barEndWidthPx(): number
    {
        return 2;
    }

    /** The fill is this wide before the rounded end is drawn. */
    public get barEndMinimumFillWidth(): number
    {
        return 4;
    }

    /** Whether the fill clip runs to the fill's edge (else it stops where the end starts). */
    public get clipIncludesBarEnd(): boolean
    {
        return true;
    }

    public get barEndSourceRightPaddingPx(): number
    {
        return 1;
    }

    public get barEndBaseSourceRightPaddingPx(): number
    {
        return this.barEndSourceRightPaddingPx;
    }

    public get usesSeparateBarEndOverlaySource(): boolean
    {
        return false;
    }

    public dispose(): void
    {
        super.dispose();

        this._dynamicBar?.dispose();
        this._dynamicBar = null;
        this._dynamicBarEnd?.dispose();
        this._dynamicBarEnd = null;
    }

    public resolveFrameWidth(width: string): number
    {
        switch(width)
        {
            case VariableFxWidth.EXTRA_SMALL: return 29;
            case VariableFxWidth.SMALL: return 45;
            case VariableFxWidth.MEDIUM: return 61;
            case VariableFxWidth.LARGE: return 77;
            case VariableFxWidth.EXTRA_LARGE: return 93;
            default: return 61;
        }
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
            composer.drawLayer(this.barBitmap(), 0, 0, VariableFxBlendMode.NORMAL, 255, this.fillClip(width));

            if(width >= this.barEndMinimumFillWidth)
            {
                composer.drawLayer(this.barEndBitmap(), (this._iconLayout.contentX + (this._layout.fillX | 0) + width - this.barEndWidthPx), this._iconLayout.contentY, VariableFxBlendMode.NORMAL, 255, this.fullFillRect(this._layout, this._iconLayout));
            }
        }

        this.drawIconOverlay(composer, this._iconLayout, this._icon);
    }

    protected drawIconOverlay(composer: VariableFxBitmapComposer, iconLayout: VariableFxIconOverlayLayout, icon: VariableFxConfiguredIcon): void
    {
        if(icon) composer.drawLayer(icon.bitmap, iconLayout.iconX, iconLayout.iconY, VariableFxBlendMode.NORMAL, 255);
    }

    protected resolveIconOverlayLayout(layout: IVariableFxBarLayout, icon: VariableFxConfiguredIcon): VariableFxIconOverlayLayout
    {
        return VariableFxConfiguredIcon.resolveBarIconOverlayLayout(layout.width, layout.height, icon, VariableFxConfiguredIcon.resolveAlignment(this._context.config.extra), this.iconContentOffsetY);
    }

    protected createPrebake(context: VariableFxRendererContext): VariableFxDataPrebake<IClassicBarPrebake>
    {
        const layout = this.resolveLayout(context.config.width);
        const assets = this.resolveAssets();
        const icon = VariableFxConfiguredIcon.resolve(context.config.extra, context.assets);
        const iconLayout = this.resolveIconOverlayLayout(layout, icon);
        const color = VariableFxPaintColor.resolveConfigured(context.config.color, context.config.extra);
        const dynamic = VariableFxPaintColor.isDynamic(context.config.color);
        const background = VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight);
        const bar = (dynamic ? null : VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight));
        const barEnd = (dynamic ? null : VariableFxBitmap.create(this.barEndWidthPx, layout.height));

        this.prebakeBackground(background, assets, layout, iconLayout);

        if(bar && barEnd) this.drawBarBitmap(bar, barEnd, ((0xFF000000 | color.rgb) >>> 0), assets, layout, iconLayout);

        return new VariableFxDataPrebake<IClassicBarPrebake>({ assets, background, barEnd, bar, icon, iconLayout, layout }, () =>
        {
            background.dispose();
            bar?.dispose();
            barEnd?.dispose();
        });
    }

    protected resolveAssets(): IClassicBarAssets
    {
        const color = VariableFxPaintColor.resolveConfigured(this._context.config.color, this._context.config.extra);
        const names = this.assetNames;
        const darkening = this.getLayer(names.darkening, this.layerDescription);
        const lighting = this.getLayer(names.lighting, this.layerDescription);

        return {
            background: this.getLayer(names.background, this.layerDescription),
            bar: this.getLayer(names.bar, this.layerDescription),
            metallic: ((color.metallic && names.metallic) ? this.getLayer(names.metallic, this.layerDescription) : null),
            overlays: resolveVariableFxBarOverlays(color.metallic, darkening, lighting)
        };
    }

    /** The bar's size for a width option: the fill inset by the border, as high as the background. */
    public resolveLayout(width: string): IVariableFxBarLayout
    {
        const background = this._context.assets?.getBitmap(this.assetNames.background);
        const insets = this.insets;
        const frameWidth = this.resolveFrameWidth(width);

        if(!background) throw new Error(`Missing Variable FX ${ this.layerDescription } background layer for layout resolution.`);

        return {
            width: frameWidth,
            height: background.height,
            fillX: (insets.fillX | 0),
            fillY: (insets.fillY | 0),
            fillWidth: Math.max(0, (frameWidth - ((insets.fillX | 0) * 2))),
            fillHeight: Math.max(1, (background.height - ((insets.fillY | 0) * 2))),
            sliceLeftWidth: (insets.sliceLeftWidth | 0),
            sliceRightWidth: (insets.sliceRightWidth | 0)
        };
    }

    private prebakeBackground(bitmap: VariableFxBitmap, assets: IClassicBarAssets, layout: IVariableFxBarLayout, iconLayout: VariableFxIconOverlayLayout): void
    {
        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);
        composer.drawThreeSlice(assets.background, resolveBackgroundSliceLeftWidth(layout), resolveBackgroundSliceRightWidth(layout), layout.width, iconLayout.contentX, iconLayout.contentY, VariableFxBlendMode.NORMAL, 255);
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

    /** A dynamic colour paints the bar per renderer, again whenever the colour moved. */
    private redrawDynamicBar(): void
    {
        const argb = this.fillArgb;

        if(this._dynamicArgb === (argb | 0)) return;

        this._dynamicArgb = (argb | 0);

        this.drawBarBitmap(this._dynamicBar, this._dynamicBarEnd, argb, this._assets, this._layout, this._iconLayout);
    }

    private drawBarBitmap(bar: VariableFxBitmap, barEnd: VariableFxBitmap, argb: number, assets: IClassicBarAssets, layout: IVariableFxBarLayout, iconLayout: VariableFxIconOverlayLayout): void
    {
        const composer = new VariableFxBitmapComposer(bar);
        const x = iconLayout.contentX;
        const y = iconLayout.contentY;

        composer.clear(0);
        composer.drawThreeSlice(assets.bar, layout.sliceLeftWidth, layout.sliceRightWidth, layout.fillWidth, (x + (layout.fillX | 0)), (y + (layout.fillY | 0)), VariableFxBlendMode.NORMAL, 255, this.fullFillRect(layout, iconLayout), argb);

        if(assets.metallic) this.drawOverlayLayer(composer, assets.metallic, VariableFxBlendMode.ADD, layout.fillWidth, x, y, layout);

        for(const overlay of assets.overlays) this.drawOverlayLayer(composer, overlay.layer, overlay.blendMode, layout.fillWidth, x, y, layout);

        this.drawBarEndBitmap(barEnd, bar, assets, layout, iconLayout);
    }

    /** The bar's last columns, cut from the drawn bar so they can follow the fill's edge. */
    private drawBarEndBitmap(barEnd: VariableFxBitmap, bar: VariableFxBitmap, assets: IClassicBarAssets, layout: IVariableFxBarLayout, iconLayout: VariableFxIconOverlayLayout): void
    {
        const composer = new VariableFxBitmapComposer(barEnd);
        const y = iconLayout.contentY;

        composer.clear(0);

        if(this.usesSeparateBarEndOverlaySource)
        {
            const x = (iconLayout.contentX + (layout.width | 0) - this.barEndBaseSourceRightPaddingPx - this.barEndWidthPx);

            composer.drawLayer(bar, -x, -y, VariableFxBlendMode.NORMAL, 255);

            if(assets.metallic) this.drawOverlayEndLayer(composer, assets.metallic, VariableFxBlendMode.ADD, layout);

            for(const overlay of assets.overlays) this.drawOverlayEndLayer(composer, overlay.layer, overlay.blendMode, layout);

            return;
        }

        const x = (iconLayout.contentX + (layout.width | 0) - this.barEndSourceRightPaddingPx - this.barEndWidthPx);

        composer.drawLayer(bar, -x, -y, VariableFxBlendMode.NORMAL, 255);
    }

    private drawOverlayEndLayer(composer: VariableFxBitmapComposer, layer: IVariableFxImage, blend: VariableFxBlendMode, layout: IVariableFxBarLayout): void
    {
        const offset = ((layout.fillWidth | 0) - this.barEndSourceRightPaddingPx - this.barEndWidthPx);

        composer.drawThreeSlice(layer, this.overlaySlice.leftWidth, this.overlaySlice.rightWidth, layout.fillWidth, -offset, layout.fillY, blend, 255);
    }

    private drawOverlayLayer(composer: VariableFxBitmapComposer, layer: IVariableFxImage, blend: VariableFxBlendMode, width: number, x: number, y: number, layout: IVariableFxBarLayout): void
    {
        if(width <= 0) return;

        composer.drawThreeSlice(layer, this.overlaySlice.leftWidth, this.overlaySlice.rightWidth, Math.min((layout.fillWidth | 0), width), (x + (layout.fillX | 0)), (y + (layout.fillY | 0)), blend, 255);
    }

    private fillClip(width: number): IVariableFxRect
    {
        return variableFxRect((this._iconLayout.contentX + (this._layout.fillX | 0)), (this._iconLayout.contentY + (this._layout.fillY | 0)), (this.clipIncludesBarEnd ? width : Math.max(0, (width - this.barEndWidthPx))), this._layout.fillHeight);
    }

    private fullFillRect(layout: IVariableFxBarLayout, iconLayout: VariableFxIconOverlayLayout): IVariableFxRect
    {
        return variableFxRect((iconLayout.contentX + (layout.fillX | 0)), (iconLayout.contentY + (layout.fillY | 0)), layout.fillWidth, layout.fillHeight);
    }
}

/** AIR's ClassicMiniProgressBarRenderer (server renderer 1): the classic bar with the thin assets. */
export class ClassicMiniProgressBarRenderer extends ClassicProgressBarRenderer
{
    public static ASSET_NAMES: IVariableFxBarAssetNames = {
        background: 'variablefx_classic_mini_bar_background',
        bar: 'variablefx_classic_mini_bar_fill',
        darkening: 'variablefx_classic_mini_bar_darkening',
        lighting: 'variablefx_classic_mini_bar_lighting',
        metallic: 'variablefx_classic_mini_bar_metallic'
    };

    public get assetNames(): IVariableFxBarAssetNames
    {
        return ClassicMiniProgressBarRenderer.ASSET_NAMES;
    }

    public get layerDescription(): string
    {
        return 'classic mini progress bar';
    }
}

/**
 * AIR's HealthProgressBarRenderer (server renderer 10): the classic bar with the health assets, no
 * metallic layer, a 1 px end that is shaded on its own, and 32 / 48 / 64 px widths.
 */
export class HealthProgressBarRenderer extends ClassicProgressBarRenderer
{
    public static ASSET_NAMES: IVariableFxBarAssetNames = {
        background: 'variablefx_health_bar_background',
        bar: 'variablefx_health_bar_fill',
        darkening: 'variablefx_health_bar_darkening',
        lighting: 'variablefx_health_bar_lighting',
        metallic: null
    };

    public static OVERLAY_SLICE = { leftWidth: 1, rightWidth: 1 };

    public get assetNames(): IVariableFxBarAssetNames
    {
        return HealthProgressBarRenderer.ASSET_NAMES;
    }

    public get layerDescription(): string
    {
        return 'health progress bar';
    }

    public get overlaySlice(): { leftWidth: number, rightWidth: number }
    {
        return HealthProgressBarRenderer.OVERLAY_SLICE;
    }

    public get barEndWidthPx(): number
    {
        return 1;
    }

    public get barEndMinimumFillWidth(): number
    {
        return 1;
    }

    public get clipIncludesBarEnd(): boolean
    {
        return false;
    }

    public get barEndSourceRightPaddingPx(): number
    {
        return 0;
    }

    public get barEndBaseSourceRightPaddingPx(): number
    {
        return 1;
    }

    public get usesSeparateBarEndOverlaySource(): boolean
    {
        return true;
    }

    public resolveFrameWidth(width: string): number
    {
        switch(width)
        {
            case VariableFxWidth.SMALL: return 32;
            case VariableFxWidth.LARGE: return 64;
            default: return 48;
        }
    }
}

/**
 * AIR's BossHealthBarRenderer (server renderer 100): the classic bar with the boss assets, a 4 px
 * border, 100 / 150 / 200 px for large, extra large and huge, and the icon (the skull) on either
 * end with "double" alignment.
 */
export class BossHealthBarRenderer extends ClassicProgressBarRenderer
{
    public static ASSET_NAMES: IVariableFxBarAssetNames = {
        background: 'variablefx_boss_health_bar_background',
        bar: 'variablefx_boss_health_bar_fill',
        darkening: 'variablefx_boss_health_bar_darkening',
        lighting: 'variablefx_boss_health_bar_lighting',
        metallic: 'variablefx_boss_health_bar_metallic'
    };

    public static INSETS = { fillX: 4, fillY: 4, sliceLeftWidth: 2, sliceRightWidth: 2 };
    public static OVERLAY_SLICE = { leftWidth: 2, rightWidth: 2 };

    public get assetNames(): IVariableFxBarAssetNames
    {
        return BossHealthBarRenderer.ASSET_NAMES;
    }

    public get insets(): { fillX: number, fillY: number, sliceLeftWidth: number, sliceRightWidth: number }
    {
        return BossHealthBarRenderer.INSETS;
    }

    public get layerDescription(): string
    {
        return 'boss health bar';
    }

    public get overlaySlice(): { leftWidth: number, rightWidth: number }
    {
        return BossHealthBarRenderer.OVERLAY_SLICE;
    }

    public resolveFrameWidth(width: string): number
    {
        switch(width)
        {
            case VariableFxWidth.LARGE: return 100;
            case VariableFxWidth.BIG_MAHOOSIVE_CHONKY: return 200;
            default: return 150;
        }
    }

    protected resolveIconOverlayLayout(layout: IVariableFxBarLayout, icon: VariableFxConfiguredIcon): VariableFxIconOverlayLayout
    {
        const alignment = VariableFxConfiguredIcon.resolveAlignment(this._context.config.extra);

        if(alignment === VariableFxIconAlignment.LEFT) return super.resolveIconOverlayLayout(layout, icon);

        return VariableFxConfiguredIcon.resolveBarIconOverlayLayout((layout.width | 0), (layout.height | 0), icon, alignment, 0);
    }

    protected drawIconOverlay(composer: VariableFxBitmapComposer, iconLayout: VariableFxIconOverlayLayout, icon: VariableFxConfiguredIcon): void
    {
        if(!icon) return;

        for(const placement of iconLayout.placements) composer.drawLayer(icon.bitmap, placement.x, placement.y, VariableFxBlendMode.NORMAL, 255);
    }
}
