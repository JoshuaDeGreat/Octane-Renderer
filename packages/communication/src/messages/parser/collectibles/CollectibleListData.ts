import { IMessageDataWrapper } from '@octane/api';
import { CollectibleProductData } from './CollectibleProductData';

/** An owned collectible: its asset id (official `readLong`) and product info. */
export class CollectibleInventoryItemData
{
    public assetId: number = 0;
    public product: CollectibleProductData = null;

    public static parse(wrapper: IMessageDataWrapper): CollectibleInventoryItemData
    {
        const data = new CollectibleInventoryItemData();

        data.assetId = CollectibleProductData.readLong(wrapper);
        data.product = CollectibleProductData.parse(wrapper);

        return data;
    }
}

/** A guild shop offer: price in emeralds, mint limit (-1 unlimited) and the serials minted so far. */
export class CollectibleShopOfferData
{
    public productCode: string = '';
    public emeraldPrice: number = 0;
    public isNew: boolean = false;
    public soldOut: boolean = false;
    public mintLimit: number = -1;
    public mintedCount: number = 0;
    public product: CollectibleProductData = null;

    public static parse(wrapper: IMessageDataWrapper): CollectibleShopOfferData
    {
        const data = new CollectibleShopOfferData();

        data.productCode = wrapper.readString();
        data.emeraldPrice = wrapper.readInt();
        data.isNew = wrapper.readBoolean();
        data.soldOut = wrapper.readBoolean();
        data.mintLimit = wrapper.readInt();
        data.mintedCount = wrapper.readInt();
        data.product = CollectibleProductData.parse(wrapper);

        return data;
    }

    public get canBuy(): boolean
    {
        return (this.mintLimit === -1) || (this.mintedCount < this.mintLimit);
    }
}

/** A reward of the rewards tab (official `UnkClass_e0a85e`), times in milliseconds. */
export class CollectibleRewardClaimData
{
    public claimId: string = '';
    public status: number = 0;
    public claimedAmount: number = 0;
    public claimLimit: number = 0;
    public validFrom: number = 0;
    public validTo: number = 0;
    public createdAt: number = 0;
    public updatedAt: number = 0;
    public collection: string = '';
    public productCode: string = '';
    public wallet: string = '';
    public product: CollectibleProductData = null;
    public setId: string = '';
    public setName: string = '';

    public static parse(wrapper: IMessageDataWrapper): CollectibleRewardClaimData
    {
        const data = new CollectibleRewardClaimData();

        data.claimId = wrapper.readString();
        data.status = wrapper.readInt();
        data.claimedAmount = wrapper.readInt();
        data.claimLimit = wrapper.readInt();
        data.validFrom = CollectibleProductData.readLong(wrapper);
        data.validTo = CollectibleProductData.readLong(wrapper);
        data.createdAt = CollectibleProductData.readLong(wrapper);
        data.updatedAt = CollectibleProductData.readLong(wrapper);
        data.collection = wrapper.readString();
        data.productCode = wrapper.readString();
        data.wallet = wrapper.readString();
        data.product = CollectibleProductData.parse(wrapper);
        data.setId = wrapper.readString();
        data.setName = wrapper.readString();

        return data;
    }
}

/** A relic (official `UnkClass_ca1162`): a furni that can be turned into a collectible for stamps. */
export class CollectibleMintableData
{
    public itemTypeId: number = 0;
    public startTime: number = 0;
    public endTime: number = 0;
    public regionLocked: boolean = false;
    public price: number = 0;
    public flag: boolean = false;
    /** 's' floor item, 'i' wall item. */
    public itemType: string = 's';

    public static parse(wrapper: IMessageDataWrapper): CollectibleMintableData
    {
        const data = new CollectibleMintableData();

        data.itemTypeId = wrapper.readInt();
        data.startTime = wrapper.readInt();
        data.endTime = wrapper.readInt();
        data.regionLocked = wrapper.readBoolean();
        data.price = wrapper.readInt();
        data.flag = wrapper.readBoolean();
        data.itemType = (wrapper.readShort() === 1) ? 'i' : 's';

        return data;
    }
}

/** A stamp pack (official `UnkClass_5563ae`). */
export class CollectibleMintTokenOfferData
{
    public offerId: number = 0;
    public productCode: string = '';
    public silverPrice: number = 0;
    public amount: number = 0;

    public static parse(wrapper: IMessageDataWrapper): CollectibleMintTokenOfferData
    {
        const data = new CollectibleMintTokenOfferData();

        data.offerId = wrapper.readInt();
        data.productCode = wrapper.readString();
        data.silverPrice = wrapper.readInt();
        data.amount = wrapper.readInt();

        return data;
    }
}
