import { IMessageComposer } from '@octane/api';

/** Official mint (3779): turns a furni of the inventory into its relic. */
export class MintCollectibleComposer implements IMessageComposer<ConstructorParameters<typeof MintCollectibleComposer>>
{
    private _data: ConstructorParameters<typeof MintCollectibleComposer>;

    constructor(itemId: number, wallet: string)
    {
        this._data = [itemId, wallet];
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
