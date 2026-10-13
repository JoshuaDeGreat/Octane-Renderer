import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredLabel, readWiredLabelEntry } from './WiredLabelData';

/** Official furniture labels and regions (AIR 2237): every label this player may see. */
export class WiredLabelsParser implements IMessageParser
{
    private _labels: IWiredLabel[];

    public flush(): boolean
    {
        this._labels = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._labels = [];

        const count = wrapper.readInt();

        if(count < 0) return false;

        for(let i = 0; i < count; i++)
        {
            const label = readWiredLabelEntry(wrapper);

            if(label) this._labels.push(label);
        }

        return true;
    }

    public get labels(): IWiredLabel[]
    {
        return this._labels;
    }
}
