import { IMessageComposer } from '@octane/api';

/** Official claim all (3836) of the rewards tab; the official client sends two empty strings. */
export class ClaimCollectibleRewardsComposer implements IMessageComposer<ConstructorParameters<typeof ClaimCollectibleRewardsComposer>>
{
    private _data: ConstructorParameters<typeof ClaimCollectibleRewardsComposer>;

    constructor(first: string, second: string)
    {
        this._data = [first, second];
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
