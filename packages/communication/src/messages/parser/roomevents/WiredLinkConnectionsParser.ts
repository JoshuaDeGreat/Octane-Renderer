import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredLinkConnection, readWiredLinkConnection, WIRED_LINK_MAX_LIST, WIRED_LINK_NO_NETWORK } from './WiredLinkData';

/** WIRED Link connections (AIR 3962): the Links of one network, in every room. */
export class WiredLinkConnectionsParser implements IMessageParser
{
    private _roomId: number;
    private _furniId: number;
    private _networkId: string;
    private _connections: IWiredLinkConnection[];

    public flush(): boolean
    {
        this._roomId = 0;
        this._furniId = 0;
        this._networkId = WIRED_LINK_NO_NETWORK;
        this._connections = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomId = wrapper.readInt();
        this._furniId = wrapper.readInt();
        this._networkId = wrapper.readString();
        this._connections = [];

        const count = wrapper.readInt();

        if(count < 0 || count > WIRED_LINK_MAX_LIST) return true;

        for(let i = 0; i < count; i++) this._connections.push(readWiredLinkConnection(wrapper));

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

    public get networkId(): string
    {
        return this._networkId;
    }

    public get connections(): IWiredLinkConnection[]
    {
        return this._connections;
    }
}
