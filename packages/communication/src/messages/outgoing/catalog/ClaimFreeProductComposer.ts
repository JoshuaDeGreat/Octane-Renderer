import { IMessageComposer } from '@octane/api';

/**
 * Official free claim (3935, `claimId`), sent by the special items display once every item of
 * the showcase has been viewed and the claim button is pressed.
 */
export class ClaimFreeProductComposer implements IMessageComposer<ConstructorParameters<typeof ClaimFreeProductComposer>>
{
    private _data: ConstructorParameters<typeof ClaimFreeProductComposer>;

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
