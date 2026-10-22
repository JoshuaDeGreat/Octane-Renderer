import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleWalletsParser } from '../../parser';

export class CollectibleWalletsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleWalletsParser);
    }

    public getParser(): CollectibleWalletsParser
    {
        return this.parser as CollectibleWalletsParser;
    }
}
