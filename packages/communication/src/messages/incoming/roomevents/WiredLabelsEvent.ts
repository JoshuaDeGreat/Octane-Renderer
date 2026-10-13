import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredLabelsParser } from '../../parser';

export class WiredLabelsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredLabelsParser);
    }

    public getParser(): WiredLabelsParser
    {
        return this.parser as WiredLabelsParser;
    }
}
