import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredUserHighlightParser } from '../../parser';

/** The room units a set furni highlight changed. */
export class WiredUserHighlightEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredUserHighlightParser);
    }

    public getParser(): WiredUserHighlightParser
    {
        return this.parser as WiredUserHighlightParser;
    }
}
