import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IVariableFxAssetProvider } from './rendering/VariableFxAssetProvider';
import { IVariableFxColorTransform, IVariableFxImage, IVariableFxRect, VariableFxBitmap, VariableFxBlendMode } from './rendering/VariableFxBitmap';
import { VariableFxBitmapComposer } from './rendering/VariableFxBitmapComposer';
import { VariableFxConfiguredIcon } from './rendering/VariableFxIcons';
import { ArrowProgressBarRenderer } from './renderers/bar/ArrowProgressBarRenderer';
import { BlockProgressBarRenderer } from './renderers/bar/BlockProgressBarRenderer';
import { BossHealthBarRenderer, ClassicMiniProgressBarRenderer, ClassicProgressBarRenderer, HealthProgressBarRenderer } from './renderers/bar/ClassicProgressBarRenderer';
import { MaskedHeartFillRenderer } from './renderers/bar/MaskedHeartFillRenderer';
import { StripedProgressBarRenderer } from './renderers/bar/StripedProgressBarRenderer';
import { ThermometerHealthPointsRenderer } from './renderers/bar/ThermometerHealthPointsRenderer';
import { StackedHealthPointsAnimator, StackedHealthPointsRenderer } from './renderers/healthpoints/StackedHealthPointsRenderer';
import { LevelDetailsNumberPainter } from './renderers/level/LevelDetailsNumbers';
import { LevelDetailsRenderer } from './renderers/level/LevelDetailsRenderer';
import { LevelWithProgressRenderer } from './renderers/level/LevelWithProgressRenderer';
import { BakedColorNumberDisplayRenderer, RecolorableNumberDisplayRenderer } from './renderers/number/NumberDisplayRenderers';
import { IVariableFxWireConfig, VariableFxConfig, VariableFxStatusData } from './VariableFxConfig';
import { VariableFxPaintColor } from './VariableFxPaintColor';
import { VariableFxRendererRegistry } from './VariableFxRendererRegistry';
import { VariableFxVisualizer } from './VariableFxVisualizer';

