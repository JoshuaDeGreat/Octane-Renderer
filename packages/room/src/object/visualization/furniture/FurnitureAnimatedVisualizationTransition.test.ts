import { IAssetData } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { FurnitureAnimatedVisualization } from './FurnitureAnimatedVisualization';
import { FurnitureAnimatedVisualizationData } from './FurnitureAnimatedVisualizationData';

// Animation shaped like wf_antenna2 (size 64): static 0 and 1, plus
// 100 (transitionTo=1) and 101 (transitionTo=0) with two animated layers,
// frameRepeat 3 and loopCount 1.
const ringLayers = {
    0: {},
    1: { frameRepeat: 3, loopCount: 1, frameSequences: { 0: { frames: Object.fromEntries([ 1, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0 ].map((id, index) => [ index, { id } ])) } } },
    2: { frameRepeat: 3, loopCount: 1, frameSequences: { 0: { frames: Object.fromEntries([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 ].map((id, index) => [ index, { id } ])) } } }
};

const ANTENNA = {
    name: 'wf_antenna2',
    visualizations: [ {
        size: 64,
        layerCount: 3,
        angle: 45,
        animations: {
            0: { layers: { 0: {}, 1: {}, 2: {} } },
            1: { layers: { 0: {}, 1: {}, 2: {} } },
            100: { transitionTo: 1, layers: ringLayers },
            101: { transitionTo: 0, layers: ringLayers }
        }
    } ]
} as unknown as IAssetData;

const SCALE = 64;

class TestVisualization extends FurnitureAnimatedVisualization
{
    constructor(private readonly _testData: FurnitureAnimatedVisualizationData)
    {
        super();
    }

    protected get data(): FurnitureAnimatedVisualizationData
    {
        return this._testData;
    }

    // Mirrors AnimatedFurnitureVisualization.updateObject (AIR
    // WIN63-202610131318-860371703, AnimatedFurnitureVisualization.as:83-110).
    public applyState(state: number): void
    {
        if(state === this._state) return;

        this.setAnimation(state);

        this._state = state;
    }

    public tick(): void
    {
        this.updateAnimation(SCALE);
    }

    public frameId(layerId: number): number
    {
        return this.getFrameNumber(SCALE, layerId);
    }
}

const createVisualization = () =>
{
    const data = new FurnitureAnimatedVisualizationData();

    expect(data.initialize(ANTENNA)).toBe(true);

    const visualization = new TestVisualization(data);

    visualization.applyState(0);
    visualization.tick();

    return visualization;
};

// Furniture animates every 41 ms in AIR (FurnitureVisualization.as:324-331).
// The server flips the state every 200 ms, as a Fast Queue antenna does.
const runFlips = (ticks: number) =>
{
    const visualization = createVisualization();
    const layer2: number[] = [];
    const animationIds: number[] = [];

    for(let tick = 1; tick <= ticks; tick++)
    {
        visualization.applyState(Math.floor((tick * 41) / 200) % 2 === 0 ? 1 : 0);
        visualization.tick();

        layer2.push(visualization.frameId(2));
        animationIds.push(visualization.animationId);
    }

    return { layer2, animationIds };
};

describe('FurnitureAnimatedVisualization transitions (AIR parity)', () =>
{
    it('plays a single transition through all of its frames', () =>
    {
        const visualization = createVisualization();
        const layer2: number[] = [];

        visualization.applyState(1);

        for(let tick = 0; tick < 30; tick++)
        {
            visualization.tick();
            layer2.push(visualization.frameId(2));
        }

        expect(layer2).toEqual([ 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 0, 0, 0 ]);
    });

    it('keeps the rings growing across 0/1 flips every 200 ms instead of restarting', () =>
    {
        const { layer2, animationIds } = runFlips(60);

        // The state really flips between the two transitions while this runs.
        expect(animationIds.filter((id, index) => (index > 0) && (id !== animationIds[index - 1])).length).toBeGreaterThanOrEqual(10);
        expect(new Set(animationIds)).toEqual(new Set([ 1000000, 1000001 ]));

        // AIR carries the active sequence offset into the new transition
        // (AnimationStateData.as:110-111, AnimatedFurnitureVisualization.as:343-354),
        // so each flip moves on to the next frame instead of going back to 1.
        // Once the sequence runs out, getFrameFromSequence falls back to
        // getFrame(frameCounter) (AnimationLayerData.as:139-142) and the rings
        // start again: a 24 tick (~1 s) loop, as seen on hhus.
        // Flips land on ticks 1, 5, 10, 15, 20 and 25.
        expect(layer2.slice(0, 26)).toEqual([
            1, 1, 1, 2,
            3, 3, 3, 4, 4,
            5, 5, 5, 6, 6,
            7, 7, 7, 8, 8,
            9, 9, 9, 0, 0,
            1, 1
        ]);

        // Every frame of the ring sequence is reached, and outside of the
        // wrap at the end of the sequence the frame never goes backwards.
        expect(new Set(layer2)).toEqual(new Set([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]));

        for(let index = 1; index < layer2.length; index++)
        {
            const previous = layer2[index - 1];
            const current = layer2[index];

            if(current >= previous) continue;

            expect([ previous, current ]).toEqual([ 9, 0 ]);
        }
    });
});
