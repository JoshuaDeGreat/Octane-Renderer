import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { WiredAddonDefinition } from './WiredAddonDefinition';

export class WiredFurniAddonParser implements IMessageParser
{
    private _definition: WiredAddonDefinition;

    public flush(): boolean
    {
        this._definition = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._definition = new WiredAddonDefinition(wrapper);

        return true;
    }

    public get definition(): WiredAddonDefinition
    {
        return this._definition;
    }
}
