import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** Official bonus (1048) and reward (501) claim results: `collectionId, wallet, success`. */
export class CollectionClaimResultParser implements IMessageParser
{
    private _collectionId: string = '';
    private _wallet: string = '';
    private _success: boolean = false;

    public flush(): boolean
    {
        this._collectionId = '';
        this._wallet = '';
        this._success = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._collectionId = wrapper.readString();
        this._wallet = wrapper.readString();
        this._success = wrapper.readBoolean();

        return true;
    }

    public get collectionId(): string
    {
        return this._collectionId;
    }

    public get wallet(): string
    {
        return this._wallet;
    }

    public get success(): boolean
    {
        return this._success;
    }
}
