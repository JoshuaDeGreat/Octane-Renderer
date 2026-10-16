import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredFurniHighlightParser } from '../../parser';

/** The furni a set furni highlight changed. */
export class WiredFurniHighlightEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniHighlightParser);
    }

    public getParser(): WiredFurniHighlightParser
    {
        return this.parser as WiredFurniHighlightParser;
    }
}
