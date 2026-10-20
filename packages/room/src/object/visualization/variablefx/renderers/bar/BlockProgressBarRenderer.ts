import { IVariableFxImage, IVariableFxRect, VariableFxBitmap, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { variableFxRect, VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { VariableFxConfiguredIcon, VariableFxIconOverlayLayout } from '../../rendering/VariableFxIcons';
import { VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { VariableFxWidth } from '../../VariableFxTypes';
import { BarVariableFxRendererBase, IVariableFxBarLayout, resolveBackgroundSliceLeftWidth, resolveBackgroundSliceRightWidth } from './BarVariableFxRendererBase';
import { IVariableFxBarOverlay, resolveVariableFxBarOverlays, VariableFxDataPrebake } from './ClassicProgressBarRenderer';
import { VariableFxSegmentedProgress } from './VariableFxSegmentedProgress';

export interface IBlockBarLayout extends IVariableFxBarLayout
{
    blockCount: number;
    blockWidth: number;
    splitterWidth: number;
}

interface IBlockBarAssets
{
    background: IVariableFxImage;
    bar: IVariableFxImage;
    metallic: IVariableFxImage;
    splitters: IVariableFxImage;
    overlays: IVariableFxBarOverlay[];
}

interface IBlockBarPrebake
{
    assets: IBlockBarAssets;
    background: VariableFxBitmap;
    bar: VariableFxBitmap;
    foreground: VariableFxBitmap;
    iconLayout: VariableFxIconOverlayLayout;
    layout: IBlockBarLayout;
}

/**
 * AIR's block progress bar (BlockProgressBarRenderer, server renderer 2): 7 px blocks with 1 px
 * splitters (3 / 4 / 6 / 8 / 10 blocks for extra small to extra large, or the config's segment
 * count), the fill a flat colour multiplied with the block texture and shaded, the splitters and the
 * icon on top. The fill is clipped to the value in whole pixels, not whole blocks.
 */
export class BlockProgressBarRenderer extends BarVariableFxRendererBase
{
    public static ASSET_NAMES = {
        background: 'variablefx_block_bar_background',
        bar: 'variablefx_block_bar_fill',
        darkening: 'variablefx_block_bar_darkening',
        lighting: 'variablefx_block_bar_lighting',
        metallic: 'variablefx_block_bar_metallic',
        splitters: 'variablefx_block_bar_splitters'
    };

    public static BLOCK_WIDTH: number = 7;
    public static SPLITTER_WIDTH: number = 1;
    public static BORDER: number = 3;
    public static FRAME_HEIGHT: number = 13;
    public static FILL_HEIGHT: number = 7;
    public static BLOCK_STEP: number = (BlockProgressBarRenderer.BLOCK_WIDTH + BlockProgressBarRenderer.SPLITTER_WIDTH);

    private _assets: IBlockBarAssets;
    private _background: VariableFxBitmap;
    private _barPrebake: VariableFxBitmap;
    private _foreground: VariableFxBitmap;
    private _iconLayout: VariableFxIconOverlayLayout;
    private _layout: IBlockBarLayout;
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

    public get layout(): IBlockBarLayout
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

    public static resolveBlockCount(width: string, configExtra: Record<string, string>): number
    {
        return VariableFxSegmentedProgress.resolveSegmentCount(width, configExtra, BlockProgressBarRenderer.resolveDefaultBlockCount);
    }

    public static resolveDefaultBlockCount(width: string): number
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

    public static resolveLayout(width: string, configExtra: Record<string, string>): IBlockBarLayout
    {
        const blockCount = BlockProgressBarRenderer.resolveBlockCount(width, configExtra);
        const fillWidth = ((blockCount * BlockProgressBarRenderer.BLOCK_WIDTH) + ((blockCount - 1) * BlockProgressBarRenderer.SPLITTER_WIDTH));

        return {
            blockCount,
            blockWidth: BlockProgressBarRenderer.BLOCK_WIDTH,
            splitterWidth: BlockProgressBarRenderer.SPLITTER_WIDTH,
            width: (fillWidth + (BlockProgressBarRenderer.BORDER * 2)),
            height: BlockProgressBarRenderer.FRAME_HEIGHT,
            fillX: BlockProgressBarRenderer.BORDER,
            fillY: BlockProgressBarRenderer.BORDER,
            fillWidth,
            fillHeight: BlockProgressBarRenderer.FILL_HEIGHT,
            sliceLeftWidth: BlockProgressBarRenderer.BORDER,
            sliceRightWidth: BlockProgressBarRenderer.BORDER
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

        if(width > 0) composer.drawLayer(this.barBitmap(), 0, 0, VariableFxBlendMode.NORMAL, 255, this.progressClip(width));

        composer.drawLayer(this._foreground, 0, 0, VariableFxBlendMode.NORMAL, 255);
    }

    private createPrebake(context: VariableFxRendererContext): VariableFxDataPrebake<IBlockBarPrebake>
    {
        const layout = BlockProgressBarRenderer.resolveLayout(context.config.width, context.config.extra);
        const assets = this.resolveAssets();
        const icon = VariableFxConfiguredIcon.resolve(context.config.extra, context.assets);
        const iconLayout = VariableFxConfiguredIcon.resolveBarIconOverlayLayout(layout.width, layout.height, icon, VariableFxConfiguredIcon.resolveAlignment(context.config.extra));
        const color = VariableFxPaintColor.resolveConfigured(context.config.color, context.config.extra);
        const background = VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight);
        const foreground = VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight);
        const bar = (VariableFxPaintColor.isDynamic(context.config.color) ? null : VariableFxBitmap.create(iconLayout.frameWidth, iconLayout.frameHeight));
        const backgroundComposer = new VariableFxBitmapComposer(background);
        const foregroundComposer = new VariableFxBitmapComposer(foreground);

        backgroundComposer.clear(0);
        backgroundComposer.drawThreeSlice(assets.background, resolveBackgroundSliceLeftWidth(layout), resolveBackgroundSliceRightWidth(layout), layout.width, iconLayout.contentX, iconLayout.contentY, VariableFxBlendMode.NORMAL, 255);

        foregroundComposer.clear(0);
        this.drawSplitters(foregroundComposer, assets.splitters, iconLayout.contentX, iconLayout.contentY, layout);

        if(icon) foregroundComposer.drawLayer(icon.bitmap, iconLayout.iconX, iconLayout.iconY, VariableFxBlendMode.NORMAL, 255);

        if(bar) this.drawBarBitmap(bar, ((0xFF000000 | color.rgb) >>> 0), assets, layout, iconLayout);

        return new VariableFxDataPrebake<IBlockBarPrebake>({ assets, background, bar, foreground, iconLayout, layout }, () =>
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

            this.drawBarBitmap(this._dynamicBar, argb, this._assets, this._layout, this._iconLayout);
        }

        return this._dynamicBar;
    }

    private drawBarBitmap(bitmap: VariableFxBitmap, argb: number, assets: IBlockBarAssets, layout: IBlockBarLayout, iconLayout: VariableFxIconOverlayLayout): void
    {
        const composer = new VariableFxBitmapComposer(bitmap);
        const x = iconLayout.contentX;
        const y = iconLayout.contentY;
        const clip = this.progressClip(layout.fillWidth, layout, iconLayout);

        composer.clear(0);
        composer.fillRect((x + layout.fillX), (y + layout.fillY), layout.fillWidth, layout.fillHeight, argb);

        this.drawRepeatedFillLayer(composer, assets.bar, VariableFxBlendMode.MULTIPLY, x, y, clip, layout);

        if(assets.metallic) this.drawRepeatedFillLayer(composer, assets.metallic, VariableFxBlendMode.NORMAL, x, y, clip, layout);

        for(const overlay of assets.overlays) this.drawRepeatedFillLayer(composer, overlay.layer, overlay.blendMode, x, y, clip, layout);
    }

    private drawRepeatedFillLayer(composer: VariableFxBitmapComposer, layer: IVariableFxImage, blend: VariableFxBlendMode, x: number, y: number, clip: IVariableFxRect, layout: IBlockBarLayout): void
    {
        if(clip.width <= 0) return;

        composer.drawTiledChunk(layer, variableFxRect(0, 0, BlockProgressBarRenderer.BLOCK_STEP, layout.fillHeight), (x + layout.fillX), (y + layout.fillY), layout.fillWidth, layout.fillHeight, blend, 255, clip);
    }

    private drawSplitters(composer: VariableFxBitmapComposer, splitters: IVariableFxImage, x: number, y: number, layout: IBlockBarLayout): void
    {
        for(let block = 1; block <= (layout.blockCount | 0); block++)
        {
            const splitterX = (x + layout.fillX + (block * BlockProgressBarRenderer.BLOCK_STEP) - layout.splitterWidth);

            composer.drawTiledChunk(splitters, variableFxRect(0, layout.fillY, layout.splitterWidth, layout.fillHeight), splitterX, (y + layout.fillY), layout.splitterWidth, layout.fillHeight, VariableFxBlendMode.NORMAL, 255);
        }
    }

    private progressClip(width: number, layout: IBlockBarLayout = this._layout, iconLayout: VariableFxIconOverlayLayout = this._iconLayout): IVariableFxRect
    {
        return variableFxRect((iconLayout.contentX + layout.fillX), (iconLayout.contentY + layout.fillY), width, layout.fillHeight);
    }

    private resolveAssets(): IBlockBarAssets
    {
        const metallic = VariableFxPaintColor.resolveConfigured(this._context.config.color, this._context.config.extra).metallic;
        const names = BlockProgressBarRenderer.ASSET_NAMES;
        const description = 'block progress bar';
        const darkening = this.getLayer(names.darkening, description);
        const lighting = this.getLayer(names.lighting, description);

        return {
            background: this.getLayer(names.background, description),
            bar: this.getLayer(names.bar, description),
            metallic: (metallic ? this.getLayer(names.metallic, description) : null),
            splitters: this.getLayer(names.splitters, description),
            overlays: resolveVariableFxBarOverlays(metallic, darkening, lighting)
        };
    }
}
