import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class FurnitureFloorRemoveParser implements IMessageParser
{
    private _itemId: number;
    private _isExpired: boolean;
    private _userId: number;
    private _delay: number;
    private _byInvisibleFurniManager: boolean;

    public flush(): boolean
    {
        this._itemId = 0;
        this._isExpired = true;
        this._userId = 0;
        this._delay = 0;
        this._byInvisibleFurniManager = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._itemId = parseInt(wrapper.readString());
        this._isExpired = wrapper.readBoolean();
        this._userId = wrapper.readInt();
        this._delay = wrapper.readInt();
        // Read when it is there, so a server that predates the flag still parses.
        this._byInvisibleFurniManager = wrapper.bytesAvailable ? wrapper.readBoolean() : false;

        return true;
    }

    public get itemId(): number
    {
        return this._itemId;
    }

    public get isExpired(): boolean
    {
        return this._isExpired;
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get delay(): number
    {
        return this._delay;
    }

    /** AIR's trailing flag: the furni left because the invisible furni manager (an area hider) hid it, not for good. */
    public get byInvisibleFurniManager(): boolean
    {
        return this._byInvisibleFurniManager;
    }
}
