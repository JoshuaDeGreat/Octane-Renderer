import { IRoomObjectVariableFxEntry, IRoomObjectVariableFxFrame, IRoomObjectVariableFxVisualizer } from '@octane/api';
import { VariableFxStackMotion } from './VariableFxStackMotion';

/**
 * One fx in a holder's stack, as AIR's VariableFxStackAddition keeps it: it fades in over 150 ms
 * when shown, out over 350 ms when hidden or gone, and slides to its place in the pile with the
 * stack motion. A hidden fx stays in the stack at alpha 0; a gone one leaves once it has faded.
 */
export class VariableFxStackEntry
{
    public static FADE_IN_DURATION_MS: number = 150;
    public static FADE_OUT_DURATION_MS: number = 350;
    public static DEFAULT_RELATIVE_DEPTH: number = -0.2;

    private static SEQUENCE: number = 10000;

    public readonly id: number = VariableFxStackEntry.SEQUENCE++;
    public readonly key: string;
    public layer: number = 0;
    public createdAt: number = 0;
    public configId: number = 0;
    public variableId: string = '';
    public visualizer: IRoomObjectVariableFxVisualizer = null;

    public readonly y: VariableFxStackMotion = new VariableFxStackMotion(0.003, 0.35, 0.01, 0.004);

    private _alpha: number = 0;
    private _fadeStartAlpha: number = 0;
    private _fadeTargetAlpha: number = 0;
    private _fadeStartedAt: number = 0;
    private _fadeDuration: number = 0;
    private _shown: boolean = false;
    private _invisible: boolean = false;
    private _finished: boolean = false;
    private _placed: boolean = false;
    private _inLayout: boolean = false;
    private _placedAt: number = 0;

    constructor(key: string)
    {
        this.key = key;
    }

    /** Takes the entry the client sent; true when something about the drawing changed. */
    public show(entry: IRoomObjectVariableFxEntry, now: number): boolean
    {
        let changed = false;
        const variableId = (entry.variableId ?? '');

        if((this.layer !== entry.layer) || (this.createdAt !== entry.createdAt) || (this.configId !== entry.configId) || (this.variableId !== variableId))
        {
            this.layer = entry.layer;
            this.createdAt = entry.createdAt;
            this.configId = entry.configId;
            this.variableId = variableId;
            changed = true;
        }

        if(this.visualizer !== entry.visualizer)
        {
            this.visualizer = entry.visualizer;
            changed = true;
        }

        if(this._finished) changed = true;

        this._finished = false;

        if(!entry.visible) return (this.startInvisibleFade(now) || changed);

        if(this._invisible || !this._shown) changed = true;

        this._invisible = false;
        this._shown = true;

        return (this.startFade(255, VariableFxStackEntry.FADE_IN_DURATION_MS, now) || changed);
    }

    /** The client no longer sends it: fade out, then leave the stack. */
    public hide(now: number): boolean
    {
        let changed = this._invisible;

        this._invisible = false;

        if(!this._shown && (this._fadeTargetAlpha === 0))
        {
            if(this._alpha === 0)
            {
                changed = (changed || !this._finished);

                this._finished = true;
            }

            return changed;
        }

        this._shown = false;

        this.startFade(0, VariableFxStackEntry.FADE_OUT_DURATION_MS, now);

        if(this._alpha === 0) this._finished = true;

        return true;
    }

    /** Advances the fade; true when the alpha changed. */
    public updateFade(now: number): boolean
    {
        if(this._alpha === this._fadeTargetAlpha) return false;

        const progress = ((this._fadeDuration <= 0) ? 1 : Math.max(0, Math.min(1, ((now - this._fadeStartedAt) / this._fadeDuration))));
        const alpha = (Math.round(this._fadeStartAlpha + ((this._fadeTargetAlpha - this._fadeStartAlpha) * progress)) | 0);

        if(alpha === this._alpha) return false;

        this._alpha = alpha;

        if((this._alpha === 0) && !this._shown && !this._invisible) this._finished = true;

        return true;
    }

    /** Lets the visualizer draw a newer frame; true when it did. A faded out fx is not drawn. */
    public updateVisualizer(now: number): boolean
    {
        if(!this.visualizer || ((this._alpha <= 0) && !this._shown)) return false;

        if(!this.visualizer.needsUpdate(now)) return false;

        return this.visualizer.update(now);
    }

    /**
     * Puts the entry's bottom `target` px from the stack bottom (negative is up). The first
     * placement is immediate, later ones slide with the stack motion; true when it moved.
     */
    public place(target: number, now: number, animate: boolean): boolean
    {
        this._inLayout = true;

        if(!this._placed)
        {
            this.y.reset(target, now);
            this._placed = true;
            this._placedAt = target;

            return true;
        }

        let moved = false;

        if(this._placedAt !== target)
        {
            const before = this.y.value;

            this._placedAt = target;
            this.y.setTarget(target, now);

            moved = (this.y.value !== before);
        }

        if(animate && this.y.update(now)) moved = true;

        return moved;
    }

    /** A fading entry gives up its slot: it stays where it is while the others move into it. */
    public freeze(now: number): boolean
    {
        if(!this._inLayout) return false;

        this._inLayout = false;

        const before = this.y.value;

        this.y.update(now);
        this.y.reset(this.y.value, now);
        this._placedAt = this.y.value;

        return (this.y.value !== before);
    }

    public get frame(): IRoomObjectVariableFxFrame
    {
        return (this.visualizer?.frame ?? null);
    }

    public get alpha(): number
    {
        return this._alpha;
    }

    /** Shown and not hidden: it takes a slot in the pile. */
    public get takesSlot(): boolean
    {
        return (this._shown && !this._invisible);
    }

    public get isFinished(): boolean
    {
        return this._finished;
    }

    public get isFading(): boolean
    {
        return (this._alpha !== this._fadeTargetAlpha);
    }

    public get isMoving(): boolean
    {
        return (this._placed && this.y.needsUpdate(0, 1));
    }

    private startFade(target: number, duration: number, now: number): boolean
    {
        const changed = this.updateFade(now);

        if(this._fadeTargetAlpha === target) return changed;

        this._fadeStartedAt = now;
        this._fadeStartAlpha = this._alpha;
        this._fadeTargetAlpha = target;
        this._fadeDuration = duration;

        return true;
    }

    private startInvisibleFade(now: number): boolean
    {
        const changed = (!this._invisible || this._shown);

        this._invisible = true;
        this._shown = false;

        return (this.startFade(0, VariableFxStackEntry.FADE_OUT_DURATION_MS, now) || changed);
    }
}
