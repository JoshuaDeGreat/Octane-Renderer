import { IMessageComposer } from '@octane/api';

/** Withdraw currency from a Polaris wired chest; negative amount means all. Polaris wire: [chestItemId, currencyType, amount]. */
export class ChestWithdrawComposer implements IMessageComposer<ConstructorParameters<typeof ChestWithdrawComposer>>
{
    private _data: ConstructorParameters<typeof ChestWithdrawComposer>;

    constructor(chestItemId: number, currencyType: number, amount: number)
    {
        this._data = [chestItemId, currencyType, amount];
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
