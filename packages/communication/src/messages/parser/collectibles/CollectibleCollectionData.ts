import { IMessageDataWrapper } from '@octane/api';
import { CollectibleProductData } from './CollectibleProductData';

/** Official `CollectibleItemClaim`: a bonus or reward claim of a set. Status 0 means it can be claimed. */
export class CollectibleItemClaimData
{
    public static STATUS_AVAILABLE = 0;
    public static STATUS_LOCKED = 1;

    public claimId: string = '';
    public claimedAmount: number = 0;
    public claimLimit: number = 0;
    public status: number = CollectibleItemClaimData.STATUS_LOCKED;

    public static parse(wrapper: IMessageDataWrapper): CollectibleItemClaimData
    {
        const data = new CollectibleItemClaimData();

        data.claimId = wrapper.readString();
        data.claimedAmount = wrapper.readInt();
        data.claimLimit = wrapper.readInt();
        data.status = wrapper.readShort();

        return data;
    }
}

/**
 * Official `class_4341`: one set of the collections tab. The bonus is the time-limited item of a
 * complete set (window in milliseconds, -1 none), the reward the item for completing it.
 */
export class CollectibleCollectionData
{
    public items: CollectibleProductData[] = [];
    public collectionId: string = '';
    public collectionName: string = '';
    public score: number = 0;
    public goal: number = 0;
    public completionXp: number = 0;
    public bonusItem: CollectibleProductData = null;
    public rewardItem: CollectibleProductData = null;
    public bonusStart: number = -1;
    public bonusEnd: number = -1;
    public status: number = 0;
    public bonusClaim: CollectibleItemClaimData = null;
    public rewardClaim: CollectibleItemClaimData = null;

    public static parse(wrapper: IMessageDataWrapper): CollectibleCollectionData
    {
        const data = new CollectibleCollectionData();

        let count = wrapper.readInt();

        while(count > 0)
        {
            data.items.push(CollectibleProductData.parse(wrapper, true));

            count--;
        }

        data.collectionId = wrapper.readString();
        data.collectionName = wrapper.readString();
        data.score = wrapper.readInt();
        data.goal = wrapper.readInt();
        data.completionXp = wrapper.readInt();

        const hasBonus = wrapper.readBoolean();

        if(hasBonus) data.bonusItem = CollectibleProductData.parse(wrapper, true);

        const hasReward = wrapper.readBoolean();

        if(hasReward) data.rewardItem = CollectibleProductData.parse(wrapper, true);

        data.bonusStart = CollectibleProductData.readLong(wrapper);
        data.bonusEnd = CollectibleProductData.readLong(wrapper);
        data.status = wrapper.readShort();

        if(hasBonus) data.bonusClaim = CollectibleItemClaimData.parse(wrapper);
        if(hasReward) data.rewardClaim = CollectibleItemClaimData.parse(wrapper);

        return data;
    }

    /** Products of the set the user owns at least once. */
    public get ownedCount(): number
    {
        return this.items.filter(item => item.amount > 0).length;
    }

    public get progressPercentage(): number
    {
        return this.items.length ? ((this.ownedCount * 100) / this.items.length) : 0;
    }
}
