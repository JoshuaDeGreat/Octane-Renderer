/** The badge part tables of GroupBadgePartsEvent, kept between sessions so badges draw before the server answers. */
export interface GroupBadgePartTables
{
    bases: Map<number, string[]>;
    symbols: Map<number, string[]>;
    partColors: Map<number, string>;
}

const STORAGE_KEY = 'octane.group_badge_parts.v1';

type StoredTables = { bases: [number, string[]][]; symbols: [number, string[]][]; partColors: [number, string][] };

const getStorage = (): Storage | null =>
{
    try
    {
        return (typeof localStorage !== 'undefined') ? localStorage : null;
    }
    catch
    {
        return null;
    }
};

/** A stable text form of the tables: equal tables give equal text. */
export const serializeGroupBadgeParts = (tables: GroupBadgePartTables): string =>
{
    const sorted = <T>(map: Map<number, T>): [number, T][] => [ ...map.entries() ].sort((a, b) => a[0] - b[0]);
    const stored: StoredTables = { bases: sorted(tables.bases), symbols: sorted(tables.symbols), partColors: sorted(tables.partColors) };

    return JSON.stringify(stored);
};

export const parseGroupBadgeParts = (text: string | null): GroupBadgePartTables | null =>
{
    if(!text) return null;

    try
    {
        const stored = JSON.parse(text) as StoredTables;

        if(!Array.isArray(stored?.bases) || !Array.isArray(stored?.symbols) || !Array.isArray(stored?.partColors)) return null;
        if(!stored.bases.length || !stored.symbols.length) return null;

        return { bases: new Map(stored.bases), symbols: new Map(stored.symbols), partColors: new Map(stored.partColors) };
    }
    catch
    {
        return null;
    }
};

export const readGroupBadgePartsCache = (): GroupBadgePartTables | null =>
{
    try
    {
        return parseGroupBadgeParts(getStorage()?.getItem(STORAGE_KEY) ?? null);
    }
    catch
    {
        return null;
    }
};

export const writeGroupBadgePartsCache = (serialized: string): void =>
{
    try
    {
        getStorage()?.setItem(STORAGE_KEY, serialized);
    }
    catch
    {
        // A full or blocked storage only costs the head start on the next login.
    }
};
