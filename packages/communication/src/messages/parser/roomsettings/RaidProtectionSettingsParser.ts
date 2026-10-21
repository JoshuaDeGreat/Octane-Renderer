import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { RaidProtectionSettingsSnapshot } from './RaidProtectionSettingsSnapshot';

/** AIR package_230/class_3943 (3877): RaidProtectionSettingsSnapshot.readFromMessage. */
export class RaidProtectionSettingsParser implements IMessageParser
{
    private _roomId: number;
    private _enabled: boolean;
    private _sensitivity: number;
    private _actionType: number;
    private _banDurationSeconds: number;
    private _guardEnabled: boolean;
    private _guardDurationSeconds: number;
    private _guardSensitivity: number;
    private _incidentActive: boolean;
    private _lastRaidAtEpochSeconds: number;

    public flush(): boolean
    {
        this._roomId = 0;
        this._enabled = false;
        this._sensitivity = 0;
        this._actionType = 0;
        this._banDurationSeconds = 0;
        this._guardEnabled = false;
        this._guardDurationSeconds = 0;
        this._guardSensitivity = 0;
        this._incidentActive = false;
        this._lastRaidAtEpochSeconds = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomId = wrapper.readInt();
        this._enabled = wrapper.readBoolean();
        this._sensitivity = wrapper.readInt();
        this._actionType = wrapper.readInt();
        this._banDurationSeconds = wrapper.readInt();
        this._guardEnabled = wrapper.readBoolean();
        this._guardDurationSeconds = wrapper.readInt();
        this._guardSensitivity = wrapper.readInt();
        this._incidentActive = wrapper.readBoolean();
        this._lastRaidAtEpochSeconds = wrapper.readInt();

        return true;
    }

    public get settings(): RaidProtectionSettingsSnapshot
    {
        return new RaidProtectionSettingsSnapshot(
            this._roomId,
            this._enabled,
            this._sensitivity,
            this._actionType,
            this._banDurationSeconds,
            this._guardEnabled,
            this._guardDurationSeconds,
            this._guardSensitivity,
            this._incidentActive,
            this._lastRaidAtEpochSeconds);
    }
}
