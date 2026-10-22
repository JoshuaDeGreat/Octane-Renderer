import { IMessageComposer } from '@octane/api';

/** Official collections request (1656) of the collections tab. */
export class GetCollectibleCollectionsComposer implements IMessageComposer<ConstructorParameters<typeof GetCollectibleCollectionsComposer>>
{
    private _data: ConstructorParameters<typeof GetCollectibleCollectionsComposer>;

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
