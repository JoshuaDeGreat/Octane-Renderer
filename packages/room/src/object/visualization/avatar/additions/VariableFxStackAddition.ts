import { AvatarAction, IRoomObjectSprite, IRoomObjectVariableFxEntry } from '@octane/api';
import { VariableFxStack } from '../../variablefx/VariableFxStack';
import { IAvatarAddition } from './IAvatarAddition';

/** What the stack needs of the avatar it sits on. */
export interface IVariableFxStackHolder
{
    readonly posture: string;
}

/**
 * The wired variable fx over an avatar (AIR's StackedAdditions, variable fx layer): one sprite that
 * holds the composed stack, its bottom 86 px above the avatar's feet (45 at the small zoom), lower
 * while sitting or lying, in front of the avatar.
 */
export class VariableFxStackAddition implements IAvatarAddition
{
    public static ROOM_LARGE_STACK_BOTTOM_Y: number = -86;
    public static ROOM_SMALL_STACK_BOTTOM_Y: number = -45;

    private _stack: VariableFxStack = new VariableFxStack();
    private _scale: number = 64;

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
