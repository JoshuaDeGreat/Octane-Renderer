import { describe, expect, it } from 'vitest';
import { FurnitureLogic, FurnitureVisualization, RoomObjectLogicFactory, RoomObjectVisualizationFactory } from '.';

// The official wf_label asset declares logic and visualization "furniture_label"; it is a plain
// static furni, and the client UI draws its bubble.
describe('furniture_label', () =>
{
    it('is a plain furni logic', () =>
    {
        expect(new RoomObjectLogicFactory().getLogicType('furniture_label')).toBe(FurnitureLogic);
    });

    it('draws as a static furni', () =>
    {
        expect(new RoomObjectVisualizationFactory().getVisualizationType('furniture_label')).toBe(FurnitureVisualization);
    });
});
