import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleCollectionsParser } from '../../parser';

export class CollectibleCollectionsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleCollectionsParser);
    }

    public getParser(): CollectibleCollectionsParser
    {
        return this.parser as CollectibleCollectionsParser;
    }
}
