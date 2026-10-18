import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredLinkNetworkInvalidatedParser } from '../../parser';

export class WiredLinkNetworkInvalidatedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredLinkNetworkInvalidatedParser);
    }

    public getParser(): WiredLinkNetworkInvalidatedParser
    {
        return this.parser as WiredLinkNetworkInvalidatedParser;
    }
}
