import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class FurnitureWallRemoveParser implements IMessageParser
{
    private _itemId: number;
    private _userId: number;
    private _byInvisibleFurniManager: boolean;

    public flush(): boolean
    {
        this._itemId = 0;
        this._userId = 0;
        this._byInvisibleFurniManager = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._itemId = parseInt(wrapper.readString());
        this._userId = wrapper.readInt();
        // Read when it is there, so a server that predates the flag still parses.
        this._byInvisibleFurniManager = wrapper.bytesAvailable ? wrapper.readBoolean() : false;

        return true;
    }

    public get itemId(): number
    {
        return this._itemId;
    }

    public get userId(): number
    {
        return this._userId;
    }

    /** AIR's trailing flag: the furni left because the invisible furni manager (an area hider) hid it, not for good. */
    public get byInvisibleFurniManager(): boolean
    {
        return this._byInvisibleFurniManager;
    }
}
