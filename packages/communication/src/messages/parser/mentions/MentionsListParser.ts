import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { MentionListItem } from './MentionListItem';

export class MentionsListParser implements IMessageParser
{
    private _mentions: MentionListItem[];
    private _hasMore: boolean;

    public flush(): boolean
    {
        this._mentions = [];
        this._hasMore = false;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this._mentions = [];
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            this._mentions.push(new MentionListItem(wrapper, true));
        }
        // Servers that do not page send nothing after the list: nothing older remains.
        this._hasMore = wrapper.bytesAvailable ? wrapper.readBoolean() : false;
        return true;
    }

    public get mentions(): MentionListItem[]
    {
        return this._mentions;
    }

    /** True when older mentions than the ones in this list are still on the server. */
    public get hasMore(): boolean
    {
        return this._hasMore;
    }
}
