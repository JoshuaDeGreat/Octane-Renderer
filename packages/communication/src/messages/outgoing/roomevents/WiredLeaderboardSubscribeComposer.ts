import { IMessageComposer } from '@octane/api';

/**
 * Official variable leaderboard subscription (AIR 2833). `(0, 0, '0', [])` is the hello sent on
 * entering a room; otherwise the one or two chunks of a panel the player now looks at, ascending.
 */
export class WiredLeaderboardSubscribeComposer implements IMessageComposer<any>
{
    private _data: any;

    constructor(overlayId: number, revision: number, variableId: string, chunkIndices: number[])
    {
        this._data = [ overlayId, revision, variableId, chunkIndices.length, ...chunkIndices ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
