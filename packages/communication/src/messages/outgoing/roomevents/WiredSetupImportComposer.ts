import { IMessageComposer } from '@octane/api';

/**
 * Previews (`confirm` false) or applies a wired setup share code. `anchorMode` 0 keeps the exported
 * tiles, 1 puts the setup's lowest corner on the importer's tile.
 */
export class WiredSetupImportComposer implements IMessageComposer<ConstructorParameters<typeof WiredSetupImportComposer>>
{
    private _data: ConstructorParameters<typeof WiredSetupImportComposer>;

    constructor(code: string, anchorMode: number, placeFromInventory: boolean, confirm: boolean)
    {
        this._data = [ code, anchorMode, placeFromInventory, confirm ];
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
