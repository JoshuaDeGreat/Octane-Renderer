import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * Official `class_4190` (350): the token of the avatar collectible the user wears, and the look it replaced
 * (figure and gender), which the editor shows on every tab but the NFT one.
 */
export class SelectedNftWardrobeOutfitParser implements IMessageParser
{
    private _tokenId: string = '';
    private _fallbackFigure: string = '';
    private _fallbackGender: string = '';

    public flush(): boolean
    {
        this._tokenId = '';
        this._fallbackFigure = '';
        this._fallbackGender = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._tokenId = wrapper.readString();
        this._fallbackFigure = wrapper.readString();
        this._fallbackGender = wrapper.readString();

        return true;
    }

    public get tokenId(): string
    {
        return this._tokenId;
    }

    public get fallbackFigure(): string
    {
        return this._fallbackFigure;
    }

    public get fallbackGender(): string
    {
        return this._fallbackGender;
    }
}
