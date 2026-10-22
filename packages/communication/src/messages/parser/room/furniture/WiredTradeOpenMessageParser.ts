import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IHeavenWiredTradeRule, readHeavenWiredTradeRulesDefinition } from './HeavenWiredTradeRuleParser';

/**
 * Heaven Polaris WiredTradeOpenComposer:
 * int contractType, string rewardText, string layoutType, bool showRequirementsImmediate,
 * bool overridePreviousTrade, int timeoutSeconds, then ContractWireUtil.appendRules.
 * Do not replace with the upstream AIR TradeRequirement layout; its field order differs.
 */
export class WiredTradeOpenMessageParser implements IMessageParser
{
    private _contractType = 0;
    private _rewardText = '';
    private _layoutType = '';
    private _giveRules: IHeavenWiredTradeRule[] = [];
    private _rewardRule: IHeavenWiredTradeRule | null = null;
    private _showRequirementsImmediate = false;
    private _overridePreviousTrade = false;
    private _timeoutSeconds = 0;

    public flush(): boolean
    {
        this._contractType = 0;
        this._rewardText = '';
        this._layoutType = '';
        this._giveRules = [];
        this._rewardRule = null;
        this._showRequirementsImmediate = false;
        this._overridePreviousTrade = false;
        this._timeoutSeconds = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this.flush();
        try
        {
            this._contractType = wrapper.readInt();
            this._rewardText = wrapper.readString();
            this._layoutType = wrapper.readString();
            this._showRequirementsImmediate = wrapper.readBoolean();
            this._overridePreviousTrade = wrapper.readBoolean();
            this._timeoutSeconds = wrapper.readInt();
            const rules = readHeavenWiredTradeRulesDefinition(wrapper);
            this._giveRules = rules.giveRules;
            this._rewardRule = rules.rewardRule;
            return true;
        }
        catch { this.flush(); return false; }
    }

    public get contractType(): number { return this._contractType; }
    public get rewardText(): string { return this._rewardText; }
    public get layoutType(): string { return this._layoutType; }
    public get giveRules(): IHeavenWiredTradeRule[] { return this._giveRules; }
    public get rewardRule(): IHeavenWiredTradeRule | null { return this._rewardRule; }
    public get showRequirementsImmediate(): boolean { return this._showRequirementsImmediate; }
    public get overridePreviousTrade(): boolean { return this._overridePreviousTrade; }
    public get timeoutSeconds(): number { return this._timeoutSeconds; }
}
