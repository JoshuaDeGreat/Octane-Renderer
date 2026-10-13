import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredLeaderboardChunkParser } from '../../parser';

export class WiredLeaderboardChunkEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredLeaderboardChunkParser);
    }

    public getParser(): WiredLeaderboardChunkParser
    {
        return this.parser as WiredLeaderboardChunkParser;
    }
}
