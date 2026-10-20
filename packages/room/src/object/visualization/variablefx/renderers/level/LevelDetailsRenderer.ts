import { IVariableFxImage, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { VariableFxFrame } from '../../rendering/VariableFxFrame';
import { IVariableFxRenderer, VariableFxConfig, VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { readVariableFxExtra, VariableFxRendererType, VariableFxWidth } from '../../VariableFxTypes';
import { ClassicMiniProgressBarRenderer } from '../bar/ClassicProgressBarRenderer';
import { ILevelBadgeAssets, ILevelBadgeRender, LevelBadgePainter, LevelRendererPrebake } from './LevelBadgePainter';
import { ILevelDetailsRenderPlan, LevelDetailsNumberPainter, LevelDetailsNumberProgress } from './LevelDetailsNumbers';
import { createDisplayedLevelStatusExtra, createLevelBarContext, createLevelBarStatusExtra, resolveLevelProgressSample } from './LevelRendererSupport';
import { LevelProgressPathAnimator, LevelProgressPathSample } from './LevelProgressPathAnimator';

/**
 * AIR's level details (LevelDetailsRenderer, server renderer 21): a 29 px panel with the level
 * badge at 5, 4, a classic mini bar at y 19 right of it and "value / next level at" centred over
 * the bar in the small numbers. Bar widths 29 / 45 / 61 / 77 / 93 px; the panel is 6 px wider than
 * the bar's right end.
 */
export class LevelDetailsRenderer implements IVariableFxRenderer
{
    public static ASSET_NAMES = {
        background: 'variablefx_level_details_background',
        darkening: 'variablefx_level_details_darkening',
        darkeningMetallic: 'variablefx_level_details_darkening_metallic',
        frame: 'variablefx_level_details_frame',
        lighting: 'variablefx_level_details_lighting',
        lightingMetallic: 'variablefx_level_details_lighting_metallic',
        numbers: 'variablefx_numbers_large',
        smallNumbers: 'variablefx_numbers_small'
    };

    public static BADGE_X: number = 5;
    public static BADGE_Y: number = 4;
    public static BADGE_WIDTH: number = 21;
    public static BADGE_HEIGHT: number = 21;
    public static BAR_SPACING_X: number = 3;
    public static BAR_Y: number = 19;
    public static NUMBER_Y: number = 7;
    public static RIGHT_PADDING: number = 6;
    public static FRAME_HEIGHT: number = 29;
    public static BACKGROUND_SLICE_LEFT: number = (LevelDetailsRenderer.BADGE_X + LevelDetailsRenderer.BADGE_WIDTH + LevelDetailsRenderer.BAR_SPACING_X);
    public static BACKGROUND_SLICE_RIGHT: number = LevelDetailsRenderer.RIGHT_PADDING;

    private _context: VariableFxRendererContext;
    private _frame: VariableFxFrame = new VariableFxFrame();
    private _animator: LevelProgressPathAnimator = new LevelProgressPathAnimator();
    private _numbers: LevelDetailsNumberProgress = new LevelDetailsNumberProgress();
    private _prebake: LevelRendererPrebake;
    private _barConfig: VariableFxConfig;
    private _bar: IVariableFxRenderer;
    private _badge: ILevelBadgeRender = null;
    private _badgeKey: string = '';
    private _renderedSignature: string = '';
    private _renderedPlanKey: string = '';
    private _initialized: boolean = false;

    constructor(context: VariableFxRendererContext)
    {
        this._context = context;
        this._prebake = context.config.getOrCreatePrebake(() => this.createPrebake(context));
        this._barConfig = this._prebake.getOrCreateSubConfig(() => LevelDetailsRenderer.createBarConfig(context.config));
        this._bar = new ClassicMiniProgressBarRenderer(this.barContext());
    }

    public get frame(): VariableFxFrame
    {
        return this._frame;
    }

    public get isContinuous(): boolean
    {
        return this._bar.isContinuous;
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

    public get barX(): number
    {
        return (LevelDetailsRenderer.BADGE_X + this.badgeWidth + LevelDetailsRenderer.BAR_SPACING_X);
    }

    public get barWidth(): number
    {
        return ((this._bar.frame.width > 0) ? this._bar.frame.width : LevelDetailsRenderer.resolveBarWidth(this._context.config.width));
    }

    public get frameWidth(): number
    {
        return (this.barX + this.barWidth + LevelDetailsRenderer.RIGHT_PADDING);
    }

    public get frameHeight(): number
    {
        return LevelDetailsRenderer.FRAME_HEIGHT;
    }

    public get displayedFrameArgb(): number
    {
        return ((0xFF000000 | VariableFxPaintColor.resolveTarget(this._context.config.color, this._context.config.extra, this._animator.progress, createDisplayedLevelStatusExtra(this._context.status.extra, this._animator.level)).rgb) >>> 0);
    }

    public static resolveBarWidth(width: string): number
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

    /** The details' bar: a classic mini bar on 0 to 1, in the level colour or the config's own. */
    public static createBarConfig(config: VariableFxConfig): VariableFxConfig
    {
        const color = ((config.color === VariableFxPaintColor.DYNAMIC_LEVELLING) ? VariableFxPaintColor.DYNAMIC_DELEGATED : config.color);
        const extra: Record<string, string> = {};
        const baked = readVariableFxExtra(config.extra, 'color');
        const metallic = readVariableFxExtra(config.extra, 'metallic');

        if(baked !== null) extra.color = baked;
        if(metallic !== null) extra.metallic = metallic;

        return VariableFxConfig.forSubRenderer(config, VariableFxRendererType.CLASSIC_MINI_PROGRESS, VariableFxRendererType.CLASSIC_MINI_PROGRESS_ID, color, extra);
    }

    /** The numbers shown at the current path, fitted over the bar. */
    public get renderPlan(): ILevelDetailsRenderPlan
    {
        const display = this._numbers.resolveDisplay(this._animator.path);

        return this._prebake.numberPainter.createRenderPlan(display.current, display.max, this.barWidth);
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

        this.updateNumbers(context, sample);
        this._bar.updateData(this.barContext(), now);
    }

    public needsUpdate(now: number): boolean
    {
        if(this._prebake.disposed) return false;

        return (this._animator.needsUpdate(now, Math.max(1, this.barWidth)) || this._bar.needsUpdate(now) || this.hasRenderChange() || this.hasFinalNumberRenderChange());
    }

    public update(now: number): boolean
    {
        if(this._prebake.disposed) return false;

        if(this._animator.update(now)) this._bar.updateData(this.barContext(), now);

        const barChanged = this._bar.update(now);

        if(!barChanged && !this.hasRenderChange() && !this.hasFinalNumberRenderChange()) return false;

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
        this._bar.dispose();
        this._frame.release();
    }

    private renderFrame(): void
    {
        const bitmap = this._frame.bitmap;

        if(!bitmap) return;

        const composer = new VariableFxBitmapComposer(bitmap);
        const background = this._prebake.getBackground(this.levelText.length, this.frameWidth);
        const barBitmap = this._bar.frame.bitmap;
        const plan = this.renderPlan;

        composer.clear(0);
        composer.drawLayer(background.bitmap, 0, 0, VariableFxBlendMode.NORMAL, 255);

        if(barBitmap) composer.drawLayer(barBitmap, this.barX, LevelDetailsRenderer.BAR_Y, VariableFxBlendMode.NORMAL, 255);

        this._prebake.numberPainter.draw(composer, plan, (this.barX + (((this.barWidth - (plan.width | 0)) / 2) | 0)), LevelDetailsRenderer.NUMBER_Y);
        this._prebake.badgePainter.drawBadge(composer, this.currentBadge(), this.levelText, LevelDetailsRenderer.BADGE_X, LevelDetailsRenderer.BADGE_Y);

        if(background.owned) background.bitmap.dispose();

        this._renderedPlanKey = plan.key;
    }

    private hasFinalNumberRenderChange(): boolean
    {
        return (this._numbers.isAtTarget(this._animator.path) && (this.renderPlan.key !== this._renderedPlanKey));
    }

    private updateNumbers(context: VariableFxRendererContext, sample: LevelProgressPathSample): void
    {
        const target = { maxValue: context.maxValue, sample, value: Math.min(context.maxValue, context.status.value) };

        if(context.status.isInitialize)
        {
            this._numbers.reset(target);

            return;
        }

        this._numbers.setTarget(target, this._animator.path);
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

    private barContext(): VariableFxRendererContext
    {
        return createLevelBarContext(this._context, this._barConfig, this._animator.progress, createLevelBarStatusExtra(this._barConfig, this._context.status.extra, this.displayedFrameArgb));
    }

    private createPrebake(context: VariableFxRendererContext): LevelRendererPrebake
    {
        const metallic = VariableFxPaintColor.resolveConfigured(context.config.color, context.config.extra).metallic;
        const names = LevelDetailsRenderer.ASSET_NAMES;
        const layer = (name: string): IVariableFxImage =>
        {
            const image = context.assets?.getBitmap(name);

            if(!image) throw new Error(`Missing Variable FX level details layer '${ name }'.`);

            return image;
        };
        const assets: ILevelBadgeAssets = {
            background: null,
            darkening: layer(metallic ? names.darkeningMetallic : names.darkening),
            frame: layer(names.frame),
            lighting: layer(metallic ? names.lightingMetallic : names.lighting),
            numbers: layer(names.numbers)
        };
        const badgePainter = new LevelBadgePainter(assets, { x: LevelDetailsRenderer.BADGE_X, y: LevelDetailsRenderer.BADGE_Y, width: LevelDetailsRenderer.BADGE_WIDTH, height: LevelDetailsRenderer.BADGE_HEIGHT });

        return new LevelRendererPrebake(badgePainter, layer(names.background), new LevelDetailsNumberPainter(layer(names.smallNumbers)), { left: LevelDetailsRenderer.BACKGROUND_SLICE_LEFT, right: LevelDetailsRenderer.BACKGROUND_SLICE_RIGHT, height: LevelDetailsRenderer.FRAME_HEIGHT });
    }
}
