import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredFurniSelectorParser } from '../../parser';

export class WiredFurniSelectorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniSelectorParser);
    }

    public getParser(): WiredFurniSelectorParser
    {
        return this.parser as WiredFurniSelectorParser;
    }
}
