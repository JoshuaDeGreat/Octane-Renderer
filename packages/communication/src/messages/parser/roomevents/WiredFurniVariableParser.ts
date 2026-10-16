import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { WiredVariableDefinition } from './WiredVariableDefinition';

export class WiredFurniVariableParser implements IMessageParser
{
    private _definition: WiredVariableDefinition;

    public flush(): boolean
    {
        this._definition = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._definition = new WiredVariableDefinition(wrapper);

        return true;
    }

    public get definition(): WiredVariableDefinition
    {
        return this._definition;
    }
}
