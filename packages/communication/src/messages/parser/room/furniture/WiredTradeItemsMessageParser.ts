import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IHeavenWiredTradeNode, readHeavenWiredTradeNode } from './HeavenWiredTradeRuleParser';

/** Heaven Polaris InteractionWiredContract negotiation states. */
export const WIRED_TRADE_STATE_READY = 0;
export const WIRED_TRADE_STATE_ADDING_ITEMS = 1;
export const WIRED_TRADE_STATE_COUNTDOWN = 2;
export const WIRED_TRADE_STATE_CONFIRMING = 3;

export interface IWiredTradeOfferedItem { itemId: number; wallItem: boolean; spriteId: number; }
export interface IWiredTradeRewardFurni { spriteId: number; amount: number; }
export interface IWiredTradeRewardCurrency { currencyType: number; amount: number; }

/**
 * Polaris WiredTradeItemsComposer: int state, bool canAccept, int secondsLeft,
 * offered[] (itemId, wallItem, spriteId), rewardFurni[] (spriteId, amount),
 * rewardCurrency[] (currencyType, amount), missing[] (ContractWireUtil node).
 * Not compatible with upstream TradingListItemParser.
 */
export class WiredTradeItemsMessageParser implements IMessageParser
{
    private _state = WIRED_TRADE_STATE_READY;
    private _canAccept = false;
    private _secondsLeft = 0;
    private _offeredItems: IWiredTradeOfferedItem[] = [];
    private _rewardFurni: IWiredTradeRewardFurni[] = [];
    private _rewardCurrency: IWiredTradeRewardCurrency[] = [];
    private _missing: IHeavenWiredTradeNode[] = [];

    public flush(): boolean
    {
        this._state = WIRED_TRADE_STATE_READY;
        this._canAccept = false;
        this._secondsLeft = 0;
        this._offeredItems = [];
        this._rewardFurni = [];
        this._rewardCurrency = [];
        this._missing = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this.flush();
        try
        {
            const count = () =>
            {
                const n = wrapper.readInt();
                if(n < 0 || n > 512) throw new Error('Invalid Heaven wired trade item count');
                return n;
            };
            this._state = wrapper.readInt();
            this._canAccept = wrapper.readBoolean();
            this._secondsLeft = wrapper.readInt();
            for(let i = count(); i > 0; i--) this._offeredItems.push({
                itemId: wrapper.readInt(), wallItem: wrapper.readBoolean(), spriteId: wrapper.readInt()
            });
            for(let i = count(); i > 0; i--) this._rewardFurni.push({
                spriteId: wrapper.readInt(), amount: wrapper.readInt()
            });
            for(let i = count(); i > 0; i--) this._rewardCurrency.push({
                currencyType: wrapper.readInt(), amount: wrapper.readInt()
            });
            for(let i = count(); i > 0; i--) this._missing.push(readHeavenWiredTradeNode(wrapper));
            return true;
        }
        catch { this.flush(); return false; }
    }

    public get state(): number { return this._state; }
    public get canAccept(): boolean { return this._canAccept; }
    public get secondsLeft(): number { return this._secondsLeft; }
    public get offeredItems(): IWiredTradeOfferedItem[] { return this._offeredItems; }
    public get rewardFurni(): IWiredTradeRewardFurni[] { return this._rewardFurni; }
    public get rewardCurrency(): IWiredTradeRewardCurrency[] { return this._rewardCurrency; }
    public get missing(): IHeavenWiredTradeNode[] { return this._missing; }
}
