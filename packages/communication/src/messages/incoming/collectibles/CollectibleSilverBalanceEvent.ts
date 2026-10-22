import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleAmountParser } from '../../parser';

export class CollectibleSilverBalanceEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleAmountParser);
    }

    public getParser(): CollectibleAmountParser
    {
        return this.parser as CollectibleAmountParser;
    }
}
