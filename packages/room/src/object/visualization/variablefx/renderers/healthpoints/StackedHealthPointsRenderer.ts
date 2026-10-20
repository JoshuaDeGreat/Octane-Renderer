import { VariableFxBitmap, VariableFxBlendMode, IVariableFxImage } from '../../rendering/VariableFxBitmap';
import { VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { VariableFxFrame } from '../../rendering/VariableFxFrame';
import { IVariableFxPrebake, IVariableFxRenderer, VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { VariableFxWidth } from '../../VariableFxTypes';
import { IVariableFxBarOverlay } from '../bar/ClassicProgressBarRenderer';

interface IStackedHeartAssets
{
    background: IVariableFxImage;
    metallic: IVariableFxImage;
    overlays: IVariableFxBarOverlay[];
}

/** One heart per colour: the heart tinted, the metallic layer added, then the shading. */
export class StackedHealthPointsHeartPrebake implements IVariableFxPrebake
{
    public static MAX_HEARTS: number = 32;

    public readonly heartWidth: number;
    public readonly heartHeight: number;

    private _hearts: Map<number, VariableFxBitmap> = new Map();

    constructor(private _assets: IStackedHeartAssets)
    {
        this.heartWidth = _assets.background.width;
        this.heartHeight = _assets.background.height;
    }

    public getHeart(argb: number): VariableFxBitmap
    {
        const key = (argb >>> 0);
        let heart = this._hearts.get(key);

        if(!heart)
        {
            heart = this.createHeart(key);

            this._hearts.set(key, heart);

            while(this._hearts.size > StackedHealthPointsHeartPrebake.MAX_HEARTS)
            {
                const oldest = this._hearts.keys().next().value;

                this._hearts.get(oldest)?.dispose();
                this._hearts.delete(oldest);
            }
        }

        return heart;
    }

    public dispose(): void
    {
        for(const heart of this._hearts.values()) heart.dispose();

        this._hearts.clear();
        this._assets = null;
    }

    private createHeart(argb: number): VariableFxBitmap
    {
        const bitmap = VariableFxBitmap.create(this.heartWidth, this.heartHeight);
        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);
        composer.drawTintedLayer(this._assets.background, 0, 0, argb, VariableFxBlendMode.NORMAL, 255);

        if(this._assets.metallic) composer.drawLayer(this._assets.metallic, 0, 0, VariableFxBlendMode.ADD, 255);

        for(const overlay of this._assets.overlays) composer.drawLayer(overlay.layer, 0, 0, overlay.blendMode, 255);

        return bitmap;
    }
}

/**
 * How the hearts fade in and out when the count changes (AIR's stacked hearts animator): the hearts
 * that change fade one after the other, gained ones from the first, lost ones from the last, 200 ms
 * for a single heart and at most 1.4 s for many, each heart taking at least 100 ms.
 */
export class StackedHealthPointsAnimator
{
    public static EPSILON: number = 0.0001;
    public static SINGLE_HEART_ANIMATION_MS: number = 200;
    public static MIN_HEART_FADE_DURATION_MS: number = 100;
    public static MAX_ANIMATION_DURATION_MS: number = 1400;

    private _changing: number[] = [];
    private _durationMs: number = 0;
    private _heartFadeMs: number = 0;
    private _opacities: number[] = [];
    private _heartDelayMs: number = 0;
    private _from: number[] = [];
    private _startedAt: number = 0;
    private _target: number = 0;
    private _to: number[] = [];

    /** Hearts up to the last one that is not fully faded out. */
    public get visibleHeartCount(): number
    {
        let count = 0;

        for(let index = 0; index < this._opacities.length; index++)
        {
            if(this._opacities[index] > StackedHealthPointsAnimator.EPSILON) count = Math.max(count, (index + 1));
        }

        return count;
    }

    public getOpacity(index: number): number
    {
        return (((index >= 0) && (index < this._opacities.length)) ? this._opacities[index] : 0);
    }

    public reset(count: number, now: number): void
    {
        this._durationMs = 0;
        this._heartFadeMs = 0;
        this._heartDelayMs = 0;
        this._startedAt = now;
        this._target = count;
        this._opacities = StackedHealthPointsAnimator.filled(count);
        this._from = [ ...this._opacities ];
        this._to = [ ...this._opacities ];
        this._changing = [];
    }

    public setTarget(count: number, now: number): void
    {
        this.update(now);

        const total = Math.max(this._opacities.length, count);
        const gaining = (count >= this.opacitySum(total));
        let distance = 0;

        this._startedAt = now;
        this._target = count;
        this._from = new Array(total);
        this._to = new Array(total);
        this._changing = [];

        for(let index = 0; index < total; index++)
        {
            const from = ((index < this._opacities.length) ? this._opacities[index] : 0);
            const to = ((index < count) ? 1 : 0);
            const change = Math.abs(to - from);

            this._from[index] = from;
            this._to[index] = to;
            distance += change;

            if(change > StackedHealthPointsAnimator.EPSILON) this._changing.push(index);
        }

        this._changing.sort(gaining ? ((left, right) => (left - right)) : ((left, right) => (right - left)));
        this._durationMs = StackedHealthPointsAnimator.resolveDuration(distance);

        if((this._durationMs <= 0) || !this._changing.length)
        {
            this.finish();

            return;
        }

        this._heartFadeMs = Math.min(this._durationMs, Math.max(StackedHealthPointsAnimator.MIN_HEART_FADE_DURATION_MS, Math.round((this._durationMs / distance) * 1.5)));
        this._heartDelayMs = ((this._changing.length > 1) ? ((this._durationMs - this._heartFadeMs) / (this._changing.length - 1)) : 0);
    }

    public needsUpdate(): boolean
    {
        return (this._changing.length > 0);
    }

    public update(now: number): boolean
    {
        if((this._durationMs <= 0) || !this._changing.length) return false;

        const elapsed = Math.max(0, (now - this._startedAt));

        if(elapsed >= this._durationMs) return this.finish();

        let changed = false;

        for(let index = 0; index < this._to.length; index++)
        {
            const opacity = this.opacityAt(index, elapsed);

            if(opacity !== this._opacities[index])
            {
                this._opacities[index] = opacity;
                changed = true;
            }
        }

        while((this._opacities.length > this._target) && (this._opacities[this._opacities.length - 1] <= StackedHealthPointsAnimator.EPSILON)) this._opacities.pop();

        return changed;
    }

    /** n hearts: each one fading adds (1400 - 200) / 1400 of the rest, so many hearts stay under 1.4 s. */
    public static resolveDuration(distance: number): number
    {
        if(distance <= StackedHealthPointsAnimator.EPSILON) return 0;

        const ratio = ((StackedHealthPointsAnimator.MAX_ANIMATION_DURATION_MS - StackedHealthPointsAnimator.SINGLE_HEART_ANIMATION_MS) / StackedHealthPointsAnimator.MAX_ANIMATION_DURATION_MS);

        return (StackedHealthPointsAnimator.MAX_ANIMATION_DURATION_MS * (1 - Math.pow(ratio, distance)));
    }

    private finish(): boolean
    {
        const settled = StackedHealthPointsAnimator.filled(this._target);
        const changed = ((this._durationMs !== 0) || !StackedHealthPointsAnimator.same(this._opacities, settled));

        this._opacities = settled;
        this._from = [ ...settled ];
        this._to = [ ...settled ];
        this._changing = [];
        this._durationMs = 0;
        this._heartFadeMs = 0;
        this._heartDelayMs = 0;

        return changed;
    }

    private opacityAt(index: number, elapsed: number): number
    {
        const order = this._changing.indexOf(index);

        if(order === -1) return ((index < this._to.length) ? this._to[index] : 0);

        const progress = Math.max(0, Math.min(1, ((elapsed - (order * this._heartDelayMs)) / this._heartFadeMs)));
        const from = ((index < this._from.length) ? this._from[index] : 0);
        const to = ((index < this._to.length) ? this._to[index] : 0);

        return (from + ((to - from) * progress));
    }

    private opacitySum(count: number): number
    {
        let sum = 0;

        for(let index = 0; index < count; index++) sum += ((index < this._opacities.length) ? this._opacities[index] : 0);

        return sum;
    }

    private static filled(count: number): number[]
    {
        return new Array(Math.max(0, count)).fill(1);
    }

    private static same(left: number[], right: number[]): boolean
    {
        return ((left.length === right.length) && left.every((value, index) => (Math.abs(value - right[index]) <= StackedHealthPointsAnimator.EPSILON)));
    }
}

/**
 * AIR's stacked hearts (StackedHealthPointsRenderer, server renderer 12): one heart per point
 * above the minimum (at most 20 rows), 3 per row (5 at large), 1 px apart and 3 px between rows,
 * filled bottom row first, fading in and out as the count changes.
 */
export class StackedHealthPointsRenderer implements IVariableFxRenderer
{
    public static ASSET_NAMES = {
        background: 'variablefx_stacked_health_points_background',
        darkening: 'variablefx_stacked_health_points_darkening',
        darkeningMetallic: 'variablefx_stacked_health_points_darkening_metallic',
        lighting: 'variablefx_stacked_health_points_lighting',
        lightingMetallic: 'variablefx_stacked_health_points_lighting_metallic',
        metallic: 'variablefx_stacked_health_points_metallic'
    };

    public static HORIZONTAL_SPACING: number = 1;
    public static VERTICAL_SPACING: number = 3;
    public static MAX_ROWS: number = 20;

    private _context: VariableFxRendererContext;
    private _frame: VariableFxFrame = new VariableFxFrame();
    private _animator: StackedHealthPointsAnimator = new StackedHealthPointsAnimator();
    private _prebake: StackedHealthPointsHeartPrebake;
    private _fillArgb: number = -1;
    private _heartCount: number = 0;
    private _initialized: boolean = false;
    private _renderedSignature: string = '';

    constructor(context: VariableFxRendererContext)
    {
        this._context = context;
        this._prebake = context.config.getOrCreatePrebake(() => new StackedHealthPointsHeartPrebake(this.resolveAssets(context)));
        this._fillArgb = StackedHealthPointsRenderer.resolveFillArgb(context);
    }

    public get frame(): VariableFxFrame
    {
        return this._frame;
    }

    public get isContinuous(): boolean
    {
        return false;
    }

    public get heartsPerRow(): number
    {
        return StackedHealthPointsRenderer.resolvePerRow(this._context.config.width);
    }

    public get heartCount(): number
    {
        return this._heartCount;
    }

    public get renderHeartCount(): number
    {
        return this._animator.visibleHeartCount;
    }

    public get rowCount(): number
    {
        return Math.max(1, Math.ceil(Math.max(this._heartCount, this._animator.visibleHeartCount) / this.heartsPerRow));
    }

    public get columnCount(): number
    {
        const visible = this._animator.visibleHeartCount;

        return ((Math.ceil(visible / this.heartsPerRow) > 1) ? this.heartsPerRow : Math.max(1, Math.min(this.heartsPerRow, visible)));
    }

    public get frameWidth(): number
    {
        return ((this.columnCount * this._prebake.heartWidth) + ((this.columnCount - 1) * StackedHealthPointsRenderer.HORIZONTAL_SPACING));
    }

    public get frameHeight(): number
    {
        return ((this.rowCount * this._prebake.heartHeight) + ((this.rowCount - 1) * StackedHealthPointsRenderer.VERTICAL_SPACING));
    }

    public static resolvePerRow(width: string): number
    {
        return ((width === VariableFxWidth.LARGE) ? 5 : 3);
    }

    /** One heart per whole point above the minimum, up to the range and 20 rows. */
    public static resolveHeartCount(context: VariableFxRendererContext): number
    {
        const value = (context.status.value - context.minValue);
        const range = (context.maxValue - context.minValue);

        if(!Number.isFinite(value) || !Number.isFinite(range)) return 0;

        return Math.min(Math.max(0, (value | 0)), Math.max(0, (range | 0)), (StackedHealthPointsRenderer.resolvePerRow(context.config.width) * StackedHealthPointsRenderer.MAX_ROWS));
    }

    public updateData(context: VariableFxRendererContext, now: number): void
    {
        this._context = context;
        this._fillArgb = StackedHealthPointsRenderer.resolveFillArgb(context);
        this._heartCount = StackedHealthPointsRenderer.resolveHeartCount(context);

        if(!this._initialized || context.status.isInitialize)
        {
            this._animator.reset(this._heartCount, now);
            this._initialized = true;

            return;
        }

        this._animator.setTarget(this._heartCount, now);
    }

    public needsUpdate(now: number): boolean
    {
        return (!this._frame.fits(this.frameWidth, this.frameHeight) || (this.signature() !== this._renderedSignature) || this._animator.needsUpdate());
    }

    public update(now: number): boolean
    {
        if(!this._animator.update(now) && !this.needsUpdate(now)) return false;

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
        this._frame.release();
    }

    /** Where heart `index` goes: rows fill bottom up, left to right. */
    public heartPosition(index: number): { x: number, y: number }
    {
        const row = ((index / this.heartsPerRow) | 0);
        const column = (index % this.heartsPerRow);

        return {
            x: (column * (this._prebake.heartWidth + StackedHealthPointsRenderer.HORIZONTAL_SPACING)),
            y: ((this.rowCount - row - 1) * (this._prebake.heartHeight + StackedHealthPointsRenderer.VERTICAL_SPACING))
        };
    }

    private renderFrame(): void
    {
        const bitmap = this._frame.bitmap;

        if(!bitmap) return;

        const composer = new VariableFxBitmapComposer(bitmap);

        composer.clear(0);

        for(let index = 0; index < this.renderHeartCount; index++)
        {
            const opacity = this.heartOpacity(index);

            if(opacity <= 0) continue;

            const position = this.heartPosition(index);

            composer.drawLayer(this._prebake.getHeart(this._fillArgb >>> 0), position.x, position.y, VariableFxBlendMode.NORMAL, opacity);
        }
    }

    private heartOpacity(index: number): number
    {
        return Math.max(0, Math.min(255, Math.round((this._animator.getOpacity(index) + 1e-9) * 255)));
    }

    private signature(): string
    {
        const opacities: number[] = [];

        for(let index = 0; index < this.renderHeartCount; index++) opacities.push(this.heartOpacity(index));

        return `${ this.frameWidth }x${ this.frameHeight }:${ this._fillArgb }:${ opacities.join(',') }`;
    }

    private resolveAssets(context: VariableFxRendererContext): IStackedHeartAssets
    {
        const metallic = VariableFxPaintColor.resolveConfigured(context.config.color, context.config.extra).metallic;
        const names = StackedHealthPointsRenderer.ASSET_NAMES;
        const layer = (name: string) =>
        {
            const image = context.assets?.getBitmap(name);

            if(!image) throw new Error(`Missing Variable FX stacked health points layer '${ name }'.`);

            return image;
        };

        return {
            background: layer(names.background),
            metallic: (metallic ? layer(names.metallic) : null),
            overlays: [
                { blendMode: VariableFxBlendMode.MULTIPLY, layer: layer(metallic ? names.darkeningMetallic : names.darkening) },
                { blendMode: VariableFxBlendMode.ADD, layer: layer(metallic ? names.lightingMetallic : names.lighting) }
            ]
        };
    }

    private static resolveFillArgb(context: VariableFxRendererContext): number
    {
        return ((0xFF000000 | VariableFxPaintColor.resolveTarget(context.config.color, context.config.extra, context.progress, context.status.extra).rgb) >>> 0);
    }
}
