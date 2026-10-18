import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredLinkNetwork, readWiredLinkNetworks, WIRED_LINK_NO_NETWORK } from './WiredLinkData';

/** WIRED Link configuration (AIR 3405): the Link window's opening state. */
export class WiredLinkConfigurationParser implements IMessageParser
{
    private _roomId: number;
    private _furniId: number;
    private _selectedNetworkId: string;
    private _receiveLocal: boolean;
    private _networks: IWiredLinkNetwork[];

    public flush(): boolean
    {
        this._roomId = 0;
        this._furniId = 0;
        this._selectedNetworkId = WIRED_LINK_NO_NETWORK;
        this._receiveLocal = false;
        this._networks = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomId = wrapper.readInt();
        this._furniId = wrapper.readInt();
        this._selectedNetworkId = wrapper.readString();
        this._receiveLocal = wrapper.readBoolean();
        this._networks = readWiredLinkNetworks(wrapper);

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

    public get selectedNetworkId(): string
    {
        return this._selectedNetworkId;
    }

    public get receiveLocal(): boolean
    {
        return this._receiveLocal;
    }

    public get networks(): IWiredLinkNetwork[]
    {
        return this._networks;
    }
}
