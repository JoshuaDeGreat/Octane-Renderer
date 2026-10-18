import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * Reason 0: the user cancelled the trade themselves, so the window says nothing. Every other reason is shown with the
 * official `wired_transactions.notification.fail.<reason>` text.
 */
export const WIRED_TRADE_FAILURE_SILENT = 0;

/**
 * The wired trade ended without settling: int failureReason. AIR WIN63-202610131318 (package_192/class_3825).
 */
export class WiredTradeCancelledMessageParser implements IMessageParser
{
    private _failureId: number = WIRED_TRADE_FAILURE_SILENT;

    public flush(): boolean
    {
        this._failureId = WIRED_TRADE_FAILURE_SILENT;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._failureId = wrapper.readInt();

        return true;
    }

    public get failureId(): number
    {
        return this._failureId;
    }
}
