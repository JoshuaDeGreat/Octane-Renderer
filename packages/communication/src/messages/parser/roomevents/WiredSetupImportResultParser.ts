import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** One box of a wired setup import: where it lands and what happened to it. */
export interface IWiredSetupImportEntry
{
    index: number;
    type: string;
    holder: string;
    x: number;
    y: number;
    /** 1 configure, 2 place from inventory, 3 missing, 4 refused, 5 blocked, 6 unsupported, 7 unchanged. */
    status: number;
    itemId: number;
    reason: string;
}

export interface IWiredSetupImportReport
{
    confirmed: boolean;
    status: number;
    anchorX: number;
    anchorY: number;
    total: number;
    configured: number;
    placed: number;
    missing: number;
    refused: number;
    entries: IWiredSetupImportEntry[];
}

const toNumber = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const toText = (value: unknown): string => (typeof value === 'string' ? value : '');

/** The wired setup import preview or result, sent as one JSON report. */
export class WiredSetupImportResultParser implements IMessageParser
{
    private _report: IWiredSetupImportReport | null = null;

    public flush(): boolean
    {
        this._report = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        try
        {
            const raw = JSON.parse(wrapper.readString()) as Record<string, unknown>;

            if(!raw || typeof raw !== 'object') return false;

            const entries = Array.isArray(raw.entries) ? raw.entries as Record<string, unknown>[] : [];

            this._report = {
                confirmed: raw.confirmed === true,
                status: toNumber(raw.status),
                anchorX: toNumber(raw.anchorX),
                anchorY: toNumber(raw.anchorY),
                total: toNumber(raw.total),
                configured: toNumber(raw.configured),
                placed: toNumber(raw.placed),
                missing: toNumber(raw.missing),
                refused: toNumber(raw.refused),
                entries: entries.filter((entry) => entry && typeof entry === 'object').map((entry) => ({
                    index: toNumber(entry.index),
                    type: toText(entry.type),
                    holder: toText(entry.holder),
                    x: toNumber(entry.x),
                    y: toNumber(entry.y),
                    status: toNumber(entry.status),
                    itemId: toNumber(entry.itemId),
                    reason: toText(entry.reason)
                }))
            };
            return true;
        }
        catch
        {
            this._report = null;
            return false;
        }
    }

    public get report(): IWiredSetupImportReport | null
    {
        return this._report;
    }
}
