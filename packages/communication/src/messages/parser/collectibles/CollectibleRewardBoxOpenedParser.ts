import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CollectibleProductData } from './CollectibleProductData';

/** Official `class_2528` (3374): a reward box in the room was opened (state 1; 0 is the start). */
export class CollectibleRewardBoxOpenedParser implements IMessageParser
{
    public static STATE_START = 0;
    public static STATE_FINISH = 1;

    private _state: number = -1;
    private _openerId: number = -1;
    private _reward: CollectibleProductData = null;

    public flush(): boolean
    {
        this._state = -1;
        this._openerId = -1;
        this._reward = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._state = wrapper.readShort();
        this._openerId = wrapper.readInt();
        this._reward = CollectibleProductData.parse(wrapper);

        return true;
    }

    public get state(): number
    {
        return this._state;
    }

    public get openerId(): number
    {
        return this._openerId;
    }

    public get reward(): CollectibleProductData
    {
        return this._reward;
    }
}
