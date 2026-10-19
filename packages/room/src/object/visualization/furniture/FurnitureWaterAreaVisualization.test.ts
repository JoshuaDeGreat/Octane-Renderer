import { IGraphicAsset, IGraphicAssetCollection } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { FurnitureWaterAreaVisualization } from './FurnitureWaterAreaVisualization';
import { ShoreMaskCreatorUtility } from './ShoreMaskCreatorUtility';

const SIZE = 64;
const shore = { texture: { width: 128, height: 80 } } as unknown as IGraphicAsset;

const maskOf = (collection: IGraphicAssetCollection, state: number) =>
{
    const { borders, borderTypes } = FurnitureWaterAreaVisualization.computeShoreBorders(state, 2, 2);
    const mask = ShoreMaskCreatorUtility.createEmptyMask(128, 80);

    ShoreMaskCreatorUtility.createShoreMask2x2(mask, SIZE, borders, borderTypes, collection);

    return mask.alpha.reduce((count, alpha) => count + (alpha ? 1 : 0), 0);
};

describe('FurnitureWaterAreaVisualization shore', () =>
{
    it('shows every segment of a lone pool and none of one surrounded by water', () =>
    {
        expect(FurnitureWaterAreaVisualization.computeShoreBorders(0, 2, 2).borders).toEqual(new Array(8).fill(true));
        expect(FurnitureWaterAreaVisualization.computeShoreBorders(0xFFF, 2, 2).borders).toEqual(new Array(8).fill(false));
    });

    it('reads the neighbour bits in the server order', () =>
    {
        // Water right of the tile: (x+2, y+2), (x+2, y+1), (x+2, y) and (x+2, y-1).
        const right = FurnitureWaterAreaVisualization.computeShoreBorders(0b0001_0101_0001, 2, 2).borders;

        expect(right).toEqual([ true, true, false, false, true, true, true, true ]);

        // Water above the tile: the top row, (x+2, y-1) to (x-1, y-1).
        const top = FurnitureWaterAreaVisualization.computeShoreBorders(0b1111_0000_0000, 2, 2).borders;

        expect(top).toEqual([ false, false, true, true, true, true, true, true ]);
    });

    // Builds every shore mask; on a busy machine that takes longer than the 5 s default.
    it('has a mask for every segment and cut any neighbour state can ask for', () =>
    {
        const collection = {} as IGraphicAssetCollection;

        expect(ShoreMaskCreatorUtility.initializeShoreMasks(SIZE, collection, shore)).toBe(true);

        const lone = maskOf(collection, 0);

        expect(lone).toBeGreaterThan(0);
        expect(maskOf(collection, 0xFFF)).toBe(0);

        for(let state = 0; state < 4096; state++)
        {
            const { borders, borderTypes } = FurnitureWaterAreaVisualization.computeShoreBorders(state, 2, 2);
            const single = ShoreMaskCreatorUtility.createEmptyMask(128, 80);

            borders.forEach((shown, segment) =>
            {
                if(!shown) return;

                const only = borders.map((_, index) => (index === segment));

                ShoreMaskCreatorUtility.createShoreMask2x2(single, SIZE, only, borderTypes, collection);

                expect(single.alpha.some(alpha => alpha > 0), `state ${ state } segment ${ segment } type ${ borderTypes[segment] }`).toBe(true);
            });

            expect(maskOf(collection, state)).toBeLessThanOrEqual(lone);
        }
    }, 30_000);
});
