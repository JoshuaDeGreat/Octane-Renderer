import { IMessageComposer } from '@octane/api';

/** Permanently enable wired behavior for an owned Polaris chest. Polaris wire: [chestItemId]. */
export class ChestEnableWiredComposer implements IMessageComposer<ConstructorParameters<typeof ChestEnableWiredComposer>>
{
    private _data: ConstructorParameters<typeof ChestEnableWiredComposer>;

    constructor(chestItemId: number)
    {
        this._data = [chestItemId];
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
