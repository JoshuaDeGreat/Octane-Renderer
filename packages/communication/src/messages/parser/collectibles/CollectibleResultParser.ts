import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** One short result: purchase (169, 0 ok), transfer (2595, 0 ok), claim all (3720, 0 ok), reward box (2692: 0 ok, 1 failed, 2 wrong wallet) or mint (1 ok). */
export class CollectibleResultParser implements IMessageParser
{
    private _result: number = -1;

    public flush(): boolean
    {
        this._result = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._result = wrapper.readShort();

        return true;
    }

    public get result(): number
    {
        return this._result;
    }
}
