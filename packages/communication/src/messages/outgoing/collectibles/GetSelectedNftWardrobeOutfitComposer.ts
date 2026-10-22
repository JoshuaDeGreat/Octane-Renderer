import { IMessageComposer } from '@octane/api';

/** Official worn avatar collectible request (3810): sent when the avatar editor opens and after it saves one. */
export class GetSelectedNftWardrobeOutfitComposer implements IMessageComposer<[]>
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
