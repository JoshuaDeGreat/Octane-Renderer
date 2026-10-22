import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectionClaimResultParser } from '../../parser';

export class CollectionBonusClaimResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectionClaimResultParser);
    }

    public getParser(): CollectionClaimResultParser
    {
        return this.parser as CollectionClaimResultParser;
    }
}
