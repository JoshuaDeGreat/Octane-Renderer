import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { readWiredSignedLong } from './WiredVariableData';

/**
 * One row of AIR's monitor error list (`class_4332`): the error id (it picks `wiredmenu.error_info.<id>`), its name,
 * its category (ERROR / WARNING, it picks the row icon), how often it happened and the milliseconds since the latest
 * time; `-1` while it never happened.
 */
export interface IWiredErrorLogData
{
    errorId: number;
    errorName: string;
    category: string;
    amount: number;
    msSinceLatest: number;
}

/** AIR wired menu monitor error list (15, `class_4215`), the answer to WiredErrorLogsRequestComposer (1132) and to the clear (1632). */
export class WiredErrorLogsParser implements IMessageParser
{
    private _errors: IWiredErrorLogData[] = [];

    public flush(): boolean
    {
        this._errors = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._errors = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._errors.push({
                errorId: wrapper.readInt(),
                errorName: wrapper.readString(),
                category: wrapper.readString(),
                amount: wrapper.readInt(),
                msSinceLatest: readWiredSignedLong(wrapper)
            });
        }

        return true;
    }

    public get errors(): IWiredErrorLogData[]
    {
        return this._errors;
    }
}
