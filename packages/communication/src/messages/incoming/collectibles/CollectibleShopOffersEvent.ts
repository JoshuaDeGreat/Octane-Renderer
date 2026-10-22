import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleShopOffersParser } from '../../parser';

export class CollectibleShopOffersEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleShopOffersParser);
    }

    public getParser(): CollectibleShopOffersParser
    {
        return this.parser as CollectibleShopOffersParser;
    }
}
