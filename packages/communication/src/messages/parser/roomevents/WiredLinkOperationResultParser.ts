import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredLinkNetwork, readWiredLinkNetworks, WIRED_LINK_NO_NETWORK } from './WiredLinkData';

/**
 * WIRED Link operation result (AIR 3961). Operations 1 save, 2 create, 3 rename, 4 delete, 5 connections;
 * result 0 is success, 1..8 the official wiredlink.error.* keys.
 */
export class WiredLinkOperationResultParser implements IMessageParser
{
    public static OPERATION_SAVE = 1;
    public static OPERATION_CREATE = 2;
    public static OPERATION_RENAME = 3;
    public static OPERATION_DELETE = 4;
    public static OPERATION_CONNECTIONS = 5;

    private _roomId: number;
    private _furniId: number;
    private _operation: number;
    private _resultCode: number;
    private _hasConfiguration: boolean;
    private _selectedNetworkId: string;
    private _receiveLocal: boolean;
    private _removedNetworkId: string;
    private _networks: IWiredLinkNetwork[];

    public flush(): boolean
    {
        this._roomId = 0;
        this._furniId = 0;
        this._operation = 0;
        this._resultCode = 0;
        this._hasConfiguration = false;
        this._selectedNetworkId = WIRED_LINK_NO_NETWORK;
        this._receiveLocal = false;
        this._removedNetworkId = WIRED_LINK_NO_NETWORK;
        this._networks = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomId = wrapper.readInt();
        this._furniId = wrapper.readInt();
        this._operation = wrapper.readInt();
        this._resultCode = wrapper.readInt();
        this._hasConfiguration = wrapper.readBoolean();

        if(this._hasConfiguration)
        {
            this._selectedNetworkId = wrapper.readString();
            this._receiveLocal = wrapper.readBoolean();
        }

        this._removedNetworkId = wrapper.readString();
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

    public get operation(): number
    {
        return this._operation;
    }

    public get resultCode(): number
    {
        return this._resultCode;
    }

    public get hasConfiguration(): boolean
    {
        return this._hasConfiguration;
    }

    public get selectedNetworkId(): string
    {
        return this._selectedNetworkId;
    }

    public get receiveLocal(): boolean
    {
        return this._receiveLocal;
    }

    public get removedNetworkId(): string
    {
        return this._removedNetworkId;
    }

    public get networks(): IWiredLinkNetwork[]
    {
        return this._networks;
    }
}
