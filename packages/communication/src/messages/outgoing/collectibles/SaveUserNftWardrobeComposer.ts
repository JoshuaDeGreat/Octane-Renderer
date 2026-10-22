import { IMessageComposer } from '@octane/api';

/** Official avatar collectible save (133): wears the NFT tab's look with this wardrobe item id. */
export class SaveUserNftWardrobeComposer implements IMessageComposer<ConstructorParameters<typeof SaveUserNftWardrobeComposer>>
{
    private _data: ConstructorParameters<typeof SaveUserNftWardrobeComposer>;

    constructor(id: string)
    {
        this._data = [id];
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
