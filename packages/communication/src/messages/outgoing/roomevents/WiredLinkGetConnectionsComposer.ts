import { IMessageComposer } from '@octane/api';

/** WIRED Link connections request (AIR 2300, ours 9494). */
export class WiredLinkGetConnectionsComposer implements IMessageComposer<ConstructorParameters<typeof WiredLinkGetConnectionsComposer>>
{
    private _data: ConstructorParameters<typeof WiredLinkGetConnectionsComposer>;

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
