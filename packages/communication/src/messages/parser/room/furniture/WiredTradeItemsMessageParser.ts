import { IMessageDataWrapper } from '@octane/api';
import { TradingListItemParser } from '../../inventory/trading/TradingListItemParser';

/**
 * The wired trade table. AIR WIN63-202610131318 (package_192/class_3020): the normal trading item lists
 * (class_3481: int firstUserId, int n, item[n], int firstUserNumItems, int firstUserNumCredits, int secondUserId,
 * int m, item[m], int secondUserNumItems, int secondUserNumCredits), then bool canAccept, int extra.
 *
 * First user = what the player offers; second user = what the chest side gives (secondUserNumCredits = reward coins).
 * canAccept = the requirements are met; extra = how many times they are met.
 * There is no trade state on the wire: the client keeps its own state machine (AIR WiredTradingModel).
 */
export class WiredTradeItemsMessageParser extends TradingListItemParser
{
    private _canAccept: boolean = false;
    private _extra: number = 0;

    public flush(): boolean
    {
        this._canAccept = false;
        this._extra = 0;

        return super.flush();
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!super.parse(wrapper)) return false;

        this._canAccept = wrapper.readBoolean();
        this._extra = wrapper.readInt();

        return true;
    }

    public get canAccept(): boolean
    {
        return this._canAccept;
    }

    public get extra(): number
    {
        return this._extra;
    }
}
