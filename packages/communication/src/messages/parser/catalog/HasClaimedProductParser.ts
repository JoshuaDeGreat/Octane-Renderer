import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * Official `class_2841` (266): `(claimId, hasClaimed)`, the answer to the special items
 * display's has-claimed request.
 */
export class HasClaimedProductParser implements IMessageParser
{
    private _claimId: string;
    private _claimed: boolean;

    public flush(): boolean
    {
        this._claimId = null;
        this._claimed = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._claimId = wrapper.readString();
        this._claimed = wrapper.readBoolean();

        return true;
    }

    public get claimId(): string
    {
        return this._claimId;
    }

    public get claimed(): boolean
    {
        return this._claimed;
    }
}
