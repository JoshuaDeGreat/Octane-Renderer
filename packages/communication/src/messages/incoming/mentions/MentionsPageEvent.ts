import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MentionsPageParser } from '../../parser';

export class MentionsPageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MentionsPageParser);
    }

    public getParser(): MentionsPageParser
    {
        return this.parser as MentionsPageParser;
    }
}
