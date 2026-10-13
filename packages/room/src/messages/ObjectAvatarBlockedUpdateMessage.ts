import { ObjectStateUpdateMessage } from './ObjectStateUpdateMessage';

export class ObjectAvatarBlockedUpdateMessage extends ObjectStateUpdateMessage
{
    private _isBlocked: boolean;

    constructor(isBlocked: boolean = false)
    {
        super();

        this._isBlocked = isBlocked;
    }

    public get isBlocked(): boolean
    {
        return this._isBlocked;
    }
}
