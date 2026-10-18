import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredSetupImportResultParser } from '../../parser';

export class WiredSetupImportResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredSetupImportResultParser);
    }

    public getParser(): WiredSetupImportResultParser
    {
        return this.parser as WiredSetupImportResultParser;
    }
}
