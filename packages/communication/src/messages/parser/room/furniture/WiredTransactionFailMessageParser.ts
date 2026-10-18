import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * A wired transaction failed outside an open trade window: int failureReason.
 * AIR WIN63-202610131318 (package_196/class_3447). Rendered as `wired_transactions.notification.fail` with
 * %reason% = `wired_transactions.notification.fail.<failureReason>`.
 */
export class WiredTransactionFailMessageParser implements IMessageParser
{
    private _failureReason: number = 0;

    public flush(): boolean
    {
        this._failureReason = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._failureReason = wrapper.readInt();

        return true;
    }

    public get failureReason(): number
    {
        return this._failureReason;
    }
}
