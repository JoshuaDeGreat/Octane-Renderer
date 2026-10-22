import { IMessageComposer } from '@octane/api';

/** Polaris ChestSaveSettingsEvent: [chestId, name, description, accessOpen, accessDonate, appearanceState, previewMode, previewAmount]. */
export class ChestSaveSettingsComposer implements IMessageComposer<ConstructorParameters<typeof ChestSaveSettingsComposer>>
{
    private _data: ConstructorParameters<typeof ChestSaveSettingsComposer>;

    constructor(chestId: number, name: string, description: string, accessOpen: boolean, accessDonate: boolean, appearanceState: number, previewMode: number, previewAmount: number)
    {
        this._data = [chestId, name, description, accessOpen, accessDonate, appearanceState, previewMode, previewAmount];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
