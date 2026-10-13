import { IMessageComposer } from '@octane/api';

/** Asks for the mentions older than the given id, the oldest one the client holds. */
export class RequestMentionsPageComposer implements IMessageComposer<ConstructorParameters<typeof RequestMentionsPageComposer>>
{
    private _data: ConstructorParameters<typeof RequestMentionsPageComposer>;

    constructor(beforeId: number)
    {
        this._data = [beforeId];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
