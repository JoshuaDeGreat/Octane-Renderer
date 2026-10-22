import { IMessageComposer } from '@octane/api';

/** Official bonus claim (149) of a complete set, inside its bonus window. */
export class ClaimCollectionBonusComposer implements IMessageComposer<ConstructorParameters<typeof ClaimCollectionBonusComposer>>
{
    private _data: ConstructorParameters<typeof ClaimCollectionBonusComposer>;

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
