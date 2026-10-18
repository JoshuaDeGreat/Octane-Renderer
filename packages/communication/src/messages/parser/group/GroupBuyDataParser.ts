import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { GroupDataBadgePart } from './utils';

/**
 * The group creator's data (AIR `?_-A1M?/?_-sq?`): the cost, the rooms a group can be made for, then the default
 * badge parts (`count × (key, colour, position)`, AIR `?_-F1V?`) the creator starts from. The parts are read only
 * when the server sent them.
 */
export class GroupBuyDataParser implements IMessageParser
{
    private _groupCost: number;
    private _availableRooms: Map<number, string>;
    private _badgeParts: GroupDataBadgePart[];

    flush(): boolean
    {
        this._groupCost = 0;
        this._availableRooms = new Map();
        this._badgeParts = [];

        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._groupCost = wrapper.readInt();
        let availableRoomsCount = wrapper.readInt();

        while(availableRoomsCount > 0)
        {
            const roomId = wrapper.readInt();
            const roomName = wrapper.readString();
            wrapper.readBoolean();

            this._availableRooms.set(roomId, roomName);

            availableRoomsCount--;
        }

        if(!wrapper.bytesAvailable) return true;

        let badgePartsCount = wrapper.readInt();

        while(badgePartsCount > 0)
        {
            const part = new GroupDataBadgePart(this._badgeParts.length === 0);

            part.key = wrapper.readInt();
            part.color = wrapper.readInt();
            part.position = wrapper.readInt();

            this._badgeParts.push(part);

            badgePartsCount--;
        }

        return true;
    }

    public get groupCost(): number
    {
        return this._groupCost;
    }

    public get availableRooms(): Map<number, string>
    {
        return this._availableRooms;
    }

    /** The default badge the creator opens on; the first part is the base. */
    public get badgeParts(): GroupDataBadgePart[]
    {
        return this._badgeParts;
    }
}
