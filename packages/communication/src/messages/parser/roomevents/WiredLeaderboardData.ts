import { IMessageDataWrapper } from '@octane/api';

/** Column types of a variable leaderboard (official `VariableLeaderboardColumnType`). */
export const WiredLeaderboardColumnType = {
    UNUSED: -1,
    USERNAME: 0,
    VALUE: 1,
    LAST_UPDATE: 2,
    CREATION: 3,
    LEVEL: 4,
    TEXT_CONNECTION: 5
} as const;

/** Rows per page for each page size option, and rows per chunk. */
export const WIRED_LEADERBOARD_PAGE_SIZES = [ 10, 15, 20 ];
export const WIRED_LEADERBOARD_CHUNK_SIZE = 50;
export const WIRED_LEADERBOARD_MAX_OVERLAYS = 4;
/** Column width ids 0..3 in pixels. */
export const WIRED_LEADERBOARD_COLUMN_WIDTHS = [ 70, 90, 120, 170 ];

export interface IWiredLeaderboardColumn
{
    type: number;
    label: string;
    width: number;
}

export interface IWiredLeaderboardChoice
{
    variableId: string;
    displayName: string;
}

/** One leaderboard panel of the room (official snapshot descriptor). */
export interface IWiredLeaderboardDescriptor
{
    overlayId: number;
    revision: number;
    title: string;
    description: string;
    tileX: number;
    tileY: number;
    offsetX: number;
    altitude: number;
    sortMode: number;
    columns: IWiredLeaderboardColumn[];
    choices: IWiredLeaderboardChoice[];
    defaultVariableId: string;
    pageSizeOption: number;
}

/** One ranked user; times are epoch milliseconds, level and text null when not available. */
export interface IWiredLeaderboardRow
{
    rank: number;
    userId: number;
    username: string;
    figure: string;
    rawValue: string;
    creationTime: number;
    lastUpdateTime: number;
    level: string | null;
    text: string | null;
}

/** A variable a leaderboard box can rank, as its editor context lists it (context type 8). */
export interface IWiredLeaderboardContextChoice
{
    variableId: string;
    technicalName: string;
    persistent: boolean;
    hasValue: boolean;
    applicableLevelUpCount: number;
}

/** The official wired editor context of a leaderboard box (type 8). */
export interface IWiredLeaderboardContext
{
    overlayInstanceId: number;
    physicalTileX: number;
    physicalTileY: number;
    totalCandidateCount: number;
    choices: IWiredLeaderboardContextChoice[];
}

/** A 64-bit integer written high half first; exact for epoch milliseconds. */
export const readWiredLeaderboardLong = (wrapper: IMessageDataWrapper): number =>
{
    const high = wrapper.readInt();
    const low = wrapper.readInt() >>> 0;

    return (high * 4294967296) + low;
};

export const WIRED_CONTEXT_VARIABLE_LEADERBOARD = 8;

export const readWiredLeaderboardContext = (wrapper: IMessageDataWrapper): IWiredLeaderboardContext =>
{
    const context: IWiredLeaderboardContext = {
        overlayInstanceId: wrapper.readInt(),
        physicalTileX: wrapper.readInt(),
        physicalTileY: wrapper.readInt(),
        totalCandidateCount: wrapper.readInt(),
        choices: []
    };

    const count = wrapper.readInt();

    for(let i = 0; i < count; i++)
    {
        context.choices.push({
            variableId: wrapper.readString(),
            technicalName: wrapper.readString(),
            persistent: wrapper.readBoolean(),
            hasValue: wrapper.readBoolean(),
            applicableLevelUpCount: wrapper.readInt()
        });
    }

    return context;
};
