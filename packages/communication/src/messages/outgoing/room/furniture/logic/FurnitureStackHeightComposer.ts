import { IMessageComposer } from '@octane/api';

export class FurnitureStackHeightComposer implements IMessageComposer<ConstructorParameters<typeof FurnitureStackHeightComposer>>
{
    private _data: ConstructorParameters<typeof FurnitureStackHeightComposer>;

    // The multi-walk state rides on the same composer when the checkbox changes; the slider update omits it.
    constructor(itemId: number, height: number = -100, multiWalk?: boolean)
    {
        this._data = (multiWalk === undefined) ? [itemId, height] : [itemId, height, multiWalk];
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