/** The PNG sizes of AIR's variablefx assets (packages/assets/src/assets/variablefx/images). */
const ASSET_SIZES: Record<string, [number, number]> = {
    arrow_bar_background: [ 13, 13 ], arrow_bar_chunk: [ 11, 7 ], arrow_bar_darkening: [ 10, 7 ], arrow_bar_lighting: [ 10, 7 ], arrow_bar_metallic: [ 11, 7 ], arrow_bar_splitter: [ 5, 7 ], arrow_bar_splitter_left: [ 3, 7 ],
    block_bar_background: [ 13, 13 ], block_bar_darkening: [ 8, 7 ], block_bar_fill: [ 8, 7 ], block_bar_lighting: [ 8, 7 ], block_bar_metallic: [ 8, 7 ], block_bar_splitters: [ 1, 13 ],
    boss_health_bar_background: [ 16, 22 ], boss_health_bar_darkening: [ 8, 14 ], boss_health_bar_fill: [ 8, 14 ], boss_health_bar_lighting: [ 8, 14 ], boss_health_bar_metallic: [ 8, 14 ],
    classic_bar_background: [ 10, 9 ], classic_bar_darkening: [ 8, 7 ], classic_bar_fill: [ 8, 7 ], classic_bar_lighting: [ 8, 7 ], classic_bar_metallic: [ 8, 7 ],
    classic_mini_bar_background: [ 10, 6 ], classic_mini_bar_darkening: [ 8, 4 ], classic_mini_bar_fill: [ 8, 4 ], classic_mini_bar_lighting: [ 8, 4 ], classic_mini_bar_metallic: [ 8, 4 ],
    health_bar_background: [ 7, 7 ], health_bar_darkening: [ 5, 5 ], health_bar_fill: [ 5, 5 ], health_bar_lighting: [ 5, 5 ],
    icon_battery: [ 11, 21 ], icon_misc_heart: [ 14, 12 ], icon_misc_skull: [ 21, 26 ], icon_energy: [ 13, 17 ], icon_cash: [ 26, 20 ],
    level_details_background: [ 36, 29 ], level_details_darkening: [ 36, 29 ], level_details_darkening_metallic: [ 36, 29 ], level_details_frame: [ 36, 29 ], level_details_lighting: [ 36, 29 ], level_details_lighting_metallic: [ 36, 29 ],
    level_with_progress_background: [ 21, 21 ], level_with_progress_darkening: [ 21, 21 ], level_with_progress_darkening_metallic: [ 21, 21 ], level_with_progress_frame: [ 21, 21 ], level_with_progress_lighting: [ 21, 21 ], level_with_progress_lighting_metallic: [ 21, 21 ],
    masked_heart_fill_background: [ 23, 20 ], masked_heart_fill_bar: [ 23, 20 ], masked_heart_fill_darkening: [ 23, 20 ], masked_heart_fill_darkening_metallic: [ 23, 20 ], masked_heart_fill_end_pointer: [ 23, 20 ], masked_heart_fill_lighting: [ 23, 20 ], masked_heart_fill_lighting_metallic: [ 23, 20 ], masked_heart_fill_mask: [ 23, 20 ], masked_heart_fill_metallic: [ 23, 20 ],
    number_blocky_darkening: [ 149, 22 ], number_blocky_lighting: [ 149, 22 ], number_blocky_numbers: [ 149, 22 ], number_freeze_style_numbers: [ 183, 109 ],
    number_shalimar_darkening: [ 197, 23 ], number_shalimar_lighting: [ 197, 23 ], number_shalimar_number_lines: [ 197, 23 ], number_shalimar_numbers: [ 197, 23 ],
    numbers_large: [ 80, 11 ], numbers_small: [ 98, 9 ],
    stacked_health_points_background: [ 14, 12 ], stacked_health_points_darkening: [ 14, 12 ], stacked_health_points_darkening_metallic: [ 14, 12 ], stacked_health_points_lighting: [ 14, 12 ], stacked_health_points_lighting_metallic: [ 14, 12 ], stacked_health_points_metallic: [ 14, 12 ],
    striped_bar_background: [ 18, 13 ], striped_bar_darkening: [ 12, 7 ], striped_bar_darkening_metallic: [ 12, 7 ], striped_bar_fill: [ 12, 7 ], striped_bar_lighting: [ 19, 7 ], striped_bar_lighting_metallic: [ 19, 7 ], striped_bar_metallic: [ 19, 7 ], striped_bar_stripe: [ 12, 7 ],
    thermometer_health_points_background: [ 13, 9 ], thermometer_health_points_darkening: [ 9, 5 ], thermometer_health_points_fill: [ 9, 5 ], thermometer_health_points_lighting: [ 9, 5 ], thermometer_health_points_splitters: [ 2, 9 ], thermometer_health_points_top: [ 13, 9 ]
};

interface IAsset extends IVariableFxImage
{
    readonly name: string;
}

interface IDrawOp
{
    target: RecordingBitmap;
    image: IVariableFxImage;
    scaleX: number;
    tx: number;
    ty: number;
    transform: IVariableFxColorTransform;
    blend: VariableFxBlendMode;
    clip: IVariableFxRect;
}

/** A bitmap that records what is drawn on it instead of touching a canvas. */
class RecordingBitmap extends VariableFxBitmap
{
    public static all: RecordingBitmap[] = [];

    public readonly ops: IDrawOp[] = [];
    public readonly fills: { x: number, y: number, width: number, height: number, argb: number }[] = [];
    public readonly masks: { image: IVariableFxImage, mask: IVariableFxImage, x: number, y: number, clip: IVariableFxRect, blend: VariableFxBlendMode }[] = [];

    constructor(width: number, height: number)
    {
        super(width, height);

        RecordingBitmap.all.push(this);
    }

    public get source(): CanvasImageSource
    {
        return (this as unknown as CanvasImageSource);
    }

    public fillRect(x: number, y: number, width: number, height: number, argb: number): void
    {
        this.fills.push({ x, y, width, height, argb });
    }

