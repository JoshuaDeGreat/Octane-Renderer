import { IMessageComposer } from '@octane/api';

/** Official `GetUserNftWardrobeMessageComposer` (3206): the avatar editor's NFT tab asks the user's avatar collectibles. */
export class GetUserNftWardrobeComposer implements IMessageComposer<[]>
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
