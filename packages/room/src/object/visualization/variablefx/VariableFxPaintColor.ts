import { readVariableFxExtra } from './VariableFxTypes';

/** A resolved fx colour: the name it came from, the rgb to paint and whether the metallic layers apply. */
export interface IVariableFxColor
{
    name: string;
    rgb: number;
    metallic: boolean;
    /** The red-to-green band (0 red, 1 yellow, 2 green) a dynamic colour picked. */
    bandIndex?: number;
    /** A per-status colour (levelling, team or delegated): it switches at once instead of fading. */
    immediate?: boolean;
}

/**
 * AIR's variable fx colours: the named palette the editor offers, the server's colour ids and the
 * dynamic colours that follow the value (red to green), the level (a hue from green round to red)
 * or the holder's team. A style's own `color` / `metallic` extras override the palette entry.
 */
export class VariableFxPaintColor
{
    public static NOT_APPLICABLE: string = 'NOT_APPLICABLE';
    public static DYNAMIC_DELEGATED: string = 'DYNAMIC_DELEGATED';
    public static GREEN: string = 'GREEN';
    public static LIME_GREEN: string = 'LIME_GREEN';
    public static YELLOW: string = 'YELLOW';
    public static ORANGE: string = 'ORANGE';
    public static RED: string = 'RED';
    public static CYAN: string = 'CYAN';
    public static BLUE: string = 'BLUE';
    public static PURPLE: string = 'PURPLE';
    public static PINK: string = 'PINK';
    public static BROWN: string = 'BROWN';
    public static BEIGE: string = 'BEIGE';
    public static TEAL: string = 'TEAL';
    public static INDIGO: string = 'INDIGO';
    public static MAGENTA: string = 'MAGENTA';
    public static LIGHT_BLUE: string = 'LIGHT_BLUE';
    public static FIRE_ORANGE: string = 'FIRE_ORANGE';
    public static DARK_GREEN: string = 'DARK_GREEN';
    public static DARK_BLUE: string = 'DARK_BLUE';
    public static WHITE: string = 'WHITE';
    public static BRONZE: string = 'BRONZE';
    public static SILVER: string = 'SILVER';
    public static GOLD: string = 'GOLD';
    public static DIAMOND: string = 'DIAMOND';
    public static EMERALD: string = 'EMERALD';
    public static DYNAMIC_RED_TO_GREEN: string = 'DYNAMIC_RED_TO_GREEN';
    public static DYNAMIC_LEVELLING: string = 'DYNAMIC_LEVELLING';
    public static DYNAMIC_TEAM_COLOR: string = 'DYNAMIC_TEAM_COLOR';

    public static DYNAMIC_RED_TO_GREEN_BAND_RGBS: number[] = [ 0xEF2318, 0xFC9910, 0x0DCD1E ];
    public static DYNAMIC_LEVELLING_START_HUE: number = 115;
    public static DYNAMIC_LEVELLING_END_HUE: number = 360;
    public static DYNAMIC_LEVELLING_SATURATION: number = 0.85;
    public static DYNAMIC_LEVELLING_VALUE: number = 0.8;

    private static PALETTE: Record<string, { rgb: number, metallic: boolean }> = {
        GREEN: { rgb: 0x36B24A, metallic: false },
        LIME_GREEN: { rgb: 0x8DDC35, metallic: false },
        YELLOW: { rgb: 0xFFD83D, metallic: false },
        ORANGE: { rgb: 0xFF9F24, metallic: false },
        RED: { rgb: 0xDF291E, metallic: false },
        CYAN: { rgb: 0x42D4E8, metallic: false },
        BLUE: { rgb: 0x3B7DE3, metallic: false },
        PURPLE: { rgb: 0x8751D1, metallic: false },
        PINK: { rgb: 0xFF6FB3, metallic: false },
        BROWN: { rgb: 0x8A533A, metallic: false },
        BEIGE: { rgb: 0xD6C28C, metallic: false },
        TEAL: { rgb: 0x2FB7A8, metallic: false },
        INDIGO: { rgb: 0x4D5BD7, metallic: false },
        MAGENTA: { rgb: 0xD64BC1, metallic: false },
        LIGHT_BLUE: { rgb: 0x82CFFF, metallic: false },
        FIRE_ORANGE: { rgb: 0xFF5A1F, metallic: false },
        DARK_GREEN: { rgb: 0x1F6F3A, metallic: false },
        DARK_BLUE: { rgb: 0x1F3D8F, metallic: false },
        WHITE: { rgb: 0xD8D8D8, metallic: false },
        BRONZE: { rgb: 0xCD7F32, metallic: true },
        SILVER: { rgb: 0xC0C0C0, metallic: true },
        GOLD: { rgb: 0xFFC83D, metallic: true },
        DIAMOND: { rgb: 0x8EEAFF, metallic: true },
        EMERALD: { rgb: 0x27C46B, metallic: true },
        DYNAMIC_RED_TO_GREEN: { rgb: 0xDF291E, metallic: false },
        DYNAMIC_LEVELLING: { rgb: 0x2DCC1E, metallic: false },
        DYNAMIC_TEAM_COLOR: { rgb: 0xD8D8D8, metallic: false },
        DYNAMIC_DELEGATED: { rgb: 0xFFFFFF, metallic: false }
    };

