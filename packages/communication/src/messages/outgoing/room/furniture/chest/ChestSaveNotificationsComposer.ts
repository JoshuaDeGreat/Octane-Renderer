import { IMessageComposer } from '@octane/api';

/** Polaris ChestSaveNotificationsEvent: [chestId, full, donation, withdraw, empty, wired, mode]. */
export class ChestSaveNotificationsComposer implements IMessageComposer<ConstructorParameters<typeof ChestSaveNotificationsComposer>>
{
    private _data: ConstructorParameters<typeof ChestSaveNotificationsComposer>;

    constructor(chestId: number, full: boolean, donation: boolean, withdraw: boolean, empty: boolean, wired: boolean, mode: number)
    {
        this._data = [chestId, full, donation, withdraw, empty, wired, mode];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
