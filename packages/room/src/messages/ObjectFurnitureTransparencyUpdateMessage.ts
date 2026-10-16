// AIR: RoomObjectFurnitureTransparencyUpdateMessage (WIN63-202610131318-860371703, messages/RoomObjectFurnitureTransparencyUpdateMessage.as).
import { RoomObjectUpdateMessage } from './RoomObjectUpdateMessage';

export class ObjectFurnitureTransparencyUpdateMessage extends RoomObjectUpdateMessage
{
    private _transparency: number;
    private _allowClickThrough: boolean;
    private _easingMode: number;
    private _initialize: boolean;

    constructor(transparency: number, allowClickThrough: boolean, easingMode: number, initialize: boolean = false)
    {
        super(null, null);

        this._transparency = transparency;
        this._allowClickThrough = allowClickThrough;
        this._easingMode = easingMode;
        this._initialize = initialize;
    }

    public get transparency(): number
    {
        return this._transparency;
    }

    public get allowClickThrough(): boolean
    {
        return this._allowClickThrough;
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
