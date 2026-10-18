import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredTradeRule, readWiredTradeRule } from './WiredTradeRuleParser';

export const WIRED_TRANSACTION_SUCCESS_DEPOSIT = 0;
export const WIRED_TRANSACTION_SUCCESS_WITHDRAW = 1;
export const WIRED_TRANSACTION_SUCCESS_REWARD = 2;
export const WIRED_TRANSACTION_SUCCESS_PAYMENT = 3;
export const WIRED_TRANSACTION_SUCCESS_TRADE = 4;

/**
 * A wired transaction succeeded. AIR WIN63-202610131318 (package_196/class_3152, WiredTransactionSuccessContents):
 * int successType (0 deposit, 1 withdraw, 2 reward, 3 payment, 4 trade); only for a reward and only when bytes remain:
 * rule (int n, TradeRequirementNode[n]), string rewardText, bool openByDefault.
 */
export class WiredTransactionSuccessMessageParser implements IMessageParser
{
    private _successType: number = WIRED_TRANSACTION_SUCCESS_DEPOSIT;
    private _rewardRule: IWiredTradeRule = null;
    private _rewardText: string = '';
    private _openByDefault: boolean = false;

    public flush(): boolean
    {
        this._successType = WIRED_TRANSACTION_SUCCESS_DEPOSIT;
        this._rewardRule = null;
        this._rewardText = '';
        this._openByDefault = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._successType = wrapper.readInt();
        this._rewardRule = null;
        this._rewardText = '';
        this._openByDefault = false;

        if(this._successType !== WIRED_TRANSACTION_SUCCESS_REWARD || !wrapper.bytesAvailable) return true;

        try
        {
            this._rewardRule = readWiredTradeRule(wrapper);
            this._rewardText = wrapper.readString();
            this._openByDefault = wrapper.readBoolean();
        }
        catch
        {
            this._rewardRule = null;

            return false;
        }

        return true;
    }

    public get successType(): number
    {
        return this._successType;
    }

    /** The reward rule; null when the message carries no reward contents. */
    public get rewardRule(): IWiredTradeRule
    {
        return this._rewardRule;
    }

    public get rewardText(): string
    {
        return this._rewardText;
    }

    public get openByDefault(): boolean
    {
        return this._openByDefault;
    }

    public get hasRewardContents(): boolean
    {
        return (this._rewardRule !== null);
    }
}
