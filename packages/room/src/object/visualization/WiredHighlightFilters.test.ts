import { ColorMatrixFilter } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { createWiredHighlightFilters, quantizeWiredHighlightStrength, WIRED_HIGHLIGHT_BRIGHTEN, WIRED_HIGHLIGHT_COLOR_TINT, WIRED_HIGHLIGHT_DARKEN, WiredHighlightFilterCache } from './WiredHighlightFilters';

describe('wired highlight filters', () =>
{
    it('quantizes strength in steps of 5 with 5 as the smallest visible step', () =>
    {
        expect([ 0, 1, 2, 3, 7, 8, 99, 100, 150, NaN ].map(quantizeWiredHighlightStrength)).toEqual([ 0, 5, 5, 5, 5, 10, 100, 100, 100, 0 ]);
    });

    it('keeps the colour offsets in the 0..1 range the Pixi v8 shader adds', () =>
    {
        const [ brighten ] = createWiredHighlightFilters(WIRED_HIGHLIGHT_BRIGHTEN, 0xFFFFFF, 76) as ColorMatrixFilter[];
        const [ tint ] = createWiredHighlightFilters(WIRED_HIGHLIGHT_COLOR_TINT, 0xFF0000, 100) as ColorMatrixFilter[];

        for(const index of [ 4, 9, 14 ])
        {
            expect(brighten.matrix[index]).toBeGreaterThan(0);
            expect(brighten.matrix[index]).toBeLessThan(1);
            expect(tint.matrix[index]).toBeLessThan(1);
        }
        expect(brighten.matrix[4]).toBeCloseTo((36 * 0.76) / 255);
    });

    it('darkens by up to 65 percent', () =>
    {
        const [ darken ] = createWiredHighlightFilters(WIRED_HIGHLIGHT_DARKEN, 0, 100) as ColorMatrixFilter[];

        expect(darken.matrix[0]).toBeCloseTo(0.35);
    });

    it('draws nothing at strength 0 and reuses the filters of a strength', () =>
    {
        const cache = new WiredHighlightFilterCache();

        cache.update(WIRED_HIGHLIGHT_DARKEN, 0, 0);
        expect(cache.filters).toBeNull();

        cache.update(WIRED_HIGHLIGHT_DARKEN, 50, 0);
        const first = cache.filters;

        cache.update(WIRED_HIGHLIGHT_DARKEN, 20, 0);
        cache.update(WIRED_HIGHLIGHT_DARKEN, 51, 0);

        expect(cache.filters).toBe(first);
    });
});
