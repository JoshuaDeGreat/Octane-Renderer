import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * The doorbell was refused (AIR `?_-H1Z?/?_-T1k?`): the flat id, then the user name. AIR reads the name only when
 * bytes remain; our server always sends it, so it is read unconditionally to keep the packet contract exact.
 */
export class FlatAccessDeniedMessageParser implements IMessageParser
{
    private _flatId: number;
    private _userName: string;

    public flush(): boolean
    {
        this._flatId = 0;
        this._userName = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._flatId = wrapper.readInt();
        this._userName = wrapper.readString();

        return true;
    }

    public get flatId(): number
    {
        return this._flatId;
    }

    public get userName(): string
    {
        return this._userName;
    }
}
