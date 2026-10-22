import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectiblesInventoryUpdateParser } from '../../parser';

export class CollectiblesInventoryUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectiblesInventoryUpdateParser);
    }

    public getParser(): CollectiblesInventoryUpdateParser
    {
        return this.parser as CollectiblesInventoryUpdateParser;
    }
}
