import { IMessageComposer } from '@octane/api';

/** Official minting status request (2371). */
export class GetMintingEnabledComposer implements IMessageComposer<[]>
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
