import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CollectorScoreParser } from '../../parser';

export class CollectorScoreEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CollectorScoreParser);
    }

    public getParser(): CollectorScoreParser
    {
        return this.parser as CollectorScoreParser;
    }
}
