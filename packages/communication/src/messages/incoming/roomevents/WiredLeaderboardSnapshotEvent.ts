import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredLeaderboardSnapshotParser } from '../../parser';

export class WiredLeaderboardSnapshotEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredLeaderboardSnapshotParser);
    }

    public getParser(): WiredLeaderboardSnapshotParser
    {
        return this.parser as WiredLeaderboardSnapshotParser;
    }
}
