import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredFurniAddonParser } from '../../parser';

export class WiredFurniAddonEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniAddonParser);
    }

    public getParser(): WiredFurniAddonParser
    {
        return this.parser as WiredFurniAddonParser;
    }
}
