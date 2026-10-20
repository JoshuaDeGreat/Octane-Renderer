import { IMessageComposer } from '@octane/api';

/** AIR wired menu monitor "Clear all" (1632, no fields); the server answers with the cleared WiredErrorLogsEvent (15). */
export class WiredErrorLogsClearComposer implements IMessageComposer<[]>
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
