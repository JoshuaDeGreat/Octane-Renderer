import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * The server refused a wired trade action: int tradeErrorId.
 * AIR WIN63-202610131318 (package_192/class_3890). Rendered as `wired_transactions.notification.trade_error`
 * with %error% = `wired_transactions.notification.trade_error.<tradeErrorId>`.
 */
export class WiredTradeErrorMessageParser implements IMessageParser
{
    private _tradeErrorId: number = 0;

    public flush(): boolean
    {
        this._tradeErrorId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._tradeErrorId = wrapper.readInt();

        return true;
    }

    public get tradeErrorId(): number
    {
        return this._tradeErrorId;
    }
}
