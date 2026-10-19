import { AlphaTolerance, IRoomObjectSprite, IRoomObjectVariableFxEntry } from '@octane/api';
import { Texture } from 'pixi.js';
import { VariableFxStackEntry } from './VariableFxStackEntry';

/** Where one drawn entry lands in the composed stack bitmap, and how opaque. */
export interface IVariableFxStackPiece
{
    entry: VariableFxStackEntry;
    /** Left / top relative to the stack anchor (the holder's axis and the stack bottom). */
    x: number;
    y: number;
    width: number;
    height: number;
    alpha: number;
}

export interface IVariableFxStackLayout
{
    pieces: IVariableFxStackPiece[];
    minX: number;
    minY: number;
    width: number;
    height: number;
    /** An entry is still sliding to its slot. */
    moving: boolean;
}

/** AIR's stack sort: layer, then the time the holder first showed it, config id, variable id. */
export const compareVariableFxStackEntries = (left: VariableFxStackEntry, right: VariableFxStackEntry): number =>
{
    if(left.layer !== right.layer) return (left.layer - right.layer);
    if(left.createdAt !== right.createdAt) return (left.createdAt - right.createdAt);
    if(left.configId !== right.configId) return (left.configId - right.configId);

    const variable = left.variableId.localeCompare(right.variableId);

    return ((variable !== 0) ? variable : (left.id - right.id));
};

/**
 * Lays the drawn entries out bottom up, as AIR's StackedAdditionStack does: the first one that takes
 * a slot sits on the stack bottom, each next one 4 px above the previous; an entry fading out keeps
 * the place it had while the rest slide into its slot. Entries are sorted already.
 */
export const layoutVariableFxStack = (entries: VariableFxStackEntry[], now: number, animate: boolean): IVariableFxStackLayout =>
{
    const pieces: IVariableFxStackPiece[] = [];
    let previous: VariableFxStackEntry = null;
    let previousY = 0;
    let moving = false;

    for(const entry of entries)
    {
        const frame = entry.frame;

        if(!frame || !frame.source || (frame.width <= 0) || (frame.height <= 0) || (entry.alpha <= 0)) continue;

        if(entry.takesSlot)
        {
            const target = ((previous === null) ? 0 : (previousY - previous.frame.height - VariableFxStack.STACK_SPACING));

            entry.place(target, now, animate);

            if(entry.isMoving) moving = true;

            previous = entry;
            previousY = target;
        }
        else
        {
            entry.freeze(now);
        }

        pieces.push({
            entry,
            x: (-Math.trunc(frame.width / 2) + frame.anchorX),
            y: (frame.anchorY + Math.round(entry.y.value) - frame.height),
            width: frame.width,
            height: frame.height,
            alpha: entry.alpha
        });
    }

    if(!pieces.length) return { pieces, minX: 0, minY: 0, width: 0, height: 0, moving };

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for(const piece of pieces)
    {
        minX = Math.min(minX, piece.x);
        minY = Math.min(minY, piece.y);
        maxX = Math.max(maxX, (piece.x + piece.width));
        maxY = Math.max(maxY, (piece.y + piece.height));
    }

    return { pieces, minX, minY, width: (maxX - minX), height: (maxY - minY), moving };
};

/**
 * The wired variable fx of one holder, drawn by its room object visualization as one sprite: AIR's
 * StackedAdditionStack with its VariableFxStackAdditions. The client sends the entries (with the
 * visualizers that paint them) through the object model; the stack fades them in and out, slides
 * them into place and composes the visible ones into a bitmap put on the holder's fx sprite.
 */
export class VariableFxStack
{
    public static STACK_SPACING: number = 4;

    private _entries: VariableFxStackEntry[] = [];
    private _source: IRoomObjectVariableFxEntry[] = null;
    private _sortNeeded: boolean = false;
    private _dirty: boolean = false;
    private _canvas: HTMLCanvasElement = null;
    private _texture: Texture = null;
    private _retiredTextures: Texture[] = [];
    private _layoutMinX: number = 0;
    private _layoutMinY: number = 0;
    private _height: number = 0;
    private _visible: boolean = false;
    private _disposed: boolean = false;

    /**
     * Takes the entries the client sent (the model value). New ones fade in, missing ones fade out
     * and leave; true when the drawing changed. The same array again is a no-op.
     */
    public setEntries(entries: IRoomObjectVariableFxEntry[], now: number): boolean
    {
        if(this._disposed || (entries === this._source)) return false;

        this._source = entries;

        const seen = new Set<string>();
        let changed = false;

        for(const source of (entries ?? []))
        {
            if(!source || !source.key || seen.has(source.key)) continue;

            seen.add(source.key);

            let entry = this.getEntry(source.key);

            if(!entry)
            {
                entry = new VariableFxStackEntry(source.key);

                this._entries.push(entry);

                changed = true;
            }

            const layer = entry.layer;
            const createdAt = entry.createdAt;
            const configId = entry.configId;
            const variableId = entry.variableId;

            if(entry.show(source, now)) changed = true;

            if((layer !== entry.layer) || (createdAt !== entry.createdAt) || (configId !== entry.configId) || (variableId !== entry.variableId)) this._sortNeeded = true;
        }

        for(const entry of this._entries)
        {
            if(!seen.has(entry.key) && entry.hide(now)) changed = true;
        }

        if(changed)
        {
            this._sortNeeded = true;
            this._dirty = true;
        }

        return changed;
    }

