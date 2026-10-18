import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredLinkOperationResultParser } from '../../parser';

export class WiredLinkOperationResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredLinkOperationResultParser);
    }

    public getParser(): WiredLinkOperationResultParser
    {
        return this.parser as WiredLinkOperationResultParser;
    }
}
