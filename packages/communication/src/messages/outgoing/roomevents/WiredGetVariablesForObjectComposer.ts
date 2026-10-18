import { IMessageComposer } from '@octane/api';

/**
 * The inspection tab's read of one object's variables (AIR `outgoing/userdefinedroomevents/wiredmenu/?_-t1r?`):
 * type (0 furni, 1 user, -10 room) and the object id (the furni's item id, the user's room index, or 0 for the room).
 */
export class WiredGetVariablesForObjectComposer implements IMessageComposer<ConstructorParameters<typeof WiredGetVariablesForObjectComposer>>
{
    private _data: ConstructorParameters<typeof WiredGetVariablesForObjectComposer>;

    constructor(type: number, objectId: number)
    {
        this._data = [ type, objectId ];
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
