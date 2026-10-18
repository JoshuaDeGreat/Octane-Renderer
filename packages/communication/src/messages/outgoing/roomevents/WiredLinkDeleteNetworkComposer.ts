import { IMessageComposer } from '@octane/api';

/** WIRED Link delete network (AIR 2731). */
export class WiredLinkDeleteNetworkComposer implements IMessageComposer<ConstructorParameters<typeof WiredLinkDeleteNetworkComposer>>
{
    private _data: ConstructorParameters<typeof WiredLinkDeleteNetworkComposer>;

    constructor(furniId: number, networkId: string)
    {
        this._data = [ furniId, networkId ];
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
