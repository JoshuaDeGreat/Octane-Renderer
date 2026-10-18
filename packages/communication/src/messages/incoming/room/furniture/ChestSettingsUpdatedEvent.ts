import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChestSettingsUpdatedMessageParser } from '../../../parser';

export class ChestSettingsUpdatedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestSettingsUpdatedMessageParser);
    }

    public getParser(): ChestSettingsUpdatedMessageParser
    {
        return this.parser as ChestSettingsUpdatedMessageParser;
    }
}
