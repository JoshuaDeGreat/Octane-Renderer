import { IVariableFxImage, VariableFxBitmap, VariableFxBlendMode } from '../../rendering/VariableFxBitmap';
import { VariableFxBitmapComposer } from '../../rendering/VariableFxBitmapComposer';
import { VariableFxFrame } from '../../rendering/VariableFxFrame';
import { VariableFxConfiguredIcon, VariableFxIconOverlayLayout } from '../../rendering/VariableFxIcons';
import { IVariableFxPrebake, IVariableFxRenderer, VariableFxRendererContext } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { readVariableFxExtra } from '../../VariableFxTypes';

export interface IVariableFxNumberDigit
{
    value: string;
    sourceX: number;
    width: number;
}

/** A number sheet: its glyphs, height, spacing, how far the icon overlaps and the layers. */
export interface IVariableFxNumberDesign
{
    design: string;
    height: number;
    spacing: number;
    contentOffsetY: number;
    iconOverlap: number;
    digits: IVariableFxNumberDigit[];
    layers?: { numbers: string, lines?: string, darkening: string, lighting: string };
    /** Baked colour sheets: the y of each colour's row. */
    colorRows?: Record<string, number>;
}

const digit = (value: string, sourceX: number, width: number): IVariableFxNumberDigit => ({ value, sourceX, width });

/** AIR's number display designs (the shalimar, blocky and freeze style sheets). */
export class VariableFxNumberDesigns
{
    public static getRecolorableDesign(design: string): IVariableFxNumberDesign
    {
        switch(design)
        {
            case 'blocky':
                return {
                    design,
                    height: 22,
                    spacing: 3,
                    contentOffsetY: 0,
                    iconOverlap: -6,
                    digits: [ digit('0', 0, 13), digit('1', 14, 9), digit('2', 24, 13), digit('3', 38, 13), digit('4', 52, 13), digit('5', 66, 13), digit('6', 80, 13), digit('7', 94, 13), digit('8', 108, 13), digit('9', 122, 13), digit('-', 136, 13) ],
                    layers: { numbers: 'variablefx_number_blocky_numbers', darkening: 'variablefx_number_blocky_darkening', lighting: 'variablefx_number_blocky_lighting' }
                };
            case 'shalimar':
                return {
                    design,
                    height: 23,
                    spacing: 3,
                    contentOffsetY: 0,
                    iconOverlap: -6,
                    digits: [ digit('0', 0, 17), digit('1', 18, 17), digit('2', 36, 17), digit('3', 54, 17), digit('4', 72, 17), digit('5', 90, 17), digit('6', 108, 17), digit('7', 126, 17), digit('8', 144, 17), digit('9', 162, 17), digit('-', 180, 17) ],
                    layers: { numbers: 'variablefx_number_shalimar_numbers', lines: 'variablefx_number_shalimar_number_lines', darkening: 'variablefx_number_shalimar_darkening', lighting: 'variablefx_number_shalimar_lighting' }
                };
            default:
                return null;
        }
    }

    public static getBakedColorDesign(design: string): IVariableFxNumberDesign
    {
        if(design !== 'freeze_style') return null;

        return {
            design,
            height: 21,
            spacing: -4,
            contentOffsetY: 0,
            iconOverlap: -1,
            digits: [ digit('0', 0, 16), digit('1', 17, 13), digit('2', 31, 16), digit('3', 48, 16), digit('4', 65, 16), digit('5', 82, 16), digit('6', 99, 16), digit('7', 116, 16), digit('8', 133, 16), digit('9', 150, 16), digit('-', 167, 16) ],
            colorRows: { RED: 0, GREEN: 22, BLUE: 44, YELLOW: 66, WHITE: 88 }
        };
    }
}

const getLayer = (context: VariableFxRendererContext, name: string): IVariableFxImage =>
{
    const image = context.assets?.getBitmap(name);

    if(!image) throw new Error(`Missing Variable FX number display layer '${ name }'.`);

    return image;
};

/**
 * The common part of AIR's number displays (NumberDisplayRendererBase): the value as a whole
 * number, glyph by glyph with the design's spacing, and the config's icon beside it (left, right
 * or both ends). Redrawn only when the shown text or the colour changes; no animation.
 */
