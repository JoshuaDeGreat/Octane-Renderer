import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** The answer to an ignore request (AIR `?_-A1M?/?_-M1q?`): the result, then the user's id. */
export class IgnoreResultParser implements IMessageParser
{
    private _result: number;
    private _userId: number;

    public flush(): boolean
    {
        this._result = -1;
        this._userId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._result = wrapper.readInt();
        this._userId = wrapper.readInt();

        return true;
    }

    public get result(): number
    {
        return this._result;
    }

    public get userId(): number
    {
        return this._userId;
    }
}
