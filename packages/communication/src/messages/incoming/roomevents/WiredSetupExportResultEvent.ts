import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredSetupExportResultParser } from '../../parser';

export class WiredSetupExportResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredSetupExportResultParser);
    }

    public getParser(): WiredSetupExportResultParser
    {
        return this.parser as WiredSetupExportResultParser;
    }
}
