import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleMintablesParser } from '../../parser';

export class CollectibleMintablesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleMintablesParser);
    }

    public getParser(): CollectibleMintablesParser
    {
        return this.parser as CollectibleMintablesParser;
    }
}
