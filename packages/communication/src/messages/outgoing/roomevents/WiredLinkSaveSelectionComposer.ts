import { IMessageComposer } from '@octane/api';

/** WIRED Link save selection (AIR 385): the network ("0" for none) and the receive-local flag. */
export class WiredLinkSaveSelectionComposer implements IMessageComposer<ConstructorParameters<typeof WiredLinkSaveSelectionComposer>>
{
    private _data: ConstructorParameters<typeof WiredLinkSaveSelectionComposer>;

    constructor(furniId: number, networkId: string, receiveLocal: boolean)
    {
        this._data = [ furniId, networkId, receiveLocal ];
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
