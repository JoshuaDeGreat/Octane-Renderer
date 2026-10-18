import { describe, expect, it, vi } from 'vitest';
import { FurnitureGuildIsometricBadgeVisualization } from './FurnitureGuildIsometricBadgeVisualization';

vi.mock('@octane/utils', () => ({
    ChooserSelectionFilter: class
    {},
    GetRenderer: () => null,
    TextureUtils: {},
    Vector3d: class
    {}
}));

vi.mock('../../../utils', () => ({
    RoomGeometry: class
    {}
}));

const matrixOf = (direction: number, flipH: boolean = false) =>
{
    const { a, b, c, d, tx, ty } = FurnitureGuildIsometricBadgeVisualization.getThumbnailMatrix(direction, 39, 40, flipH);

    return { a, b, c, d, tx, ty };
};

describe('FurnitureGuildIsometricBadgeVisualization', () =>
{
    // guild_forum: the THUMBNAIL layer asset is 40px wide, a group badge 39px.
    const scale = 40 / 39;

    it('shears the badge down to the right for directions 0 and 4, 1.1 times as tall as wide (class_1881)', () =>
    {
        for(const direction of [ 0, 4 ])
        {
            const matrix = matrixOf(direction);

            expect(matrix.a).toBeCloseTo(scale);
            expect(matrix.b).toBeCloseTo(0.5 * scale);
            expect(matrix.c).toBe(0);
            expect(matrix.d).toBeCloseTo(1.1 * scale);
            expect(matrix.tx).toBe(0);
            expect(matrix.ty).toBe(0);
        }
    });

    it('shears the badge up to the right for direction 2, starting half the asset width down', () =>
    {
        const matrix = matrixOf(2);

        expect(matrix.a).toBeCloseTo(scale);
        expect(matrix.b).toBeCloseTo(-0.5 * scale);
        expect(matrix.d).toBeCloseTo(1.1 * scale);
        expect(matrix.tx).toBe(0);
        expect(matrix.ty).toBeCloseTo(20);
    });

    it('only scales the badge for the other directions', () =>
    {
        const matrix = matrixOf(6);

        expect(matrix.a).toBeCloseTo(scale);
        expect(matrix.b).toBe(0);
        expect(matrix.d).toBeCloseTo(scale);
    });

    it('pre-mirrors the drawing for a mirrored layer asset, so the shown badge is the one AIR draws', () =>
    {
        const matrix = matrixOf(2, true);

        expect(matrix.a).toBeCloseTo(-scale);
        expect(matrix.b).toBeCloseTo(-0.5 * scale);
        expect(matrix.tx).toBe(40);
        expect(matrix.ty).toBeCloseTo(20);

        // The right edge of the badge (u = 39) is drawn at x = 0, which the mirrored sprite shows at the right edge again.
        expect(matrix.a * 39 + matrix.tx).toBeCloseTo(0);
    });

    it('tints COLOR1 / COLOR2 with the parsed group colours, black included, and uses the defaults only without one', () =>
    {
        expect(FurnitureGuildIsometricBadgeVisualization.getGuildColor(0x112233, 0xEEEEEE)).toBe(0x112233);
        expect(FurnitureGuildIsometricBadgeVisualization.getGuildColor(0, 0xEEEEEE)).toBe(0);
        expect(FurnitureGuildIsometricBadgeVisualization.getGuildColor(undefined, 0xEEEEEE)).toBe(0xEEEEEE);
        expect(FurnitureGuildIsometricBadgeVisualization.getGuildColor(NaN, 0x4B4B4B)).toBe(0x4B4B4B);
    });
});
