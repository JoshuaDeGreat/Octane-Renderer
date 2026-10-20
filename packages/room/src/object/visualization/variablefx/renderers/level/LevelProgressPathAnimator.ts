import { VariableFxStackMotion } from '../../VariableFxStackMotion';

/** A level and how far into it (AIR's LevelProgressPathSample). */
export class LevelProgressPathSample
{
    public readonly level: number;
    public readonly progress: number;
    public readonly maxLevel: number;

    constructor(level: number, progress: number, public readonly isMaxed: boolean, maxLevel: number)
    {
        this.level = LevelProgressPathSample.normalizeLevel(level);
        this.progress = (Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0);
        this.maxLevel = LevelProgressPathSample.normalizeMaxLevel(maxLevel);
    }

    public static normalize(sample: LevelProgressPathSample): LevelProgressPathSample
    {
        return new LevelProgressPathSample(sample.level, sample.progress, sample.isMaxed, sample.maxLevel);
    }

    private static normalizeLevel(level: number): number
    {
        return ((!Number.isFinite(level) || (level < 0)) ? 0 : (level | 0));
    }

    private static normalizeMaxLevel(maxLevel: number): number
    {
        const value = Number(maxLevel);

        return (((maxLevel === null) || (maxLevel === undefined) || !Number.isFinite(value) || (value < 0)) ? null : (value | 0));
    }
}

/**
 * Animates a level badge along one path, level plus progress (AIR's LevelProgressPathAnimator):
 * a level up runs the bar to the end, flips the number and runs on from empty. The path eases with
 * the same capped acceleration as the stack motion (0.000008 / ms², at most 0.02 / ms).
 */
export class LevelProgressPathAnimator
{
    public static EPSILON: number = 0.000001;

    private _path: VariableFxStackMotion = new VariableFxStackMotion(0.000008, 0.02, 0.0001, 0.000006);
    private _target: LevelProgressPathSample = new LevelProgressPathSample(0, 0, false, null);

    public get level(): number
    {
        return this.displayed.level;
    }

    public get progress(): number
    {
        return this.displayed.progress;
    }

    public get path(): number
    {
        return this._path.value;
    }

    public get target(): LevelProgressPathSample
    {
        return this._target;
    }

    public reset(sample: LevelProgressPathSample, now: number): void
    {
        this._target = LevelProgressPathSample.normalize(sample);
        this._path.reset(LevelProgressPathAnimator.resolvePath(this._target), now);
    }

    public setTarget(sample: LevelProgressPathSample, now: number): void
    {
        this._target = LevelProgressPathSample.normalize(sample);
        this._path.setTarget(LevelProgressPathAnimator.resolvePath(this._target), now);
    }

    public needsUpdate(now: number, scale: number): boolean
    {
        return this._path.needsUpdate(now, scale);
    }

    public update(now: number): boolean
    {
        return this._path.update(now);
    }

    public get displayed(): { level: number, progress: number }
    {
        return LevelProgressPathAnimator.resolveDisplay(this._path.value, this._target);
    }

    /** At the cap with both ends of the range met, the bar is full rather than empty. */
    public static resolveSampleProgress(progress: number, value: number, min: number, max: number, maxed: boolean): number
    {
        return ((maxed && Number.isFinite(value) && Number.isFinite(min) && Number.isFinite(max) && (min === max) && (value >= max)) ? 1 : progress);
    }

    public static resolveDisplay(path: number, target: LevelProgressPathSample): { level: number, progress: number }
    {
        const sample = LevelProgressPathSample.normalize(target);

        if(Math.abs(path - LevelProgressPathAnimator.resolvePath(sample)) <= LevelProgressPathAnimator.EPSILON) return { level: sample.level, progress: sample.progress };

        const value = (Number.isFinite(path) ? Math.max(0, path) : 0);
        const level = (Math.floor(value) | 0);
        const fraction = (value - level);

        if(fraction <= LevelProgressPathAnimator.EPSILON) return { level, progress: 0 };
        if((1 - fraction) <= LevelProgressPathAnimator.EPSILON) return { level: (level + 1), progress: 0 };

        return { level, progress: fraction };
    }

    public static resolvePath(target: LevelProgressPathSample): number
    {
        const sample = LevelProgressPathSample.normalize(target);

        return ((sample.isMaxed && (sample.progress >= 1)) ? sample.level : (sample.level + sample.progress));
    }
}
