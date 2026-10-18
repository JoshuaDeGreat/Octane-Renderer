import { IActiveActionData, IAvatarImage, RoomObjectSpriteData } from '@octane/api';
import { describe, expect, it } from 'vitest';
import type { AvatarStructure } from '../AvatarStructure';
import type { AssetAliasCollection } from '../alias';
import { AvatarImageCache } from './AvatarImageCache';

const asset = (x: number, y: number, width: number, height: number) => ({ x, y, width, height, rectangle: { width, height } });

// The figure library: a head for directions 2 (drawn for 2 and, flipped, 4) and the eyes only as an alias.
const libraryAssets: Record<string, ReturnType<typeof asset>> = {
    h_std_hd_1_2_0: asset(10, 5, 30, 40),
    h_std_ey_1_2_0: asset(4, -20, 12, 6)
};
const aliases: Record<string, string> = { h_std_ey_2_2_0: 'h_std_ey_1_2_0' };

const assets = {
    getAssetName: (name: string) => (aliases[name] ?? name),
    getAsset: (name: string) => (libraryAssets[aliases[name] ?? name] ?? null)
} as unknown as AssetAliasCollection;

const part = (partType: string, partId: string, colour: number = null) => ({
    partType,
    partId,
    flippedPartType: partType,
    isColorable: (colour !== null),
    color: ((colour !== null) ? { rgb: colour } : null),
    getFrameDefinition: () => null,
    getFrameIndex: () => 0
});

const action = {
    id: 'std',
    actionParameter: '',
    startFrame: 0,
    overridingAction: null,
    definition: { isAnimation: false, startFromFrameZero: false, assetPartDefinition: 'std', geometryType: 'vertical', state: 'std' }
} as unknown as IActiveActionData;

const structure = {
    getBodyPartsUnordered: () => [ 'head' ],
    getActiveBodyPartIds: () => [ 'head' ],
    getParts: () => [ part('ey', '2'), part('hd', '1', 0xFFCC99) ],
    getFrameBodyPartOffset: () => ({ x: 1, y: -2 }),
    getAnimation: () => null
} as unknown as AvatarStructure;

const avatar = { getFigure: () => null } as unknown as IAvatarImage;

const collect = (direction: number): RoomObjectSpriteData[] =>
{
    const cache = new AvatarImageCache(structure, avatar, assets, 'h');

    cache.setDirection('full', direction);
    cache.setAction(action, 0);

    const data: RoomObjectSpriteData[] = [];

    cache.collectServerRenderData('head', 0, data);

    return data;
};

describe('AvatarImageCache server render data (AIR camera)', () =>
{
    it('names each part by the figure library asset, back to front, with AIR placement and colour', () =>
    {
        const data = collect(2);

        expect(data.map(entry => entry.name)).toEqual([ 'h_std_hd_1_2_0', 'h_std_ey_1_2_0' ]);

        // x = asset.x - 33 + body part offset, y = asset.y + body part offset, z steps by -0.0001.
        expect(data[0]).toMatchObject({ x: -22, y: 3, z: -0, width: 30, height: 40, flipH: false, color: '0xffcc99' });
        expect(data[1]).toMatchObject({ x: -28, y: -22, z: -0.0001, width: 12, height: 6, flipH: false });
        expect(data[1].color).toBeUndefined();
    });

    it('mirrors a flipped direction from the direction 2 assets like AIR', () =>
    {
        const data = collect(4);

        expect(data.map(entry => entry.name)).toEqual([ 'h_std_hd_1_2_0', 'h_std_ey_1_2_0' ]);
        // Flipped: x = -(asset.x - 33) - width, then the body part offset.
        expect(data[0]).toMatchObject({ x: (-(10 - 33) - 30) + 1, flipH: true });
        expect(data[1]).toMatchObject({ x: (-(4 - 33) - 12) + 1, flipH: true });
    });
});
