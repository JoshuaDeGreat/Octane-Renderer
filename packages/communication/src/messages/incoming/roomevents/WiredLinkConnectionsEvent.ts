import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredLinkConnectionsParser } from '../../parser';

export class WiredLinkConnectionsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredLinkConnectionsParser);
    }

    public getParser(): WiredLinkConnectionsParser
    {
        return this.parser as WiredLinkConnectionsParser;
    }
}
