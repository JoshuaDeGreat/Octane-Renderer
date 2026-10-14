import { describe, expect, it } from 'vitest';
import { FurnitureMultiStateLogic, FurnitureRecolorableVisualization, RoomObjectLogicFactory, RoomObjectVisualizationFactory } from '.';

// Habbo's recolourable Builders Club furni (*_recolorable) declare "furniture_recolorable".
describe('furniture_recolorable', () =>
{
    it('switches states like any multi-state furni', () =>
    {
        expect(new RoomObjectLogicFactory().getLogicType('furniture_recolorable')).toBe(FurnitureMultiStateLogic);
    });

    it('tints the recolorable layer', () =>
    {
        expect(new RoomObjectVisualizationFactory().getVisualizationType('furniture_recolorable')).toBe(FurnitureRecolorableVisualization);
    });

    it('reads the colour from r, g and b, white when missing or invalid', () =>
    {
        expect(FurnitureRecolorableVisualization.colorOf({ state: '0', r: '255', g: '128', b: '0' })).toBe(0xFF8000);
        expect(FurnitureRecolorableVisualization.colorOf({ state: '0' })).toBe(0xFFFFFF);
        expect(FurnitureRecolorableVisualization.colorOf({ r: 'x', g: '300', b: '-1' })).toBe(0xFFFFFF);
        expect(FurnitureRecolorableVisualization.colorOf(null)).toBe(0xFFFFFF);
    });
});
