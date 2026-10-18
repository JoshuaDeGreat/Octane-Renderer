import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredVariablesForObjectParser } from '../../parser';

export class WiredVariablesForObjectEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredVariablesForObjectParser);
    }

    public getParser(): WiredVariablesForObjectParser
    {
        return this.parser as WiredVariablesForObjectParser;
    }
}