    public draw(image: IVariableFxImage, scaleX: number, tx: number, ty: number, transform: IVariableFxColorTransform, blend: VariableFxBlendMode, clip: IVariableFxRect): void
    {
        this.ops.push({ target: this, image, scaleX, tx, ty, transform, blend, clip });
    }

    public drawAlphaMasked(image: IVariableFxImage, imageX: number, imageY: number, mask: IVariableFxImage, maskX: number, maskY: number, blend: VariableFxBlendMode, opacity: number, clip: IVariableFxRect): void
    {
        this.masks.push({ image, mask, x: imageX, y: imageY, clip, blend });
    }

    /** Draws of an asset, by name without the prefix. */
    public drawsOf(name: string): IDrawOp[]
    {
        return this.ops.filter(op => ((op.image as IAsset).name === `variablefx_${ name }`));
    }
}

class FakeAssets implements IVariableFxAssetProvider
{
    public readonly requested: string[] = [];
    private _assets: Map<string, IAsset> = new Map();

    public getBitmap(name: string): IVariableFxImage
    {
        this.requested.push(name);

        const size = ASSET_SIZES[name.replace(/^variablefx_/, '')];

        if(!size) return null;

        let asset = this._assets.get(name);

        if(!asset)
        {
            asset = { name, width: size[0], height: size[1], source: {} as CanvasImageSource };
            this._assets.set(name, asset);
        }

        return asset;
    }
}

let assets: FakeAssets;
let originalCreate: typeof VariableFxBitmap.create;
let originalCanvas: typeof VariableFxBitmap.createCanvas;

const wire = (overrides: Partial<IVariableFxWireConfig> = {}): IVariableFxWireConfig => ({
    category: 1,
    styleId: 0,
    colorId: 1,
    widthId: 2,
    rendererId: 0,
    defaultMinValue: 0,
    defaultMaxValue: 100,
    extra: {},
    ...overrides
});

const visualize = (config: IVariableFxWireConfig, value: number, extra: Record<string, string> = {}, now = 1000) =>
{
    const visualizer = new VariableFxVisualizer(VariableFxConfig.fromWire(config), new VariableFxStatusData(value, null, null, extra, true), now, assets, VariableFxRendererRegistry.createDefault());

    visualizer.update(now);

    return visualizer;
};

const frameOf = (visualizer: VariableFxVisualizer) => (visualizer.renderer.frame.bitmap as RecordingBitmap);

beforeEach(() =>
{
    assets = new FakeAssets();
    RecordingBitmap.all = [];
    originalCreate = VariableFxBitmap.create;
    originalCanvas = VariableFxBitmap.createCanvas;
    VariableFxBitmap.createCanvas = () => null;
    VariableFxBitmap.create = (width, height) => new RecordingBitmap(width, height);
});

afterEach(() =>
{
    VariableFxBitmap.create = originalCreate;
    VariableFxBitmap.createCanvas = originalCanvas;
});

