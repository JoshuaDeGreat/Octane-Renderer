import { IMessageComposer } from '@octane/api';

/**
 * AIR UnkMessageComposer_9args_0904d6 (2170), RaidProtectionSettingsController.sendSave. The last
 * value says the owner confirmed switching protection on.
 */
export class SaveRaidProtectionSettingsComposer implements IMessageComposer<ConstructorParameters<typeof SaveRaidProtectionSettingsComposer>>
{
    private _data: ConstructorParameters<typeof SaveRaidProtectionSettingsComposer>;

    constructor(roomId: number, enabled: boolean, sensitivity: number, actionType: number, banDurationSeconds: number, guardEnabled: boolean, guardDurationSeconds: number, guardSensitivity: number, confirmed: boolean)
    {
        this._data = [roomId, enabled, sensitivity, actionType, banDurationSeconds, guardEnabled, guardDurationSeconds, guardSensitivity, confirmed];
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