    /**
     * Advances fades, visualizers and the motion to `now` and draws the stack on `sprite`, its
     * bottom `bottomY` px from the holder's position and centred on `centerX`. True when the sprite
     * changed and the canvas has to place it again.
     */
    public apply(sprite: IRoomObjectSprite, centerX: number, bottomY: number, now: number): boolean
    {
        if(!sprite || this._disposed) return false;

        this.destroyRetiredTextures();

        let changed = this._dirty;

        for(const entry of this._entries)
        {
            if(entry.updateFade(now)) changed = true;
            if(entry.updateVisualizer(now)) changed = true;
        }

        if(this.removeFinished()) changed = true;

        const moving = this._entries.some(entry => entry.isMoving);

        if(!changed && !moving && ((this._visible && sprite.visible && sprite.texture) || (!this._visible && !sprite.visible)))
        {
            return this.place(sprite, centerX, bottomY);
        }

        this._dirty = false;

        if(this._sortNeeded)
        {
            this._entries.sort(compareVariableFxStackEntries);
            this._sortNeeded = false;
        }

        const layout = layoutVariableFxStack(this._entries, now, true);

        if(!layout.pieces.length || !this.compose(layout))
        {
            const wasVisible = sprite.visible;

            this.hideSprite(sprite);

            return wasVisible;
        }

        sprite.texture = this._texture;
        sprite.alpha = 255;
        sprite.visible = true;
        sprite.relativeDepth = VariableFxStackEntry.DEFAULT_RELATIVE_DEPTH;
        sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;
        sprite.skipMouseHandling = true;
        sprite.clickHandling = false;
        sprite.flipH = false;
        sprite.flipV = false;
        sprite.tag = 'variable_fx';
        sprite.name = 'variable_fx_stack';

        this._layoutMinX = layout.minX;
        this._layoutMinY = layout.minY;
        this._height = layout.height;
        this._visible = true;

        this.place(sprite, centerX, bottomY);

        return true;
    }

    /** Whether the stack still animates (a fade, a slide or a visualizer drawing new frames). */
    public get isAnimating(): boolean
    {
        if(this._dirty) return true;

        for(const entry of this._entries)
        {
            if(entry.isFading || entry.isMoving) return true;
        }

        return false;
    }

    public get isEmpty(): boolean
    {
        return !this._entries.length;
    }

    /** The composed height while something shows; what a habbicon above the stack is lifted by. */
    public get visibleHeight(): number
    {
        return (this._visible ? this._height : 0);
    }

    public get entries(): ReadonlyArray<VariableFxStackEntry>
    {
        return this._entries;
    }

    public dispose(): void
    {
        this._disposed = true;
        this._entries = [];
        this._source = null;

        this.destroyRetiredTextures();

        if(this._texture && !this._texture.destroyed) this._texture.destroy(true);

        this._texture = null;
        this._canvas = null;
    }

    /** A canvas for the composed stack; tests override it. */
    protected createCanvas(width: number, height: number): HTMLCanvasElement
    {
        if(typeof document === 'undefined') return null;

        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    protected createTexture(canvas: HTMLCanvasElement): Texture
    {
        return Texture.from(canvas, true);
    }

    protected updateTexture(texture: Texture): void
    {
        texture.source.update();
    }

    private place(sprite: IRoomObjectSprite, centerX: number, bottomY: number): boolean
    {
        if(!this._visible) return false;

        const offsetX = (Math.round(centerX) + this._layoutMinX);
        const offsetY = (Math.round(bottomY) + this._layoutMinY);

        if((sprite.offsetX === offsetX) && (sprite.offsetY === offsetY)) return false;

        sprite.offsetX = offsetX;
        sprite.offsetY = offsetY;

        return true;
    }

    private compose(layout: IVariableFxStackLayout): boolean
    {
        const width = Math.max(1, Math.ceil(layout.width));
        const height = Math.max(1, Math.ceil(layout.height));

        if(!this._canvas || (this._canvas.width !== width) || (this._canvas.height !== height))
        {
            const canvas = this.createCanvas(width, height);

            if(!canvas) return false;

            // The old texture may still be on screen this frame; it goes on the next apply.
            if(this._texture) this._retiredTextures.push(this._texture);

            this._canvas = canvas;
            this._texture = null;
        }

        const context = this._canvas.getContext('2d');

        if(!context) return false;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = 1;
        context.clearRect(0, 0, width, height);

        for(const piece of layout.pieces)
        {
            context.globalAlpha = (Math.max(0, Math.min(255, piece.alpha)) / 255);
            context.drawImage(piece.entry.frame.source, (piece.x - layout.minX), (piece.y - layout.minY));
        }

        context.globalAlpha = 1;

        if(!this._texture) this._texture = this.createTexture(this._canvas);
        else this.updateTexture(this._texture);

        return !!this._texture;
    }

    private hideSprite(sprite: IRoomObjectSprite): void
    {
        sprite.visible = false;
        sprite.alpha = 0;
        sprite.texture = null;

        this._visible = false;
        this._height = 0;
    }

    private removeFinished(): boolean
    {
        let removed = false;

        for(let index = (this._entries.length - 1); index >= 0; index--)
        {
            if(!this._entries[index].isFinished) continue;

            this._entries.splice(index, 1);

            removed = true;
        }

        return removed;
    }

    private getEntry(key: string): VariableFxStackEntry
    {
        for(const entry of this._entries)
        {
            if(entry.key === key) return entry;
        }

        return null;
    }

    private destroyRetiredTextures(): void
    {
        if(!this._retiredTextures.length) return;

        for(const texture of this._retiredTextures)
        {
            if(texture && !texture.destroyed) texture.destroy(true);
        }

        this._retiredTextures = [];
    }
}