export abstract class NumberDisplayRendererBase implements IVariableFxRenderer
{
    protected _design: IVariableFxNumberDesign;
    protected _frame: VariableFxFrame = new VariableFxFrame();
    protected _composer: VariableFxBitmapComposer = null;

    private _digits: Map<string, IVariableFxNumberDigit> = new Map();
    private _text: string;
    private _icon: VariableFxConfiguredIcon;
    private _alignment: string;
    private _renderedText: string = '';

    constructor(context: VariableFxRendererContext, design: IVariableFxNumberDesign)
    {
        this._design = design;
        this._text = NumberDisplayRendererBase.normalizeDisplayValue(context.status.value);
        this._icon = VariableFxConfiguredIcon.resolve(context.config.extra, context.assets);
        this._alignment = VariableFxConfiguredIcon.resolveAlignment(context.config.extra);

        for(const entry of design.digits) this._digits.set(entry.value, entry);
    }

    public get frame(): VariableFxFrame
    {
        return this._frame;
    }

    public get isContinuous(): boolean
    {
        return false;
    }

    public get text(): string
    {
        return this._text;
    }

    public updateData(context: VariableFxRendererContext, now: number): void
    {
        this._text = NumberDisplayRendererBase.normalizeDisplayValue(context.status.value);

        this.onDataUpdated(context);
    }

    public needsUpdate(now: number): boolean
    {
        return (!this._frame.bitmap || (this._text !== this._renderedText) || this.needsRendererUpdate());
    }

    public update(now: number): boolean
    {
        if(!this.needsUpdate(now)) return false;

        const layout = this.layout;

        if(!this._frame.fits(layout.frameWidth, layout.frameHeight))
        {
            this._frame.allocate(layout.frameWidth, layout.frameHeight);
            this._renderedText = '';
        }

        this.renderFrame(layout);

        this._renderedText = this._text;
        this.afterRender();
        this._frame.updateId++;

        return true;
    }

    public dispose(): void
    {
        this._frame.release();
    }

    /** The frame with the icon placed beside the number. */
    public get layout(): VariableFxIconOverlayLayout
    {
        return VariableFxIconOverlayLayout.resolve({
            alignment: this._alignment,
            contentWidth: this.contentWidth,
            contentHeight: this._design.height,
            contentOffsetY: this._design.contentOffsetY,
            iconWidth: (this._icon ? this._icon.bitmap.width : 0),
            iconHeight: (this._icon ? this._icon.bitmap.height : 0),
            iconOffsetX: 0,
            iconOffsetY: 0,
            overlap: this._design.iconOverlap
        });
    }

    public get contentWidth(): number
    {
        let width = 0;
        const digits = this.displayDigits();

        for(let index = 0; index < digits.length; index++)
        {
            if(index > 0) width += this._design.spacing;

            width += (digits[index].width | 0);
        }

        return Math.max(0, width);
    }

    public displayDigits(): IVariableFxNumberDigit[]
    {
        const digits: IVariableFxNumberDigit[] = [];

        for(const character of this._text)
        {
            const entry = this._digits.get(character);

            if(!entry) throw new Error(`Missing Variable FX number display digit '${ character }'.`);

            digits.push(entry);
        }

        return digits;
    }

    protected abstract drawDigit(entry: IVariableFxNumberDigit, x: number, y: number): void;

    protected onDataUpdated(context: VariableFxRendererContext): void
    {}

    protected needsRendererUpdate(): boolean
    {
        return false;
    }

    protected afterRender(): void
    {}

    private renderFrame(layout: VariableFxIconOverlayLayout): void
    {
        const bitmap = this._frame.bitmap;

        if(!bitmap) return;

        this._composer = new VariableFxBitmapComposer(bitmap);

        try
        {
            this._composer.clear(0);

            let x = layout.contentX;

            for(const entry of this.displayDigits())
            {
                this.drawDigit(entry, x, layout.contentY);

                x += ((entry.width | 0) + this._design.spacing);
            }

            if(this._icon)
            {
                for(const placement of layout.placements) this._composer.drawLayer(this._icon.bitmap, placement.x, placement.y, VariableFxBlendMode.NORMAL, 255);
            }
        }
        finally
        {
            this._composer = null;
        }
    }

