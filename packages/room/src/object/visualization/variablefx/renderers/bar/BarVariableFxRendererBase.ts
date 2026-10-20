import { VariableFxAnimatedPaintColor, IVariableFxPaintColorSource } from '../../animation/VariableFxAnimatedColor';
import { IVariableFxImage } from '../../rendering/VariableFxBitmap';
import { VariableFxFrame } from '../../rendering/VariableFxFrame';
import { IVariableFxRenderer, VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxStackMotion } from '../../VariableFxStackMotion';

/** A bar's layout: the frame, where the fill sits in it and how the background three-slices. */
export interface IVariableFxBarLayout
{
    width: number;
    height: number;
    fillX: number;
    fillY: number;
    fillWidth: number;
    fillHeight: number;
    sliceLeftWidth: number;
    sliceRightWidth: number;
}

/** The background's three-slice widths: the slice widths plus the border around the fill. */
export const resolveBackgroundSliceLeftWidth = (layout: IVariableFxBarLayout): number => Math.max(0, ((layout.fillX | 0) + (layout.sliceLeftWidth | 0)));

export const resolveBackgroundSliceRightWidth = (layout: IVariableFxBarLayout): number => Math.max(0, (((layout.width | 0) - (layout.fillX | 0) - (layout.fillWidth | 0)) + (layout.sliceRightWidth | 0)));

/**
 * The common part of AIR's bar renderers (BarVariableFxRendererBase): the fill eases towards the
 * value with a capped acceleration (it accelerates by 0.00001 / ms², tops out at 0.003 / ms and
 * brakes at 0.000008 / ms²), the fill colour fades over 300 ms, and a frame is drawn only when the
 * filled width in whole pixels or the colour changed.
 */
export abstract class BarVariableFxRendererBase implements IVariableFxRenderer
{
    public static FILL_COLOR_TRANSITION_MS: number = 300;

    protected _context: VariableFxRendererContext;
    protected _frame: VariableFxFrame = new VariableFxFrame();
    protected _fillColor: VariableFxAnimatedPaintColor = new VariableFxAnimatedPaintColor(BarVariableFxRendererBase.FILL_COLOR_TRANSITION_MS);
    protected _progress: VariableFxStackMotion = new VariableFxStackMotion(0.00001, 0.003, 0.0001, 0.000008);

    private _initialized: boolean = false;
    private _renderedColor: number = -1;
    private _renderedWidth: number = -1;

    constructor(context: VariableFxRendererContext)
    {
        this._context = context;
    }

    public get frame(): VariableFxFrame
    {
        return this._frame;
    }

    public get isContinuous(): boolean
    {
        return false;
    }

    public get context(): VariableFxRendererContext
    {
        return this._context;
    }

    public abstract get frameWidth(): number;
    public abstract get frameHeight(): number;
    public abstract get progressPixelWidth(): number;

    /** The fill's drawn progress, 0 to 1. */
    public get displayedProgress(): number
    {
        return this._progress.value;
    }

    public get fillArgb(): number
    {
        return this._fillColor.argb;
    }

    public updateData(context: VariableFxRendererContext, now: number): void
    {
        this._context = context;

        if(!this._initialized || context.status.isInitialize)
        {
            this._progress.reset(context.progress, now);
            this._fillColor.reset(this.paintColorSource(), now);
            this._initialized = true;

            return;
        }

        this._progress.setTarget(context.progress, now);
        this._fillColor.setTarget(this.paintColorSource(), now);
    }

    public needsUpdate(now: number): boolean
    {
        return (this.hasRenderChange(now) || this._progress.needsUpdate(now, this.progressPixelWidth) || this._fillColor.needsUpdate());
    }

    public update(now: number): boolean
    {
        this._progress.update(now);
        this._fillColor.update(this.paintColorSource(), now);

        if(!this.hasRenderChange(now)) return false;

        if(!this._frame.fits(this.frameWidth, this.frameHeight))
        {
            this._frame.allocate(this.frameWidth, this.frameHeight);
            this._renderedColor = -1;
            this._renderedWidth = -1;
        }

        this.renderFrame(now);

        this._renderedColor = this._fillColor.value;
        this._renderedWidth = this.renderedPixelWidth();
        this.afterRender(now);
        this._frame.updateId++;

        return true;
    }

    public dispose(): void
    {
        this._frame.release();
    }

    /** The filled width in whole pixels. */
    public renderedPixelWidth(): number
    {
        return Math.max(0, Math.min(this.progressPixelWidth, ((this._progress.value * this.progressPixelWidth) | 0)));
    }

    protected abstract renderFrame(now: number): void;

    /** A renderer that also redraws for its own reasons (the striped bar's stripes). */
    protected hasExtraRenderChange(now: number): boolean
    {
        return false;
    }

    protected afterRender(now: number): void
    {}

    protected getLayer(name: string, description: string): IVariableFxImage
    {
        const layer = (this._context.assets ? this._context.assets.getBitmap(name) : null);

        if(!layer) throw new Error(`Missing Variable FX ${ description } layer '${ name }'.`);

        return layer;
    }

    private hasRenderChange(now: number): boolean
    {
        const width = this.renderedPixelWidth();

        if(!this._frame.fits(this.frameWidth, this.frameHeight) || (width !== this._renderedWidth)) return true;

        return (((this._fillColor.value !== this._renderedColor) && ((width > 0) || (this._renderedWidth > 0))) || this.hasExtraRenderChange(now));
    }

    private paintColorSource(): IVariableFxPaintColorSource
    {
        return {
            color: this._context.config.color,
            extra: this._context.config.extra,
            progress: this._progress.value,
            statusExtra: this._context.status.extra
        };
    }
}
