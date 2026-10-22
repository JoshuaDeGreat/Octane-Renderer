import { IMessageComposer } from '@octane/api';

/** Official stamp offers request (1133). */
export class GetMintTokenOffersComposer implements IMessageComposer<[]>
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
