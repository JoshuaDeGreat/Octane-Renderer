import { IMessageComposer } from '@octane/api';

/** Transfer fee request (official 875, taken here: 9421). */
export class GetCollectibleTransferFeeComposer implements IMessageComposer<[]>
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
