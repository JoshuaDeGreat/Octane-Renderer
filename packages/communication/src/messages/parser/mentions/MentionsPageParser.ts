import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { MentionListItem } from './MentionListItem';

/** The page after the list the client already has: mentions older than the oldest one it holds. */
export class MentionsPageParser implements IMessageParser
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
        this._hasMore = wrapper.readBoolean();
        return true;
    }

    public get mentions(): MentionListItem[]
    {
        return this._mentions;
    }

    public get hasMore(): boolean
    {
        return this._hasMore;
    }
}
