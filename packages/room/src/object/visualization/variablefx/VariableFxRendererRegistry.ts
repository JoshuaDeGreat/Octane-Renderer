import { ArrowProgressBarRenderer } from './renderers/bar/ArrowProgressBarRenderer';
import { BlockProgressBarRenderer } from './renderers/bar/BlockProgressBarRenderer';
import { BossHealthBarRenderer, ClassicMiniProgressBarRenderer, ClassicProgressBarRenderer, HealthProgressBarRenderer } from './renderers/bar/ClassicProgressBarRenderer';
import { MaskedHeartFillRenderer } from './renderers/bar/MaskedHeartFillRenderer';
import { StripedProgressBarRenderer } from './renderers/bar/StripedProgressBarRenderer';
import { ThermometerHealthPointsRenderer } from './renderers/bar/ThermometerHealthPointsRenderer';
import { StackedHealthPointsRenderer } from './renderers/healthpoints/StackedHealthPointsRenderer';
import { LevelDetailsRenderer } from './renderers/level/LevelDetailsRenderer';
import { LevelWithProgressRenderer } from './renderers/level/LevelWithProgressRenderer';
import { BakedColorNumberDisplayRenderer, RecolorableNumberDisplayRenderer } from './renderers/number/NumberDisplayRenderers';
import { IVariableFxRendererRegistryLike, VariableFxRendererFactory } from './VariableFxConfig';
import { VARIABLE_FX_RENDERER_MAPPING, VariableFxCategory, VariableFxRendererType } from './VariableFxTypes';

/**
 * Which painter draws a config (AIR's VariableFxRendererRegistry): by the server's renderer id
 * through the renderer mapping, else by category and renderer name.
 */
export class VariableFxRendererRegistry implements IVariableFxRendererRegistryLike
{
    private static _default: VariableFxRendererRegistry = null;

    private _factories: Record<string, VariableFxRendererFactory> = {};
    private _registrations: { category: string, style: string, create: VariableFxRendererFactory }[] = [];
    private _byId: Map<number, VariableFxRendererFactory> = new Map();

    public static getDefault(): VariableFxRendererRegistry
    {
        if(!VariableFxRendererRegistry._default) VariableFxRendererRegistry._default = VariableFxRendererRegistry.createDefault();

        return VariableFxRendererRegistry._default;
    }

