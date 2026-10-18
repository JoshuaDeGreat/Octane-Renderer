import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** WIRED Link open (AIR 1715, ours 9493): the owner used their Link; the client asks for its configuration. */
export class WiredLinkOpenParser implements IMessageParser
{
    private _furniId: number;

    public flush(): boolean
    {
        this._furniId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._furniId = wrapper.readInt();

        return true;
    }

    public get furniId(): number
    {
        return this._furniId;
    }
}
