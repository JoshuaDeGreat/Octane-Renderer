import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredLabel, readWiredLabelEntry } from './WiredLabelData';

/** Official furniture labels and regions update (AIR 796): labels added or changed, then removed ids. */
export class WiredLabelsUpdateParser implements IMessageParser
{
    private _changed: IWiredLabel[];
    private _removedIds: number[];

    public flush(): boolean
    {
        this._changed = [];
        this._removedIds = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._changed = [];
        this._removedIds = [];

        const changed = wrapper.readInt();

        if(changed < 0) return false;

        for(let i = 0; i < changed; i++)
        {
            const label = readWiredLabelEntry(wrapper);

            if(label) this._changed.push(label);
        }

        const removed = wrapper.readInt();

        if(removed < 0) return false;

        for(let i = 0; i < removed; i++)
        {
            this._removedIds.push(wrapper.readInt());
        }

        return true;
    }

    public get changed(): IWiredLabel[]
    {
        return this._changed;
    }

    public get removedIds(): number[]
    {
        return this._removedIds;
    }
}
