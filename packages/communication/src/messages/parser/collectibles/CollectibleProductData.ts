import { IMessageDataWrapper } from '@octane/api';

/**
 * Official `class_2508`: the product info of a collectible. `productTypeId` is `class_3169`
 * (0 wall item, 1 floor item, 2 effect, 4 badge, 9 chat style, 10 pet, 11 clothing); `itemTypeId` is
 * the furni type id, effect id, badge code, chat style id or pet type. `class_4366` adds the amount
 * owned after the score.
 */
export class CollectibleProductData
{
    public static TYPE_WALL = 0;
    public static TYPE_FLOOR = 1;
    public static TYPE_EFFECT = 2;
    public static TYPE_BADGE = 4;
    public static TYPE_CHAT_STYLE = 9;
    public static TYPE_PET = 10;
    public static TYPE_CLOTHING = 11;

    public productTypeId: number = -1;
    public itemTypeId: string = '';
    public score: number = 0;
    public amount: number = 0;
    public petFigure: string = '';
    public figureSetIds: number[] = [];
    public productCode: string = '';
    public rarity: string = '';

    /** Two big-endian ints, the official `readLong`. */
    public static readLong(wrapper: IMessageDataWrapper): number
    {
        const high = wrapper.readInt();
        const low = wrapper.readInt();

        return (high * 0x100000000) + (low >>> 0);
    }

    public static parse(wrapper: IMessageDataWrapper, withAmount: boolean = false): CollectibleProductData
    {
        const data = new CollectibleProductData();

        data.productTypeId = wrapper.readShort();
        data.itemTypeId = wrapper.readString();
        data.score = wrapper.readInt();
        if(withAmount) data.amount = wrapper.readInt();
        data.petFigure = wrapper.readString();

        let count = wrapper.readInt();

        while(count > 0)
        {
            data.figureSetIds.push(wrapper.readInt());

            count--;
        }

        data.productCode = wrapper.readString();
        data.rarity = wrapper.readString();

        return data;
    }
}
