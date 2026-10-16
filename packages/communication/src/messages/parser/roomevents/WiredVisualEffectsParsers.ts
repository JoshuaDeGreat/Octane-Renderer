import { IMessageDataWrapper, IMessageParser } from '@octane/api';

const MAXIMUM_COUNT = 10000;

const readCount = (wrapper: IMessageDataWrapper): number =>
{
    const count = wrapper.readInt();

    if((count < 0) || (count > MAXIMUM_COUNT)) throw new Error('Invalid wired visual effect count');

    return count;
};

const readInts = (wrapper: IMessageDataWrapper): number[] => Array.from({ length: readCount(wrapper) }, () => wrapper.readInt());

/**
 * Furni (or, for the user variant, room units) made transparent by "set furni transparency": count, ids
 * (negative for wall items), transparency (0 visible, 100 invisible), allowClickThrough, easingMode (0 none, 1..4 eased).
 */
export class WiredFurniTransparencyParser implements IMessageParser
{
    private _ids: number[] = [];
    private _transparency = 0;
    private _allowClickThrough = false;
    private _easingMode = 0;

    public flush(): boolean
    {
        this._ids = [];
        this._transparency = 0;
        this._allowClickThrough = false;
        this._easingMode = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._ids = readInts(wrapper);
        this._transparency = wrapper.readInt();
        this._allowClickThrough = wrapper.readBoolean();
        this._easingMode = wrapper.readInt();

        return true;
    }

    /** Furni ids, or room indices for the user variant. */
    public get ids(): number[]
    {
        return this._ids;
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
}

/** The user variant: the same body with room unit indices. */
export class WiredUserTransparencyParser extends WiredFurniTransparencyParser
{
    public get roomIndices(): number[]
    {
        return this.ids;
    }
}

/**
 * Furni highlighted by "set furni highlight": count, furni ids (negative for wall items), highlightType (0 outline,
 * 1 soft glow, 2 darken, 3 colour tint, 4 brighten, 5 neon aura), strength (0..100), color (RGB), animationMode
 * (0 steady, 1 pulse), easingMode.
 */
export class WiredFurniHighlightParser implements IMessageParser
{
    private _ids: number[] = [];
    private _highlightType = 0;
    private _strength = 0;
    private _color = 0;
    private _animationMode = 0;
    private _easingMode = 0;

    public flush(): boolean
    {
        this._ids = [];
        this._highlightType = 0;
        this._strength = 0;
        this._color = 0;
        this._animationMode = 0;
        this._easingMode = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._ids = readInts(wrapper);
        this._highlightType = wrapper.readInt();
        this._strength = wrapper.readInt();
        this._color = wrapper.readInt();
        this._animationMode = wrapper.readInt();
        this._easingMode = wrapper.readInt();

        return true;
    }

    public get furniIds(): number[]
    {
        return this._ids;
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
}

/** The user variant: the same body with room unit indices. */
export class WiredUserHighlightParser extends WiredFurniHighlightParser
{
    public get roomIndices(): number[]
    {
        return this.furniIds;
    }
}

/** One furni (negative id for wall items) or room unit's transparency. */
export interface IWiredTransparencyState
{
    id: number;
    transparency: number;
    allowClickThrough: boolean;
    easingMode: number;
}

/** One furni (negative id for wall items) or room unit's highlight. */
export interface IWiredHighlightState
{
    id: number;
    highlightType: number;
    strength: number;
    color: number;
    animationMode: number;
    easingMode: number;
}

/** The transparency and highlight a room already shows, sent to a user entering it: the transparency list, then the highlight list. */
export class WiredVisualizationStateParser implements IMessageParser
{
    private _transparencies: IWiredTransparencyState[] = [];
    private _highlights: IWiredHighlightState[] = [];

    public flush(): boolean
    {
        this._transparencies = [];
        this._highlights = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._transparencies = Array.from({ length: readCount(wrapper) }, () => ({
            id: wrapper.readInt(),
            transparency: wrapper.readInt(),
            allowClickThrough: wrapper.readBoolean(),
            easingMode: wrapper.readInt()
        }));
        this._highlights = Array.from({ length: readCount(wrapper) }, () => ({
            id: wrapper.readInt(),
            highlightType: wrapper.readInt(),
            strength: wrapper.readInt(),
            color: wrapper.readInt(),
            animationMode: wrapper.readInt(),
            easingMode: wrapper.readInt()
        }));

        return true;
    }

    public get transparencies(): IWiredTransparencyState[]
    {
        return this._transparencies;
    }

    public get highlights(): IWiredHighlightState[]
    {
        return this._highlights;
    }
}

export class WiredFurniVisualizationStateParser extends WiredVisualizationStateParser
{
}

export class WiredUserVisualizationStateParser extends WiredVisualizationStateParser
{
}
