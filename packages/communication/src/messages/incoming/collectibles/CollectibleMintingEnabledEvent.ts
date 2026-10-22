import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectibleMintingEnabledParser } from '../../parser';

export class CollectibleMintingEnabledEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectibleMintingEnabledParser);
    }

    public getParser(): CollectibleMintingEnabledParser
    {
        return this.parser as CollectibleMintingEnabledParser;
    }
}