    public static normalizeDisplayValue(value: number): string
    {
        return (Number.isFinite(value) ? String(value | 0) : '0');
    }
}

/** The recolorable sheet per colour: tinted, the number lines on top, then shaded. */
export class RecolorableNumberSheetPrebake implements IVariableFxPrebake
{
    public static MAX_SHEETS: number = 16;

    private _sheets: Map<number, VariableFxBitmap> = new Map();

    constructor(private _layers: { numbers: IVariableFxImage, lines: IVariableFxImage, darkening: IVariableFxImage, lighting: IVariableFxImage })
    {}

    public getSheet(rgb: number): VariableFxBitmap
    {
        const key = (rgb & 0xFFFFFF);
        let sheet = this._sheets.get(key);

        if(!sheet)
        {
            sheet = this.createSheet(key);

            this._sheets.set(key, sheet);

            while(this._sheets.size > RecolorableNumberSheetPrebake.MAX_SHEETS)
            {
                const oldest = this._sheets.keys().next().value;

                this._sheets.get(oldest)?.dispose();
                this._sheets.delete(oldest);
            }
        }

        return sheet;
    }

    public dispose(): void
    {
        for(const sheet of this._sheets.values()) sheet.dispose();

        this._sheets.clear();
        this._layers = null;
    }

    private createSheet(rgb: number): VariableFxBitmap
    {
        const numbers = this._layers.numbers;
        const sheet = VariableFxBitmap.create(numbers.width, numbers.height);
        const composer = new VariableFxBitmapComposer(sheet);

        composer.clear(0);
        composer.drawChunk(numbers, 0, 0, numbers.width, numbers.height, 0, 0, VariableFxBlendMode.NORMAL, 255, null, { red: (((rgb >>> 16) & 255) / 255), green: (((rgb >>> 8) & 255) / 255), blue: ((rgb & 255) / 255), alpha: 1 });

        if(this._layers.lines) composer.drawLayer(this._layers.lines, 0, 0, VariableFxBlendMode.NORMAL, 255);
        if(this._layers.darkening) composer.drawLayer(this._layers.darkening, 0, 0, VariableFxBlendMode.MULTIPLY, 255);
        if(this._layers.lighting) composer.drawLayer(this._layers.lighting, 0, 0, VariableFxBlendMode.ADD, 255);

        return sheet;
    }
}

/**
 * AIR's RecolorableNumberDisplayRenderer (server renderer 200): the shalimar or blocky sheet in
 * the config's colour (or the holder's team colour), shaded once per colour.
 */
export class RecolorableNumberDisplayRenderer extends NumberDisplayRendererBase
{
    private _prebake: RecolorableNumberSheetPrebake;
    private _rgb: number;
    private _renderedRgb: number = null;

    constructor(context: VariableFxRendererContext)
    {
        const design = RecolorableNumberDisplayRenderer.resolveDesign(context);

        super(context, design);

        this._prebake = context.config.getOrCreatePrebake(() => new RecolorableNumberSheetPrebake({
            numbers: getLayer(context, design.layers.numbers),
            lines: (design.layers.lines ? getLayer(context, design.layers.lines) : null),
            darkening: getLayer(context, design.layers.darkening),
            lighting: getLayer(context, design.layers.lighting)
        }));
        this._rgb = RecolorableNumberDisplayRenderer.resolvePaintRgb(context);
    }

    public get paintRgb(): number
    {
        return this._rgb;
    }

    public static resolveDesign(context: VariableFxRendererContext): IVariableFxNumberDesign
    {
        const name = readVariableFxExtra(context.config.extra, 'design');
        const design = VariableFxNumberDesigns.getRecolorableDesign(name);

        if(!design) throw new Error(`Unknown recolorable Variable FX number display design '${ name ?? '' }'.`);

        return design;
    }

    public static resolvePaintRgb(context: VariableFxRendererContext): number
    {
        if(VariableFxPaintColor.resolve(context.config.color).name === VariableFxPaintColor.DYNAMIC_TEAM_COLOR) return (VariableFxPaintColor.resolveTarget(context.config.color, context.config.extra, 0, context.status.extra).rgb | 0);

        return (VariableFxPaintColor.resolveConfigured(context.config.color, context.config.extra).rgb | 0);
    }

