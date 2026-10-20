import { IVariableFxImage, VariableFxBitmap, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { variableFxRect, VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { LevelProgressPathAnimator, LevelProgressPathSample } from './LevelProgressPathAnimator';

export interface ILevelDetailsTextPart
{
    text: string;
    width: number;
}

export interface ILevelDetailsRenderPlan
{
    key: string;
    parts: ILevelDetailsTextPart[];
    width: number;
}

/**
 * The "value / next level" text of the level details (AIR's LevelDetailsNumberPainter), in the
 * small number sheet: glyphs 9 px high drawn 1 px overlapped. When "current/max" does not fit over
 * the bar it shows only the current value, and when that does not fit either, as many leading
 * digits as fit followed by "...".
 */
export class LevelDetailsNumberPainter
{
    public static GLYPH_HEIGHT: number = 9;
    public static GLYPH_SPACING_X: number = -1;
    public static GLYPHS: Readonly<Record<string, { sourceX: number, width: number }>> = {
        0: { sourceX: 0, width: 7 },
        1: { sourceX: 8, width: 4 },
        2: { sourceX: 13, width: 7 },
        3: { sourceX: 21, width: 7 },
        4: { sourceX: 29, width: 7 },
        5: { sourceX: 37, width: 7 },
        6: { sourceX: 45, width: 7 },
        7: { sourceX: 53, width: 7 },
        8: { sourceX: 61, width: 7 },
        9: { sourceX: 69, width: 7 },
        '/': { sourceX: 77, width: 12 },
        '...': { sourceX: 90, width: 8 }
    };

    private _texts: Map<string, VariableFxBitmap> = new Map();

    constructor(private _numbers: IVariableFxImage)
    {}

    public createRenderPlan(current: string, max: string, availableWidth: number): ILevelDetailsRenderPlan
    {
        const width = Math.max(0, (availableWidth | 0));
        const full = this.createPlan(`full:${ current }/${ max }`, [ current, '/', max ]);

        if(full.width <= width) return full;

        const currentOnly = this.createPlan(`current:${ current }`, [ current ]);

        if(currentOnly.width <= width) return currentOnly;

        for(let length = current.length; length > 0; length--)
        {
            const prefix = current.substr(0, length);
            const plan = this.createPlan(`truncated:${ prefix }...`, [ prefix, '...' ]);

            if(plan.width <= width) return plan;
        }

        const dots = this.createPlan('truncated:...', [ '...' ]);

        return ((dots.width <= width) ? dots : { key: 'empty', parts: [], width: 0 });
    }

    public draw(composer: VariableFxBitmapComposer, plan: ILevelDetailsRenderPlan, x: number, y: number): void
    {
        let partX = x;

        for(const part of plan.parts)
        {
            composer.drawLayer(this.textBitmap(part.text), partX, y, VariableFxBlendMode.NORMAL, 255);

            partX += ((part.width | 0) + LevelDetailsNumberPainter.GLYPH_SPACING_X);
        }
    }

    public measureText(text: string): number
    {
        const glyphs = LevelDetailsNumberPainter.resolveGlyphs(text);

        if(!glyphs.length) return 0;

        let width = 0;

        for(const glyph of glyphs) width += (glyph.width | 0);

        return (width + (LevelDetailsNumberPainter.GLYPH_SPACING_X * (glyphs.length - 1)));
    }

    public dispose(): void
    {
        for(const bitmap of this._texts.values()) bitmap.dispose();

        this._texts.clear();
    }

    public static resolveGlyphs(text: string): { sourceX: number, width: number }[]
    {
        const glyphs: { sourceX: number, width: number }[] = [];
        let index = 0;

        while(index < text.length)
        {
            if(text.substr(index, 3) === '...')
            {
                glyphs.push(LevelDetailsNumberPainter.GLYPHS['...']);
                index += 3;

                continue;
            }

            const glyph = LevelDetailsNumberPainter.GLYPHS[text.charAt(index)];

            if(glyph) glyphs.push(glyph);

            index++;
        }

        return glyphs;
    }

    private createPlan(key: string, texts: string[]): ILevelDetailsRenderPlan
    {
        const parts: ILevelDetailsTextPart[] = [];

        for(const text of texts)
        {
            if(text.length > 0) parts.push({ text, width: this.measureText(text) });
        }

        let width = 0;

        for(const part of parts) width += (part.width | 0);

        return { key, parts, width: (parts.length ? (width + (LevelDetailsNumberPainter.GLYPH_SPACING_X * (parts.length - 1))) : 0) };
    }

    private textBitmap(text: string): VariableFxBitmap
    {
        let bitmap = this._texts.get(text);

        if(bitmap) return bitmap;

        bitmap = VariableFxBitmap.create(Math.max(1, this.measureText(text)), LevelDetailsNumberPainter.GLYPH_HEIGHT);

        const composer = new VariableFxBitmapComposer(bitmap);
        let x = 0;

        composer.clear(0);

        for(const glyph of LevelDetailsNumberPainter.resolveGlyphs(text))
        {
            composer.drawLayer(this._numbers, (x - (glyph.sourceX | 0)), 0, VariableFxBlendMode.NORMAL, 255, variableFxRect(x, 0, glyph.width, LevelDetailsNumberPainter.GLYPH_HEIGHT));

            x += ((glyph.width | 0) + LevelDetailsNumberPainter.GLYPH_SPACING_X);
        }

        this._texts.set(text, bitmap);

        return bitmap;
    }
}

export interface ILevelDetailsNumberTarget
{
    maxValue: number;
    sample: LevelProgressPathSample;
    value: number;
}

/**
 * Counts the details' numbers along with the badge's path (AIR's LevelDetailsNumberProgress): the
 * current value runs from the old to the new one as the path moves, and the "next level at" number
 * switches to the new one once the path reaches the target level, showing "..." while it passes
 * levels in between.
 */
export class LevelDetailsNumberProgress
{
    public static ELLIPSIS: string = '...';
    public static PATH_EPSILON: number = 0.0001;

    private _initialized: boolean = false;
    private _sourceMaxText: string = '0';
    private _sourcePath: number = 0;
    private _sourceValue: number = 0;
    private _target: ILevelDetailsNumberTarget = null;
    private _targetMaxText: string = '0';
    private _targetPath: number = 0;
    private _targetValue: number = 0;

    public reset(target: ILevelDetailsNumberTarget): void
    {
        this._target = LevelDetailsNumberProgress.normalizeTarget(target);
        this._targetPath = LevelProgressPathAnimator.resolvePath(this._target.sample);
        this._targetValue = LevelDetailsNumberProgress.normalizeNumber(this._target.value);
        this._targetMaxText = String(LevelDetailsNumberProgress.normalizeNumber(this._target.maxValue));
        this._sourcePath = this._targetPath;
        this._sourceValue = this._targetValue;
        this._sourceMaxText = this._targetMaxText;
        this._initialized = true;
    }

    public setTarget(target: ILevelDetailsNumberTarget, path: number): void
    {
        if(!this._initialized)
        {
            this.reset(target);

            return;
        }

        const display = this.resolveDisplay(path);

        this._sourcePath = LevelDetailsNumberProgress.normalizePath(path);
        this._sourceValue = LevelDetailsNumberProgress.normalizeNumber(display.current);
        this._sourceMaxText = display.max;
        this._target = LevelDetailsNumberProgress.normalizeTarget(target);
        this._targetPath = LevelProgressPathAnimator.resolvePath(this._target.sample);
        this._targetValue = LevelDetailsNumberProgress.normalizeNumber(this._target.value);
        this._targetMaxText = String(LevelDetailsNumberProgress.normalizeNumber(this._target.maxValue));
    }

    public resolveDisplay(path: number): { current: string, max: string }
    {
        const position = LevelDetailsNumberProgress.normalizePath(path);

        return { current: String(LevelDetailsNumberProgress.normalizeNumber(this.currentValue(position))), max: this.maxText(position) };
    }

    public isAtTarget(path: number): boolean
    {
        return (Math.abs(LevelDetailsNumberProgress.normalizePath(path) - this._targetPath) <= LevelDetailsNumberProgress.PATH_EPSILON);
    }

    private currentValue(path: number): number
    {
        const span = (this._targetPath - this._sourcePath);

        if(Math.abs(span) <= LevelDetailsNumberProgress.PATH_EPSILON) return this._targetValue;

        const ratio = Math.max(0, Math.min(1, ((path - this._sourcePath) / span)));

        if(ratio >= (1 - LevelDetailsNumberProgress.PATH_EPSILON)) return this._targetValue;
        if(ratio <= LevelDetailsNumberProgress.PATH_EPSILON) return this._sourceValue;

        return ((this._sourceValue + ((this._targetValue - this._sourceValue) * ratio)) | 0);
    }

    private maxText(path: number): string
    {
        const span = (this._targetPath - this._sourcePath);

        if(Math.abs(span) <= LevelDetailsNumberProgress.PATH_EPSILON) return this._targetMaxText;

        if(span > 0)
        {
            const nextLevel = (Math.floor(this._sourcePath) + 1);

            if(path < (nextLevel - LevelDetailsNumberProgress.PATH_EPSILON)) return this._sourceMaxText;
            if(path >= (this.targetSegmentStart() - LevelDetailsNumberProgress.PATH_EPSILON)) return this._targetMaxText;

            return LevelDetailsNumberProgress.ELLIPSIS;
        }

        const sourceLevel = Math.floor(this._sourcePath);
        const targetNext = (Math.floor(this._targetPath) + 1);

        if(path >= (sourceLevel + LevelDetailsNumberProgress.PATH_EPSILON)) return this._sourceMaxText;
        if(path <= (targetNext + LevelDetailsNumberProgress.PATH_EPSILON)) return this._targetMaxText;

        return LevelDetailsNumberProgress.ELLIPSIS;
    }

    private targetSegmentStart(): number
    {
        return (((this._target.sample.progress <= LevelDetailsNumberProgress.PATH_EPSILON) && (this._targetPath > 0)) ? (this._targetPath - 1) : Math.floor(this._targetPath));
    }

    private static normalizeTarget(target: ILevelDetailsNumberTarget): ILevelDetailsNumberTarget
    {
        return { maxValue: LevelDetailsNumberProgress.normalizeNumber(target.maxValue), sample: target.sample, value: LevelDetailsNumberProgress.normalizeNumber(target.value) };
    }

    private static normalizePath(path: number): number
    {
        return (Number.isFinite(path) ? Math.max(0, path) : 0);
    }

    private static normalizeNumber(value: number | string): number
    {
        const number = Number(value);

        return (Number.isFinite(number) ? Math.max(0, (number | 0)) : 0);
    }
}
