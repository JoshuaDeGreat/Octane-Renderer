import { IMessageComposer } from '@octane/api';

/** Official transfer (1857): moves every collectible to the named user (an external wallet on habbo.com). */
export class TransferCollectiblesComposer implements IMessageComposer<ConstructorParameters<typeof TransferCollectiblesComposer>>
{
    private _data: ConstructorParameters<typeof TransferCollectiblesComposer>;

    constructor(recipient: string)
    {
        this._data = [recipient];
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
