import { IMessageComposer } from '@octane/api';

/** WIRED Link create network (AIR 2192). */
export class WiredLinkCreateNetworkComposer implements IMessageComposer<ConstructorParameters<typeof WiredLinkCreateNetworkComposer>>
{
    private _data: ConstructorParameters<typeof WiredLinkCreateNetworkComposer>;

    constructor(furniId: number, name: string)
    {
        this._data = [ furniId, name ];
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
