// AIR: RoomObjectFurnitureHighlightUpdateMessage (WIN63-202610131318-860371703, messages/RoomObjectFurnitureHighlightUpdateMessage.as).
import { RoomObjectUpdateMessage } from './RoomObjectUpdateMessage';

export class ObjectFurnitureHighlightUpdateMessage extends RoomObjectUpdateMessage
{
    private _highlightType: number;
    private _strength: number;
    private _color: number;
    private _animationMode: number;
    private _easingMode: number;
    private _initialize: boolean;

    constructor(highlightType: number, strength: number, color: number, animationMode: number, easingMode: number, initialize: boolean = false)
    {
        super(null, null);

        this._highlightType = highlightType;
        this._strength = strength;
        this._color = color;
        this._animationMode = animationMode;
        this._easingMode = easingMode;
        this._initialize = initialize;
    }

    public get highlightType(): number
    {
        return this._highlightType;
    }

    public get strength(): number
    {
        return this._strength;
    }

    public get color(): number
    {
        return this._color;
    }

    public get animationMode(): number
    {
        return this._animationMode;
    }

    public get easingMode(): number
    {
        return this._easingMode;
    }

    public get initialize(): boolean
    {
        return this._initialize;
    }
}
