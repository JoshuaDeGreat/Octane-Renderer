import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { CollectibleRewardClaimData } from './CollectibleListData';

/** Official reward claims of the rewards tab (3865). */
export class CollectibleRewardClaimsParser implements IMessageParser
{
    private _claims: CollectibleRewardClaimData[] = [];

    public flush(): boolean
    {
        this._claims = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._claims.push(CollectibleRewardClaimData.parse(wrapper));

            count--;
        }

        return true;
    }

    public get claims(): CollectibleRewardClaimData[]
    {
        return this._claims;
    }
}
