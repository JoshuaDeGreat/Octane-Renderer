import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectiblesInventoryParser } from '../../parser';

export class CollectiblesInventoryEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectiblesInventoryParser);
    }

    public getParser(): CollectiblesInventoryParser
    {
        return this.parser as CollectiblesInventoryParser;
    }
}
