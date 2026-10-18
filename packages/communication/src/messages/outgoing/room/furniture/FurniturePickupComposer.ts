import { IMessageComposer } from '@octane/api';

export class FurniturePickupComposer implements IMessageComposer<ConstructorParameters<typeof FurniturePickupComposer>>
{
    private _data: ConstructorParameters<typeof FurniturePickupComposer>;

    /** Official layout: `confirmed` is true when the pick-up answers the server's ObjectRemoveConfirm. */
    constructor(category: number, objectId: number, confirmed: boolean = false)
    {
        this._data = [category, objectId, confirmed];
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
