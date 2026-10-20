import { IVariableFxImage, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { VariableFxFrame } from '../../rendering/VariableFxFrame';
import { IVariableFxRenderer, VariableFxConfig, VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { readVariableFxExtra, VariableFxCategory, VariableFxRendererType } from '../../VariableFxTypes';
import { ILevelBadgeAssets, ILevelBadgeRender, LevelBadgePainter, LevelRendererPrebake } from './LevelBadgePainter';
import { createDisplayedLevelStatusExtra, createLevelBarContext, createLevelBarStatusExtra, resolveLevelProgressSample } from './LevelRendererSupport';
import { LevelProgressPathAnimator } from './LevelProgressPathAnimator';

/**
 * AIR's level badge with a bar (LevelWithProgressRenderer, server renderer 20): the badge with the
 * level on the left, overlapping by 3 px the bar the config's `sub_renderer` names (block, striped
 * or arrow), vertically centred on the badge. A level up runs the bar to its end, then the number
 * changes and the bar runs on from empty; the badge's frame and the bar follow the level colour.
 */
export class LevelWithProgressRenderer implements IVariableFxRenderer
{
    public static ASSET_NAMES = {
        background: 'variablefx_level_with_progress_background',
        darkening: 'variablefx_level_with_progress_darkening',
        darkeningMetallic: 'variablefx_level_with_progress_darkening_metallic',
        frame: 'variablefx_level_with_progress_frame',
        lighting: 'variablefx_level_with_progress_lighting',
        lightingMetallic: 'variablefx_level_with_progress_lighting_metallic',
        numbers: 'variablefx_numbers_large'
    };

    public static FRAME_HEIGHT: number = 21;
    public static PROGRESS_BAR_OVERLAP_WIDTH: number = 3;

    private _context: VariableFxRendererContext;
    private _frame: VariableFxFrame = new VariableFxFrame();
    private _animator: LevelProgressPathAnimator = new LevelProgressPathAnimator();
    private _prebake: LevelRendererPrebake;
    private _bar: IVariableFxRenderer = null;
    private _barConfig: VariableFxConfig = null;
    private _badge: ILevelBadgeRender = null;
    private _badgeKey: string = '';
    private _renderedSignature: string = '';
    private _initialized: boolean = false;

    constructor(context: VariableFxRendererContext)
    {
        this._context = context;
        this._prebake = context.config.getOrCreatePrebake(() => this.createPrebake(context));

        this.createBar(context);
    }

    public get frame(): VariableFxFrame
    {
        return this._frame;
    }

    public get isContinuous(): boolean
    {
        return (!!this._bar && this._bar.isContinuous);
    }

    public get bar(): IVariableFxRenderer
    {
        return this._bar;
    }

    public get levelText(): string
    {
        return String(this._animator.level);
    }

    public get badgeWidth(): number
    {
        return this._prebake.badgePainter.resolveFrameWidth(Math.max(1, this.levelText.length));
    }

    /** The bar starts 3 px inside the badge's right edge. */
    public get barX(): number
    {
        return Math.max(0, (this.badgeWidth - LevelWithProgressRenderer.PROGRESS_BAR_OVERLAP_WIDTH));
    }

    public get barY(): number
    {
        const height = (this._bar ? this._bar.frame.height : 0);

        return ((height <= 0) ? 0 : Math.max(0, ((this.frameHeight - height) / 2) | 0));
    }

    public get frameWidth(): number
    {
        const width = (this._bar ? this._bar.frame.width : 0);

        return ((width <= 0) ? this.badgeWidth : (this.barX + width));
    }

    public get frameHeight(): number
    {
        return Math.max(LevelWithProgressRenderer.FRAME_HEIGHT, (this._bar ? this._bar.frame.height : 0));
    }

    public get displayedFrameArgb(): number
    {
        return ((0xFF000000 | VariableFxPaintColor.resolveTarget(this._context.config.color, this._context.config.extra, this._animator.progress, createDisplayedLevelStatusExtra(this._context.status.extra, this._animator.level)).rgb) >>> 0);
    }

    public updateData(context: VariableFxRendererContext, now: number): void
    {
        this._context = context;

        const sample = resolveLevelProgressSample(context);

        if(!this._initialized || context.status.isInitialize)
        {
            this._animator.reset(sample, now);
            this._initialized = true;
        }
        else
        {
            this._animator.setTarget(sample, now);
        }

        this.updateBar(now);
    }

    public needsUpdate(now: number): boolean
    {
        if(this._prebake.disposed) return false;

        return (this._animator.needsUpdate(now, Math.max(1, (this._bar ? this._bar.frame.width : this.badgeWidth))) || (!!this._bar && this._bar.needsUpdate(now)) || this.hasRenderChange());
    }

    public update(now: number): boolean
    {
        if(this._prebake.disposed) return false;

        if(this._animator.update(now)) this.updateBar(now);

        const barChanged = (!!this._bar && this._bar.update(now));

        if(!barChanged && !this.hasRenderChange()) return false;

        if(!this._frame.fits(this.frameWidth, this.frameHeight))
        {
            this._frame.allocate(this.frameWidth, this.frameHeight);
            this._renderedSignature = '';
        }

        this.renderFrame();

        this._renderedSignature = this.signature();
        this._frame.updateId++;

        return true;
    }

    public dispose(): void
    {
        this.disposeBadge();
        this._bar?.dispose();
        this._bar = null;
        this._frame.release();
    }

    private renderFrame(): void
    {
        const bitmap = this._frame.bitmap;

        if(!bitmap) return;

        const composer = new VariableFxBitmapComposer(bitmap);
        const barBitmap = (this._bar ? this._bar.frame.bitmap : null);

        composer.clear(0);

        if(barBitmap) composer.drawLayer(barBitmap, this.barX, this.barY, VariableFxBlendMode.NORMAL, 255);

        this._prebake.badgePainter.drawBadge(composer, this.currentBadge(), this.levelText, 0, 0);
    }

    private currentBadge(): ILevelBadgeRender
    {
        const digits = Math.max(1, this.levelText.length);
        const argb = this.displayedFrameArgb;
        const key = `${ digits }:${ argb }`;

        if(this._badge && (this._badgeKey === key)) return this._badge;

        this.disposeBadge();

        this._badge = this._prebake.badgePainter.createRender(digits, argb);
        this._badgeKey = key;

        return this._badge;
    }

    private disposeBadge(): void
    {
        if(this._badge && !this._prebake.disposed) this._prebake.badgePainter.disposeRender(this._badge);

        this._badge = null;
        this._badgeKey = '';
    }

    private signature(): string
    {
        return `${ this.frameWidth }x${ this.frameHeight }:${ this._animator.level }:${ this.displayedFrameArgb }`;
    }

    private hasRenderChange(): boolean
    {
        return (!this._frame.fits(this.frameWidth, this.frameHeight) || (this.signature() !== this._renderedSignature));
    }

    /** The bar the config's `sub_renderer` names; none when it names no renderer or this one. */
    private createBar(context: VariableFxRendererContext): void
    {
        const raw = readVariableFxExtra(context.config.extra, 'sub_renderer');
        const id = ((raw && Number.isFinite(Number(raw))) ? (Number(raw) | 0) : null);
        const name = ((id === null) ? null : VariableFxRendererType.resolveById(id));

        if((id === null) || !name || (name === context.config.renderer) || !context.registry) return;

        const factory = (context.registry.resolveById(id) || context.registry.resolve(VariableFxCategory.PROGRESS_BAR, name));

        if(!factory) return;

        const color = ((context.config.color === VariableFxPaintColor.DYNAMIC_LEVELLING) ? VariableFxPaintColor.DYNAMIC_DELEGATED : context.config.color);

        this._barConfig = this._prebake.getOrCreateSubConfig(() => VariableFxConfig.forSubRenderer(context.config, name, id, color, context.config.extra));
        this._bar = factory(this.barContext());
    }

    private updateBar(now: number): void
    {
        if(this._bar) this._bar.updateData(this.barContext(), now);
    }

    private barContext(): VariableFxRendererContext
    {
        return createLevelBarContext(this._context, this._barConfig, this._animator.progress, createLevelBarStatusExtra(this._barConfig, this._context.status.extra, this.displayedFrameArgb));
    }

    private createPrebake(context: VariableFxRendererContext): LevelRendererPrebake
    {
        const metallic = VariableFxPaintColor.resolveConfigured(context.config.color, context.config.extra).metallic;
        const names = LevelWithProgressRenderer.ASSET_NAMES;
        const layer = (name: string): IVariableFxImage =>
        {
            const image = context.assets?.getBitmap(name);

            if(!image) throw new Error(`Missing Variable FX level with progress layer '${ name }'.`);

            return image;
        };
        const assets: ILevelBadgeAssets = {
            background: layer(names.background),
            darkening: layer(metallic ? names.darkeningMetallic : names.darkening),
            frame: layer(names.frame),
            lighting: layer(metallic ? names.lightingMetallic : names.lighting),
            numbers: layer(names.numbers)
        };

        return new LevelRendererPrebake(new LevelBadgePainter(assets, { x: 0, y: 0, width: 21, height: LevelWithProgressRenderer.FRAME_HEIGHT }));
    }
}
