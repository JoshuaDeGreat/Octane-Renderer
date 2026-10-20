import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * Official `class_2853` (`ObjectRemoveMultiple`, 1451): `int count [ int id ]
 * int pickerId bool byInvisibleFurniManager`. `class_1902.onObjectRemoveMultiple` disposes every floor
 * object and refreshes the tile object map once.
 */
export class ObjectRemoveMultipleParser implements IMessageParser
{
    private _ids: number[];
    private _pickerId: number;
    private _byInvisibleFurniManager: boolean;

    public flush(): boolean
    {
        this._ids = [];
        this._pickerId = 0;
        this._byInvisibleFurniManager = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._ids = [];

        let totalIds = wrapper.readInt();

        while(totalIds > 0)
        {
            this._ids.push(wrapper.readInt());

            totalIds--;
        }

        this._pickerId = wrapper.readInt();
        // Read when it is there, so a server that predates the flag still parses.
        this._byInvisibleFurniManager = wrapper.bytesAvailable ? wrapper.readBoolean() : false;

        return true;
    }

    public get ids(): number[]
    {
        return this._ids;
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
