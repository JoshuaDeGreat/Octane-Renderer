import { IMessageDataWrapper } from '@octane/api';
import { IWiredContractDefinition, IWiredContractNode, IWiredContractRule } from '../../roomevents/WiredContractData';

/** TradeRequirementNode types (AIR package_231/TradeRequirementNode: byte type). */
export const WIRED_TRADE_NODE_COINS = 0;
export const WIRED_TRADE_NODE_FURNI = 1;

/**
 * One thing a trade asks for or hands back: a pile of coins, or a pile of one kind of furni. Same wire shape as the
 * contract editor's node (AIR TradeRequirementNode): byte type, int amount, if furni: bool wall, int typeId,
 * string posterId.
 */
export type IWiredTradeNode = IWiredContractNode;

/** Nodes inside a rule are joined (all must be met); alternative rules are or-ed. */
export type IWiredTradeRule = IWiredContractRule;

/** AIR TradeRequirementRulesDefinition: bool hasGive, [int n, rule[n]], bool hasGet, [rule]. */
export type IWiredTradeRulesDefinition = IWiredContractDefinition;

/** Smallest wire size of a node (byte type + int amount) and of a rule (int count). */
const MIN_NODE_BYTES = 5;
const MIN_RULE_BYTES = 4;

/**
 * Reads a list count without a fixed cap -- AIR TradeRequirementRule / TradeRequirementRulesDefinition.readFromMessage
 * have none, and a give-from-chest reward can name any number of furni types. A count that cannot fit in the bytes
 * left is refused so a bogus value cannot loop.
 */
const readCount = (wrapper: IMessageDataWrapper, minItemBytes: number): number =>
{
    const count = wrapper.readInt();

    if(count < 0) throw new Error('Invalid wired trade list count');

    const remaining = wrapper.remainingBytes;

    if(remaining !== undefined && count * minItemBytes > remaining) throw new Error('Wired trade list count exceeds the packet');

    return count;
};

const readNode = (wrapper: IMessageDataWrapper): IWiredTradeNode =>
{
    if(!wrapper.bytesAvailable) throw new Error('Truncated wired trade node');

    const type = wrapper.readByte();

    if(type !== WIRED_TRADE_NODE_COINS && type !== WIRED_TRADE_NODE_FURNI) throw new Error('Invalid wired trade node type');

    const amount = wrapper.readInt();
    const itemType = type === WIRED_TRADE_NODE_FURNI
        ? { isWallItem: wrapper.readBoolean(), typeId: wrapper.readInt(), legacyPosterId: wrapper.readString() }
        : null;

    return { type, amount, itemType };
};

/** AIR TradeRequirementRule: int n, TradeRequirementNode[n] (uncapped; the contract editor keeps its own caps). */
export const readWiredTradeRule = (wrapper: IMessageDataWrapper): IWiredTradeRule =>
{
    const count = readCount(wrapper, MIN_NODE_BYTES);
    const nodes: IWiredTradeNode[] = [];

    for(let i = 0; i < count; i++) nodes.push(readNode(wrapper));

    return { nodes };
};

/** AIR TradeRequirementRulesDefinition, uncapped: bool hasGive, [int n, rule[n]], bool hasGet, [rule]. */
export const readWiredTradeRulesDefinition = (wrapper: IMessageDataWrapper): IWiredTradeRulesDefinition =>
{
    let youGiveRule: IWiredTradeRule[] = null;

    if(wrapper.readBoolean())
    {
        const count = readCount(wrapper, MIN_RULE_BYTES);

        youGiveRule = [];

        for(let i = 0; i < count; i++) youGiveRule.push(readWiredTradeRule(wrapper));
    }

    const youGetRule = wrapper.readBoolean() ? readWiredTradeRule(wrapper) : null;

    return { youGiveRule, youGetRule };
};
