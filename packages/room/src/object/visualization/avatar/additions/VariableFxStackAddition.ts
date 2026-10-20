import { AvatarAction, IRoomObjectSprite, IRoomObjectVariableFxEntry } from '@octane/api';
import { VariableFxStack } from '../../variablefx/VariableFxStack';
import { HabbiconStackVisualizer, IHabbiconStackSource } from './HabbiconStackVisualizer';
import { IAvatarAddition } from './IAvatarAddition';

/** What the stack needs of the avatar it sits on. */
export interface IVariableFxStackHolder
{
    readonly posture: string;
}

/**
 * The stacked additions over an avatar (AIR's StackedAdditions): the wired variable fx at layer 0
 * and the habbicon bubble at layer 100 on top of them, composed into one sprite whose bottom is
 * 86 px above the avatar's feet (45 at the small zoom), lower while sitting or lying, in front of
 * the avatar.
 */
export class VariableFxStackAddition implements IAvatarAddition
{
    public static ROOM_LARGE_STACK_BOTTOM_Y: number = -86;
    public static ROOM_SMALL_STACK_BOTTOM_Y: number = -45;
    public static LAYER_VARIABLE_FX: number = 0;
    public static LAYER_HABBICON: number = 100;
    public static HABBICON_KEY: string = 'habbicon';

    private _stack: VariableFxStack = new VariableFxStack();
    private _scale: number = 64;
    private _habbicon: HabbiconStackVisualizer = null;

    constructor(
        private _id: number,
        private _holder: IVariableFxStackHolder)
    {}

    /** Bottom of the stack relative to the avatar's position, as AIR resolves it. */
    public static resolveStackBottomY(scale: number, posture: string): number
    {
        const small = (scale < 48);
        const additionScale = (small ? 32 : 64);
        let bottomY = (small ? VariableFxStackAddition.ROOM_SMALL_STACK_BOTTOM_Y : VariableFxStackAddition.ROOM_LARGE_STACK_BOTTOM_Y);

        if(posture === AvatarAction.POSTURE_SIT) bottomY += (additionScale / 2);
        else if(posture === AvatarAction.POSTURE_LAY) bottomY += additionScale;

        return bottomY;
    }

    public setEntries(entries: IRoomObjectVariableFxEntry[], now: number = Date.now()): boolean
    {
        return this._stack.setEntries(entries, now);
    }

    /** Puts a habbicon bubble on top of the stack, replacing the one there; null takes it off. */
    public setHabbicon(habbicon: IHabbiconStackSource, now: number = Date.now()): boolean
    {
        if(this._habbicon && (this._habbicon.source === habbicon)) return false;

        this._habbicon?.dispose();
        this._habbicon = (habbicon ? new HabbiconStackVisualizer(habbicon, () => this._scale) : null);

        return this._stack.setAddition(VariableFxStackAddition.HABBICON_KEY, VariableFxStackAddition.LAYER_HABBICON, this._habbicon, now);
    }

    public get habbicon(): IHabbiconStackSource
    {
        return (this._habbicon ? this._habbicon.source : null);
    }

    public update(sprite: IRoomObjectSprite, scale: number): void
    {
        this._scale = scale;

        this._stack.apply(sprite, 0, this.stackBottomY, Date.now());
    }

    public animate(sprite: IRoomObjectSprite): boolean
    {
        return this._stack.apply(sprite, 0, this.stackBottomY, Date.now());
    }

    public dispose(): void
    {
        this._habbicon?.dispose();
        this._habbicon = null;
        this._stack.dispose();
        this._holder = null;
    }

    public get stack(): VariableFxStack
    {
        return this._stack;
    }

    public get stackBottomY(): number
    {
        return VariableFxStackAddition.resolveStackBottomY(this._scale, this._holder?.posture);
    }

    public get id(): number
    {
        return this._id;
    }
}
