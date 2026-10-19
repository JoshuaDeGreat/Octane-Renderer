import { IMessageComposer } from '@octane/api';

/** AIR wired menu monitor room stats request (1957, no fields); the server answers with WiredRoomStatsEvent (1891). */
export class WiredRoomStatsRequestComposer implements IMessageComposer<[]>
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
