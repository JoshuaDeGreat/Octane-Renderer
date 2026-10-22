import { IMessageDataWrapper } from '@octane/api';

/**
 * Official `NftWardrobeItem` (package_208): one avatar collectible of the avatar editor's NFT tab. `id` is what
 * the editor sends back to wear it, `tokenId` what the worn outfit (350) names, `contractKey` its collection
 * (`habbo:avatar`, `habbo:clothes`, `habbo:avatar_genesis`).
 */
export class NftWardrobeItemData
{
    public static readonly CONTRACT_AVATAR = 'habbo:avatar';
    public static readonly CONTRACT_CLOTHES = 'habbo:clothes';
    public static readonly CONTRACT_GENESIS = 'habbo:avatar_genesis';

    private _id: string;
    private _figureString: string;
    private _gender: string;
    private _tokenId: string;
    private _contractKey: string;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._id = wrapper.readString();
        this._figureString = wrapper.readString();
        this._gender = wrapper.readString();
        this._tokenId = wrapper.readString();
        this._contractKey = wrapper.readString();
    }

    public get id(): string
    {
        return this._id;
    }

    public get figureString(): string
    {
        return this._figureString;
    }

    public get gender(): string
    {
        return this._gender;
    }

    public get tokenId(): string
    {
        return this._tokenId;
    }

    public get contractKey(): string
    {
        return this._contractKey;
    }
}
