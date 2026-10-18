import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredFurniTransparencyParser } from '../../parser';

/** The furni a set furni transparency changed. */
export class WiredFurniTransparencyEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniTransparencyParser);
    }

    public getParser(): WiredFurniTransparencyParser
    {
        return this.parser as WiredFurniTransparencyParser;
    }
}
