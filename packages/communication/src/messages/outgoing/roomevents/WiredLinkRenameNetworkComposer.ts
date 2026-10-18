import { IMessageComposer } from '@octane/api';

/** WIRED Link rename network (AIR 2794). */
export class WiredLinkRenameNetworkComposer implements IMessageComposer<ConstructorParameters<typeof WiredLinkRenameNetworkComposer>>
{
    private _data: ConstructorParameters<typeof WiredLinkRenameNetworkComposer>;

    constructor(furniId: number, networkId: string, name: string)
    {
        this._data = [ furniId, networkId, name ];
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
