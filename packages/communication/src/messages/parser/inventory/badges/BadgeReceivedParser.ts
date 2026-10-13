import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class BadgeReceivedParser implements IMessageParser
{
    private _badgeId: number;
    private _badgeCode: string;
    private _senderName: string;
    private _ownerCount: number;
    private _rarityTier: number;

    public flush(): boolean
    {
        this._badgeId = 0;
        this._badgeCode = null;
        this._senderName = '';
        this._ownerCount = 0;
        this._rarityTier = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._badgeId = wrapper.readInt();
        this._badgeCode = wrapper.readString();
        this._senderName = wrapper.bytesAvailable ? wrapper.readString() : '';
        this._ownerCount = wrapper.bytesAvailable ? wrapper.readInt() : 0;
        this._rarityTier = wrapper.bytesAvailable ? wrapper.readInt() : 0;

        return true;
    }

    public get badgeId(): number
    {
        return this._badgeId;
    }

    public get badgeCode(): string
    {
        return this._badgeCode;
    }

    public get senderName(): string
    {
        return this._senderName;
    }

    public get ownerCount(): number
    {
        return this._ownerCount;
    }

    public get rarityTier(): number
    {
        return this._rarityTier;
    }
}