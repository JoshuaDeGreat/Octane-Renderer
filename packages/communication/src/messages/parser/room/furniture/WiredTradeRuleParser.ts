import { IMessageDataWrapper } from '@octane/api';

/** Heaven Polaris contract wire: int kind, int currencyType, bool wallItem, int spriteId, int amount. */
export const WIRED_TRADE_NODE_COINS = 0;
export const WIRED_TRADE_NODE_FURNI = 1;

export interface IWiredTradeNode
{
    kind: number;
    currencyType: number;
    wallItem: boolean;
    spriteId: number;
    amount: number;
}
export interface IWiredTradeRule { nodes: IWiredTradeNode[]; }
// The Heaven UI uses explicit aliases to distinguish this Polaris wire format
// from upstream AIR trade requirements.
export type IHeavenWiredTradeNode = IWiredTradeNode;
export type IHeavenWiredTradeRule = IWiredTradeRule;
export interface IWiredTradeRulesDefinition { giveRules: IWiredTradeRule[]; rewardRule: IWiredTradeRule | null; }

const MAX_RULES = 128;
const MAX_NODES = 512;
const readCount = (wrapper: IMessageDataWrapper, limit: number): number =>
{
    const count = wrapper.readInt();
    if(count < 0 || count > limit) throw new Error('Invalid Heaven wired trade count');
    return count;
};

export const readWiredTradeNode = (wrapper: IMessageDataWrapper): IWiredTradeNode =>
{
    const kind = wrapper.readInt();
    const currencyType = wrapper.readInt();
    const wallItem = wrapper.readBoolean();
    const spriteId = wrapper.readInt();
    const amount = wrapper.readInt();
    if(kind !== WIRED_TRADE_NODE_COINS && kind !== WIRED_TRADE_NODE_FURNI) throw new Error('Invalid Heaven wired trade kind');
    return { kind, currencyType, wallItem, spriteId, amount };
};

export const readWiredTradeRule = (wrapper: IMessageDataWrapper): IWiredTradeRule =>
{
    const count = readCount(wrapper, MAX_NODES);
    const nodes: IWiredTradeNode[] = [];
    for(let i = 0; i < count; i++) nodes.push(readWiredTradeNode(wrapper));
    return { nodes };
};

/** Polaris ContractWireUtil.appendRules: int alternatives, rule[], bool hasReward, rewardRule? */
export const readWiredTradeRulesDefinition = (wrapper: IMessageDataWrapper): IWiredTradeRulesDefinition =>
{
    const count = readCount(wrapper, MAX_RULES);
    const giveRules: IWiredTradeRule[] = [];
    for(let i = 0; i < count; i++) giveRules.push(readWiredTradeRule(wrapper));
    const rewardRule = wrapper.readBoolean() ? readWiredTradeRule(wrapper) : null;
    return { giveRules, rewardRule };
};
