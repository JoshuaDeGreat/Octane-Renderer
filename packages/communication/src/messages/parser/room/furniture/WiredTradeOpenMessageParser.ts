import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredTradeRule, IWiredTradeRulesDefinition, readWiredTradeRulesDefinition } from './WiredTradeRuleParser';

/** TradeRequirement types (AIR trade/requirements/TradeRequirement). */
export const WIRED_TRADE_REQUIREMENT_ANY_COINS = 0;
export const WIRED_TRADE_REQUIREMENT_ANY_FURNI = 1;
export const WIRED_TRADE_REQUIREMENT_ANY = 2;
export const WIRED_TRADE_REQUIREMENT_RULES = 4;

/** TradeRequirementRules types. */
export const WIRED_TRADE_RULES_NORMAL = 0;
export const WIRED_TRADE_RULES_MULTIPLIER = 1;
export const WIRED_TRADE_RULES_AUTO = 2;

/**
 * A wired trade opens. AIR WIN63-202610131318 (package_192/class_3295):
 * TradeRequirement (int type, string youGetText, string layoutType, if type == 4: TradeRequirementRules),
 * bool showRequirementsImmediate, bool overridePreviousTrade, int timeoutSeconds.
 *
 * TradeRequirementRules = bool hasGive, [int n, rule[n]], bool hasGet, [rule], int rulesType,
 * if rulesType == 1: int multiplier, if rulesType == 2: int autoMultiplierMax. Rules are unscaled.
 */
export class WiredTradeOpenMessageParser implements IMessageParser
{
    private _requirementType: number = WIRED_TRADE_REQUIREMENT_ANY;
    private _youGetText: string = '';
    private _layoutType: string = '';
    private _giveRules: IWiredTradeRule[] = null;
    private _getRule: IWiredTradeRule = null;
    private _rulesType: number = WIRED_TRADE_RULES_NORMAL;
    private _multiplier: number = 1;
    private _autoMultiplierMax: number = 0;
    private _showRequirementsImmediate: boolean = false;
    private _overridePreviousTrade: boolean = false;
    private _timeoutSeconds: number = 0;

    public flush(): boolean
    {
        this._requirementType = WIRED_TRADE_REQUIREMENT_ANY;
        this._youGetText = '';
        this._layoutType = '';
        this._giveRules = null;
        this._getRule = null;
        this._rulesType = WIRED_TRADE_RULES_NORMAL;
        this._multiplier = 1;
        this._autoMultiplierMax = 0;
        this._showRequirementsImmediate = false;
        this._overridePreviousTrade = false;
        this._timeoutSeconds = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this.flush();

        this._requirementType = wrapper.readInt();
        this._youGetText = wrapper.readString();
        this._layoutType = wrapper.readString();

        if(this._requirementType === WIRED_TRADE_REQUIREMENT_RULES)
        {
            let definition: IWiredTradeRulesDefinition;

            try
            {
                definition = readWiredTradeRulesDefinition(wrapper);
            }
            catch
            {
                return false;
            }

            this._giveRules = definition.youGiveRule;
            this._getRule = definition.youGetRule;
            this._rulesType = wrapper.readInt();

            if(this._rulesType === WIRED_TRADE_RULES_MULTIPLIER) this._multiplier = wrapper.readInt();
            else if(this._rulesType === WIRED_TRADE_RULES_AUTO) this._autoMultiplierMax = wrapper.readInt();
        }

        this._showRequirementsImmediate = wrapper.readBoolean();
        this._overridePreviousTrade = wrapper.readBoolean();
        this._timeoutSeconds = wrapper.readInt();

        return true;
    }

    public get requirementType(): number
    {
        return this._requirementType;
    }

    public get youGetText(): string
    {
        return this._youGetText;
    }

    public get layoutType(): string
    {
        return this._layoutType;
    }

    /** The alternatives the player can give; null when the rules have no give side (AIR ignores such a trade). */
    public get giveRules(): IWiredTradeRule[]
    {
        return this._giveRules;
    }

    /** What the player gets; null when there is no get rule. */
    public get getRule(): IWiredTradeRule
    {
        return this._getRule;
    }

    public get rulesType(): number
    {
        return this._rulesType;
    }

    public get multiplier(): number
    {
        return this._multiplier;
    }

    public get autoMultiplierMax(): number
    {
        return this._autoMultiplierMax;
    }

    public get showRequirementsImmediate(): boolean
    {
        return this._showRequirementsImmediate;
    }

    public get overridePreviousTrade(): boolean
    {
        return this._overridePreviousTrade;
    }

    public get timeoutSeconds(): number
    {
        return this._timeoutSeconds;
    }
}
