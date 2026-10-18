import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredTransactionSuccessMessageParser } from '../../../parser';

export class WiredTransactionSuccessEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredTransactionSuccessMessageParser);
    }

    public getParser(): WiredTransactionSuccessMessageParser
    {
        return this.parser as WiredTransactionSuccessMessageParser;
    }
}
