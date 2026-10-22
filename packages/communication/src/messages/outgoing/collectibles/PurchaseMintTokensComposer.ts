import { IMessageComposer } from '@octane/api';

/** Official stamp purchase (189) of a `MINT_TOKEN` offer, paid in silver. */
export class PurchaseMintTokensComposer implements IMessageComposer<ConstructorParameters<typeof PurchaseMintTokensComposer>>
{
    private _data: ConstructorParameters<typeof PurchaseMintTokensComposer>;

    constructor(offerId: number, wallet: string)
    {
        this._data = [offerId, wallet];
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