    public static createDefault(): VariableFxRendererRegistry
    {
        const registry = new VariableFxRendererRegistry();

        registry.registerFactory('ArrowProgressBarRenderer', context => new ArrowProgressBarRenderer(context));
        registry.registerFactory('BakedColorNumberDisplayRenderer', context => new BakedColorNumberDisplayRenderer(context));
        registry.registerFactory('BlockProgressBarRenderer', context => new BlockProgressBarRenderer(context));
        registry.registerFactory('BossHealthBarRenderer', context => new BossHealthBarRenderer(context));
        registry.registerFactory('ClassicMiniProgressBarRenderer', context => new ClassicMiniProgressBarRenderer(context));
        registry.registerFactory('ClassicProgressBarRenderer', context => new ClassicProgressBarRenderer(context));
        registry.registerFactory('HealthProgressBarRenderer', context => new HealthProgressBarRenderer(context));
        registry.registerFactory('LevelDetailsRenderer', context => new LevelDetailsRenderer(context));
        registry.registerFactory('LevelWithProgressRenderer', context => new LevelWithProgressRenderer(context));
        registry.registerFactory('MaskedHeartFillRenderer', context => new MaskedHeartFillRenderer(context));
        registry.registerFactory('RecolorableNumberDisplayRenderer', context => new RecolorableNumberDisplayRenderer(context));
        registry.registerFactory('StackedHealthPointsRenderer', context => new StackedHealthPointsRenderer(context));
        registry.registerFactory('StripedProgressBarRenderer', context => new StripedProgressBarRenderer(context));
        registry.registerFactory('ThermometerHealthPointsRenderer', context => new ThermometerHealthPointsRenderer(context));

        const factory = (name: string) => registry._factories[name];
        const register = (category: string, style: string, name: string) => registry.register(category, style, factory(name));

        register(VariableFxCategory.PROGRESS_BAR, VariableFxRendererType.CLASSIC_PROGRESS, 'ClassicProgressBarRenderer');
        register(VariableFxCategory.PROGRESS_BAR, VariableFxRendererType.CLASSIC_MINI_PROGRESS, 'ClassicMiniProgressBarRenderer');
        register(VariableFxCategory.PROGRESS_BAR, VariableFxRendererType.BLOCK_PROGRESS, 'BlockProgressBarRenderer');
        register(VariableFxCategory.PROGRESS_BAR, VariableFxRendererType.STRIPED_PROGRESS, 'StripedProgressBarRenderer');
        register(VariableFxCategory.PROGRESS_BAR, VariableFxRendererType.ARROW_PROGRESS, 'ArrowProgressBarRenderer');
        register(VariableFxCategory.STATUS_BAR, VariableFxRendererType.BLOCK_PROGRESS, 'BlockProgressBarRenderer');
        register(VariableFxCategory.STATUS_BAR, VariableFxRendererType.STRIPED_PROGRESS, 'StripedProgressBarRenderer');
        register(VariableFxCategory.STATUS_BAR, VariableFxRendererType.ARROW_PROGRESS, 'ArrowProgressBarRenderer');
        register(VariableFxCategory.HEALTH_POINTS, VariableFxRendererType.HEALTH_PROGRESS, 'HealthProgressBarRenderer');
        register(VariableFxCategory.HEALTH_POINTS, VariableFxRendererType.MASKED_HEART_FILL, 'MaskedHeartFillRenderer');
        register(VariableFxCategory.HEALTH_POINTS, VariableFxRendererType.STACKED_HEALTH_POINTS, 'StackedHealthPointsRenderer');
        register(VariableFxCategory.HEALTH_POINTS, VariableFxRendererType.THERMOMETER_HEALTH_POINTS, 'ThermometerHealthPointsRenderer');
        register(VariableFxCategory.LEVELLING_PROGRESS, VariableFxRendererType.LEVEL_WITH_PROGRESS, 'LevelWithProgressRenderer');
        register(VariableFxCategory.LEVELLING_PROGRESS, VariableFxRendererType.LEVEL_WITH_BAR_AND_NUMERICAL_PROGRESS, 'LevelDetailsRenderer');
        register(VariableFxCategory.BOSS_BAR, VariableFxRendererType.BOSS_HEALTH_BAR, 'BossHealthBarRenderer');
        register(VariableFxCategory.NUMBER_DISPLAY, VariableFxRendererType.NUMBER_RECOLORABLE, 'RecolorableNumberDisplayRenderer');
        register(VariableFxCategory.NUMBER_DISPLAY, VariableFxRendererType.NUMBER_BAKED_COLORS, 'BakedColorNumberDisplayRenderer');

        for(const mapping of VARIABLE_FX_RENDERER_MAPPING)
        {
            const create = registry._factories[mapping.rendererClass];

            if(!create) throw new Error(`No Variable FX renderer factory registered for class '${ mapping.rendererClass }'.`);

            if(VariableFxRendererType.resolveById(mapping.id) === mapping.name) registry._byId.set(mapping.id, create);
        }

        return registry;
    }

    public registerFactory(rendererClass: string, create: VariableFxRendererFactory): void
    {
        this._factories[rendererClass] = create;
    }

    public register(category: string, style: string, create: VariableFxRendererFactory): void
    {
        this._registrations.push({ category, style, create });
    }

    public resolve(category: string, style: string = null): VariableFxRendererFactory
    {
        if(style !== null)
        {
            for(const registration of this._registrations)
            {
                if((registration.category === category) && (registration.style === style)) return registration.create;
            }
        }

        for(const registration of this._registrations)
        {
            if((registration.category === category) && (registration.style === null)) return registration.create;
        }

        return null;
    }

    public resolveById(rendererId: number): VariableFxRendererFactory
    {
        return (this._byId.get(rendererId) ?? null);
    }

    /** The class name the mapping gives a server renderer id, for tests and logging. */
    public static rendererClassOf(rendererId: number): string
    {
        return (VARIABLE_FX_RENDERER_MAPPING.find(mapping => (mapping.id === rendererId))?.rendererClass ?? null);
    }
}
