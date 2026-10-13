import { IMessageComposer } from '@octane/api';

/** Official furniture label settings save (AIR 2970): colour, who may see it and whether it stays open. */
export class WiredLabelSaveSettingsComposer implements IMessageComposer<ConstructorParameters<typeof WiredLabelSaveSettingsComposer>>
{
    private _data: ConstructorParameters<typeof WiredLabelSaveSettingsComposer>;

    constructor(furniId: number, color: number, visibility: number, alwaysOpen: boolean)
    {
        this._data = [ furniId, color, visibility, alwaysOpen ];
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