    private static IDS: Record<number, string> = {
        [-1]: 'NOT_APPLICABLE',
        1: 'GREEN',
        2: 'LIME_GREEN',
        3: 'YELLOW',
        4: 'ORANGE',
        5: 'RED',
        6: 'CYAN',
        7: 'BLUE',
        8: 'PURPLE',
        9: 'PINK',
        10: 'BROWN',
        11: 'BEIGE',
        12: 'TEAL',
        13: 'INDIGO',
        14: 'MAGENTA',
        15: 'LIGHT_BLUE',
        16: 'FIRE_ORANGE',
        17: 'DARK_GREEN',
        18: 'DARK_BLUE',
        19: 'WHITE',
        100: 'BRONZE',
        101: 'SILVER',
        102: 'GOLD',
        103: 'DIAMOND',
        104: 'EMERALD',
        1000: 'DYNAMIC_RED_TO_GREEN',
        1001: 'DYNAMIC_LEVELLING',
        1002: 'DYNAMIC_TEAM_COLOR'
    };

    /** The colour the server's colour id stands for; anything unknown is "not applicable". */
    public static fromId(id: number): string
    {
        return (VariableFxPaintColor.IDS[id] ?? VariableFxPaintColor.NOT_APPLICABLE);
    }

    /** The palette entry of a colour name; unknown names paint white like "not applicable". */
    public static resolve(name: string): IVariableFxColor
    {
        const entry = VariableFxPaintColor.PALETTE[name];

        if(!entry) return { name: VariableFxPaintColor.NOT_APPLICABLE, rgb: 0xFFFFFF, metallic: false };

        return { name, rgb: entry.rgb, metallic: entry.metallic };
    }

    /** The config's colour with the style's `color` and `metallic` extras applied. */
    public static resolveConfigured(name: string, configExtra: Record<string, string> = null): IVariableFxColor
    {
        const color = VariableFxPaintColor.resolve(name);
        const metallic = VariableFxPaintColor.parseBoolean(readVariableFxExtra(configExtra, 'metallic'));
        const rgb = VariableFxPaintColor.parseRgb(readVariableFxExtra(configExtra, 'color'));

        return { name: color.name, rgb: (rgb ?? color.rgb), metallic: (metallic ?? color.metallic) };
    }

    /**
     * The colour to paint for the current value: the band of red to green the progress is in, the
     * level's hue, the team / delegated colour the status carries, or the configured colour.
     */
    public static resolveTarget(name: string, configExtra: Record<string, string> = null, progress: number = 0, statusExtra: Record<string, string> = null): IVariableFxColor
    {
        const color = VariableFxPaintColor.resolve(name);

        if(color.name === VariableFxPaintColor.DYNAMIC_RED_TO_GREEN)
        {
            const band = VariableFxPaintColor.resolveRedToGreenBand(progress);

            return { name: color.name, rgb: band.rgb, metallic: false, bandIndex: band.index };
        }

        if(color.name === VariableFxPaintColor.DYNAMIC_LEVELLING)
        {
            return { name: color.name, rgb: VariableFxPaintColor.resolveDynamicLevellingRgb(statusExtra), metallic: false, immediate: true };
        }

        if((color.name === VariableFxPaintColor.DYNAMIC_DELEGATED) || (color.name === VariableFxPaintColor.DYNAMIC_TEAM_COLOR))
        {
            return { name: color.name, rgb: (VariableFxPaintColor.parseRgb(readVariableFxExtra(statusExtra, 'delegated_color')) ?? color.rgb), metallic: false, immediate: true };
        }

        return VariableFxPaintColor.resolveConfigured(name, configExtra);
    }

    /** The rgb of a red-to-green band, null when the colour is not the red-to-green one. */
    public static resolveBandRgb(name: string, band: number): number
    {
        if(VariableFxPaintColor.resolve(name).name !== VariableFxPaintColor.DYNAMIC_RED_TO_GREEN) return null;

        return VariableFxPaintColor.DYNAMIC_RED_TO_GREEN_BAND_RGBS[Math.max(0, Math.min(2, Math.trunc(band)))];
    }

    public static isDynamic(name: string): boolean
    {
        return (VariableFxPaintColor.resolve(name).name.indexOf('DYNAMIC_') === 0);
    }

    /** Below a third red, below two thirds yellow, green above. */
    public static resolveRedToGreenBand(progress: number): { index: number, rgb: number }
    {
        const value = (Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0);
        const index = ((value < (1 / 3)) ? 0 : ((value < (2 / 3)) ? 1 : 2));

        return { index, rgb: VariableFxPaintColor.DYNAMIC_RED_TO_GREEN_BAND_RGBS[index] };
    }

