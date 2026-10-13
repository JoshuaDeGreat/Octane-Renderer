import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredLeaderboardRow, readWiredLeaderboardLong } from './WiredLeaderboardData';

/**
 * Official variable leaderboard chunk (AIR 3979): up to 50 ranked rows of one panel and variable;
 * row k of chunk c is row c * 50 + k of the whole board.
 */
export class WiredLeaderboardChunkParser implements IMessageParser
{
    private _overlayId: number;
    private _revision: number;
    private _variableId: string;
    private _chunkIndex: number;
    private _totalCount: number;
    private _rows: IWiredLeaderboardRow[];

    public flush(): boolean
    {
        this._overlayId = 0;
        this._revision = 0;
        this._variableId = '';
        this._chunkIndex = 0;
        this._totalCount = 0;
        this._rows = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._overlayId = wrapper.readInt();
        this._revision = wrapper.readInt();
        this._variableId = wrapper.readString();
        this._chunkIndex = wrapper.readInt();
        this._totalCount = wrapper.readInt();
        this._rows = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const rank = wrapper.readInt();
            const userId = wrapper.readInt();
            const username = wrapper.readString();
            const figure = wrapper.readString();
            const rawValue = wrapper.readString();
            const creationTime = readWiredLeaderboardLong(wrapper);
            const lastUpdateTime = readWiredLeaderboardLong(wrapper);
            const level = wrapper.readBoolean() ? wrapper.readString() : null;
            const text = wrapper.readBoolean() ? wrapper.readString() : null;

            this._rows.push({ rank, userId, username, figure, rawValue, creationTime, lastUpdateTime, level, text });
        }

        return true;
    }

    public get overlayId(): number
    {
        return this._overlayId;
    }

    public get revision(): number
    {
        return this._revision;
    }

    public get variableId(): string
    {
        return this._variableId;
    }

    public get chunkIndex(): number
    {
        return this._chunkIndex;
    }

    public get totalCount(): number
    {
        return this._totalCount;
    }

    public get rows(): IWiredLeaderboardRow[]
    {
        return this._rows;
    }
}
