import { IMessageComposer } from '@octane/api';

/** Official collectible purchase (1542) of a product of type `n`, paid in emeralds. */
export class PurchaseCollectibleComposer implements IMessageComposer<ConstructorParameters<typeof PurchaseCollectibleComposer>>
{
    private _data: ConstructorParameters<typeof PurchaseCollectibleComposer>;

    constructor(productCode: string, wallet: string)
    {
        this._data = [productCode, wallet];
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
