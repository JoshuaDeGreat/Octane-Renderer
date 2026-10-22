import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * AIR FriendNotificationMessageParser (FriendToolbarNotification, 3082): the friend's avatar id as a string,
 * the type code (AIR FriendNotification: -1 messenger, 0 room event, 1 achievement, 2 quest,
 * 3 playing a game, 4 finished a game) and the message (event title, badge code, quest key or game name).
 */
export class FriendNotificationParser implements IMessageParser
{
    private _typeCode: number;
    private _avatarId: number;
    private _message: string;

    public flush(): boolean
    {
        this._typeCode = -1;
        this._avatarId = 0;
        this._message = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._avatarId = Number.parseInt(wrapper.readString(), 10) || 0;
        this._typeCode = wrapper.readInt();
        this._message = wrapper.readString();

        return true;
    }

    public get typeCode(): number
    {
        return this._typeCode;
    }

    public get avatarId(): number
    {
        return this._avatarId;
    }

    public get message(): string
    {
        return this._message;
    }
}
