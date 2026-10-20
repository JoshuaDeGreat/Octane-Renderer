import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredErrorLogsParser } from '../../parser';

export class WiredErrorLogsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredErrorLogsParser);
    }

    public getParser(): WiredErrorLogsParser
    {
        return this.parser as WiredErrorLogsParser;
    }
}
