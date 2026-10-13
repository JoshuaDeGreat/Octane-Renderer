import { IMessageComposer } from '@octane/api';

/** Official furniture label text save (AIR 2638): the label furni and its new text. */
export class WiredLabelSaveTextComposer implements IMessageComposer<ConstructorParameters<typeof WiredLabelSaveTextComposer>>
{
    private _data: ConstructorParameters<typeof WiredLabelSaveTextComposer>;

    constructor(furniId: number, text: string)
    {
        this._data = [ furniId, text ];
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
