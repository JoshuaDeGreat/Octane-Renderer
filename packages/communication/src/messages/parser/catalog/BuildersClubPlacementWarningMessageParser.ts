import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * The server asks to confirm a Builders Club placement that would hide the room. It echoes the
 * placement, so the client can resend it with confirmed set: type, page, offer and extra data, then
 * x, y and direction for floor furni or the wall location.
 */
export class BuildersClubPlacementWarningMessageParser implements IMessageParser
{
    public static TYPE_FLOOR: number = 0;
    public static TYPE_WALL: number = 1;

    private _typeCode: number;
    private _pageId: number;
    private _offerId: number;
    private _extraParam: string;
    private _x: number;
    private _y: number;
    private _direction: number;
    private _wallLocation: string;

    public flush(): boolean
    {
        this._typeCode = BuildersClubPlacementWarningMessageParser.TYPE_FLOOR;
        this._pageId = -1;
        this._offerId = -1;
        this._extraParam = '';
        this._x = 0;
        this._y = 0;
        this._direction = 0;
        this._wallLocation = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._typeCode = wrapper.readInt();
        this._pageId = wrapper.readInt();
        this._offerId = wrapper.readInt();
        this._extraParam = wrapper.readString();

        if(this._typeCode === BuildersClubPlacementWarningMessageParser.TYPE_FLOOR)
        {
            this._x = wrapper.readInt();
            this._y = wrapper.readInt();
            this._direction = wrapper.readInt();
        }
        else
        {
            this._wallLocation = wrapper.readString();
        }

        return true;
    }

    public get typeCode(): number
    {
        return this._typeCode;
    }

    public get pageId(): number
    {
        return this._pageId;
    }

    public get offerId(): number
    {
        return this._offerId;
    }

    public get extraParam(): string
    {
        return this._extraParam;
    }

    public get x(): number
    {
        return this._x;
    }

    public get y(): number
    {
        return this._y;
    }

    public get direction(): number
    {
        return this._direction;
    }

    public get wallLocation(): string
    {
        return this._wallLocation;
    }
}
