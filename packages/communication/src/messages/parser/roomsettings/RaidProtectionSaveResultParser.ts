import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { RaidProtectionSettingsSnapshot } from './RaidProtectionSettingsSnapshot';

/**
 * AIR package_230/class_4240 (958): the answer to a save. The room id, the result code, then the
 * settings in force (RaidProtectionSettingsSnapshot.readAfterRoomId).
 */
export class RaidProtectionSaveResultParser implements IMessageParser
{
    public static RESULT_SAVED: number = 0;
    public static RESULT_FEATURE_DISABLED: number = 1;
    public static RESULT_ROOM_UNAVAILABLE: number = 2;
    public static RESULT_NO_RIGHTS: number = 3;
    public static RESULT_INVALID: number = 4;
    public static RESULT_CONFIRMATION_REQUIRED: number = 5;
    public static RESULT_SAVE_FAILED: number = 6;

    private _roomId: number;
    private _resultCode: number;
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
        this._resultCode = 0;
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
        this._resultCode = wrapper.readInt();
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

    public get resultCode(): number
    {
        return this._resultCode;
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
