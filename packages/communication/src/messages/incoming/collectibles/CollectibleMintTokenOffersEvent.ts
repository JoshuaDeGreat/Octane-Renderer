import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleMintTokenOffersParser } from '../../parser';

export class CollectibleMintTokenOffersEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleMintTokenOffersParser);
    }

    public getParser(): CollectibleMintTokenOffersParser
    {
        return this.parser as CollectibleMintTokenOffersParser;
    }
}