describe('AIR variable fx renderer registry', () =>
{
    it('maps every server renderer id to the painter AIR registers for it', () =>
    {
        const registry = VariableFxRendererRegistry.createDefault();
        const cases: [number, unknown][] = [
            [ 0, ClassicProgressBarRenderer ], [ 1, ClassicMiniProgressBarRenderer ], [ 2, BlockProgressBarRenderer ], [ 3, StripedProgressBarRenderer ], [ 4, ArrowProgressBarRenderer ],
            [ 10, HealthProgressBarRenderer ], [ 11, MaskedHeartFillRenderer ], [ 12, StackedHealthPointsRenderer ], [ 13, ThermometerHealthPointsRenderer ],
            [ 20, LevelWithProgressRenderer ], [ 21, LevelDetailsRenderer ], [ 100, BossHealthBarRenderer ], [ 200, RecolorableNumberDisplayRenderer ], [ 201, BakedColorNumberDisplayRenderer ]
        ];

        for(const [ id, type ] of cases)
        {
            const extra = ((id === 200) ? { design: 'shalimar' } : ((id === 201) ? { design: 'freeze_style' } : {}));
            const visualizer = visualize(wire({ rendererId: id, extra }), 50);

            expect(visualizer.renderer, `renderer ${ id }`).toBeInstanceOf(type);
        }

        expect(registry.resolveById(101)).toBeNull();
        expect(VariableFxRendererRegistry.rendererClassOf(21)).toBe('LevelDetailsRenderer');
    });

    it('resolves the server colour and width ids to AIR names', () =>
    {
        const config = VariableFxConfig.fromWire(wire({ colorId: 102, widthId: 100, category: 4 }));

        expect(config.color).toBe('GOLD');
        expect(config.width).toBe('big_mahoosive_chonky');
        expect(config.category).toBe('boss_bar');
        expect(VariableFxPaintColor.resolveConfigured('GOLD').metallic).toBe(true);
        expect(VariableFxPaintColor.resolveConfigured('NOT_APPLICABLE', { color: '#4aa9f6', metallic: 'true' })).toEqual({ name: 'NOT_APPLICABLE', rgb: 0x4AA9F6, metallic: true });
        expect(VariableFxPaintColor.resolveTarget('DYNAMIC_RED_TO_GREEN', null, 0.5).rgb).toBe(16554256);
        expect(VariableFxPaintColor.resolveTarget('DYNAMIC_TEAM_COLOR', null, 0, { delegated_color: '#36b24a' }).rgb).toBe(0x36B24A);
    });
});

