import { IMessageComposer } from '@octane/api';

/** Official wallet selection (3361): asks the collector XP and level of the wallet. */
export class SelectCollectibleWalletComposer implements IMessageComposer<ConstructorParameters<typeof SelectCollectibleWalletComposer>>
{
    private _data: ConstructorParameters<typeof SelectCollectibleWalletComposer>;

    constructor(wallet: string)
    {
        this._data = [wallet];
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
