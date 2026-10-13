import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredLeaderboardChoice, IWiredLeaderboardColumn, IWiredLeaderboardDescriptor, WIRED_LEADERBOARD_MAX_OVERLAYS } from './WiredLeaderboardData';

/**
 * Official variable leaderboard snapshot (AIR 1494): every leaderboard panel of the room. Like the
 * AIR client, a snapshot with more than four panels is dropped whole.
 */
export class WiredLeaderboardSnapshotParser implements IMessageParser
{
    private _descriptors: IWiredLeaderboardDescriptor[];
    private _valid: boolean;

    public flush(): boolean
    {
        this._descriptors = [];
        this._valid = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._descriptors = [];

        const count = wrapper.readInt();

        this._valid = (count >= 0) && (count <= WIRED_LEADERBOARD_MAX_OVERLAYS);

        if(!this._valid) return true;

        for(let i = 0; i < count; i++)
        {
            const overlayId = wrapper.readInt();
            const revision = wrapper.readInt();
            const title = wrapper.readString();
            const description = wrapper.readString();
            const tileX = wrapper.readInt();
            const tileY = wrapper.readInt();
            const offsetX = wrapper.readInt();
            const altitude = wrapper.readInt();
            const sortMode = wrapper.readInt();
            const columns: IWiredLeaderboardColumn[] = [];
            const columnCount = wrapper.readInt();

            for(let j = 0; j < columnCount; j++)
            {
                columns.push({ type: wrapper.readInt(), label: wrapper.readString(), width: wrapper.readInt() });
            }

            const choices: IWiredLeaderboardChoice[] = [];
            const choiceCount = wrapper.readInt();

            for(let j = 0; j < choiceCount; j++)
            {
                choices.push({ variableId: wrapper.readString(), displayName: wrapper.readString() });
            }

            const defaultVariableId = wrapper.readString();
            const pageSizeOption = wrapper.readInt();

            this._descriptors.push({ overlayId, revision, title, description, tileX, tileY, offsetX, altitude, sortMode, columns, choices, defaultVariableId, pageSizeOption });
        }

        return true;
    }

    public get descriptors(): IWiredLeaderboardDescriptor[]
    {
        return this._descriptors;
    }

    /** False when the snapshot listed more panels than the client may show. */
    public get valid(): boolean
    {
        return this._valid;
    }
}
