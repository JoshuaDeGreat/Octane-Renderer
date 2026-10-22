import { IMessageComposer } from '@octane/api';

/** Official reward box open (1489) after the user confirmed opening the box. */
export class OpenCollectibleRewardBoxComposer implements IMessageComposer<ConstructorParameters<typeof OpenCollectibleRewardBoxComposer>>
{
    private _data: ConstructorParameters<typeof OpenCollectibleRewardBoxComposer>;

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
