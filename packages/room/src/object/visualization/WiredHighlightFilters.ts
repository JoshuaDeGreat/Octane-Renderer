// The official client's wired highlight filters (build WIN63-202610131318): strength quantized in steps of 5,
// outline, soft glow, darken, colour tint, brighten and neon aura.
import { ColorMatrixFilter, Filter } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';

export const WIRED_HIGHLIGHT_OUTLINE: number = 0;
export const WIRED_HIGHLIGHT_SOFT_GLOW: number = 1;
export const WIRED_HIGHLIGHT_DARKEN: number = 2;
export const WIRED_HIGHLIGHT_COLOR_TINT: number = 3;
export const WIRED_HIGHLIGHT_BRIGHTEN: number = 4;
export const WIRED_HIGHLIGHT_NEON_AURA: number = 5;

export const quantizeWiredHighlightStrength = (value: number): number =>
{
    if(!Number.isFinite(value) || value <= 0) return 0;

    if(value >= 100) return 100;

    return Math.max(5, Math.round(value / 5) * 5);
};

// Outline, soft glow and neon aura are drawn once for the whole furni (composite silhouette in AIR).
export const usesWiredHighlightCompositeSilhouette = (type: number): boolean =>
{
    return type === WIRED_HIGHLIGHT_OUTLINE || type === WIRED_HIGHLIGHT_SOFT_GLOW || type === WIRED_HIGHLIGHT_NEON_AURA;
};

const createDarkenFilter = (amount: number): ColorMatrixFilter =>
{
    const factor = 1 - 0.65 * amount;
    const filter = new ColorMatrixFilter();

    filter.matrix = [factor, 0, 0, 0, 0, 0, factor, 0, 0, 0, 0, 0, factor, 0, 0, 0, 0, 0, 1, 0];

    return filter;
};

const createBrightenFilter = (amount: number): ColorMatrixFilter =>
{
    const factor = 1 + 0.78 * amount;
    // Flash adds its offset column in 0..255; the Pixi v8 shader adds it in 0..1 colour space.
    const offset = (36 * amount) / 255;
    const filter = new ColorMatrixFilter();

    filter.matrix = [factor, 0, 0, 0, offset, 0, factor, 0, 0, offset, 0, 0, factor, 0, offset, 0, 0, 0, 1, 0];

    return filter;
};

const createColorTintFilter = (color: number, amount: number): ColorMatrixFilter =>
{
    const red = ((color >> 16) & 0xFF) / 255;
    const green = ((color >> 8) & 0xFF) / 255;
    const blue = (color & 0xFF) / 255;
    const mix = 0.65 * amount;
    const cross = mix * 0.05;
    const lift = (35 * amount) / 255;
    const filter = new ColorMatrixFilter();

    filter.matrix = [
        1 - mix + mix * red, cross * green, cross * blue, 0, red * lift,
        cross * red, 1 - mix + mix * green, cross * blue, 0, green * lift,
        cross * red, cross * green, 1 - mix + mix * blue, 0, blue * lift,
        0, 0, 0, 1, 0,
    ];

    return filter;
};

export const createWiredHighlightFilters = (type: number, color: number, strength: number): Filter[] =>
{
    if(strength <= 0) return null;

    const amount = Math.min(100, strength) / 100;
    const rgb = (color & 0xFFFFFF);

    switch(type)
    {
        case WIRED_HIGHLIGHT_OUTLINE:
            return [new GlowFilter({ color: rgb, alpha: amount, distance: 2 + 2 * amount, outerStrength: 2 + 5 * amount, quality: 1, knockout: true })];
        case WIRED_HIGHLIGHT_SOFT_GLOW:
            return [new GlowFilter({ color: rgb, alpha: 0.75 * amount, distance: 6 + 6 * amount, outerStrength: 1.5 + 1.5 * amount, quality: 1, knockout: true })];
        case WIRED_HIGHLIGHT_DARKEN:
            return [createDarkenFilter(amount)];
        case WIRED_HIGHLIGHT_COLOR_TINT:
            return [createColorTintFilter(rgb, amount * (rgb === 0 ? 1 : 1.35))];
        case WIRED_HIGHLIGHT_BRIGHTEN:
            return [createBrightenFilter(amount)];
        case WIRED_HIGHLIGHT_NEON_AURA:
            return [
                new GlowFilter({ color: rgb, alpha: 0.55 * amount, distance: 14 + 10 * amount, outerStrength: 1.5 + 1.5 * amount, quality: 1, knockout: true }),
                new GlowFilter({ color: 0xFFFFFF, alpha: 0.9 * amount, distance: 2, outerStrength: 6 + 6 * amount, quality: 1, knockout: true }),
            ];
        default:
            return null;
    }
};

export class WiredHighlightFilterCache
{
    private _type: number = 0;
    private _color: number = 0xFFFFFF;
    private _strength: number = 0;
    private _filters: Filter[] = null;
    private _byStrength: Map<number, Filter[]> = new Map();

    // Returns true when the filter list changed.
    public update(type: number, strength: number, color: number): boolean
    {
        const quantized = quantizeWiredHighlightStrength(strength);
        const rgb = (color & 0xFFFFFF);

        if((type === this._type) && (quantized === this._strength) && (rgb === this._color)) return false;

        if((type !== this._type) || (rgb !== this._color)) this._byStrength = new Map();

        this._type = type;
        this._strength = quantized;
        this._color = rgb;
        this._filters = this.getFilters();

        return true;
    }

    public get type(): number
    {
        return this._type;
    }

    public get strength(): number
    {
        return this._strength;
    }

    public get filters(): Filter[]
    {
        return this._filters;
    }

    private getFilters(): Filter[]
    {
        if(this._strength === 0) return null;

        let filters = this._byStrength.get(this._strength);

        if(!filters)
        {
            filters = createWiredHighlightFilters(this._type, this._color, this._strength);
            this._byStrength.set(this._strength, filters);
        }

        return filters;
    }
}
