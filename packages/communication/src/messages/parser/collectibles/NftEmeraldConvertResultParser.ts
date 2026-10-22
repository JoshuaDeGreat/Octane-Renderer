import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** Official `class_3388`: an emerald furni could not be redeemed (`stuffId, result`). */
export class NftEmeraldConvertResultParser implements IMessageParser
{
    private _stuffId: number = 0;
    private _result: number = 0;

    public flush(): boolean
    {
        this._stuffId = 0;
        this._result = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._stuffId = wrapper.readInt();
        this._result = wrapper.readShort();

        return true;
    }

    public get stuffId(): number
    {
        return this._stuffId;
    }

    public get result(): number
    {
        return this._result;
    }
}
