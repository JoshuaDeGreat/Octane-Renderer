import { RoomObjectVariable } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { WiredFurnitureEffectState } from './WiredFurnitureEffectState';

const model = () =>
{
    const values = new Map<string, unknown>();

    return {
        setValue: (key: string, value: unknown) => values.set(key, value),
        getValue: (key: string) => values.get(key),
        values
    };
};

describe('WiredFurnitureEffectState', () =>
{
    it('eases transparency over 500 ms and snaps without easing', () =>
    {
        const state = new WiredFurnitureEffectState();
        const target = model();

        state.setTransparency(100, false, 1, false, 1000, target as never);
        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_TRANSPARENCY)).toBe(0);

        state.update(1250, target as never);
        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_TRANSPARENCY)).toBe(50);

        state.update(1600, target as never);
        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_TRANSPARENCY)).toBe(100);

        state.setTransparency(0, true, 0, false, 2000, target as never);
        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_TRANSPARENCY)).toBe(0);
        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_CLICK_THROUGH)).toBe(1);
    });

    it('applies a room-entry state at once', () =>
    {
        const state = new WiredFurnitureEffectState();
        const target = model();

        state.setHighlight(0, 80, 0x00FF00, 0, 4, true, 1000, target as never);

        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_HIGHLIGHT_STRENGTH)).toBe(80);
        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_HIGHLIGHT_COLOR)).toBe(0x00FF00);
    });

    it('pulses a highlight once a second', () =>
    {
        const state = new WiredFurnitureEffectState();
        const target = model();

        state.setHighlight(1, 100, 0xFFFFFF, 1, 0, false, 0, target as never);
        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_HIGHLIGHT_STRENGTH)).toBe(0);

        state.update(500, target as never);
        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_HIGHLIGHT_STRENGTH)).toBe(100);

        state.update(1000, target as never);
        expect(target.getValue(RoomObjectVariable.FURNITURE_WIRED_HIGHLIGHT_STRENGTH)).toBe(0);
    });
});
