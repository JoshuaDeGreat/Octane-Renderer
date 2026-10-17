import { IMessageComposer } from '@octane/api';

/**
 * Save a chest's notification preferences: [chestId, notifyMode, chestFull, donation, someoneWithdraws, chestEmpty,
 * wiredTransaction]. AIR WIN63-202610131318 (package_95/class_2747, ChestNotificationSettingsUI).
 */
export class ChestSaveNotificationsComposer implements IMessageComposer<ConstructorParameters<typeof ChestSaveNotificationsComposer>>
{
    private _data: ConstructorParameters<typeof ChestSaveNotificationsComposer>;

    constructor(chestId: number, notifyMode: number, chestFull: boolean, donation: boolean, someoneWithdraws: boolean, chestEmpty: boolean, wiredTransaction: boolean)
    {
        this._data = [chestId, notifyMode, chestFull, donation, someoneWithdraws, chestEmpty, wiredTransaction];
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
