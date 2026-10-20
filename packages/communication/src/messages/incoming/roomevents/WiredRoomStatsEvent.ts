import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredRoomStatsParser } from '../../parser';

export class WiredRoomStatsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredRoomStatsParser);
    }

    public getParser(): WiredRoomStatsParser
    {
        return this.parser as WiredRoomStatsParser;
    }
}
