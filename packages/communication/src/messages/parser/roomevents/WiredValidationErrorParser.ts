import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** A placeholder of the refusal key and the value the server fills it with. */
export interface IWiredValidationErrorParameter
{
    key: string;
    value: string;
}

/**
 * A wired save the server refused: the localization key, then `count × (key, value)` placeholder pairs
 * (AIR `userdefinedroomevents/?_-J1M?`, pair `?_-kw?`). The pairs are read only when the server sent them.
 */
export class WiredValidationErrorParser implements IMessageParser
{
    private _info: string;
    private _parameters: IWiredValidationErrorParameter[];

    public flush(): boolean
    {
        this._info = null;
        this._parameters = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._info = wrapper.readString();
        this._parameters = [];

        if(!wrapper.bytesAvailable) return true;

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._parameters.push({ key: wrapper.readString(), value: wrapper.readString() });

            count--;
        }

        return true;
    }

    public get info(): string
    {
        return this._info;
    }

    public get parameters(): IWiredValidationErrorParameter[]
    {
        return this._parameters;
    }
}
