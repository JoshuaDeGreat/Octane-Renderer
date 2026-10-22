import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleResultParser } from '../../parser';

export class CollectiblePurchaseResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleResultParser);
    }

    public getParser(): CollectibleResultParser
    {
        return this.parser as CollectibleResultParser;
    }
}
