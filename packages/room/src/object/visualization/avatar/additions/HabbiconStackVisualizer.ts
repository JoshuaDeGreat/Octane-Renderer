import { IRoomObjectSprite, IRoomObjectVariableFxFrame } from '@octane/api';
import { Texture } from 'pixi.js';
import { IVariableFxStackedAdditionVisualizer } from '../../variablefx/VariableFxStackEntry';

/** What the stack needs of the habbicon bubble it draws. */
export interface IHabbiconStackSource
{
    readonly isFinished: boolean;
    isPartOfStack: boolean;
    update(sprite: IRoomObjectSprite, scale: number): void;
    animate(sprite: IRoomObjectSprite): boolean;
    dispose(): void;
}

/** The few sprite fields the bubble writes. */
interface IHabbiconStackSprite
{
    texture: Texture;
    visible: boolean;
    alpha: number;
    offsetX: number;
    offsetY: number;
    relativeDepth: number;
}

/**
 * The habbicon bubble as an entry of the avatar's stacked additions (AIR's StackedAdditions,
 * layer 100): the bubble draws on a stand-in sprite as before and the stack takes its bitmap from
 * there. In the stack the bubble keeps its own x (-20 / -10 px plus the frame compensation) and its
 * intro slide as the y offset; the stack puts its bottom on top of the fx below it.
 */
export class HabbiconStackVisualizer implements IVariableFxStackedAdditionVisualizer
{
    private _sprite: IHabbiconStackSprite = { texture: null, visible: false, alpha: 0, offsetX: 0, offsetY: 0, relativeDepth: 0 };
    private _frame: IRoomObjectVariableFxFrame = null;
    private _updateId: number = 0;
    private _scale: number = -1;
    private _started: boolean = false;

    constructor(
        private _source: IHabbiconStackSource,
        private readonly _resolveScale: () => number)
    {
        this._source.isPartOfStack = true;
    }

    public get source(): IHabbiconStackSource
    {
        return this._source;
    }

    public get frame(): IRoomObjectVariableFxFrame
    {
        return this._frame;
    }

    public get isFinished(): boolean
    {
        return (!this._source || this._source.isFinished);
    }

    public needsUpdate(now: number): boolean
    {
        return !this.isFinished;
    }

    public update(now: number): boolean
    {
        if(this.isFinished)
        {
            const had = !!this._frame;

            this._frame = null;

            return had;
        }

        const scale = this._resolveScale();
        const sprite = (this._sprite as unknown as IRoomObjectSprite);

        if(!this._started || (scale !== this._scale))
        {
            this._source.update(sprite, scale);
            this._scale = scale;
            this._started = true;
        }

        this._source.animate(sprite);

        return this.captureFrame();
    }

    public dispose(): void
    {
        this._source?.dispose();
        this._source = null;
        this._frame = null;
    }

    /** The bubble's current bitmap as a stack frame; true when it differs from the last one. */
    private captureFrame(): boolean
    {
        const texture = this._sprite.texture;
        const image = (texture?.source as unknown as { resource?: CanvasImageSource })?.resource ?? null;

        if(!this._sprite.visible || !texture || texture.destroyed || !image)
        {
            const had = !!this._frame;

            this._frame = null;

            return had;
        }

        const width = Math.round(texture.width);
        const height = Math.round(texture.height);
        const anchorX = (this._sprite.offsetX + Math.trunc(width / 2));
        const anchorY = this._sprite.offsetY;
        const previous = this._frame;

        if(previous && (previous.source === image) && (previous.width === width) && (previous.height === height) && (previous.anchorX === anchorX) && (previous.anchorY === anchorY)) return false;

        this._frame = { source: image, width, height, anchorX, anchorY, updateId: ++this._updateId };

        return true;
    }
}
