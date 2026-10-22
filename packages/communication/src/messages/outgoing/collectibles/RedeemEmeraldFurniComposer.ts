import { IMessageComposer } from '@octane/api';

/** Official emerald furni redeem (121) from the credit furni widget. */
export class RedeemEmeraldFurniComposer implements IMessageComposer<ConstructorParameters<typeof RedeemEmeraldFurniComposer>>
{
    private _data: ConstructorParameters<typeof RedeemEmeraldFurniComposer>;

    constructor(objectId: number)
    {
        this._data = [objectId];
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
