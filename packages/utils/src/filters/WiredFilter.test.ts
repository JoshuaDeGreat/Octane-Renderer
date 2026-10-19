import { describe, expect, it } from 'vitest';
import { WiredFilter } from './WiredFilter';

describe('WiredFilter', () =>
{
    it('keeps the old look by default: outline in the line colour, 28 % of the colour, nothing after', () =>
    {
        const filter = new WiredFilter({ lineColor: [ 0.45, 0.95, 0.55 ], color: [ 0.18, 0.78, 0.3 ] });

        expect(filter.uniforms.uMix).toBeCloseTo(0.28);
        expect(filter.uniforms.uReplaceLine).toBe(1);
        expect([ ...filter.uniforms.uScale ]).toEqual([ 1, 1, 1 ]);
        expect([ ...filter.uniforms.uOffset ]).toEqual([ 0, 0, 0 ]);
        expect(filter.uniforms.uAlpha).toBe(1);
        expect(filter.uniforms.uLineColor[1]).toBeCloseTo(0.95);
    });

    it('takes a colour matrix to apply last and can leave the outline alone', () =>
    {
        const filter = new WiredFilter({ lineColor: 0x000000, color: 0x000000, mix: 0, replaceLine: false, scale: [ 0.9, 1, 1 ], offset: [ 0, 40 / 255, 80 / 255 ], alpha: 0.8 });

        expect(filter.uniforms.uMix).toBe(0);
        expect(filter.uniforms.uReplaceLine).toBe(0);
        expect(filter.uniforms.uScale[0]).toBeCloseTo(0.9);
        expect(filter.uniforms.uOffset[2]).toBeCloseTo(80 / 255);
        expect(filter.uniforms.uAlpha).toBeCloseTo(0.8);
    });
});
