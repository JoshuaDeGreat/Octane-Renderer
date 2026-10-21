import { IMessageComposer } from '@octane/api';

/**
 * Official has-claimed request (395, `claimId`), sent by `SpecialItemsController.initialize`
 * when a special items display with a free claim opens. Answered by `HasClaimedProductEvent`.
 */
export class GetHasClaimedProductComposer implements IMessageComposer<ConstructorParameters<typeof GetHasClaimedProductComposer>>
{
    private _data: ConstructorParameters<typeof GetHasClaimedProductComposer>;

    constructor(claimId: string)
    {
        this._data = [claimId];
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
