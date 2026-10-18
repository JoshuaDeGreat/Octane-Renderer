import { IMessageComposer } from '@octane/api';

/** Asks for the share code of every wired box in the room (format version 1). */
export class WiredSetupExportComposer implements IMessageComposer<ConstructorParameters<typeof WiredSetupExportComposer>>
{
    private _data: ConstructorParameters<typeof WiredSetupExportComposer>;

    constructor(version: number = 1)
    {
        this._data = [ version ];
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
