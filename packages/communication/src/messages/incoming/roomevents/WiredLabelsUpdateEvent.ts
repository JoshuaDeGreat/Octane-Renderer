import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredLabelsUpdateParser } from '../../parser';

export class WiredLabelsUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredLabelsUpdateParser);
    }

    public getParser(): WiredLabelsUpdateParser
    {
        return this.parser as WiredLabelsUpdateParser;
    }
}
