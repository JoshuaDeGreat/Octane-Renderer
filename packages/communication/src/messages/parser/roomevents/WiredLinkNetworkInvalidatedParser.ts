import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { WIRED_LINK_NO_NETWORK } from './WiredLinkData';

/** WIRED Link network invalidated (AIR 999): a network of the open Link window was deleted elsewhere. */
export class WiredLinkNetworkInvalidatedParser implements IMessageParser
{
    private _roomId: number;
    private _furniId: number;
    private _deletedNetworkId: string;

    public flush(): boolean
    {
        this._roomId = 0;
        this._furniId = 0;
        this._deletedNetworkId = WIRED_LINK_NO_NETWORK;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomId = wrapper.readInt();
        this._furniId = wrapper.readInt();
        this._deletedNetworkId = wrapper.readString();

        return true;
    }

    public get roomId(): number
    {
        return this._roomId;
    }

    public get furniId(): number
    {
        return this._furniId;
    }

    public get deletedNetworkId(): string
    {
        return this._deletedNetworkId;
    }
}
