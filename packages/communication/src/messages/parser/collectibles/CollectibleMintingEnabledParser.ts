import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** Official minting status (3059). */
export class CollectibleMintingEnabledParser implements IMessageParser
{
    private _enabled: boolean = false;

    public flush(): boolean
    {
        this._enabled = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._enabled = wrapper.readBoolean();

        return true;
    }

    public get enabled(): boolean
    {
        return this._enabled;
    }
}
