import { IMessageComposer } from '@octane/api';

/**
 * Saves a wired addon in the official AIR layout (build WIN63-202610131318): id, int params, string
 * param, furni picks, furni source types, user source types, variable ids and the second furni picks.
 */
export class UpdateAddonMessageComposer implements IMessageComposer<unknown[]>
{
    private _data: unknown[];

    constructor(id: number, ints: number[], string: string, stuffs: number[], furniSources: number[] = [], userSources: number[] = [], variableIds: string[] = [], stuffs2: number[] = [])
    {
        this._data = [
            id,
            ints.length, ...ints,
            string,
            stuffs.length, ...stuffs,
            furniSources.length, ...furniSources,
            userSources.length, ...userSources,
            variableIds.length, ...variableIds,
            stuffs2.length, ...stuffs2
        ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
