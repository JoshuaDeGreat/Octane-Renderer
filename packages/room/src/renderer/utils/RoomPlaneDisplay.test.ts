import { Matrix, Point, Texture, TextureSource, WebGLRenderer } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IRoomPlaneDrawData } from '@octane/api';
import { ExtendedSprite, RoomEngine, RoomPlane, RoomPlaneDisplay } from '@octane/room';

const { rendererState } = vi.hoisted(() => ({ rendererState: { value: null } }));

vi.mock('@octane/utils', async importOriginal => ({
    ...(await importOriginal<object>()),
    GetRenderer: () => rendererState.value
}));

const makeData = (overrides: Partial<IRoomPlaneDrawData> = {}): IRoomPlaneDrawData => ({
    version: 1,
    width: 40,
    height: 20,
    direct: true,
    tileTexture: new Texture({ source: new TextureSource({ width: 8, height: 8 }) }),
    tileSimple: true,
    planeToTile: new Matrix(),
    textureTransform: new Matrix(),
    mapCoord: new Matrix(),
    clampFrame: new Float32Array(4),
    clampOffset: new Float32Array(2),
    tileTint: 0xFFFFFF,
    blackIsTransparent: false,
    patches: [],
    ...overrides
});

describe('RoomPlaneDisplay', () =>
{
    it('covers the plane box with one quad and hides without data', () =>
    {
        const display = new RoomPlaneDisplay();

        expect(display.visible).toBe(false);

        const data = makeData();

        display.setData(data);

        expect(display.visible).toBe(true);
        expect(Array.from(display.geometry.positions)).toEqual([ 0, 0, 40, 0, 40, 20, 0, 20 ]);

        display.setData(makeData({ direct: false, patches: [] }));

        expect(display.visible).toBe(false);

        display.setData(null);

        expect(display.visible).toBe(false);

        display.destroy();
    });

    it('binds up to eight patches and lets go of them when hidden', () =>
    {
        const display = new RoomPlaneDisplay();
        const patch = new Texture({ source: new TextureSource({ width: 4, height: 4 }) });
        const data = makeData({ patches: [ { x: 2, y: 3, width: 4, height: 4, texture: patch } ] });

        display.setData(data);

        expect(display.shader.resources.uPatch0).toBe(patch.source);
        expect(display.shader.resources.uPatch1).toBe(Texture.EMPTY.source);

        display.setData(makeData({ width: 0 }));

        expect(display.shader.resources.uPatch0).toBe(Texture.EMPTY.source);

        display.destroy();
    });
});

describe('ExtendedSprite plane display', () =>
{
    it('draws a plane through a display child and hit tests its draw data', () =>
    {
        const sprite = new ExtendedSprite();
        const data = makeData({ direct: false, patches: [] });

        sprite.setPlaneDrawData(data);

        expect(sprite.children).toHaveLength(1);
        expect(sprite.planeDrawData).toBe(data);

        // Draw data without the tile or a patch at that point: nothing to click.
        expect(sprite.containsPoint(new Point(10, 10))).toBe(false);

        sprite.alphaTolerance = 0;

        // alphaTolerance 0 takes the whole plane box.
        expect(sprite.containsPoint(new Point(10, 10))).toBe(true);
        expect(sprite.containsPoint(new Point(50, 10))).toBe(false);

        sprite.setPlaneDrawData(null);

        expect(sprite.children).toHaveLength(0);
        expect(sprite.planeDrawData).toBeNull();
    });
});

describe('RoomEngine.setPlaneRenderMode', () =>
{
    afterEach(() =>
    {
        RoomPlane.DIRECT_DRAW = false;
        rendererState.value = null;
    });

    const setMode = (direct: boolean) => RoomEngine.prototype.setPlaneRenderMode.call({ _roomManager: null }, direct);

    it('turns direct planes on only on WebGL2', () =>
    {
        const webGL2 = Object.assign(Object.create(WebGLRenderer.prototype), { context: { webGLVersion: 2 } });
        const webGL1 = Object.assign(Object.create(WebGLRenderer.prototype), { context: { webGLVersion: 1 } });

        rendererState.value = webGL1;
        setMode(true);
        expect(RoomPlane.DIRECT_DRAW).toBe(false);

        rendererState.value = {};
        setMode(true);
        expect(RoomPlane.DIRECT_DRAW).toBe(false);

        rendererState.value = webGL2;
        setMode(true);
        expect(RoomPlane.DIRECT_DRAW).toBe(true);

        setMode(false);
        expect(RoomPlane.DIRECT_DRAW).toBe(false);
    });
});
