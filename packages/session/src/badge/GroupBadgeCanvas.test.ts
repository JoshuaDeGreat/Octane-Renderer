import { describe, expect, it } from 'vitest';
import { drawGroupBadge, GroupBadgeLayer } from './GroupBadgeCanvas';

type Call = [string, ...unknown[]];

const fakeCanvas = (calls: Call[], label: string) =>
{
    const context = {
        imageSmoothingEnabled: true,
        globalCompositeOperation: 'source-over',
        fillStyle: '',
        drawImage: (...args: unknown[]) => calls.push([`${ label }.drawImage:${ context.globalCompositeOperation }`, ...args]),
        fillRect: (...args: unknown[]) => calls.push([`${ label }.fillRect:${ context.globalCompositeOperation }:${ context.fillStyle }`, ...args])
    };

    return { width: 0, height: 0, getContext: () => context, label } as unknown as HTMLCanvasElement;
};

const partImage = () => document.createElement('canvas');

const layer = (tint: number | null, x = 1, y = 2): GroupBadgeLayer => ({
    texture: { source: { resource: partImage() }, frame: { x: 0, y: 0, width: 10, height: 8 } } as unknown as GroupBadgeLayer['texture'],
    x,
    y,
    tint
});

describe('drawGroupBadge', () =>
{
    it('draws untinted layers straight onto the badge at their cell position', () =>
    {
        const calls: Call[] = [];
        const canvas = drawGroupBadge([ layer(null), layer(0xFFFFFF, 4, 5) ], 39, 39, () => fakeCanvas(calls, 'badge'));

        expect(canvas).not.toBeNull();
        expect(calls.map(call => [ call[0], call.slice(-4) ])).toEqual([
            [ 'badge.drawImage:source-over', [ 1, 2, 10, 8 ] ],
            [ 'badge.drawImage:source-over', [ 4, 5, 10, 8 ] ]
        ]);
    });

    it('multiplies a tinted layer by its colour and keeps the part alpha', () =>
    {
        const calls: Call[] = [];
        let made = 0;

        drawGroupBadge([ layer(0x3366CC) ], 39, 39, () => fakeCanvas(calls, (made++ === 0) ? 'badge' : 'tint'));

        expect(calls.map(call => call[0])).toEqual([
            'tint.drawImage:source-over',
            'tint.fillRect:multiply:#3366cc',
            'tint.drawImage:destination-in',
            'badge.drawImage:source-over'
        ]);
    });

    it('gives up when a part image only lives on the GPU', () =>
    {
        const gpuOnly = { ...layer(null), texture: { source: {}, frame: { x: 0, y: 0, width: 1, height: 1 } } } as unknown as GroupBadgeLayer;

        expect(drawGroupBadge([ gpuOnly ], 39, 39, () => fakeCanvas([], 'badge'))).toBeNull();
        expect(drawGroupBadge([], 39, 39, () => fakeCanvas([], 'badge'))).toBeNull();
    });
});
