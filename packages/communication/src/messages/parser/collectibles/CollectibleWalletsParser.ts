import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * Official `class_4154` (400): the collector ("Stardust") wallet and the linked wallets. `wallets` starts
 * with the collector wallet, as in the official client.
 */
export class CollectibleWalletsParser implements IMessageParser
{
    private _collectorWallet: string = '';
    private _wallets: string[] = [];

    public flush(): boolean
    {
        this._collectorWallet = '';
        this._wallets = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._collectorWallet = wrapper.readString();

        if(this._collectorWallet !== '') this._wallets.push(this._collectorWallet);

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._wallets.push(wrapper.readString());

            count--;
        }

        return true;
    }

    public get collectorWallet(): string
    {
        return this._collectorWallet;
    }

    public get wallets(): string[]
    {
        return this._wallets;
    }
}