describe('AIR bar painters', () =>
{
    it('sizes the classic bar per width and clips the fill to the value', () =>
    {
        const widths: Record<number, number> = { 0: 29, 1: 45, 2: 61, 3: 77, 4: 93 };

        for(const widthId of Object.keys(widths).map(Number))
        {
            const renderer = visualize(wire({ widthId }), 50).renderer as ClassicProgressBarRenderer;

            expect(renderer.frameWidth).toBe(widths[widthId]);
            expect(renderer.frameHeight).toBe(9);
            expect(renderer.layout.fillWidth).toBe(widths[widthId] - 2);
        }

        const visualizer = visualize(wire(), 50);
        const frame = frameOf(visualizer);
        const fill = frame.ops[1];

        expect(visualizer.frame).toMatchObject({ width: 61, height: 9 });
        expect(fill.clip).toEqual({ x: 1, y: 1, width: 29, height: 7 });
        // The rounded end sits on the fill's edge: 1 + 29 - 2.
        expect(frame.ops[2].tx).toBe(28);
    });

    it('bakes the classic bar in the config colour, shaded with the darkening then the lighting', () =>
    {
        visualize(wire({ colorId: 5 }), 50);

        const bar = RecordingBitmap.all.find(bitmap => bitmap.drawsOf('classic_bar_fill').length > 0);
        const tint = bar.drawsOf('classic_bar_fill')[0].transform;

        expect(tint.red).toBeCloseTo(0xDF / 255);
        expect(tint.green).toBeCloseTo(0x29 / 255);
        expect(bar.drawsOf('classic_bar_darkening').map(op => op.blend)).toEqual([ VariableFxBlendMode.MULTIPLY, VariableFxBlendMode.MULTIPLY, VariableFxBlendMode.MULTIPLY ]);
        expect(bar.drawsOf('classic_bar_lighting').map(op => op.blend)).toEqual([ VariableFxBlendMode.ADD, VariableFxBlendMode.ADD, VariableFxBlendMode.ADD ]);
        expect(bar.drawsOf('classic_bar_metallic')).toHaveLength(0);
    });

    it('adds the metallic layer and shades twice for a metallic colour', () =>
    {
        visualize(wire({ colorId: 102 }), 50);

        expect(assets.requested).toContain('variablefx_classic_bar_metallic');

        const bar = RecordingBitmap.all.find(bitmap => bitmap.drawsOf('classic_bar_fill').length > 0);

        // Three-slice parts per pass: two passes each of lighting and darkening.
        expect(bar.drawsOf('classic_bar_lighting')).toHaveLength(6);
        expect(bar.drawsOf('classic_bar_metallic').every(op => op.blend === VariableFxBlendMode.ADD)).toBe(true);
    });

    it('lays the block bar out in 7 px blocks with 1 px splitters, or the configured segments', () =>
    {
        expect(BlockProgressBarRenderer.resolveLayout('medium', {})).toMatchObject({ blockCount: 6, fillWidth: 47, width: 53, height: 13 });
        expect(BlockProgressBarRenderer.resolveLayout('extra_small', {}).blockCount).toBe(3);
        expect(BlockProgressBarRenderer.resolveLayout('extra_large', {}).blockCount).toBe(10);
        expect(BlockProgressBarRenderer.resolveLayout('medium', { segments: '12' })).toMatchObject({ blockCount: 12, fillWidth: 95 });
        expect(BlockProgressBarRenderer.resolveLayout('medium', { segments: '500' }).blockCount).toBe(100);

        const renderer = visualize(wire({ rendererId: 2 }), 50).renderer as BlockProgressBarRenderer;
        const foreground = RecordingBitmap.all.find(bitmap => bitmap.drawsOf('block_bar_splitters').length > 0);

        expect(renderer.frameWidth).toBe(53);
        expect(foreground.drawsOf('block_bar_splitters').map(op => op.clip.x)).toEqual([ 10, 18, 26, 34, 42, 50 ]);
    });

    it('puts the status bar icon left of the bar, overlapping by 5 px, lifted by its metadata', () =>
    {
        const renderer = visualize(wire({ category: 3, rendererId: 2, colorId: -1, extra: { icon: 'energy', color: '#ffd83d', metallic: 'false' } }), 50).renderer as BlockProgressBarRenderer;
        const layout = renderer.iconLayout;

        expect(layout.contentX).toBe(13 - VariableFxConfiguredIcon.BAR_ICON_OVERLAP_PX);
        expect(layout.iconX).toBe(2);
        expect(layout.frameWidth).toBe(8 + 53);
        // The bar sits 2 px below centre and the icon 1 px lower than centre: 4 + 13 vs 1 + 17.
        expect(layout.contentY).toBe(4);
        expect(layout.frameHeight).toBe(18);
        expect(assets.requested).toContain('variablefx_icon_energy');
    });

    it('sizes the striped bar and moves its stripes one pixel every 70 ms', () =>
    {
        expect(StripedProgressBarRenderer.resolveLayout('small').width).toBe(37);
        expect(StripedProgressBarRenderer.resolveLayout('medium').width).toBe(53);
        expect(StripedProgressBarRenderer.stripePhase(0)).toBe(0);
        expect(StripedProgressBarRenderer.stripePhase(700)).toBe(0);
        expect(StripedProgressBarRenderer.stripePhase(770)).toBe(1);

        const visualizer = visualize(wire({ rendererId: 3 }), 50, {}, 700);

        expect(visualizer.needsUpdate(700)).toBe(true);
        expect(visualizer.update(735)).toBe(false);
        expect(visualizer.update(770)).toBe(true);

        const stripes = frameOf(visualizer).ops.filter(op => op.blend === VariableFxBlendMode.MULTIPLY);

        expect(stripes[stripes.length - 1].tx).toBe(1 - 10);
    });

    it('sizes the arrow bar in 9 px arrows', () =>
    {
        expect(ArrowProgressBarRenderer.resolveLayout('medium', {})).toMatchObject({ arrowCount: 6, fillWidth: 54, width: 60 });
        expect(ArrowProgressBarRenderer.resolveLayout('small', { segments: '3' }).fillWidth).toBe(27);
    });

    it('draws the health bar in red-to-green bands at 32 / 48 / 64 px with a heart icon', () =>
    {
        const low = visualize(wire({ category: 0, rendererId: 10, colorId: 1000, widthId: 1, extra: { icon: 'misc_heart' } }), 10).renderer as HealthProgressBarRenderer;

        expect(low.layout.width).toBe(32);
        expect(low.fillArgb & 0xFFFFFF).toBe(15672088);
        expect(visualize(wire({ category: 0, rendererId: 10, colorId: 1000, widthId: 3 }), 90).renderer).toMatchObject({ frameWidth: 64 });
        expect((visualize(wire({ category: 0, rendererId: 10, colorId: 1000 }), 90).renderer as HealthProgressBarRenderer).fillArgb & 0xFFFFFF).toBe(904478);
    });

    it('puts the boss skull on both ends with "double" alignment', () =>
    {
        const renderer = visualize(wire({ category: 4, rendererId: 100, colorId: 5, widthId: 4, extra: { icon: 'misc_skull', icon_alignment: 'double' } }), 50).renderer as BossHealthBarRenderer;
        const skulls = frameOf({ renderer } as unknown as VariableFxVisualizer).drawsOf('icon_misc_skull');

        expect(renderer.layout).toMatchObject({ width: 150, height: 22, fillX: 4, fillWidth: 142 });
        // The bar starts after the left skull (21 - 5 px overlap); the right skull overlaps its end.
        expect(renderer.iconLayout.contentX).toBe(16);
        expect(skulls.map(op => op.tx)).toEqual([ 3, 16 + 150 - 5 - 3 ]);
        expect(renderer.iconLayout.frameWidth).toBe(158 + 21);
    });

    it('sizes the thermometer per segment count and keeps the fill asset colour', () =>
    {
        expect(ThermometerHealthPointsRenderer.resolveFrameWidth('medium')).toBe(9 * 5 + 5);
        expect(ThermometerHealthPointsRenderer.resolveFrameWidth('extra_large')).toBe(15 * 5 + 5);
        expect(ThermometerHealthPointsRenderer.resolveFrameWidth('medium', { segments: '2' })).toBe(15);

        const renderer = visualize(wire({ category: 0, rendererId: 13, colorId: -1 }), 50).renderer as ThermometerHealthPointsRenderer;

        expect(renderer.layout).toMatchObject({ width: 50, height: 9, fillWidth: 46, fillHeight: 5 });
        expect(RecordingBitmap.all.some(bitmap => bitmap.ops.some(op => op.transform && (op.transform.red !== 1)))).toBe(false);
    });

    it('fills the single heart from 2 px in and masks its end pointer', () =>
    {
        const visualizer = visualize(wire({ category: 0, rendererId: 11, colorId: 5, widthId: -1 }), 50);
        const renderer = visualizer.renderer as MaskedHeartFillRenderer;

        expect(renderer.frameWidth).toBe(23);
        expect(renderer.progressPixelWidth).toBe(19);

        const heart = RecordingBitmap.all.find(bitmap => bitmap.masks.length > 0);

        expect(heart.drawsOf('masked_heart_fill_bar')[0].clip).toEqual({ x: 2, y: 0, width: 9, height: 20 });
        expect(heart.masks[0]).toMatchObject({ x: 2 + 9 - 1 - 1, clip: { x: 10, y: 2, width: 1, height: 16 }, blend: VariableFxBlendMode.MULTIPLY });
    });

    it('eases the fill towards a new value instead of jumping', () =>
    {
        const visualizer = visualize(wire(), 0);
        const renderer = visualizer.renderer as ClassicProgressBarRenderer;

        visualizer.updateData(new VariableFxStatusData(100), 1000);

        expect(renderer.renderedPixelWidth()).toBe(0);

        visualizer.update(1100);

        const partway = renderer.renderedPixelWidth();

        expect(partway).toBeGreaterThan(0);
        expect(partway).toBeLessThan(59);

        for(let now = 1100; now <= 5000; now += 50) visualizer.update(now);

        expect(renderer.renderedPixelWidth()).toBe(59);
    });
});

