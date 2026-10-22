import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CollectibleMintTokenOfferData } from './CollectibleListData';

/** Official stamp offers (745). */
export class CollectibleMintTokenOffersParser implements IMessageParser
{
    private _offers: CollectibleMintTokenOfferData[] = [];

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
            this._offers.push(CollectibleMintTokenOfferData.parse(wrapper));

            count--;
        }

        return true;
    }

    public get offers(): CollectibleMintTokenOfferData[]
    {
        return this._offers;
    }
}
