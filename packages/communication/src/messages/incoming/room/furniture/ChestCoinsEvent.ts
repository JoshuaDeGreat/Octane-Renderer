import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChestCoinsMessageParser } from '../../../parser';

export class ChestCoinsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestCoinsMessageParser);
    }

    public getParser(): ChestCoinsMessageParser
    {
        return this.parser as ChestCoinsMessageParser;
    }
}
