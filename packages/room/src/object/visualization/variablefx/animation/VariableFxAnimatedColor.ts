import { VariableFxPaintColor } from '../VariableFxPaintColor';

/** Fades an rgb to a new one channel by channel over a fixed time (AIR's AnimatedColor). */
export class VariableFxAnimatedColor
{
    private _durationMs: number;
    private _source: number = 0;
    private _startedAt: number = 0;
    private _target: number = 0;
    private _value: number = 0;

    constructor(durationMs: number)
    {
        this._durationMs = Math.max(0, durationMs);
    }

    public get value(): number
    {
        return this._value;
    }

    public get target(): number
    {
        return this._target;
    }

    public reset(rgb: number, now: number): void
    {
        const color = (rgb & 0xFFFFFF);

        this._source = color;
        this._startedAt = now;
        this._target = color;
        this._value = color;
    }

    public setTarget(rgb: number, now: number): void
    {
        const color = (rgb & 0xFFFFFF);

        if(color === this._target) return;

        this.update(now);

        this._source = this._value;
        this._startedAt = now;
        this._target = color;
    }

    public needsUpdate(): boolean
    {
        return (this._value !== this._target);
    }

    public update(now: number): boolean
    {
        const previous = this._value;

        if((this._durationMs === 0) || (now >= (this._startedAt + this._durationMs)))
        {
            this._value = this._target;

            return (previous !== this._value);
        }

        const progress = Math.max(0, ((now - this._startedAt) / this._durationMs));
        const mix = (from: number, to: number) => Math.round(from + ((to - from) * progress));

        this._value = ((mix(((this._source >> 16) & 255), ((this._target >> 16) & 255)) << 16) | (mix(((this._source >> 8) & 255), ((this._target >> 8) & 255)) << 8) | mix((this._source & 255), (this._target & 255)));

        return (previous !== this._value);
    }
}

/** What an animated paint colour is resolved from each tick. */
export interface IVariableFxPaintColorSource
{
    color: string;
    extra: Record<string, string>;
    progress: number;
    statusExtra: Record<string, string>;
}

/**
 * A bar's fill colour as AIR animates it (AnimatedPaintColor): a configured colour fades over the
 * given time, a per-status colour (level, team) switches at once, and the red-to-green colour steps
 * through its bands one at a time, so a drop from green to red passes yellow.
 */
export class VariableFxAnimatedPaintColor
{
    private _color: VariableFxAnimatedColor;
    private _band: number = null;
    private _targetRgb: number = -1;
    private _bandDirection: number = 0;

    constructor(durationMs: number)
    {
        this._color = new VariableFxAnimatedColor(durationMs);
    }

    public get value(): number
    {
        return this._color.value;
    }

    public get argb(): number
    {
        return ((0xFF000000 | this._color.value) >>> 0);
    }

    public reset(source: IVariableFxPaintColorSource, now: number): void
    {
        const resolved = VariableFxPaintColor.resolveTarget(source.color, source.extra, source.progress, source.statusExtra);
        const rgb = (resolved.rgb & 0xFFFFFF);

        this._color.reset(rgb, now);
        this._band = (resolved.bandIndex ?? null);
        this._targetRgb = rgb;
        this._bandDirection = 0;
    }

    public setTarget(source: IVariableFxPaintColorSource, now: number): void
    {
        this.retarget(source, now);
    }

    public needsUpdate(): boolean
    {
        return this._color.needsUpdate();
    }

    public update(source: IVariableFxPaintColorSource, now: number): boolean
    {
        const before = this.retarget(source, now);
        const moved = this._color.update(now);
        const after = this.retarget(source, now);

        return (before || moved || after);
    }

    private retarget(source: IVariableFxPaintColorSource, now: number): boolean
    {
        const resolved = VariableFxPaintColor.resolveTarget(source.color, source.extra, source.progress, source.statusExtra);

        if(resolved.immediate === true) return this.jumpTo(resolved.rgb);

        const band = (resolved.bandIndex ?? null);

        if(band === null) return this.fadeTo(resolved.rgb, null, now);

        const next = this.nextBand(band | 0);
        const rgb = VariableFxPaintColor.resolveBandRgb(source.color, next);

        return this.fadeTo(((rgb === null) ? resolved.rgb : (rgb >>> 0)), next, now);
    }

    private fadeTo(rgb: number, band: number, now: number): boolean
    {
        const color = (rgb & 0xFFFFFF);

        if((this._targetRgb === color) && (this._band === band)) return false;

        const previousBand = this._band;

        this._color.setTarget(color, now);
        this._band = band;
        this._targetRgb = color;
        this._bandDirection = (((previousBand !== null) && (band !== null)) ? Math.sign(band - previousBand) : 0);

        return true;
    }

    private jumpTo(rgb: number): boolean
    {
        const color = (rgb & 0xFFFFFF);

        if((this._targetRgb === color) && (this._band === null) && (this._color.value === color)) return false;

        this._color.reset(color, 0);
        this._band = null;
        this._targetRgb = color;
        this._bandDirection = 0;

        return true;
    }

    /** One band at a time towards `band`, waiting for the fade to land before the next step. */
    private nextBand(band: number): number
    {
        if(this._band === null) return band;
        if(band === this._band) return this._band;

        const direction = Math.sign(band - this._band);

        if(!this.isAtTarget() && (direction === this._bandDirection)) return this._band;
        if(this.isAtTarget()) return (this._band + direction);

        return band;
    }

    private isAtTarget(): boolean
    {
        return (this._color.value === this._targetRgb);
    }
}