describe('AIR hearts, levels and numbers', () =>
{
    it('stacks a heart per point, 3 per row (5 at large), bottom row first', () =>
    {
        const renderer = visualize(wire({ category: 0, rendererId: 12, colorId: 5 }), 7).renderer as StackedHealthPointsRenderer;

        expect(renderer.heartCount).toBe(7);
        expect(renderer.columnCount).toBe(3);
        expect(renderer.rowCount).toBe(3);
        expect(renderer.frameWidth).toBe(3 * 14 + 2);
        expect(renderer.frameHeight).toBe(3 * 12 + 2 * 3);
        expect(renderer.heartPosition(0)).toEqual({ x: 0, y: 30 });
        expect(renderer.heartPosition(6)).toEqual({ x: 0, y: 0 });
        expect(StackedHealthPointsRenderer.resolvePerRow('large')).toBe(5);
        expect(StackedHealthPointsAnimator.resolveDuration(1)).toBeCloseTo(200);
        expect(StackedHealthPointsAnimator.resolveDuration(100)).toBeLessThan(1400);
    });

    it('draws the level badge with the bar the sub renderer names, overlapping by 3 px', () =>
    {
        const visualizer = visualize(wire({ category: 2, rendererId: 20, colorId: 1001, extra: { sub_renderer: '2' } }), 50, { current_level: '3', max_level: '10', is_maxed: 'false' });
        const renderer = visualizer.renderer as LevelWithProgressRenderer;

        expect(renderer.bar).toBeInstanceOf(BlockProgressBarRenderer);
        expect(renderer.levelText).toBe('3');
        expect(renderer.badgeWidth).toBe(21);
        expect(renderer.frameWidth).toBe(18 + 53);
        expect(renderer.frameHeight).toBe(21);
        expect(renderer.barY).toBe(4);
        // The level colour: green at level one, round to red at the cap.
        expect(renderer.displayedFrameArgb & 0xFFFFFF).toBe(VariableFxPaintColor.resolveDynamicLevellingRgb({ current_level: '3', max_level: '10' }));
    });

    it('lays the level details out with the badge, a mini bar and the numbers over it', () =>
    {
        const visualizer = visualize(wire({ category: 2, rendererId: 21, colorId: 1001, extra: { sub_renderer: '1' } }), 40, { current_level: '12', max_level: '50', is_maxed: 'false' });
        const renderer = visualizer.renderer as LevelDetailsRenderer;

        expect(renderer.bar).toBeInstanceOf(ClassicMiniProgressBarRenderer);
        expect(renderer.badgeWidth).toBe(6 + 2 * 8 + 5);
        expect(renderer.barX).toBe(5 + 27 + 3);
        expect(renderer.frameWidth).toBe(35 + 61 + 6);
        expect(renderer.frameHeight).toBe(29);
        expect(renderer.renderPlan.parts.map(part => part.text)).toEqual([ '40', '/', '100' ]);
    });

    it('shortens the level numbers like AIR when they do not fit', () =>
    {
        const painter = new LevelDetailsNumberPainter({ width: 98, height: 9, source: null });

        expect(painter.measureText('10')).toBe(4 + 7 - 1);
        expect(painter.createRenderPlan('123', '456', 100).key).toBe('full:123/456');
        expect(painter.createRenderPlan('123', '456', 20).key).toBe('current:123');
        expect(painter.createRenderPlan('123456', '9', 20).key).toBe('truncated:12...');
    });

    it('draws numbers glyph by glyph with the design spacing and the icon on its side', () =>
    {
        const shalimar = visualize(wire({ category: 5, rendererId: 200, colorId: 7, widthId: -1, extra: { design: 'shalimar' } }), 42).renderer as RecolorableNumberDisplayRenderer;

        expect(shalimar.contentWidth).toBe(17 + 3 + 17);
        expect(shalimar.layout.frameHeight).toBe(23);
        expect(shalimar.paintRgb).toBe(3898851);

        const withIcon = visualize(wire({ category: 5, rendererId: 200, colorId: 7, extra: { design: 'blocky', icon: 'cash', icon_alignment: 'right' } }), -5).renderer as RecolorableNumberDisplayRenderer;

        expect(withIcon.text).toBe('-5');
        expect(withIcon.layout.contentX).toBe(0);
        expect(withIcon.layout.iconX).toBe(13 + 3 + 13 + 6);

        const freeze = visualize(wire({ category: 5, rendererId: 201, colorId: 1002, extra: { design: 'freeze_style' } }), 3, { delegated_color: '#3b7de3' }).renderer as BakedColorNumberDisplayRenderer;

        // The team colour picks the sheet row of the matching baked colour.
        expect(freeze.sourceY).toBe(44);
    });
});

