import { IMessageComposer } from '@octane/api';

/** Completion reward claim of a set (official 2209, taken here: 9420). */
export class ClaimCollectionRewardComposer implements IMessageComposer<ConstructorParameters<typeof ClaimCollectionRewardComposer>>
{
    private _data: ConstructorParameters<typeof ClaimCollectionRewardComposer>;

    constructor(collectionId: string, wallet: string)
    {
        this._data = [collectionId, wallet];
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
