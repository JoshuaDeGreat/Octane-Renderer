import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * The coins in a coin chest: int chestId, int coins, bool isUpdate.
 * AIR WIN63-202610131318 (package_112/class_3799). isUpdate = false answers ChestOpen (1595) and opens the
 * coin chest window; isUpdate = true updates the amount of the chest that is already open.
 */
export class ChestCoinsMessageParser implements IMessageParser
{
    private _chestId: number = 0;
    private _coins: number = 0;
    private _isUpdate: boolean = false;

    public flush(): boolean
    {
        this._chestId = 0;
        this._coins = 0;
        this._isUpdate = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._chestId = wrapper.readInt();
        this._coins = wrapper.readInt();
        this._isUpdate = wrapper.readBoolean();

        return true;
    }

    public get chestId(): number
    {
        return this._chestId;
    }

    public get coins(): number
    {
        return this._coins;
    }

    public get isUpdate(): boolean
    {
        return this._isUpdate;
    }
}
