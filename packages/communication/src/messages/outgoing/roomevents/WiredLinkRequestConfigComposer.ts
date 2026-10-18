import { IMessageComposer } from '@octane/api';

/** WIRED Link configuration request (AIR 3208). */
export class WiredLinkRequestConfigComposer implements IMessageComposer<ConstructorParameters<typeof WiredLinkRequestConfigComposer>>
{
    private _data: ConstructorParameters<typeof WiredLinkRequestConfigComposer>;

    constructor(furniId: number)
    {
        this._data = [ furniId ];
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
