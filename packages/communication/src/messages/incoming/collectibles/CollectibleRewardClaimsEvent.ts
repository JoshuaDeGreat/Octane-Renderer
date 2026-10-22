import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleRewardClaimsParser } from '../../parser';

export class CollectibleRewardClaimsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleRewardClaimsParser);
    }

    public getParser(): CollectibleRewardClaimsParser
    {
        return this.parser as CollectibleRewardClaimsParser;
    }
}