    protected drawDigit(entry: IVariableFxNumberDigit, x: number, y: number): void
    {
        this._composer.drawChunk(this._prebake.getSheet(this._rgb >>> 0), entry.sourceX, 0, entry.width, this._design.height, x, y, VariableFxBlendMode.NORMAL, 255);
    }

    protected onDataUpdated(context: VariableFxRendererContext): void
    {
        this._rgb = RecolorableNumberDisplayRenderer.resolvePaintRgb(context);
    }

    protected needsRendererUpdate(): boolean
    {
        return ((this._renderedRgb === null) || (this._renderedRgb !== this._rgb));
    }

    protected afterRender(): void
    {
        this._renderedRgb = this._rgb;
    }
}

/**
 * AIR's BakedColorNumberDisplayRenderer (server renderer 201): the freeze style sheet, which has a
 * row per colour (red, green, blue, yellow, white); the team colour picks the row whose colour the
 * holder's team has, white or green when none matches.
 */
export class BakedColorNumberDisplayRenderer extends NumberDisplayRendererBase
{
    public static DEFAULT_COLOR: string = 'GREEN';

    private _numbers: IVariableFxImage;
    private _teamColor: boolean;
    private _sourceY: number;
    private _renderedSourceY: number = null;

    constructor(context: VariableFxRendererContext)
    {
        const design = BakedColorNumberDisplayRenderer.resolveDesign(context);

        super(context, design);

        this._numbers = getLayer(context, `variablefx_number_${ design.design }_numbers`);
        this._teamColor = (VariableFxPaintColor.resolve(context.config.color).name === VariableFxPaintColor.DYNAMIC_TEAM_COLOR);
        this._sourceY = BakedColorNumberDisplayRenderer.resolveSourceY(context, design);
    }

    public get sourceY(): number
    {
        return this._sourceY;
    }

    public static resolveDesign(context: VariableFxRendererContext): IVariableFxNumberDesign
    {
        const name = readVariableFxExtra(context.config.extra, 'design');
        const design = VariableFxNumberDesigns.getBakedColorDesign(name);

        if(!design) throw new Error(`Unknown baked-color Variable FX number display design '${ name ?? '' }'.`);

        return design;
    }

    public static resolveSourceY(context: VariableFxRendererContext, design: IVariableFxNumberDesign): number
    {
        const name = VariableFxPaintColor.resolve(context.config.color).name;
        const color = ((name === VariableFxPaintColor.DYNAMIC_TEAM_COLOR) ? BakedColorNumberDisplayRenderer.resolveTeamRow(context, design) : name);
        const row = (design.colorRows[color] ?? design.colorRows[BakedColorNumberDisplayRenderer.DEFAULT_COLOR]);

        return ((row === undefined || row === null) ? 0 : (row | 0));
    }

    private static resolveTeamRow(context: VariableFxRendererContext, design: IVariableFxNumberDesign): string
    {
        const delegated = VariableFxPaintColor.parseRgb(readVariableFxExtra(context.status.extra, 'delegated_color'));

        if(delegated !== null)
        {
            for(const color of Object.keys(design.colorRows))
            {
                if((VariableFxPaintColor.resolve(color).rgb >>> 0) === (delegated >>> 0)) return color;
            }
        }

        return ((design.colorRows[VariableFxPaintColor.WHITE] !== undefined) ? VariableFxPaintColor.WHITE : BakedColorNumberDisplayRenderer.DEFAULT_COLOR);
    }

    protected drawDigit(entry: IVariableFxNumberDigit, x: number, y: number): void
    {
        this._composer.drawChunk(this._numbers, entry.sourceX, this._sourceY, entry.width, this._design.height, x, y, VariableFxBlendMode.NORMAL, 255);
    }

    protected onDataUpdated(context: VariableFxRendererContext): void
    {
        if(this._teamColor) this._sourceY = BakedColorNumberDisplayRenderer.resolveSourceY(context, this._design);
    }

    protected needsRendererUpdate(): boolean
    {
        return ((this._renderedSourceY === null) || (this._renderedSourceY !== this._sourceY));
    }

    protected afterRender(): void
    {
        this._renderedSourceY = this._sourceY;
    }
}
