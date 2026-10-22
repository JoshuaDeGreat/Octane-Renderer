import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CollectibleInventoryItemData } from './CollectibleListData';

/** Official collectibles inventory change (1475): the collectibles added, then the ones removed. */
export class CollectiblesInventoryUpdateParser implements IMessageParser
{
    private _added: CollectibleInventoryItemData[] = [];
    private _removed: CollectibleInventoryItemData[] = [];

    public flush(): boolean
    {
        this._added = [];
        this._removed = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._added.push(CollectibleInventoryItemData.parse(wrapper));

            count--;
        }

        count = wrapper.readInt();

        while(count > 0)
        {
            this._removed.push(CollectibleInventoryItemData.parse(wrapper));

            count--;
        }

        return true;
    }

    public get added(): CollectibleInventoryItemData[]
    {
        return this._added;
    }

    public get removed(): CollectibleInventoryItemData[]
    {
        return this._removed;
    }
}
