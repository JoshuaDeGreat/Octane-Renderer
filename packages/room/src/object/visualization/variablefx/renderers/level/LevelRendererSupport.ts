import { VariableFxConfig, VariableFxRendererContext, VariableFxStatusData } from '../../VariableFxConfig';
import { VariableFxPaintColor } from '../../VariableFxPaintColor';
import { readVariableFxExtra } from '../../VariableFxTypes';
import { LevelProgressPathAnimator, LevelProgressPathSample } from './LevelProgressPathAnimator';

/** The level, cap and maxed flag a status carries, with how far into the level its value is. */
export const resolveLevelProgressSample = (context: VariableFxRendererContext): LevelProgressPathSample =>
{
    const level = Number(readVariableFxExtra(context.status.extra, 'current_level'));
    const maxLevel = Number(readVariableFxExtra(context.status.extra, 'max_level'));
    const maxed = (String(readVariableFxExtra(context.status.extra, 'is_maxed')).toLowerCase() === 'true');
    const progress = LevelProgressPathAnimator.resolveSampleProgress(context.progress, context.status.value, context.minValue, context.maxValue, maxed);

    return new LevelProgressPathSample(level, progress, maxed, (Number.isFinite(maxLevel) ? maxLevel : null));
};

/** The status extras with the displayed level in place of the target one, for the level colour. */
export const createDisplayedLevelStatusExtra = (statusExtra: Record<string, string>, displayedLevel: number): Record<string, string> =>
{
    const extra: Record<string, string> = {
        max_level: readVariableFxExtra(statusExtra, 'max_level'),
        is_maxed: readVariableFxExtra(statusExtra, 'is_maxed'),
        current_level: String(displayedLevel)
    };
    const delegated = readVariableFxExtra(statusExtra, 'delegated_color');

    if(delegated !== null) extra.delegated_color = delegated;

    return extra;
};

export const formatVariableFxRgbHex = (rgb: number): string => `#${ (rgb & 0xFFFFFF).toString(16).padStart(6, '0') }`;

/**
 * The extras a level's bar is drawn with: a bar that follows the level colour gets the badge's
 * displayed colour, one in the team colour the holder's team colour.
 */
export const createLevelBarStatusExtra = (barConfig: VariableFxConfig, statusExtra: Record<string, string>, displayedArgb: number): Record<string, string> =>
{
    const extra: Record<string, string> = {};

    if(barConfig.color !== VariableFxPaintColor.DYNAMIC_DELEGATED)
    {
        const delegated = ((barConfig.color === VariableFxPaintColor.DYNAMIC_TEAM_COLOR) ? readVariableFxExtra(statusExtra, 'delegated_color') : null);

        if(delegated !== null) extra.delegated_color = delegated;

        return extra;
    }

    extra.delegated_color = formatVariableFxRgbHex(displayedArgb & 0xFFFFFF);

    return extra;
};

/** The bar's context: its own config, the displayed progress as the value on 0 to 1, always settled. */
export const createLevelBarContext = (context: VariableFxRendererContext, barConfig: VariableFxConfig, progress: number, statusExtra: Record<string, string>): VariableFxRendererContext =>
    new VariableFxRendererContext(context.assets, barConfig, new VariableFxStatusData(progress, null, null, statusExtra, true), 0, 1, progress, context.registry);
