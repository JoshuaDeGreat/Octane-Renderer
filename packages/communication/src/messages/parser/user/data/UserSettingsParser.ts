import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class UserSettingsParser implements IMessageParser
{
    private _volumeSystem: number;
    private _volumeFurni: number;
    private _volumeTrax: number;
    private _volumeSoundboard: number;
    private _oldChat: boolean;
    private _roomInvites: boolean;
    private _cameraFollow: boolean;
    private _flags: number;
    private _chatType: number;
    private _onlineStatusVisible: boolean;
    private _friendsCanFollow: boolean;
    private _friendRequestsAllowed: boolean;
    private _wiredWhisperDisabled: boolean;
    private _chatMode: number;
    private _chatBubbleWidth: number;
    private _chatScrollSpeed: number;
    private _onlineIndicatorPreference: number;
    private _profileVisible: boolean;
    private _wiredMenuPreferences: string;

    public flush(): boolean
    {
        this._volumeSystem = 0;
        this._volumeFurni = 0;
        this._volumeTrax = 0;
        this._volumeSoundboard = 80;
        this._oldChat = false;
        this._roomInvites = false;
        this._cameraFollow = false;
        this._flags = 0;
        this._chatType = 0;
        this._onlineStatusVisible = true;
        this._friendsCanFollow = true;
        this._friendRequestsAllowed = true;
        this._wiredWhisperDisabled = false;
        this._chatMode = 0;
        this._chatBubbleWidth = 1;
        this._chatScrollSpeed = 1;
        this._onlineIndicatorPreference = 0;
        this._profileVisible = true;
        this._wiredMenuPreferences = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._volumeSystem = wrapper.readInt();
        this._volumeFurni = wrapper.readInt();
        this._volumeTrax = wrapper.readInt();
        this._oldChat = wrapper.readBoolean();
        this._roomInvites = wrapper.readBoolean();
        this._cameraFollow = wrapper.readBoolean();
        this._flags = wrapper.readInt();
        this._chatType = wrapper.readInt();
        this._onlineStatusVisible = wrapper.readBoolean();
        this._friendsCanFollow = wrapper.readBoolean();
        this._friendRequestsAllowed = wrapper.readBoolean();
        this._volumeSoundboard = wrapper.bytesAvailable ? wrapper.readInt() : 80;
        // Trailing per-user preferences (official UserSettings 3574 layout, each optional so an older
        // emulator that stops at the soundboard volume keeps the official defaults).
        this._wiredWhisperDisabled = wrapper.bytesAvailable ? wrapper.readBoolean() : false;
        this._chatMode = wrapper.bytesAvailable ? wrapper.readInt() : 0;
        this._chatBubbleWidth = wrapper.bytesAvailable ? wrapper.readInt() : 1;
        this._chatScrollSpeed = wrapper.bytesAvailable ? wrapper.readInt() : 1;
        this._onlineIndicatorPreference = wrapper.bytesAvailable ? wrapper.readInt() : 0;
        // Whether other users see the full extended profile; visible when the server does not say.
        this._profileVisible = wrapper.bytesAvailable ? wrapper.readBoolean() : true;
        // The wired menu preferences the server stored ("menu,inspect,playtest,showAll,style"), or ''.
        this._wiredMenuPreferences = wrapper.bytesAvailable ? wrapper.readString() : '';

        return true;
    }

    public get volumeSystem(): number
    {
        return this._volumeSystem;
    }

    public get volumeFurni(): number
    {
        return this._volumeFurni;
    }

    public get volumeTrax(): number
    {
        return this._volumeTrax;
    }

    public get volumeSoundboard(): number
    {
        return this._volumeSoundboard;
    }

    public get oldChat(): boolean
    {
        return this._oldChat;
    }

    public get roomInvites(): boolean
    {
        return this._roomInvites;
    }

    public get cameraFollow(): boolean
    {
        return this._cameraFollow;
    }

    public get flags(): number
    {
        return this._flags;
    }

    public get chatType(): number
    {
        return this._chatType;
    }

    public get onlineStatusVisible(): boolean
    {
        return this._onlineStatusVisible;
    }

    public get friendsCanFollow(): boolean
    {
        return this._friendsCanFollow;
    }

    public get friendRequestsAllowed(): boolean
    {
        return this._friendRequestsAllowed;
    }

    public get wiredWhisperDisabled(): boolean
    {
        return this._wiredWhisperDisabled;
    }

    public get chatMode(): number
    {
        return this._chatMode;
    }

    public get chatBubbleWidth(): number
    {
        return this._chatBubbleWidth;
    }

    public get chatScrollSpeed(): number
    {
        return this._chatScrollSpeed;
    }

    public get onlineIndicatorPreference(): number
    {
        return this._onlineIndicatorPreference;
    }

    public get profileVisible(): boolean
    {
        return this._profileVisible;
    }

    public get wiredMenuPreferences(): string
    {
        return this._wiredMenuPreferences;
    }
}
