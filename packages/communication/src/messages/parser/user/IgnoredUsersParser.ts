import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** The ignored users (AIR `?_-A1M?/?_-02j?`): their user ids. */
export class IgnoredUsersParser implements IMessageParser
{
    private _ignoredUserIds: number[];

    public flush(): boolean
    {
        this._ignoredUserIds = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._ignoredUserIds = [];

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._ignoredUserIds.push(wrapper.readInt());

            count--;
        }

        return true;
    }

    public get ignoredUserIds(): number[]
    {
        return this._ignoredUserIds;
    }
}