    /** Level one green (hue 115), the cap red (hue 360), evenly in between; one level is green unless maxed. */
    public static resolveDynamicLevellingRgb(statusExtra: Record<string, string>): number
    {
        const maxLevelValue = Number(readVariableFxExtra(statusExtra, 'max_level'));
        const maxLevel = (Number.isFinite(maxLevelValue) ? (maxLevelValue | 0) : 0);
        const maxed = (String(readVariableFxExtra(statusExtra, 'is_maxed')).toLowerCase() === 'true');

        if(maxLevel <= 1)
        {
            return VariableFxPaintColor.hsvToRgb((maxed ? VariableFxPaintColor.DYNAMIC_LEVELLING_END_HUE : VariableFxPaintColor.DYNAMIC_LEVELLING_START_HUE), VariableFxPaintColor.DYNAMIC_LEVELLING_SATURATION, VariableFxPaintColor.DYNAMIC_LEVELLING_VALUE);
        }

        const levelValue = Number(readVariableFxExtra(statusExtra, 'current_level'));
        const level = (Number.isFinite(levelValue) ? (levelValue | 0) : 0);
        const ratio = Math.max(0, Math.min(1, ((level - 1) / (maxLevel - 1))));
        const hue = (VariableFxPaintColor.DYNAMIC_LEVELLING_START_HUE + ((VariableFxPaintColor.DYNAMIC_LEVELLING_END_HUE - VariableFxPaintColor.DYNAMIC_LEVELLING_START_HUE) * ratio));

        return VariableFxPaintColor.hsvToRgb(hue, VariableFxPaintColor.DYNAMIC_LEVELLING_SATURATION, VariableFxPaintColor.DYNAMIC_LEVELLING_VALUE);
    }

    public static hsvToRgb(hue: number, saturation: number, value: number): number
    {
        const h = (((hue % 360) + 360) % 360);
        const chroma = (value * saturation);
        const sector = (h / 60);
        const x = (chroma * (1 - Math.abs((sector % 2) - 1)));
        const m = (value - chroma);
        const rgb = VariableFxPaintColor.sectorRgb(sector, chroma, x);

        return (((Math.floor((rgb[0] + m) * 255) << 16) | (Math.floor((rgb[1] + m) * 255) << 8) | Math.floor((rgb[2] + m) * 255)) >>> 0);
    }

    public static sectorRgb(sector: number, chroma: number, x: number): number[]
    {
        if(sector < 1) return [ chroma, x, 0 ];
        if(sector < 2) return [ x, chroma, 0 ];
        if(sector < 3) return [ 0, chroma, x ];
        if(sector < 4) return [ 0, x, chroma ];
        if(sector < 5) return [ x, 0, chroma ];

        return [ chroma, 0, x ];
    }

    /** `#rrggbb`, `rrggbb` or `0xrrggbb`; null for anything else. */
    public static parseRgb(value: string): number
    {
        if((value === null) || (value === undefined)) return null;

        const hex = String(value).trim().replace(/^#/, '').replace(/^0x/i, '');

        return (/^[0-9a-f]{6}$/i.test(hex) ? (parseInt(hex, 16) & 0xFFFFFF) : null);
    }

    public static parseBoolean(value: string): boolean
    {
        switch((value === null || value === undefined) ? '' : value.toLowerCase())
        {
            case 'true': return true;
            case 'false': return false;
            default: return null;
        }
    }

    /**
     * Scales a colour's brightness (HSV value) by `factor`, keeping hue and saturation; the striped
     * bar darkens its stripes this way.
     */
    public static scaleValue(rgb: number, factor: number): number
    {
        const r = (((rgb >>> 16) & 255) / 255);
        const g = (((rgb >>> 8) & 255) / 255);
        const b = ((rgb & 255) / 255);
        const max = Math.max(r, g, b);
        const delta = (max - Math.min(r, g, b));
        let hue = 0;

        if(delta !== 0)
        {
            if(max === r) hue = (60 * (((g - b) / delta) % 6));
            else if(max === g) hue = (60 * (((b - r) / delta) + 2));
            else hue = (60 * (((r - g) / delta) + 4));
        }

        hue = (((hue % 360) + 360) % 360);

        const saturation = ((max === 0) ? 0 : (delta / max));
        const value = Math.max(0, Math.min(1, (max * factor)));
        const chroma = (value * saturation);
        const sector = (hue / 60);
        const x = (chroma * (1 - Math.abs((sector % 2) - 1)));
        const m = (value - chroma);
        const out = VariableFxPaintColor.sectorRgb(sector, chroma, x);
        const clamp = (channel: number) => Math.max(0, Math.min(255, Math.floor(channel)));

        return (((clamp((out[0] + m) * 255) << 16) | (clamp((out[1] + m) * 255) << 8) | clamp((out[2] + m) * 255)) >>> 0);
    }
}
