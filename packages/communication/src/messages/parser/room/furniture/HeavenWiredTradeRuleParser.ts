import { IMessageDataWrapper } from '@octane/api';

/** Heaven Polaris contract wire: int kind, int currencyType, bool wallItem, int spriteId, int amount. */
export const HEAVEN_WIRED_TRADE_NODE_COINS = 0;
export const HEAVEN_WIRED_TRADE_NODE_FURNI = 1;

export interface IHeavenWiredTradeNode
{
    kind: number;
    currencyType: number;
    wallItem: boolean;
    spriteId: number;
    amount: number;
}
export interface IHeavenWiredTradeRule { nodes: IHeavenWiredTradeNode[]; }
export interface IHeavenWiredTradeRulesDefinition { giveRules: IHeavenWiredTradeRule[]; rewardRule: IHeavenWiredTradeRule | null; }

const MAX_RULES = 128;
const MAX_NODES = 512;
const readCount = (wrapper: IMessageDataWrapper, limit: number): number =>
{
    const count = wrapper.readInt();
    if(count < 0 || count > limit) throw new Error('Invalid Heaven wired trade count');
    return count;
};

export const readHeavenWiredTradeNode = (wrapper: IMessageDataWrapper): IHeavenWiredTradeNode =>
{
    const kind = wrapper.readInt();
    const currencyType = wrapper.readInt();
    const wallItem = wrapper.readBoolean();
    const spriteId = wrapper.readInt();
    const amount = wrapper.readInt();
    if(kind !== HEAVEN_WIRED_TRADE_NODE_COINS && kind !== HEAVEN_WIRED_TRADE_NODE_FURNI) throw new Error('Invalid Heaven wired trade kind');
    return { kind, currencyType, wallItem, spriteId, amount };
};

export const readHeavenWiredTradeRule = (wrapper: IMessageDataWrapper): IHeavenWiredTradeRule =>
{
    const count = readCount(wrapper, MAX_NODES);
    const nodes: IHeavenWiredTradeNode[] = [];
    for(let i = 0; i < count; i++) nodes.push(readHeavenWiredTradeNode(wrapper));
    return { nodes };
};

/** Polaris ContractWireUtil.appendRules: int alternatives, rule[], bool hasReward, rewardRule? */
export const readHeavenWiredTradeRulesDefinition = (wrapper: IMessageDataWrapper): IHeavenWiredTradeRulesDefinition =>
{
    const count = readCount(wrapper, MAX_RULES);
    const giveRules: IHeavenWiredTradeRule[] = [];
    for(let i = 0; i < count; i++) giveRules.push(readHeavenWiredTradeRule(wrapper));
    const rewardRule = wrapper.readBoolean() ? readHeavenWiredTradeRule(wrapper) : null;
    return { giveRules, rewardRule };
};
