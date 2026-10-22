import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { NftWardrobeItemData } from './NftWardrobeItemData';

/** Official `class_4131` (2236): the user's avatar collectibles; every list replaces the previous one. */
export class UserNftWardrobeParser implements IMessageParser
{
    private _nftAvatars: NftWardrobeItemData[] = [];

    public flush(): boolean
    {
        this._nftAvatars = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._nftAvatars.push(new NftWardrobeItemData(wrapper));

            count--;
        }

        return true;
    }

    public get nftAvatars(): NftWardrobeItemData[]
    {
        return this._nftAvatars;
    }
}
