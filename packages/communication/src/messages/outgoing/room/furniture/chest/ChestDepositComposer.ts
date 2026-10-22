import { IMessageComposer } from '@octane/api';

/** Deposit currency into a Polaris wired chest. Polaris wire: [chestItemId, currencyType, amount]. */
export class ChestDepositComposer implements IMessageComposer<ConstructorParameters<typeof ChestDepositComposer>>
{
    private _data: ConstructorParameters<typeof ChestDepositComposer>;

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
