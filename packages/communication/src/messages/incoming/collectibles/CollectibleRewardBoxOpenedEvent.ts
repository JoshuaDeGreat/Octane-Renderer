import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleRewardBoxOpenedParser } from '../../parser';

export class CollectibleRewardBoxOpenedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleRewardBoxOpenedParser);
    }

    public getParser(): CollectibleRewardBoxOpenedParser
    {
        return this.parser as CollectibleRewardBoxOpenedParser;
    }
}
