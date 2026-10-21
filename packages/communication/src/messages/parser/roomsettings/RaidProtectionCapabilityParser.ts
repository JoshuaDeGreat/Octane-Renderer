import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** AIR package_230/class_4062 (2671): whether the viewer may manage the room's raid protection. */
export class RaidProtectionCapabilityParser implements IMessageParser
{
    private _roomId: number;
    private _canManage: boolean;

    public flush(): boolean
    {
        this._roomId = 0;
        this._canManage = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomId = wrapper.readInt();
        this._canManage = wrapper.readBoolean();

        return true;
    }

    public get roomId(): number
    {
        return this._roomId;
    }

    public get canManage(): boolean
    {
        return this._canManage;
    }
}
