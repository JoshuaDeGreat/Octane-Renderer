import { IMessageDataWrapper } from '@octane/api';
import { IWiredLeaderboardContext, readWiredLeaderboardContext, WIRED_CONTEXT_VARIABLE_LEADERBOARD } from './WiredLeaderboardData';

/** Official wired editor context types (AIR `wiredcontext`). */
export const WiredDefinitionContextType = {
    ALL_VARIABLES_IN_ROOM: 0,
    FURNI_VARIABLE_INFO_AND_HOLDERS: 1,
    USER_VARIABLE_INFO_AND_HOLDERS: 2,
    GLOBAL_VARIABLE_INFO_AND_VALUE: 3,
    SHARED_VARIABLE_LIST: 4,
    VARIABLE_LIST: 5,
    SHARED_GLOBAL_PLACEHOLDER_LIST: 6,
    TEXT_PLACEHOLDERS: 7,
    VARIABLE_LEADERBOARD: WIRED_CONTEXT_VARIABLE_LEADERBOARD
} as const;

/** A wired variable as the official editor context carries it (`WiredVariable`). */
export interface IWiredDefinitionVariable
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
    requiresExecutionContext: boolean;
    canReadCreationTime: boolean;
    canReadLastUpdateTime: boolean;
    textConnector: Map<number, string>;
    textConnectorFallback: string;
}

export interface IWiredDefinitionHolderValue
{
    objectId: number;
    value: number;
}

/** One context entry of a definition; only the fields of its type are set. */
export interface IWiredDefinitionContext
{
    type: number;
    hash?: number;
    variable?: IWiredDefinitionVariable;
    holders?: IWiredDefinitionHolderValue[];
    value?: number;
    sharedVariables?: { roomId: number; roomName: string; variable: IWiredDefinitionVariable }[];
    variables?: IWiredDefinitionVariable[];
    sharedPlaceholders?: { roomId: number; roomName: string; placeholderName: string }[];
    placeholderNames?: string[];
    capturerNames?: string[];
    leaderboard?: IWiredLeaderboardContext;
}

export const readWiredDefinitionVariable = (wrapper: IMessageDataWrapper): IWiredDefinitionVariable =>
{
    const variable: IWiredDefinitionVariable = {
        variableId: wrapper.readString(),
        variableType: wrapper.readInt(),
        variableName: wrapper.readString(),
        availabilityType: wrapper.readInt(),
        variableTarget: wrapper.readInt(),
        alwaysAvailable: wrapper.readBoolean(),
        canCreateAndDelete: wrapper.readBoolean(),
        hasValue: wrapper.readBoolean(),
        canWriteValue: wrapper.readBoolean(),
        canInterceptChanges: wrapper.readBoolean(),
        isInvisible: wrapper.readBoolean(),
        requiresExecutionContext: wrapper.readBoolean(),
        canReadCreationTime: wrapper.readBoolean(),
        canReadLastUpdateTime: wrapper.readBoolean(),
        textConnector: new Map<number, string>(),
        textConnectorFallback: null
    };

    if(wrapper.readBoolean())
    {
        let count = wrapper.readInt();

        while(count > 0)
        {
            const key = wrapper.readInt();

            variable.textConnector.set(key, wrapper.readString());
            count--;
        }

        if(wrapper.readBoolean()) variable.textConnectorFallback = wrapper.readString();
    }

    return variable;
};

const readList = <T>(wrapper: IMessageDataWrapper, read: () => T): T[] =>
{
    const list: T[] = [];
    let count = wrapper.readInt();

    while(count > 0)
    {
        list.push(read());
        count--;
    }

    return list;
};

/** The context block of an official wired definition: a count, then typed entries. */
export const readWiredDefinitionContexts = (wrapper: IMessageDataWrapper): IWiredDefinitionContext[] =>
{
    return readList(wrapper, () =>
    {
        const type = wrapper.readInt();
        const context: IWiredDefinitionContext = { type };

        switch(type)
        {
            case WiredDefinitionContextType.ALL_VARIABLES_IN_ROOM:
                context.hash = wrapper.readInt();
                break;
            case WiredDefinitionContextType.FURNI_VARIABLE_INFO_AND_HOLDERS:
            case WiredDefinitionContextType.USER_VARIABLE_INFO_AND_HOLDERS:
                context.variable = readWiredDefinitionVariable(wrapper);
                context.holders = readList(wrapper, () => ({ objectId: wrapper.readInt(), value: wrapper.readInt() }));
                break;
            case WiredDefinitionContextType.GLOBAL_VARIABLE_INFO_AND_VALUE:
                context.variable = readWiredDefinitionVariable(wrapper);
                context.value = wrapper.readInt();
                break;
            case WiredDefinitionContextType.SHARED_VARIABLE_LIST:
                context.sharedVariables = readList(wrapper, () => ({
                    roomId: wrapper.readInt(),
                    roomName: wrapper.readString(),
                    variable: readWiredDefinitionVariable(wrapper)
                }));
                break;
            case WiredDefinitionContextType.VARIABLE_LIST:
                context.variables = readList(wrapper, () => readWiredDefinitionVariable(wrapper));
                break;
            case WiredDefinitionContextType.SHARED_GLOBAL_PLACEHOLDER_LIST:
                context.sharedPlaceholders = readList(wrapper, () => ({
                    roomId: wrapper.readInt(),
                    roomName: wrapper.readString(),
                    placeholderName: wrapper.readString()
                }));
                break;
            case WiredDefinitionContextType.TEXT_PLACEHOLDERS:
                context.placeholderNames = readList(wrapper, () => wrapper.readString());
                context.capturerNames = readList(wrapper, () => wrapper.readString());
                break;
            case WiredDefinitionContextType.VARIABLE_LEADERBOARD:
                context.leaderboard = readWiredLeaderboardContext(wrapper);
                break;
            default:
                throw new Error(`Unknown wired definition context type ${ type }`);
        }

        return context;
    });
};
