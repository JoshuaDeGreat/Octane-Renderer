import { IMessageComposer } from '@octane/api';

/** AIR UnkMessageComposer_1args_94bac7 (2394): open the raid protection settings of the room. */
export class GetRaidProtectionSettingsComposer implements IMessageComposer<ConstructorParameters<typeof GetRaidProtectionSettingsComposer>>
{
    private _data: ConstructorParameters<typeof GetRaidProtectionSettingsComposer>;

    constructor(roomId: number)
    {
        this._data = [roomId];
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
