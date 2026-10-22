import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserNftWardrobeParser } from '../../parser';

export class UserNftWardrobeEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserNftWardrobeParser);
    }

    public getParser(): UserNftWardrobeParser
    {
        return this.parser as UserNftWardrobeParser;
    }
}
