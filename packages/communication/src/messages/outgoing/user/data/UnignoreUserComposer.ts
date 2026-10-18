import { IMessageComposer } from '@octane/api';

/** Stops ignoring a user by id (AIR `?_-02R?/?_-gt?`). */
export class UnignoreUserComposer implements IMessageComposer<ConstructorParameters<typeof UnignoreUserComposer>>
{
    private _data: ConstructorParameters<typeof UnignoreUserComposer>;

    constructor(userId: number)
    {
        this._data = [userId];
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
