import { IMessageDataWrapper } from '@octane/api';
import { IWiredDefinitionContext, readWiredDefinitionContexts } from './WiredDefinitionContext';
import { IWiredLeaderboardContext } from './WiredLeaderboardData';

/** Which official definition this is; only the holder specifics differ. */
export type WiredDefinitionHolder = 'trigger' | 'action' | 'condition' | 'addon' | 'selector' | 'variable';

/** Allowed and default furni/user sources per selection slot, as the server decides them. */
export interface IWiredInputSourcesConf
{
    furniAllowed: number[][];
    userAllowed: number[][];
    furniDefaults: number[];
    userDefaults: number[];
}

const readInts = (wrapper: IMessageDataWrapper): number[] =>
{
    const values: number[] = [];
    let count = wrapper.readInt();

    while(count > 0)
    {
        values.push(wrapper.readInt());
        count--;
    }

    return values;
};

/**
 * An official wired editor definition (AIR `§_-lk§`, build WIN63-202610131318): furni limit, furni picks
 * (two sets), sprite id, box id, string param, int params, variable ids, furni and user source types, code,
 * the holder's definition specifics (action delay, condition quantifier), advanced mode, input sources conf,
 * allow wall furni, the holder's type specifics (condition quantifier type and invert, selector filter and
 * invert), editor contexts and default int params.
 *
 * <p>Everything is read here, steered by the holder, so subclasses only name their getters.
 */
export class Triggerable
{
    private _holder: WiredDefinitionHolder;
    private _furniLimit: number;
    private _stuffIds: number[];
    private _stuffIds2: number[];
    private _stuffTypeId: number;
    private _id: number;
    private _stringParam: string;
    private _intParams: number[];
    private _variableIds: string[];
    private _furniSourceTypes: number[];
    private _userSourceTypes: number[];
    private _code: number;
    private _delayInPulses: number;
    private _quantifierCode: number;
    private _advancedMode: boolean;
    private _inputSourcesConf: IWiredInputSourcesConf;
    private _allowWallFurni: boolean;
    private _quantifierType: number;
    private _isInvert: boolean;
    private _isFilter: boolean;
    private _contexts: IWiredDefinitionContext[];
    private _defaultIntParams: number[];
    private _stuffTypeSelectionCode: number;

    constructor(wrapper: IMessageDataWrapper, holder: WiredDefinitionHolder)
    {
        this._holder = holder;
        this._furniLimit = wrapper.readInt();
        this._stuffIds = readInts(wrapper);
        this._stuffIds2 = readInts(wrapper);
        this._stuffTypeId = wrapper.readInt();
        this._id = wrapper.readInt();
        this._stringParam = wrapper.readString();
        this._intParams = readInts(wrapper);

        this._variableIds = [];
        let count = wrapper.readInt();

        while(count > 0)
        {
            this._variableIds.push(wrapper.readString());
            count--;
        }

        this._furniSourceTypes = readInts(wrapper);
        this._userSourceTypes = readInts(wrapper);
        this._code = wrapper.readInt();

        this._delayInPulses = 0;
        this._quantifierCode = 0;

        if(holder === 'action') this._delayInPulses = wrapper.readInt();
        else if(holder === 'condition') this._quantifierCode = wrapper.readInt();
        else if(holder === 'selector')
        {
            this._isFilter = wrapper.readBoolean();
            this._isInvert = wrapper.readBoolean();
        }

        this._advancedMode = wrapper.readBoolean();
        this._inputSourcesConf = {
            furniAllowed: this.readAllowedSources(wrapper),
            userAllowed: this.readAllowedSources(wrapper),
            furniDefaults: readInts(wrapper),
            userDefaults: readInts(wrapper)
        };
        this._allowWallFurni = wrapper.readBoolean();

        this._quantifierType = 0;
        if(holder === 'condition')
        {
            this._quantifierType = wrapper.readByte();
            this._isInvert = wrapper.readBoolean();
        }

        this._isFilter = !!this._isFilter;
        this._isInvert = !!this._isInvert;
        this._contexts = readWiredDefinitionContexts(wrapper);
        this._defaultIntParams = readInts(wrapper);
        this._stuffTypeSelectionCode = -1;
    }

    private readAllowedSources(wrapper: IMessageDataWrapper): number[][]
    {
        const slots: number[][] = [];
        let count = wrapper.readInt();

        while(count > 0)
        {
            slots.push(readInts(wrapper));
            count--;
        }

        return slots;
    }

    public getBoolean(index: number): boolean
    {
        return (this._intParams[index] === 1);
    }

    public get holder(): WiredDefinitionHolder
    {
        return this._holder;
    }

    /** Legacy field; the official definition has no stuff type selection. */
    public get stuffTypeSelectionEnabled(): boolean
    {
        return false;
    }

    /** Legacy field; the official save packet has no selection code. */
    public get stuffTypeSelectionCode(): number
    {
        return this._stuffTypeSelectionCode;
    }

    public set stuffTypeSelectionCode(code: number)
    {
        this._stuffTypeSelectionCode = code;
    }

    public get maximumItemSelectionCount(): number
    {
        return this._furniLimit;
    }

    public get selectedItems(): number[]
    {
        return this._stuffIds;
    }

    /** The second furni pick set (official dual picking). */
    public get selectedItems2(): number[]
    {
        return this._stuffIds2;
    }

    public get id(): number
    {
        return this._id;
    }

    public get stringData(): string
    {
        return this._stringParam;
    }

    public get intData(): number[]
    {
        return this._intParams;
    }

    public get variableIds(): string[]
    {
        return this._variableIds;
    }

    public get furniSourceTypes(): number[]
    {
        return this._furniSourceTypes;
    }

    public get userSourceTypes(): number[]
    {
        return this._userSourceTypes;
    }

    public get code(): number
    {
        return this._code;
    }

    public get spriteId(): number
    {
        return this._stuffTypeId;
    }

    public get delayInPulses(): number
    {
        return this._delayInPulses;
    }

    public get quantifierCode(): number
    {
        return this._quantifierCode;
    }

    /** 0 none, 1 furni, 2 users, 3 variables. */
    public get quantifierType(): number
    {
        return this._quantifierType;
    }

    public get isInvert(): boolean
    {
        return this._isInvert;
    }

    public get isFilter(): boolean
    {
        return this._isFilter;
    }

    public get advancedMode(): boolean
    {
        return this._advancedMode;
    }

    public get inputSourcesConf(): IWiredInputSourcesConf
    {
        return this._inputSourcesConf;
    }

    public get allowWallFurni(): boolean
    {
        return this._allowWallFurni;
    }

    public get contexts(): IWiredDefinitionContext[]
    {
        return this._contexts;
    }

    /** The variable leaderboard editor context (type 8), null when the box sent none. */
    public get leaderboardContext(): IWiredLeaderboardContext
    {
        return this._contexts.find(context => !!context.leaderboard)?.leaderboard ?? null;
    }

    public get defaultIntParams(): number[]
    {
        return this._defaultIntParams;
    }
}
