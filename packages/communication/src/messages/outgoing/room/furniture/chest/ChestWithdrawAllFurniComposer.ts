import { IMessageComposer } from '@octane/api';

/** Withdraw all stored furniture from a Polaris chest. Polaris wire: [chestItemId]. */
export class ChestWithdrawAllFurniComposer implements IMessageComposer<ConstructorParameters<typeof ChestWithdrawAllFurniComposer>>
{
    private _data: ConstructorParameters<typeof ChestWithdrawAllFurniComposer>;

    constructor(chestItemId: number)
    {
        this._data = [chestItemId];
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
