import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredTransactionFailMessageParser } from '../../../parser';

export class WiredTransactionFailEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredTransactionFailMessageParser);
    }

    public getParser(): WiredTransactionFailMessageParser
    {
        return this.parser as WiredTransactionFailMessageParser;
    }
}
