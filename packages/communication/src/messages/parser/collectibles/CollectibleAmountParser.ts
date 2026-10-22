import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** One int: the emerald (652) or silver (2458) balance, the transfer fee (3909) or the stamp balance. */
export class CollectibleAmountParser implements IMessageParser
{
    private _amount: number = 0;

    public flush(): boolean
    {
        this._amount = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._amount = wrapper.readInt();

        return true;
    }

    public get amount(): number
    {
        return this._amount;
    }
}
