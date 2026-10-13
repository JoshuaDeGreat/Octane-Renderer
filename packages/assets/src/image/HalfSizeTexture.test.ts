import { describe, expect, it } from 'vitest';
import { halfSizeOffset, halfSizePadding, halvePixels } from './HalfSizeTexture';

const rgba = (pixels: number[][]): Uint8ClampedArray => new Uint8ClampedArray(pixels.flat());
const pixel = (data: Uint8ClampedArray, width: number, x: number, y: number): number[] => Array.from(data.slice(((y * width) + x) * 4, ((y * width) + x) * 4 + 4));

const RED = [200, 40, 40, 255];
const PINK = [220, 80, 80, 255];
const BLACK = [10, 10, 10, 255];
const NONE = [0, 0, 0, 0];

describe('halvePixels', () =>
{
    it('averages a block of similar colours', () =>
    {
        const { data, width, height } = halvePixels(rgba([RED, PINK, PINK, RED]), 2, 2);

        expect([width, height]).toEqual([1, 1]);
        expect(pixel(data, 1, 0, 0)).toEqual([210, 60, 60, 255]);
    });

    it('keeps a dark outline (two pixels of the block) instead of a muddy average', () =>
    {
        expect(pixel(halvePixels(rgba([BLACK, PINK, BLACK, PINK]), 2, 2).data, 1, 0, 0)).toEqual(BLACK);
    });

    it('averages a single dark detail pixel', () =>
    {
        expect(pixel(halvePixels(rgba([BLACK, PINK, PINK, PINK]), 2, 2).data, 1, 0, 0)).toEqual([168, 63, 63, 255]);
    });

    it('drops a block with a single pixel, keeps one with two', () =>
    {
        expect(pixel(halvePixels(rgba([RED, NONE, NONE, NONE]), 2, 2).data, 1, 0, 0)).toEqual(NONE);
        expect(pixel(halvePixels(rgba([RED, NONE, NONE, RED]), 2, 2).data, 1, 0, 0)).toEqual(RED);
    });

    it('keeps see-through pixels (glass) with their alpha', () =>
    {
        const glass = [120, 180, 220, 90];

        expect(pixel(halvePixels(rgba([glass, glass, glass, glass]), 2, 2).data, 1, 0, 0)).toEqual(glass);
    });

    it('rounds odd sizes up and applies the padding in front', () =>
    {
        // 3x1 row, padded by one column: blocks are [pad, a] and [b, c].
        const { data, width, height } = halvePixels(rgba([RED, RED, RED]), 3, 1, 1, 0);

        expect([width, height]).toEqual([2, 1]);
        expect(pixel(data, 2, 0, 0)).toEqual(NONE);
        expect(pixel(data, 2, 1, 0)).toEqual(RED);
    });
});

describe('half-size placement', () =>
{
    it('puts every full-size pixel in the half-size pixel that covers its position', () =>
    {
        for(let offset = -7; offset <= 7; offset++)
        {
            const pad = halfSizePadding(offset);
            const half = halfSizeOffset(offset, false);

            for(let i = 0; i < 12; i++)
            {
                // Full pixel i sits at offset + i; in the texture it lands in half pixel floor((i + pad) / 2).
                expect(half + Math.floor((i + pad) / 2)).toBe(Math.floor((offset + i) / 2));
            }
        }
    });

    it('does the same for flipped sprites, which grow to the left of their offset', () =>
    {
        for(let offset = -7; offset <= 7; offset++)
        {
            const pad = halfSizePadding(offset);
            const half = halfSizeOffset(offset, true);

            for(let i = 0; i < 12; i++)
            {
                // Flipped: texture pixel i covers [offset - i - 1, offset - i]; half pixel k covers [half - k - 1, half - k].
                const k = Math.floor((i + pad) / 2);

                expect(half - k - 1).toBe(Math.floor((offset - i - 1) / 2));
            }
        }
    });
});

describe('halvePixels detail', () =>
{
    it('averages contrasty detail that is not an outline (paintings keep their colours)', () =>
    {
        const GOLD = [230, 190, 60, 255];
        const BROWN = [150, 100, 40, 255];

        expect(pixel(halvePixels(rgba([GOLD, BROWN, BROWN, GOLD]), 2, 2).data, 1, 0, 0)).toEqual([190, 145, 50, 255]);
    });
});
