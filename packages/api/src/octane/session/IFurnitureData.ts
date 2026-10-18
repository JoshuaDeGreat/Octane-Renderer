import { FurnitureType } from './FurnitureType';

export interface IFurnitureData
{
    type: FurnitureType;
    id: number;
    className: string;
    fullName: string;
    category: string;
    hasIndexedColor: boolean;
    colorIndex: number;
    revision: number;
    tileSizeX: number;
    tileSizeY: number;
    tileSizeZ: number;
    colors: number[];
    name: string;
    description: string;
    adUrl: string;
    purchaseOfferId: number;
    rentOfferId: number;
    customParams: string;
    specialType: number;
    purchaseCouldBeUsedForBuyout: boolean;
    rentCouldBeUsedForBuyout: boolean;
    availableForBuildersClub: boolean;
    /** The Builders Club catalogue offer placing this furni, -1 when none (furnidata bcofferid). */
    bcOfferId: number;
    allowStack: boolean;
    canPutStuffOn?: boolean;
    height?: number;
    tradeable?: boolean;
    canStandOn: boolean;
    canSitOn: boolean;
    canLayOn: boolean;
    isExternalImage: boolean;
    excludeDynamic: boolean;
    furniLine: string;
    environment: string;
    rare: boolean;
}
