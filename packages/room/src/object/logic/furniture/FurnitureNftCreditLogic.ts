import { IAssetData, RoomObjectVariable } from '@octane/api';
import { FurnitureCreditLogic } from './FurnitureCreditLogic';

/**
 * Official `FurnitureNftCreditLogic` (`furniture_nft_credit`): an emerald furni. Its value is the number
 * at the end of its type (`nft_emerald_50` holds 50 emeralds), 15000 for `nft_emerald_emerhand` and 2000
 * for `nft_emerald_eggmerald`; the credit furni widget redeems it for emeralds.
 */
export class FurnitureNftCreditLogic extends FurnitureCreditLogic
{
    public static EMERALD_HAND_TYPE = 'nft_emerald_emerhand';
    public static EMERALD_EGG_TYPE = 'nft_emerald_eggmerald';

    public static emeraldValue(type: string): number
    {
        if(!type) return 0;

        const match = type.match(/\d+$/);

        if(match) return parseInt(match[0], 10);
        if(type === FurnitureNftCreditLogic.EMERALD_HAND_TYPE) return 15000;
        if(type === FurnitureNftCreditLogic.EMERALD_EGG_TYPE) return 2000;

        return 0;
    }

    public initialize(asset: IAssetData): void
    {
        super.initialize(asset);

        if(!this.object) return;

        this.object.model.setValue(RoomObjectVariable.FURNITURE_CREDIT_VALUE, FurnitureNftCreditLogic.emeraldValue(this.object.type));
        this.object.model.setValue(RoomObjectVariable.FURNITURE_NFT_CREDIT, 'true');
    }
}
