import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** The wired setup share code: status (0 is OK), how many boxes it holds and the code. */
export class WiredSetupExportResultParser implements IMessageParser
{
    private _status = 0;
    private _boxCount = 0;
    private _code = '';

    public flush(): boolean
    {
        this._status = 0;
        this._boxCount = 0;
        this._code = '';
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._status = wrapper.readInt();
        this._boxCount = wrapper.readInt();
        this._code = wrapper.readString();
        return true;
    }

    public get status(): number
    {
        return this._status;
    }

    public get boxCount(): number
    {
        return this._boxCount;
    }

    public get code(): string
    {
        return this._code;
    }
}
