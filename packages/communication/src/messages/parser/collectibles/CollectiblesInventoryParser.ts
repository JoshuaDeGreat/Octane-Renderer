import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CollectibleInventoryItemData } from './CollectibleListData';

/** Official collectibles inventory (2539). */
export class CollectiblesInventoryParser implements IMessageParser
{
    private _items: CollectibleInventoryItemData[] = [];

    public flush(): boolean
    {
        this._items = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._items.push(CollectibleInventoryItemData.parse(wrapper));

            count--;
        }

        return true;
    }

    public get items(): CollectibleInventoryItemData[]
    {
        return this._items;
    }
}
