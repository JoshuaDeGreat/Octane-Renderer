/** AIR's VariableFxWidth: the size option of an fx, which each renderer turns into its own width. */
export class VariableFxWidth
{
    public static NOT_APPLICABLE: string = 'not_applicable';
    public static EXTRA_SMALL: string = 'extra_small';
    public static SMALL: string = 'small';
    public static MEDIUM: string = 'medium';
    public static LARGE: string = 'large';
    public static EXTRA_LARGE: string = 'extra_large';
    public static BIG_MAHOOSIVE_CHONKY: string = 'big_mahoosive_chonky';

    /** The width the server's width id stands for (AIR's wire table). */
    public static fromId(id: number): string
    {
        switch(id)
        {
            case -1: return VariableFxWidth.NOT_APPLICABLE;
            case 0: return VariableFxWidth.EXTRA_SMALL;
            case 1: return VariableFxWidth.SMALL;
            case 2: return VariableFxWidth.MEDIUM;
            case 3: return VariableFxWidth.LARGE;
            case 4: return VariableFxWidth.EXTRA_LARGE;
            case 100: return VariableFxWidth.BIG_MAHOOSIVE_CHONKY;
            default: return VariableFxWidth.MEDIUM;
        }
    }
}

/** Where a number display or boss bar puts its icon (AIR's icon alignment extra). */
export class VariableFxIconAlignment
{
    public static LEFT: string = 'left';
    public static RIGHT: string = 'right';
    public static DOUBLE: string = 'double';
}

/** AIR's fx categories, by name and by the server's id. */
export class VariableFxCategory
{
    public static HEALTH_POINTS: string = 'health_points';
    public static PROGRESS_BAR: string = 'progress_bar';
    public static LEVELLING_PROGRESS: string = 'levelling_progress';
    public static STATUS_BAR: string = 'status_bar';
    public static BOSS_BAR: string = 'boss_bar';
    public static NUMBER_DISPLAY: string = 'number_display';

    public static fromId(id: number): string
    {
        switch(id)
        {
            case 0: return VariableFxCategory.HEALTH_POINTS;
            case 1: return VariableFxCategory.PROGRESS_BAR;
            case 2: return VariableFxCategory.LEVELLING_PROGRESS;
            case 3: return VariableFxCategory.STATUS_BAR;
            case 4: return VariableFxCategory.BOSS_BAR;
            case 5: return VariableFxCategory.NUMBER_DISPLAY;
            default: return null;
        }
    }
}

/** AIR's renderer names and the server's renderer ids (VariableFxRendererType). */
export class VariableFxRendererType
{
    public static CLASSIC_PROGRESS: string = 'classic_progress';
    public static CLASSIC_MINI_PROGRESS: string = 'classic_mini_progress';
    public static BLOCK_PROGRESS: string = 'block_progress';
    public static STRIPED_PROGRESS: string = 'striped_progress';
    public static ARROW_PROGRESS: string = 'arrow_progress';
    public static HEALTH_PROGRESS: string = 'health_progress';
    public static MASKED_HEART_FILL: string = 'masked_heart_fill';
    public static STACKED_HEALTH_POINTS: string = 'stacked_health_points';
    public static THERMOMETER_HEALTH_POINTS: string = 'thermometer_health_points';
    public static LEVEL_WITH_PROGRESS: string = 'level_with_progress';
    public static LEVEL_WITH_BAR_AND_NUMERICAL_PROGRESS: string = 'level_with_bar_and_numerical_progress';
    public static BOSS_HEALTH_BAR: string = 'boss_health_bar';
    public static NUMERICAL_PROGRESS: string = 'numerical_progress';
    public static NUMBER_RECOLORABLE: string = 'number_recolorable';
    public static NUMBER_BAKED_COLORS: string = 'number_baked_colors';

