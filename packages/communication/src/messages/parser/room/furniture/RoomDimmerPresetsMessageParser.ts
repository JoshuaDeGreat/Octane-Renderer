import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { RoomDimmerPresetsMessageData } from './RoomDimmerPresetsMessageData';

/**
 * The dimmer presets (AIR `?_-J2Y?/?_-DL?`): preset count, selected preset, the presets, then whether the dimmer
 * is on and its item id. The tail is read only when the server sent it.
 */
export class RoomDimmerPresetsMessageParser implements IMessageParser
{
    private _selectedPresetId: number;
    private _presets: RoomDimmerPresetsMessageData[];
    private _isOn: boolean;
    private _itemId: number;

    constructor()
    {
        this._selectedPresetId = 0;
        this._presets = [];
        this._isOn = false;
        this._itemId = 0;
    }

    public flush(): boolean
    {
        this._presets = [];
        this._isOn = false;
        this._itemId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const totalPresets = wrapper.readInt();

        this._selectedPresetId = wrapper.readInt();

        for(let i = 0; i < totalPresets; i++)
        {
            const presetId = wrapper.readInt();
            const type = wrapper.readInt();
            const color = parseInt(wrapper.readString().substr(1), 16);
            const brightness = wrapper.readInt();

            this._presets.push(new RoomDimmerPresetsMessageData(presetId, type, color, brightness));
        }

        if(!wrapper.bytesAvailable) return true;

        this._isOn = wrapper.readBoolean();
        this._itemId = wrapper.readInt();

        return true;
    }

    public getPreset(id: number): RoomDimmerPresetsMessageData
    {
        if((id < 0) || (id >= this.presetCount)) return null;

        return this._presets[id];
    }

    public get presetCount(): number
    {
        return this._presets.length;
    }

    public get selectedPresetId(): number
    {
        return this._selectedPresetId;
    }

    public get isOn(): boolean
    {
        return this._isOn;
    }

    public get itemId(): number
    {
        return this._itemId;
    }
}
