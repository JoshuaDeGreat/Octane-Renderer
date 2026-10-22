import { IMessageComposer } from '@octane/api';

/** Official guild shop request (1762). */
export class GetCollectibleShopComposer implements IMessageComposer<[]>
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
