import { readVariableFxExtra } from '../../VariableFxTypes';

/**
 * The segment count of a segmented bar (AIR's VariableFxSegmentedProgress): the config's
 * `segments` extra when it is a positive number (at most 100), the renderer's count for the width
 * otherwise.
 */
export class VariableFxSegmentedProgress
{
    public static MAX_SEGMENTS: number = 100;

    public static resolveSegmentOverride(configExtra: Record<string, string>): number
    {
        const raw = readVariableFxExtra(configExtra, 'segments');

        if(!raw) return null;

        const value = Number(raw);

        if(!Number.isFinite(value)) return null;

        const count = (value | 0);

        return ((count <= 0) ? null : Math.min(VariableFxSegmentedProgress.MAX_SEGMENTS, count));
    }

    public static resolveSegmentCount(width: string, configExtra: Record<string, string>, byWidth: (width: string) => number): number
    {
        return ((VariableFxSegmentedProgress.resolveSegmentOverride(configExtra) ?? byWidth(width)) | 0);
    }
}
