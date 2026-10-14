import { IMessageComposer } from '@octane/api';

/**
 * Official recolour (2852) of a recolourable furni. Scope: 0 only this furni, 1 every furni with its
 * colour, 2 every furni of its type, 3 every furni of its type and colour.
 */
export class RecolorFurniComposer implements IMessageComposer<ConstructorParameters<typeof RecolorFurniComposer>>
{
    private _data: ConstructorParameters<typeof RecolorFurniComposer>;

    constructor(furniId: number, scope: number, red: number, green: number, blue: number)
    {
        this._data = [ furniId, scope, red, green, blue ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        this._data = null;
    }
}
