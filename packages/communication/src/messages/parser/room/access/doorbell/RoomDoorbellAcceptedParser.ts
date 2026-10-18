import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** FlatAccessible, the doorbell was answered (AIR `?_-bt?/?_-L1W?`): the flat id, then the user name. */
export class RoomDoorbellAcceptedParser implements IMessageParser
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
