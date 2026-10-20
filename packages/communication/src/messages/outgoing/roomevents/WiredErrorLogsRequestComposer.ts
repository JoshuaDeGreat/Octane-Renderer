import { IMessageComposer } from '@octane/api';

/** AIR wired menu monitor error list request (1132, no fields); the server answers with WiredErrorLogsEvent (15). */
export class WiredErrorLogsRequestComposer implements IMessageComposer<[]>
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
