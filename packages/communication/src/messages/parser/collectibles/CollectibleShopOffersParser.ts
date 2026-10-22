import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CollectibleShopOfferData } from './CollectibleListData';

/** Official guild shop offers (3495). */
export class CollectibleShopOffersParser implements IMessageParser
{
    private _offers: CollectibleShopOfferData[] = [];

    public flush(): boolean
    {
        this._offers = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._offers.push(CollectibleShopOfferData.parse(wrapper));

            count--;
        }

        return true;
    }

    public get offers(): CollectibleShopOfferData[]
    {
        return this._offers;
    }
}
