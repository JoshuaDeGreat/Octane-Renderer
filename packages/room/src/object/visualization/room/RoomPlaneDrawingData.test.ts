import { Vector3d } from '@octane/utils';
import { describe, expect, it, vi } from 'vitest';
import { RoomGeometry, RoomPlane } from '@octane/room';

const roomVisualization = {
    wallData: {
        planes: [ { id: 'default', visualizations: [
            { size: 32, allLayers: [ { materialId: 'wall_small', color: 0xFFFFFF } ] },
            { size: 64, allLayers: [ { materialId: 'wall_mat', color: 0xFF8000 } ] }
        ] } ],
        materials: [
            { id: 'wall_mat', matrices: [ { align: 'bottom', columns: [
                { width: 64, cells: [ { textureId: 'wall_tex' } ] },
                { width: 32, repeatMode: 'none', cells: [ { textureId: 'wall_tex' }, { textureId: 'missing' } ] }
            ] } ] },
            { id: 'wall_small', matrices: [ { columns: [ { width: 32, cells: [ { textureId: 'small_tex' } ] } ] } ] }
        ],
        textures: [
            { id: 'wall_tex', bitmaps: [ { assetName: 'wall_texture_64_0_wall_color_basic' } ] },
            { id: 'small_tex', bitmaps: [ { assetName: 'wall_texture_32_0_wall_color_basic' } ] }
        ]
    },
    floorData: {
        planes: [ { id: '101', visualizations: [ { size: 64, allLayers: [ { color: 0x989865 } ] } ] } ],
        materials: [],
        textures: []
    }
};

vi.mock('@octane/assets', async importOriginal => ({
    ...(await importOriginal<object>()),
    GetAssetManager: () => ({ getCollection: (name: string) => ((name === 'room') ? { data: { roomVisualization } } : null) })
}));


const geometry = () => new RoomGeometry(64, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5));

const makeVisible = (plane: InstanceType<typeof RoomPlane>, width: number, height: number) =>
{
    const internals = plane as unknown as { _isVisible: boolean, _width: number, _height: number };

    internals._isVisible = true;
    internals._width = width;
    internals._height = height;
};

describe('RoomPlane.getDrawingDatas (AIR)', () =>
{
    it('gives a wall\'s texture columns as asset names, with AIR\'s colour blend and bottom alignment', () =>
    {
        const plane = new RoomPlane(new Vector3d(), new Vector3d(0, 4, 3), new Vector3d(0, -4, 0), new Vector3d(0, 0, -3), RoomPlane.TYPE_WALL, false, [], 1);

        plane.id = 'unknown_wall_id';
        plane.color = 0x808080;
        makeVisible(plane, 128, 192);

        const datas = plane.getDrawingDatas(geometry());

        expect(datas).toHaveLength(1);
        expect(datas[0].color).toBe(0x804000);
        expect(datas[0].isBottomAligned()).toBe(true);
        expect(datas[0].assetNameColumns).toEqual([
            [ 'wall_texture_64_0_wall_color_basic' ],
            [ 'wall_texture_64_0_wall_color_basic', '' ]
        ]);
        expect(datas[0].maskAssetNames).toEqual([]);
    });

    it('gives a colour-only floor layer and places the plane masks', () =>
    {
        const plane = new RoomPlane(new Vector3d(), new Vector3d(0, 0, 0), new Vector3d(2, 0, 0), new Vector3d(0, 4, 0), RoomPlane.TYPE_FLOOR, true, [], 1);
        const maskManager = {
            getMask: (type: string) => ((type === 'door') ? {
                getAssetName: (scale: number) => `door_${ scale }`,
                getGraphicAsset: () => ({ offsetX: -5, offsetY: -10, flipH: true, flipV: false })
            } : null)
        };

        plane.id = '101';
        plane.color = 0xFFFFFF;
        (plane as unknown as { maskManager: unknown }).maskManager = maskManager;
        plane.addBitmapMask('door', 1, 1);
        makeVisible(plane, 128, 200);

        const datas = plane.getDrawingDatas(geometry());

        expect(datas).toHaveLength(1);
        expect(datas[0].color).toBe(0x989865);
        expect(datas[0].assetNameColumns).toEqual([]);
        expect(datas[0].maskAssetNames).toEqual([ 'door_64' ]);
        expect(datas[0].maskAssetLocations[0].x).toBe(59);
        expect(datas[0].maskAssetLocations[0].y).toBe(140);
        expect(datas[0].maskAssetFlipHs).toEqual([ true ]);
    });

    it('gives nothing for a hidden plane and the plane colour when it has no layers', () =>
    {
        const hidden = new RoomPlane(new Vector3d(), new Vector3d(), new Vector3d(2, 0, 0), new Vector3d(0, 2, 0), RoomPlane.TYPE_FLOOR, false, [], 1);

        expect(hidden.getDrawingDatas(geometry())).toEqual([]);

        const landscape = new RoomPlane(new Vector3d(), new Vector3d(), new Vector3d(2, 0, 0), new Vector3d(0, 0, 2), RoomPlane.TYPE_LANDSCAPE, false, [], 1);

        landscape.color = 0x123456;
        makeVisible(landscape, 10, 10);

        const datas = landscape.getDrawingDatas(geometry());

        expect(datas).toHaveLength(1);
        expect(datas[0].color).toBe(0x123456);
    });

    it('blends like AIR Canvas.colorize', () =>
    {
        expect(RoomPlane.blendColor(0xFFFFFF, 0xABCDEF)).toBe(0xABCDEF);
        expect(RoomPlane.blendColor(0x000000, 0xABCDEF)).toBe(0);
        expect(RoomPlane.blendColor(0x808080, 0xFF8000)).toBe(0x804000);
    });
});