describe('VariableFxVisualizer', () =>
{
    it('resolves the range from the status overrides and the config, as AIR does', () =>
    {
        const visualizer = new VariableFxVisualizer(VariableFxConfig.fromWire(wire({ defaultMinValue: 10, defaultMaxValue: 20 })), new VariableFxStatusData(15, null, 30), 0, assets, VariableFxRendererRegistry.createDefault());
        const context = visualizer.createContext();

        expect([ context.minValue, context.maxValue ]).toEqual([ 10, 30 ]);
        expect(context.progress).toBeCloseTo(0.25);
        expect(VariableFxVisualizer.calculateProgress(5, 5, 5)).toBe(0);
        expect(VariableFxVisualizer.calculateProgress(50, 0, 10)).toBe(1);
    });

    it('waits for the fx assets instead of failing and shares a prebake between holders', () =>
    {
        const empty: IVariableFxAssetProvider = { getBitmap: () => null };
        const config = VariableFxConfig.fromWire(wire());
        const waiting = new VariableFxVisualizer(config, new VariableFxStatusData(5), 0, empty, VariableFxRendererRegistry.createDefault());

        expect(waiting.frame).toBeNull();
        expect(waiting.needsUpdate(100)).toBe(false);
        expect(waiting.needsUpdate(VariableFxVisualizer.RETRY_DELAY_MS)).toBe(true);

        const first = new VariableFxVisualizer(config, new VariableFxStatusData(5), 0, assets, VariableFxRendererRegistry.createDefault());
        const created = RecordingBitmap.all.length;

        new VariableFxVisualizer(config, new VariableFxStatusData(50), 0, assets, VariableFxRendererRegistry.createDefault());

        expect(first.renderer).not.toBeNull();
        expect(config.prebake).not.toBeNull();
        // The second holder makes no new prebaked bitmaps of its own (the bar colour is fixed).
        expect(RecordingBitmap.all.length).toBe(created);
    });
});

