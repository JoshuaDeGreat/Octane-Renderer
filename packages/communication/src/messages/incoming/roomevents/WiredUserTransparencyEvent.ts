import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredUserTransparencyParser } from '../../parser';

/** The room units a set furni transparency changed. */
export class WiredUserTransparencyEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredUserTransparencyParser);
    }

    public getParser(): WiredUserTransparencyParser
    {
        return this.parser as WiredUserTransparencyParser;
    }
}
