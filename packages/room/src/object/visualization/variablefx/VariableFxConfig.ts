import { IVariableFxAssetProvider } from './rendering/VariableFxAssetProvider';
import { VariableFxFrame } from './rendering/VariableFxFrame';
import { VariableFxPaintColor } from './VariableFxPaintColor';
import { VariableFxCategory, VariableFxRendererType, VariableFxWidth } from './VariableFxTypes';

/** What the room needs of the config the server sent (the client's IWiredVariableFxConfig). */
export interface IVariableFxWireConfig
{
    category: number;
    styleId: number;
    colorId: number;
    widthId: number;
    rendererId: number;
    defaultMinValue: number;
    defaultMaxValue: number;
    extra: Record<string, string>;
}

/** What the room needs of a value the server sent (the client's IWiredVariableFxStatus). */
export interface IVariableFxWireStatus
{
    value: number;
    overrideMinValue: number | null;
    overrideMaxValue: number | null;
    extra: Record<string, string>;
    initialize?: boolean;
}

/** Something a renderer bakes once per config and shares between every holder drawing it. */
export interface IVariableFxPrebake
{
    dispose(): void;
}

/**
 * One fx config as AIR's renderers read it: names instead of the server's ids, the default range
 * and the style's extras. Renderers keep their prebaked bitmaps on it, so every holder of the same
 * config draws from the same prebake.
 */
export class VariableFxConfig
{
    private static WIRE_CONFIGS: WeakMap<object, VariableFxConfig> = new WeakMap();

    public prebake: IVariableFxPrebake = null;

    constructor(
        public readonly category: string,
        public readonly style: string,
        public readonly renderer: string,
        public readonly width: string,
        public readonly color: string,
        public readonly minValue: number,
        public readonly maxValue: number,
        public readonly extra: Record<string, string> = {},
        public readonly categoryId: number = -1,
        public readonly styleId: number = -1,
        public readonly rendererId: number = -1)
    {}

    /** The AIR config for a server config, made once per config object so its prebake is shared. */
    public static forWire(wire: IVariableFxWireConfig): VariableFxConfig
    {
        if(!wire) return null;

        let config = VariableFxConfig.WIRE_CONFIGS.get(wire);

        if(!config)
        {
            config = VariableFxConfig.fromWire(wire);

            VariableFxConfig.WIRE_CONFIGS.set(wire, config);
        }

        return config;
    }

    public static fromWire(wire: IVariableFxWireConfig): VariableFxConfig
    {
        const renderer = VariableFxRendererType.resolveById(wire.rendererId);

        return new VariableFxConfig(
            VariableFxCategory.fromId(wire.category),
            renderer,
            renderer,
            VariableFxWidth.fromId(wire.widthId),
            VariableFxPaintColor.fromId(wire.colorId),
            Number(wire.defaultMinValue),
            Number(wire.defaultMaxValue),
            { ...(wire.extra ?? {}) },
            wire.category,
            wire.styleId,
            wire.rendererId);
    }

    /** The config a level renderer draws its bar with (AIR: range 0 to 1, the bar's renderer). */
    public static forSubRenderer(parent: VariableFxConfig, renderer: string, rendererId: number, color: string, extra: Record<string, string>): VariableFxConfig
    {
        return new VariableFxConfig(VariableFxCategory.PROGRESS_BAR, renderer, renderer, parent.width, color, 0, 1, extra, parent.categoryId, parent.styleId, rendererId);
    }

    /** The prebake on this config, made by `create` the first time. */
    public getOrCreatePrebake<T extends IVariableFxPrebake>(create: () => T): T
    {
        if(!this.prebake) this.prebake = create();

        return (this.prebake as T);
    }

    public disposePrebake(): void
    {
        if(!this.prebake) return;

        this.prebake.dispose();
        this.prebake = null;
    }
}

/** One value to draw (AIR's VariableFxStatusData). */
export class VariableFxStatusData
{
    constructor(
        public readonly value: number,
        public readonly overrideMinValue: number = null,
        public readonly overrideMaxValue: number = null,
        public readonly extra: Record<string, string> = {},
        public readonly isInitialize: boolean = false)
    {}

    public static fromWire(status: IVariableFxWireStatus, initialize: boolean = !!status?.initialize): VariableFxStatusData
    {
        return new VariableFxStatusData(Number(status?.value), (status?.overrideMinValue ?? null), (status?.overrideMaxValue ?? null), { ...(status?.extra ?? {}) }, initialize);
    }

    public get effectiveOverrideMinValue(): number
    {
        return VariableFxStatusData.finiteOrNull(this.overrideMinValue);
    }

    public get effectiveOverrideMaxValue(): number
    {
        return VariableFxStatusData.finiteOrNull(this.overrideMaxValue);
    }

    private static finiteOrNull(value: number): number
    {
        if((value === null) || (value === undefined)) return null;

        const number = Number(value);

        return (Number.isFinite(number) ? number : null);
    }
}

/** What a renderer draws from: the assets, config, value and the range it resolved to. */
export class VariableFxRendererContext
{
    constructor(
        public readonly assets: IVariableFxAssetProvider,
        public readonly config: VariableFxConfig,
        public readonly status: VariableFxStatusData,
        public readonly minValue: number,
        public readonly maxValue: number,
        public readonly progress: number,
        public readonly registry: IVariableFxRendererRegistryLike = null)
    {}
}

/** The bit of the renderer registry a level renderer needs to make its bar. */
export interface IVariableFxRendererRegistryLike
{
    resolveById(rendererId: number): VariableFxRendererFactory;
    resolve(category: string, renderer: string): VariableFxRendererFactory;
}

/** One of AIR's per-renderer painters. */
export interface IVariableFxRenderer
{
    readonly frame: VariableFxFrame;
    /** Draws new frames on its own (the striped bar's moving stripes). */
    readonly isContinuous: boolean;
    updateData(context: VariableFxRendererContext, now: number): void;
    needsUpdate(now: number): boolean;
    update(now: number): boolean;
    dispose(): void;
}

export type VariableFxRendererFactory = (context: VariableFxRendererContext) => IVariableFxRenderer;
