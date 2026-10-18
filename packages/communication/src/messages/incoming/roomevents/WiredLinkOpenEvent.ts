import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredLinkOpenParser } from '../../parser';

export class WiredLinkOpenEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredLinkOpenParser);
    }

    public getParser(): WiredLinkOpenParser
    {
        return this.parser as WiredLinkOpenParser;
    }
}