describe('VariableFxBitmapComposer', () =>
{
    it('three-slices an image: ends as they are, the middle stretched, all inside the target', () =>
    {
        const target = new RecordingBitmap(40, 10);
        const image = { width: 10, height: 9, source: {} as CanvasImageSource };

        new VariableFxBitmapComposer(target).drawThreeSlice(image, 3, 3, 30, 5, 0);

        expect(target.ops.map(op => op.clip)).toEqual([ { x: 5, y: 0, width: 3, height: 9 }, { x: 8, y: 0, width: 24, height: 9 }, { x: 32, y: 0, width: 3, height: 9 } ]);
        expect(target.ops[1].scaleX).toBe(6);
        expect(target.ops[1].tx).toBe(8 - (3 * 6));
        expect(target.ops[2].tx).toBe(32 - 7);
    });

    it('tiles a chunk over a rect, clipped to the rect and the clip', () =>
    {
        const target = new RecordingBitmap(40, 10);
        const image = { width: 8, height: 7, source: {} as CanvasImageSource };

        new VariableFxBitmapComposer(target).drawTiledChunk(image, { x: 0, y: 0, width: 8, height: 7 }, 3, 3, 20, 7, VariableFxBlendMode.MULTIPLY, 255, { x: 3, y: 3, width: 12, height: 7 });

        expect(target.ops.map(op => op.tx)).toEqual([ 3, 11 ]);
        expect(target.ops.every(op => op.blend === VariableFxBlendMode.MULTIPLY)).toBe(true);
        expect(target.ops[1].clip).toEqual({ x: 11, y: 3, width: 4, height: 7 });
    });
});