    public static CLASSIC_PROGRESS_ID: number = 0;
    public static CLASSIC_MINI_PROGRESS_ID: number = 1;
    public static BLOCK_PROGRESS_ID: number = 2;
    public static STRIPED_PROGRESS_ID: number = 3;
    public static ARROW_PROGRESS_ID: number = 4;
    public static HEALTH_PROGRESS_ID: number = 10;
    public static MASKED_HEART_FILL_ID: number = 11;
    public static STACKED_HEALTH_POINTS_ID: number = 12;
    public static THERMOMETER_HEALTH_POINTS_ID: number = 13;
    public static LEVEL_WITH_PROGRESS_ID: number = 20;
    public static LEVEL_WITH_BAR_AND_NUMERICAL_PROGRESS_ID: number = 21;
    public static BOSS_HEALTH_BAR_ID: number = 100;
    public static NUMERICAL_PROGRESS_ID: number = 101;
    public static NUMBER_RECOLORABLE_ID: number = 200;
    public static NUMBER_BAKED_COLORS_ID: number = 201;

    private static NAMES: Record<number, string> = {
        0: 'classic_progress',
        1: 'classic_mini_progress',
        2: 'block_progress',
        3: 'striped_progress',
        4: 'arrow_progress',
        10: 'health_progress',
        11: 'masked_heart_fill',
        12: 'stacked_health_points',
        13: 'thermometer_health_points',
        20: 'level_with_progress',
        21: 'level_with_bar_and_numerical_progress',
        100: 'boss_health_bar',
        101: 'numerical_progress',
        200: 'number_recolorable',
        201: 'number_baked_colors'
    };

    public static resolveById(id: number): string
    {
        return (VariableFxRendererType.NAMES[id] ?? null);
    }

    public static resolveId(name: string): number
    {
        for(const id in VariableFxRendererType.NAMES)
        {
            if(VariableFxRendererType.NAMES[id] === name) return Number(id);
        }

        return -1;
    }
}

/**
 * The renderer classes the client ships per server renderer id: AIR's variablefx/renderers.xml
 * (asset variablefx_renderer_mapping) as data.
 */
export const VARIABLE_FX_RENDERER_MAPPING: ReadonlyArray<{ id: number, name: string, rendererClass: string }> = [
    { id: 0, name: 'classic_progress', rendererClass: 'ClassicProgressBarRenderer' },
    { id: 1, name: 'classic_mini_progress', rendererClass: 'ClassicMiniProgressBarRenderer' },
    { id: 2, name: 'block_progress', rendererClass: 'BlockProgressBarRenderer' },
    { id: 3, name: 'striped_progress', rendererClass: 'StripedProgressBarRenderer' },
    { id: 4, name: 'arrow_progress', rendererClass: 'ArrowProgressBarRenderer' },
    { id: 10, name: 'health_progress', rendererClass: 'HealthProgressBarRenderer' },
    { id: 11, name: 'masked_heart_fill', rendererClass: 'MaskedHeartFillRenderer' },
    { id: 12, name: 'stacked_health_points', rendererClass: 'StackedHealthPointsRenderer' },
    { id: 13, name: 'thermometer_health_points', rendererClass: 'ThermometerHealthPointsRenderer' },
    { id: 20, name: 'level_with_progress', rendererClass: 'LevelWithProgressRenderer' },
    { id: 21, name: 'level_with_bar_and_numerical_progress', rendererClass: 'LevelDetailsRenderer' },
    { id: 100, name: 'boss_health_bar', rendererClass: 'BossHealthBarRenderer' },
    { id: 200, name: 'number_recolorable', rendererClass: 'RecolorableNumberDisplayRenderer' },
    { id: 201, name: 'number_baked_colors', rendererClass: 'BakedColorNumberDisplayRenderer' }
];

/** Reads a trimmed extra, null when it is not there. */
export const readVariableFxExtra = (extra: Record<string, string>, key: string): string =>
{
    if(!extra) return null;

    const value = extra[key];

    if((value === undefined) || (value === null)) return null;

    return String(value).trim();
};
