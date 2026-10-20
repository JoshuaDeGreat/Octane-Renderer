import { IMessageDataWrapper } from '@octane/api';

/** Official variable targets (`WiredVariable.variableTarget`). */
export const WiredVariableTarget = {
    FURNI: 0,
    USER: 1,
    GLOBAL: -10,
    CONTEXT: -20
} as const;

/**
 * Official variable types (`WiredVariable.variableType`): made with a variable box, internal (`@`), a sub-variable
 * of a box (level-up, quest and Time Utilities parts) and smart (`~`).
 */
export const WiredVariableType = {
    CREATED: 0,
    INTERNAL: 1,
    SUB: 2,
    SMART: 3
} as const;

/**
 * A packed built-in value (`@position`, `@occupation`, the recolorable colour) arrives with an empty text connector
 * table; AIR shows it unpacked as "x: 14, y: 22".
 */
export const isPackedWiredVariable = (variable: Pick<IWiredVariableData, 'textConnector' | 'variableType'>): boolean =>
    variable.textConnector !== null
    && variable.textConnector.length === 0
    && (variable.variableType === WiredVariableType.INTERNAL || variable.variableType === WiredVariableType.SMART);

/**
 * One wired variable definition as the official AIR 13 client reads it
 * (`package_215.WiredVariable`).
 */
export interface IWiredVariableData
{
    variableId: string;
    variableType: number;
    variableName: string;
    availabilityType: number;
    variableTarget: number;
    alwaysAvailable: boolean;
    canCreateAndDelete: boolean;
    hasValue: boolean;
    canWriteValue: boolean;
    canInterceptChanges: boolean;
    isInvisible: boolean;
    /** True for a pointer: it only exists while a stack runs. */
    requiresExecutionContext: boolean;
    canReadCreationTime: boolean;
    canReadLastUpdateTime: boolean;
    textConnector: { key: number; value: string }[] | null;
    /** What a value the text connector does not name reads as, or null. */
    textConnectorFallback: string | null;
}

/** Reads the official `WiredVariable` block from the wrapper. */
export function parseWiredVariableData(wrapper: IMessageDataWrapper): IWiredVariableData
{
    const variableId = wrapper.readString();
    const variableType = wrapper.readInt();
    const variableName = wrapper.readString();
    const availabilityType = wrapper.readInt();
    const variableTarget = wrapper.readInt();
    const alwaysAvailable = wrapper.readBoolean();
    const canCreateAndDelete = wrapper.readBoolean();
    const hasValue = wrapper.readBoolean();
    const canWriteValue = wrapper.readBoolean();
    const canInterceptChanges = wrapper.readBoolean();
    const isInvisible = wrapper.readBoolean();
    const requiresExecutionContext = wrapper.readBoolean();
    const canReadCreationTime = wrapper.readBoolean();
    const canReadLastUpdateTime = wrapper.readBoolean();

    let textConnector: { key: number; value: string }[] = null;
    let textConnectorFallback: string = null;

    if(wrapper.readBoolean())
    {
        textConnector = [];

        const totalConnectors = wrapper.readInt();

        for(let i = 0; i < totalConnectors; i++)
        {
            const key = wrapper.readInt();
            const value = wrapper.readString();

            textConnector.push({ key, value });
        }

        if(wrapper.readBoolean()) textConnectorFallback = wrapper.readString();
    }

    return {
        variableId,
        variableType,
        variableName,
        availabilityType,
        variableTarget,
        alwaysAvailable,
        canCreateAndDelete,
        hasValue,
        canWriteValue,
        canInterceptChanges,
        isInvisible,
        requiresExecutionContext,
        canReadCreationTime,
        canReadLastUpdateTime,
        textConnector,
        textConnectorFallback
    };
}

/** The wire uses two 32-bit halves for every `long`, exactly like the official client. */
export function readWiredLong(wrapper: IMessageDataWrapper): number
{
    const high = wrapper.readInt() >>> 0;
    const low = wrapper.readInt() >>> 0;

    return (high * 0x100000000) + low;
}

/** A signed `long` sent as two 32-bit halves; the high half carries the sign. */
export function readWiredSignedLong(wrapper: IMessageDataWrapper): number
{
    const high = wrapper.readInt();
    const low = wrapper.readInt() >>> 0;

    return (high * 0x100000000) + low;
}
