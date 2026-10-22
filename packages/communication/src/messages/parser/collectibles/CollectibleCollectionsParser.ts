import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CollectibleCollectionData } from './CollectibleCollectionData';

/** Official collections list: one `class_4341` per set. */
export class CollectibleCollectionsParser implements IMessageParser
{
    private _collections: CollectibleCollectionData[] = [];

    public flush(): boolean
    {
        this._collections = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._collections.push(CollectibleCollectionData.parse(wrapper));

            count--;
        }

        return true;
    }

    public get collections(): CollectibleCollectionData[]
    {
        return this._collections;
    }
}
