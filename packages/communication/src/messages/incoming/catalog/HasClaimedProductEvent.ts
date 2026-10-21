import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HasClaimedProductParser } from '../../parser';

export class HasClaimedProductEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HasClaimedProductParser);
    }

    public getParser(): HasClaimedProductParser
    {
        return this.parser as HasClaimedProductParser;
    }
}
