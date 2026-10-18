import { IMessageComposer } from '@octane/api';

/**
 * Withdraw everything from a chest, coins or furni: [chestId]. AIR WIN63-202610131318 (package_95/class_3881).
 */
export class ChestWithdrawAllComposer implements IMessageComposer<ConstructorParameters<typeof ChestWithdrawAllComposer>>
{
    private _data: ConstructorParameters<typeof ChestWithdrawAllComposer>;

    constructor(chestId: number)
    {
        this._data = [chestId];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
