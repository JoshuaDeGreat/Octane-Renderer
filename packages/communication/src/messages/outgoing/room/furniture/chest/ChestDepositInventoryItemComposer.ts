import { IMessageComposer } from '@octane/api';

/** Deposit one inventory item after starting the Polaris chest deposit session. Polaris wire: [chestItemId, inventoryItemId]. */
export class ChestDepositInventoryItemComposer implements IMessageComposer<ConstructorParameters<typeof ChestDepositInventoryItemComposer>>
{
    private _data: ConstructorParameters<typeof ChestDepositInventoryItemComposer>;

    constructor(chestItemId: number, inventoryItemId: number)
    {
        this._data = [chestItemId, inventoryItemId];
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
