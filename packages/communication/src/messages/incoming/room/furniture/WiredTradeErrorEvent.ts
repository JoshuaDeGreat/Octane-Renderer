import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredTradeErrorMessageParser } from '../../../parser';

export class WiredTradeErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredTradeErrorMessageParser);
    }

    public getParser(): WiredTradeErrorMessageParser
    {
        return this.parser as WiredTradeErrorMessageParser;
    }
}
