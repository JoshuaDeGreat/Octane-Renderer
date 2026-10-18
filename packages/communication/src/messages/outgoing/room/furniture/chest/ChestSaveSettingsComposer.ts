import { IMessageComposer } from '@octane/api';

/**
 * Save a chest's preferences: [chestId, name, description, everyoneCanOpen, everyoneCanDonate, stateMode,
 * previewMode, previewAmount, wiredEnabled]. AIR WIN63-202610131318 (package_95/class_3094, ChestSettingsUI).
 * The Wired upgrade is this save with wiredEnabled = true; once upgraded every later save keeps sending true.
 */
export class ChestSaveSettingsComposer implements IMessageComposer<ConstructorParameters<typeof ChestSaveSettingsComposer>>
{
    private _data: ConstructorParameters<typeof ChestSaveSettingsComposer>;

    constructor(chestId: number, name: string, description: string, everyoneCanOpen: boolean, everyoneCanDonate: boolean, stateMode: number, previewMode: number, previewAmount: number, wiredEnabled: boolean)
    {
        this._data = [chestId, name, description, everyoneCanOpen, everyoneCanDonate, stateMode, previewMode, previewAmount, wiredEnabled];
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
