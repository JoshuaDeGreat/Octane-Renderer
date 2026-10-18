import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** The user entered the room as a spectator (AIR `?_-bt?/?_-PI?`): the flat id. */
export class YouAreSpectatorMessageParser implements IMessageParser
{
    private _flatId: number;

    public flush(): boolean
    {
        this._flatId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._flatId = wrapper.readInt();

        return true;
    }

    public get flatId(): number
    {
        return this._flatId;
    }
}
