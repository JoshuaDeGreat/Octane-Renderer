import { IMessageComposer } from '@octane/api';

export class GetMarketplaceItemStatsComposer implements IMessageComposer<ConstructorParameters<typeof GetMarketplaceItemStatsComposer>>
{
    private _data: ConstructorParameters<typeof GetMarketplaceItemStatsComposer>;

    /** `category` is 1 for a floor item, 2 for a wall item, 3 for a unique (LTD) one; `itemId` is the sprite id. */
    constructor(category: number, itemId: number)
    {
        this._data = [category, itemId];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        this._data = null;
    }
}
