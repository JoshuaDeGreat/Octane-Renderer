import { describe, expect, it } from 'vitest';
import { FurnitureNftCreditLogic } from './FurnitureNftCreditLogic';

describe('FurnitureNftCreditLogic', () =>
{
    it('reads the emerald value from the furni type as the official logic', () =>
    {
        expect(FurnitureNftCreditLogic.emeraldValue('nft_emerald_50')).toBe(50);
        expect(FurnitureNftCreditLogic.emeraldValue('nft_emerald_emerhand')).toBe(15000);
        expect(FurnitureNftCreditLogic.emeraldValue('nft_emerald_eggmerald')).toBe(2000);
        expect(FurnitureNftCreditLogic.emeraldValue('nft_emerald_box')).toBe(0);
        expect(FurnitureNftCreditLogic.emeraldValue('')).toBe(0);
    });
});
