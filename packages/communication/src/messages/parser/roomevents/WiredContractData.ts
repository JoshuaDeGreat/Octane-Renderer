import { IMessageDataWrapper } from '@octane/api';

export interface IWiredContractItemType { isWallItem: boolean; typeId: number; legacyPosterId: string; }
export interface IWiredContractNode { type: 0 | 1; amount: number; itemType: IWiredContractItemType | null; }
export interface IWiredContractRule { nodes: IWiredContractNode[]; }
export interface IWiredContractDefinition { youGiveRule: IWiredContractRule[] | null; youGetRule: IWiredContractRule | null; }
export interface IWiredContractContents {
    contractId: number;
    contractType: 0 | 1 | 2;
    definition: IWiredContractDefinition;
    paymentMode: number;
    receiveText: string;
    layoutType: string;
    rewardCategory: number;
    showDialog: boolean;
    rewardText: string;
}

/** AIR TradeRequirementRule / TradeRequirementNode / ChestItemType: byte kind, int amount, optional furni tuple. */
export function readWiredContractRule(wrapper: IMessageDataWrapper): IWiredContractRule
{
    const count = wrapper.readInt();
    if(count < 0 || count > 5) throw new Error('Invalid contract node count');
    const nodes: IWiredContractNode[] = [];
    for(let i = 0; i < count; i++)
    {
        const type = wrapper.readByte();
        if(type !== 0 && type !== 1) throw new Error('Invalid contract node type');
        const amount = wrapper.readInt();
        const itemType = type === 1 ? { isWallItem: wrapper.readBoolean(), typeId: wrapper.readInt(), legacyPosterId: wrapper.readString() } : null;
        nodes.push({ type, amount, itemType });
    }
    return { nodes };
}

/** AIR TradeRequirementRulesDefinition preserves absent rules separately from empty rules. */
export function readWiredContractDefinition(wrapper: IMessageDataWrapper): IWiredContractDefinition
{
    let youGiveRule: IWiredContractRule[] | null = null;
    if(wrapper.readBoolean())
    {
        const count = wrapper.readInt();
        if(count < 0 || count > 3) throw new Error('Invalid contract alternative count');
        youGiveRule = [];
        for(let i = 0; i < count; i++) youGiveRule.push(readWiredContractRule(wrapper));
    }
    const youGetRule = wrapper.readBoolean() ? readWiredContractRule(wrapper) : null;
    return { youGiveRule, youGetRule };
}
