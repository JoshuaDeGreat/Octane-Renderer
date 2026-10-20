import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * Official `class_2992` (`ItemRemoveMultiple`, 2204): `int count [ int itemId ]
 * int pickerId bool byInvisibleFurniManager`, the wall-item twin of `ObjectRemoveMultiple`.
 */
export class ItemRemoveMultipleParser implements IMessageParser
{
    private _itemIds: number[];
    private _pickerId: number;
    private _byInvisibleFurniManager: boolean;

    public flush(): boolean
    {
        this._itemIds = [];
        this._pickerId = 0;
        this._byInvisibleFurniManager = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._itemIds = [];

        let totalItems = wrapper.readInt();

        while(totalItems > 0)
        {
            this._itemIds.push(wrapper.readInt());

            totalItems--;
        }

        this._pickerId = wrapper.readInt();
        // Read when it is there, so a server that predates the flag still parses.
        this._byInvisibleFurniManager = wrapper.bytesAvailable ? wrapper.readBoolean() : false;

        return true;
    }

    public get itemIds(): number[]
    {
        return this._itemIds;
    }

    public get pickerId(): number
    {
        return this._pickerId;
    }

    /** AIR's trailing flag: the furni left because the invisible furni manager (an area hider) hid it, not for good. */
    public get byInvisibleFurniManager(): boolean
    {
        return this._byInvisibleFurniManager;
    }
}
