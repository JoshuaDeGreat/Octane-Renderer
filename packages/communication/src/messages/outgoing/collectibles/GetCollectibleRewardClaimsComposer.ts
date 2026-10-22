import { IMessageComposer } from '@octane/api';

/** Official reward claims request (2902) of the rewards tab. */
export class GetCollectibleRewardClaimsComposer implements IMessageComposer<ConstructorParameters<typeof GetCollectibleRewardClaimsComposer>>
{
    private _data: ConstructorParameters<typeof GetCollectibleRewardClaimsComposer>;

    constructor(wallet: string)
    {
        this._data = [wallet];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
