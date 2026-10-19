import { IMessageComposer } from '@octane/api';

/** Variable Add-on Share "Synchronize" button (AIR 2144, ours 9495): pushes the box's shared add-ons out again. */
export class WiredAddonShareSynchronizeComposer implements IMessageComposer<ConstructorParameters<typeof WiredAddonShareSynchronizeComposer>>
{
    private _data: ConstructorParameters<typeof WiredAddonShareSynchronizeComposer>;

    constructor(wiredId: number)
    {
        this._data = [ wiredId ];
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
