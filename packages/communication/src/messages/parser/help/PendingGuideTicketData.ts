import { IMessageDataWrapper } from '@octane/api';

/**
 * The call for help somebody already has open. The official `class_2768` reads a different set of
 * strings depending on the type, so the shape is decided here and not by the caller: reading a
 * fixed number of fields walks off the end of the packet. The types are the official request
 * types: a tour for a new or a returning user, a request for instructions, and a bully report.
 */
export class PendingGuideTicketData
{
    public static readonly TYPE_TOUR_NEW_USER: number = 0;
    public static readonly TYPE_INSTRUCTIONS: number = 1;
    public static readonly TYPE_TOUR_RETURNING_USER: number = 2;
    public static readonly TYPE_BULLY_REPORT: number = 3;

    private _type: number;
    private _secondsAgo: number;
    private _isGuide: boolean;
    private _otherPartyName: string = null;
    private _otherPartyFigure: string = null;
    private _description: string = null;
    private _roomName: string = null;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._type = wrapper.readInt();
        this._secondsAgo = wrapper.readInt();
        this._isGuide = wrapper.readBoolean();

        switch(this._type)
        {
            case PendingGuideTicketData.TYPE_TOUR_NEW_USER:
            case PendingGuideTicketData.TYPE_TOUR_RETURNING_USER:
                this._otherPartyName = wrapper.readString();
                this._otherPartyFigure = wrapper.readString();
                return;
            case PendingGuideTicketData.TYPE_INSTRUCTIONS:
                this._otherPartyName = wrapper.readString();
                this._otherPartyFigure = wrapper.readString();
                this._description = wrapper.readString();
                return;
            case PendingGuideTicketData.TYPE_BULLY_REPORT:
                // A guide looking at a bully report is told nothing about the other party.
                if(this._isGuide) return;
                this._otherPartyName = wrapper.readString();
                this._otherPartyFigure = wrapper.readString();
                this._roomName = wrapper.readString();
                return;
        }
    }

    public get type(): number
    {
        return this._type;
    }

    public get secondsAgo(): number
    {
        return this._secondsAgo;
    }

    public get isGuide(): boolean
    {
        return this._isGuide;
    }

    public get otherPartyName(): string
    {
        return this._otherPartyName;
    }

    public get otherPartyFigure(): string
    {
        return this._otherPartyFigure;
    }

    public get description(): string
    {
        return this._description;
    }

    public get roomName(): string
    {
        return this._roomName;
    }
}
