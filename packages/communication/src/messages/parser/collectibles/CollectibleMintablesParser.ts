import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CollectibleMintableData } from './CollectibleListData';

/** Official relic list: furni that can be turned into collectibles. */
export class CollectibleMintablesParser implements IMessageParser
{
    private _mintables: CollectibleMintableData[] = [];

    public flush(): boolean
    {
        this._mintables = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._mintables.push(CollectibleMintableData.parse(wrapper));

            count--;
        }

        return true;
    }

    public get mintables(): CollectibleMintableData[]
    {
        return this._mintables;
    }
}
