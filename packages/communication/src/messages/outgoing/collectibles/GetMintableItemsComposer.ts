import { IMessageComposer } from '@octane/api';

/** Official relic list request (1606). */
export class GetMintableItemsComposer implements IMessageComposer<[]>
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
