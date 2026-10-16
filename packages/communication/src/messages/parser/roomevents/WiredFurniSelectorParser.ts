import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { WiredSelectorDefinition } from './WiredSelectorDefinition';

export class WiredFurniSelectorParser implements IMessageParser
{
    private _definition: WiredSelectorDefinition;

    public flush(): boolean
    {
        this._definition = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._definition = new WiredSelectorDefinition(wrapper);

        return true;
    }

    public get definition(): WiredSelectorDefinition
    {
        return this._definition;
    }
}
