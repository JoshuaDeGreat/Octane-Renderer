import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * A chest's preferences were saved: int chestId, bool isNotificationPreferences.
 * AIR WIN63-202610131318 (package_112/class_2436). Sent only on success; the client closes the matching
 * frame (the settings frame when false, the notification settings frame when true).
 */
export class ChestSettingsUpdatedMessageParser implements IMessageParser
{
    private _chestId: number = 0;
    private _isNotificationPreferences: boolean = false;

    public flush(): boolean
    {
        this._chestId = 0;
        this._isNotificationPreferences = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._chestId = wrapper.readInt();
        this._isNotificationPreferences = wrapper.readBoolean();

        return true;
    }

    public get chestId(): number
    {
        return this._chestId;
    }

    public get isNotificationPreferences(): boolean
    {
        return this._isNotificationPreferences;
    }
}
