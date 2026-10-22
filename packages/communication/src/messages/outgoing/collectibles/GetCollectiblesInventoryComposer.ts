import { IMessageComposer } from '@octane/api';

/** Official collectibles inventory request (1119). */
export class GetCollectiblesInventoryComposer implements IMessageComposer<[]>
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
