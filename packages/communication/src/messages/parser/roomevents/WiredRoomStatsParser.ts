import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * AIR WiredRoomStatsData: the wired usage of the room against its limit, whether the room is marked heavy, then
 * floor furni, wall furni and the permanent furni, user and global variables, each count then limit.
 */
export interface IWiredRoomStatsData
{
    usage: number;
    usageLimit: number;
    isHeavy: boolean;
    floorCount: number;
    floorLimit: number;
    wallCount: number;
    wallLimit: number;
    permanentFurniVariables: number;
    permanentFurniVariablesLimit: number;
    permanentUserVariables: number;
    permanentUserVariablesLimit: number;
    permanentGlobalVariables: number;
    permanentGlobalVariablesLimit: number;
}

/** AIR wired menu monitor room stats (1891), the answer to WiredRoomStatsRequestComposer (1957). */
export class WiredRoomStatsParser implements IMessageParser
{
    private _roomStats: IWiredRoomStatsData = null;

    public flush(): boolean
    {
        this._roomStats = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const usage = wrapper.readDouble();
        const usageLimit = wrapper.readDouble();
        const isHeavy = wrapper.readBoolean();
        const floorCount = wrapper.readInt();
        const floorLimit = wrapper.readInt();
        const wallCount = wrapper.readInt();
        const wallLimit = wrapper.readInt();
        const permanentFurniVariables = wrapper.readInt();
        const permanentFurniVariablesLimit = wrapper.readInt();
        const permanentUserVariables = wrapper.readInt();
        const permanentUserVariablesLimit = wrapper.readInt();
        const permanentGlobalVariables = wrapper.readInt();
        const permanentGlobalVariablesLimit = wrapper.readInt();

        this._roomStats = {
            usage,
            usageLimit,
            isHeavy,
            floorCount,
            floorLimit,
            wallCount,
            wallLimit,
            permanentFurniVariables,
            permanentFurniVariablesLimit,
            permanentUserVariables,
            permanentUserVariablesLimit,
            permanentGlobalVariables,
            permanentGlobalVariablesLimit
        };

        return true;
    }

    public get roomStats(): IWiredRoomStatsData
    {
        return this._roomStats;
    }
}
