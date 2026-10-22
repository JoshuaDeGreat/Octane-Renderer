import { IMessageComposer } from '@octane/api';

/** Official wallets request (3702), sent when the collectibles hub opens. */
export class GetCollectibleWalletsComposer implements IMessageComposer<[]>
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
