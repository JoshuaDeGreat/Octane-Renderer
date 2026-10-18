import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredLinkConfigurationParser } from '../../parser';

export class WiredLinkConfigurationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredLinkConfigurationParser);
    }

    public getParser(): WiredLinkConfigurationParser
    {
        return this.parser as WiredLinkConfigurationParser;
    }
}
