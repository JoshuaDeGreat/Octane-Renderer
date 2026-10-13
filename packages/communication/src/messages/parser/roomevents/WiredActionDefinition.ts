import { IMessageDataWrapper } from '@octane/api';
import { Triggerable } from './Triggerable';
import { IWiredLeaderboardContext, readWiredLeaderboardContext, WIRED_CONTEXT_VARIABLE_LEADERBOARD } from './WiredLeaderboardData';

export class WiredActionDefinition extends Triggerable
{
    private _type: number;
    private _delayInPulses: number;
    private _conflictingTriggers: number[];
    private _leaderboardContext: IWiredLeaderboardContext;

    constructor(wrapper: IMessageDataWrapper)
    {
        super(wrapper);

        this._conflictingTriggers = [];
        this._type = wrapper.readInt();
        this._delayInPulses = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._conflictingTriggers.push(wrapper.readInt());

            count--;
        }

        this._leaderboardContext = null;
        this.readContexts(wrapper);
    }

    /**
     * Official wired editor contexts, sent after the usual fields by boxes that need room data in
     * their editor. Only the variable leaderboard's (type 8) is known; reading stops at any other.
     */
    private readContexts(wrapper: IMessageDataWrapper): void
    {
        if(!wrapper.bytesAvailable) return;

        let count = wrapper.readInt();

        while(count > 0 && wrapper.bytesAvailable)
        {
            const type = wrapper.readInt();

            if(type !== WIRED_CONTEXT_VARIABLE_LEADERBOARD) return;

            this._leaderboardContext = readWiredLeaderboardContext(wrapper);

            count--;
        }
    }

    public get type(): number
    {
        return this._type;
    }

    public get code(): number
    {
        return this._type;
    }

    public get delayInPulses(): number
    {
        return this._delayInPulses;
    }

    /** The variable leaderboard editor context (type 8), null when the box sent none. */
    public get leaderboardContext(): IWiredLeaderboardContext
    {
        return this._leaderboardContext;
    }

    public get conflictingTriggers(): number[]
    {
        return this._conflictingTriggers;
    }
}
