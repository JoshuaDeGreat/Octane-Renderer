import { IMessageComposer } from '@octane/api';

/** Asks for the ignored user ids (AIR `?_-02R?/?_-Y2p?`, no fields). */
export class GetIgnoredUsersComposer implements IMessageComposer<[]>
{
    public getMessageArray(): []
    {
        return [];
    }

    public dispose(): void
    {
        return;
    }
}
