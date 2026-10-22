import { afterEach, describe, expect, it } from 'vitest';
import { parseGroupBadgeParts, readGroupBadgePartsCache, serializeGroupBadgeParts, writeGroupBadgePartsCache } from './GroupBadgePartsCache';

const tables = () => ({
    bases: new Map([ [ 2, [ 'base_basic_2' ] ], [ 1, [ 'base_basic_1', 'base_basic_1_part2' ] ] ]),
    symbols: new Map([ [ 7, [ 'symbol_star' ] ] ]),
    partColors: new Map([ [ 1, 'FFFFFF' ], [ 2, '3366CC' ] ])
});

describe('group badge parts cache', () =>
{
    afterEach(() => localStorage.clear());

    it('gives the same text for the same tables in any order', () =>
    {
        const reordered = tables();

        reordered.bases = new Map([ ...reordered.bases.entries() ].reverse());

        expect(serializeGroupBadgeParts(reordered)).toBe(serializeGroupBadgeParts(tables()));
    });

    it('keeps the tables between sessions', () =>
    {
        writeGroupBadgePartsCache(serializeGroupBadgeParts(tables()));

        const read = readGroupBadgePartsCache();

        expect(read?.bases.get(1)).toEqual([ 'base_basic_1', 'base_basic_1_part2' ]);
        expect(read?.symbols.get(7)).toEqual([ 'symbol_star' ]);
        expect(read?.partColors.get(2)).toBe('3366CC');
    });

    it('ignores a missing, broken or empty copy', () =>
    {
        expect(readGroupBadgePartsCache()).toBeNull();
        expect(parseGroupBadgeParts('{broken')).toBeNull();
        expect(parseGroupBadgeParts(JSON.stringify({ bases: [], symbols: [], partColors: [] }))).toBeNull();
    });
});
