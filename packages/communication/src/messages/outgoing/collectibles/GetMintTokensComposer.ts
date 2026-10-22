import { IMessageComposer } from '@octane/api';

/** Official stamp balance request (2610). */
export class GetMintTokensComposer implements IMessageComposer<ConstructorParameters<typeof GetMintTokensComposer>>
{
    private _data: ConstructorParameters<typeof GetMintTokensComposer>;

    constructor(wallet: string)
    {
        this._data = [wallet];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
