import { IMessageComposer } from '@octane/api';

/** Ignores a user by id (AIR `?_-02R?/?_-Z2I?`, sent from IgnoredUsersManager.ignoreUser). */
export class IgnoreUserComposer implements IMessageComposer<ConstructorParameters<typeof IgnoreUserComposer>>
{
    private _data: ConstructorParameters<typeof IgnoreUserComposer>;

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
