import { GetRenderer, WiredFilter } from '@octane/utils';
import { Filter, RenderTexture, Renderer, Sprite, Texture, TextureSource } from 'pixi.js';

// Drawn textures nobody shows any more are kept up to this many pixels, for a mark toggled back on.
const UNUSED_PIXEL_BUDGET = (1024 * 1024);
// All drawings together stay under this many pixels (16 MB); past it, marks draw through the filter.
const TOTAL_PIXEL_BUDGET = (4 * 1024 * 1024);

export interface IWiredHighlight
{
    readonly texture: Texture;
}

interface Entry extends IWiredHighlight
{
    texture: RenderTexture;
    sourceTexture: Texture;
    filter: WiredFilter;
    uniforms: Float32Array;
    refs: number;
    dirty: boolean;
    pixels: number;
}

// A WiredFilter only reads the texel it writes, so a frame drawn through it once looks the same as
// drawing the frame through it every frame. A marked sprite can then show the drawn frame and skip
// the filter's offscreen pass. One drawing per texture and filter, shared by the sprites showing it
// and counted: drawings no sprite shows are kept within a pixel budget, oldest dropped first, and a
// drawing a sprite shows is only ever redrawn in place, never dropped from under it.
export class WiredHighlightCache
{
    private static _entries: Map<Texture, Map<WiredFilter, Entry>> = new Map();
    private static _unused: Set<Entry> = new Set();
    private static _unusedPixels: number = 0;
    private static _texturesBySource: Map<TextureSource, Set<Texture>> = new Map();
    private static _trackedSources: Map<Texture, TextureSource> = new Map();
    private static _totalPixels: number = 0;
    private static _renderer: Renderer = null;

    public static getFilter(filters: Filter[]): WiredFilter
    {
        if(!filters || (filters.length !== 1)) return null;

        const filter = filters[0];

        return (filter instanceof WiredFilter) ? filter : null;
    }

    public static acquire(texture: Texture, filter: WiredFilter): IWiredHighlight
    {
        const renderer = GetRenderer();

        if(!renderer || !filter || !texture || texture.destroyed || (texture === Texture.EMPTY)) return null;

        if(!this.isEligibleSource(texture.source)) return null;

        this.watchRenderer(renderer);

        let filters = this._entries.get(texture);
        let entry = filters?.get(filter);

        if(!entry)
        {
            const pixels = this.targetSize(texture).pixels;

            while((this._totalPixels + pixels) > TOTAL_PIXEL_BUDGET)
            {
                const oldest = this._unused.values().next().value;

                if(!oldest) return null;

                this.remove(oldest);
            }

            entry = { texture: null, sourceTexture: texture, filter, uniforms: new Float32Array(6), refs: 0, dirty: false, pixels: 0 };

            if(!this.draw(renderer, entry)) return null;

            if(!filters)
            {
                filters = new Map();
                this._entries.set(texture, filters);

                texture.on('update', this.onTextureUpdate, this);
                texture.once('destroy', this.onTextureDestroy, this);

                this.trackSource(texture, texture.source);
            }

            filters.set(filter, entry);
        }

        else if(!this.isEligibleSource(texture.source))
        {
            this.remove(entry);

            return null;
        }

        else if(entry.dirty && !this.draw(renderer, entry)) return null;

        if(!entry.refs && this._unused.delete(entry)) this._unusedPixels -= this.pixels(entry);

        entry.refs++;

        return entry;
    }

    public static release(highlight: IWiredHighlight): void
    {
        const entry = highlight as Entry;

        if(!entry || (entry.refs <= 0)) return;

        entry.refs--;

        // Still shown elsewhere, or being dropped (its source went away).
        if(entry.refs || !entry.texture || entry.texture.destroyed) return;

        this._unused.add(entry);
        this._unusedPixels += this.pixels(entry);

        for(const unused of this._unused)
        {
            if(this._unusedPixels <= UNUSED_PIXEL_BUDGET) break;

            this.remove(unused);
        }
    }

    // Run before every render of a sprite showing a drawing: redraws it in place when its source
    // changed, the context came back, or the filter colours were changed on the filter itself.
    public static validate(highlight: IWiredHighlight): void
    {
        const entry = highlight as Entry;

        if(!entry || !entry.texture || entry.texture.destroyed) return;

        // The source can stop qualifying in place (scale mode, resource): then the drawing goes and
        // its sprites draw through the filter again.
        if(!this.isEligibleSource(entry.sourceTexture.source))
        {
            this.remove(entry);

            return;
        }

        // Drawn for another renderer: drop them all (the sprites showing them go back to the filter).
        const renderer = GetRenderer();

        if(renderer !== this._renderer)
        {
            this.watchRenderer(renderer);

            if(!entry.texture || entry.texture.destroyed) return;
        }

        if(entry.dirty)
        {
            this.draw(GetRenderer(), entry);

            return;
        }

        const uniforms = entry.filter.uniforms;
        const drawn = entry.uniforms;

        if((drawn[0] === uniforms.uLineColor[0]) && (drawn[1] === uniforms.uLineColor[1]) && (drawn[2] === uniforms.uLineColor[2])
            && (drawn[3] === uniforms.uColor[0]) && (drawn[4] === uniforms.uColor[1]) && (drawn[5] === uniforms.uColor[2])) return;

        this.draw(GetRenderer(), entry);
    }

    // Only loaded images: their pixels do not change behind our back. Render textures (avatars,
    // planes, generated images) can be redrawn without telling anyone.
    private static isEligibleSource(source: TextureSource): boolean
    {
        if(!source || source.destroyed || (source.scaleMode !== 'nearest')) return false;

        const resource = source.resource;

        return ((typeof ImageBitmap !== 'undefined') && (resource instanceof ImageBitmap))
            || ((typeof HTMLImageElement !== 'undefined') && (resource instanceof HTMLImageElement));
    }

    private static trackSource(texture: Texture, source: TextureSource): void
    {
        this._trackedSources.set(texture, source);

        let textures = this._texturesBySource.get(source);

        if(!textures)
        {
            textures = new Set();
            this._texturesBySource.set(source, textures);
            source.on('update', this.onSourceUpdate, this);
            source.on('destroy', this.onSourceDestroy, this);
        }

        textures.add(texture);
    }

    private static untrackSource(texture: Texture): void
    {
        const source = this._trackedSources.get(texture);

        this._trackedSources.delete(texture);

        if(!source) return;

        const textures = this._texturesBySource.get(source);

        textures?.delete(texture);

        if(textures && !textures.size)
        {
            this._texturesBySource.delete(source);
            source.off('update', this.onSourceUpdate, this);
            source.off('destroy', this.onSourceDestroy, this);
        }
    }

    // The drawing's size: whole logical pixels at the source's resolution. Its pixel count is what the
    // budget counts, rounded up so it never falls short of what the render texture holds.
    private static targetSize(texture: Texture): { width: number; height: number; resolution: number; pixels: number }
    {
        const width = Math.max(1, Math.round(texture.width));
        const height = Math.max(1, Math.round(texture.height));
        const resolution = texture.source.resolution;

        return { width, height, resolution, pixels: (Math.ceil(width * resolution) * Math.ceil(height * resolution)) };
    }

    private static draw(renderer: Renderer, entry: Entry): boolean
    {
        if(!renderer) return false;

        const texture = entry.sourceTexture;

        if(!this.isEligibleSource(texture.source))
        {
            this.remove(entry);

            return false;
        }

        const { width, height, resolution, pixels } = this.targetSize(texture);
        const before = entry.pixels;
        const growth = (pixels - before);

        // A redraw may grow the drawing (its frame changed). Make room in the budget first, or give it
        // up: the sprites showing it go back to the filter from their destroy listener.
        if(entry.texture && (growth > 0))
        {
            while((this._totalPixels + growth) > TOTAL_PIXEL_BUDGET)
            {
                const oldest = [ ...this._unused ].find(unused => (unused !== entry));

                if(!oldest)
                {
                    this.remove(entry);

                    return false;
                }

                this.remove(oldest);
            }
        }

        if(!entry.texture)
        {
            entry.texture = RenderTexture.create({ width, height, resolution, scaleMode: 'nearest' });
        }

        else if((entry.texture.width !== width) || (entry.texture.height !== height) || (entry.texture.source.resolution !== resolution))
        {
            entry.texture.source.resize(width, height, resolution);
        }

        entry.pixels = pixels;

        this._totalPixels += (pixels - before);

        if(this._unused.has(entry)) this._unusedPixels += (pixels - before);

        const sprite = new Sprite(texture);

        sprite.anchor.set(0);
        sprite.filters = [ entry.filter ];

        renderer.render({ container: sprite, target: entry.texture, clear: true });

        sprite.destroy();

        const uniforms = entry.filter.uniforms;

        entry.uniforms.set(uniforms.uLineColor, 0);
        entry.uniforms.set(uniforms.uColor, 3);
        entry.dirty = false;

        return true;
    }

    private static pixels(entry: Entry): number
    {
        return entry.pixels;
    }

    private static remove(entry: Entry): void
    {
        if(this._unused.delete(entry)) this._unusedPixels -= this.pixels(entry);

        const filters = this._entries.get(entry.sourceTexture);

        filters?.delete(entry.filter);

        if(filters && !filters.size)
        {
            this._entries.delete(entry.sourceTexture);

            entry.sourceTexture.off('update', this.onTextureUpdate, this);
            entry.sourceTexture.off('destroy', this.onTextureDestroy, this);

            this.untrackSource(entry.sourceTexture);
        }

        this._totalPixels -= this.pixels(entry);
        entry.pixels = 0;

        // Sprites still showing it (its source is going away) fall back from their destroy listener.
        if(entry.texture && !entry.texture.destroyed) entry.texture.destroy(true);

        entry.texture = null;
    }

    private static markDirty(texture: Texture): void
    {
        const filters = this._entries.get(texture);

        if(filters) for(const entry of filters.values()) entry.dirty = true;
    }

    // The texture's frame, trim, orig, rotation or source changed. A new source is tracked instead
    // of the old one; a new source that is not a loaded image ends the texture's drawings.
    private static onTextureUpdate(texture: Texture): void
    {
        const source = texture.source;

        if(this._trackedSources.get(texture) !== source)
        {
            if(!this.isEligibleSource(source))
            {
                this.onTextureDestroy(texture);

                return;
            }

            this.untrackSource(texture);
            this.trackSource(texture, source);
        }

        this.markDirty(texture);
    }

    // The pixels of the source changed (re-upload).
    private static onSourceUpdate(source: TextureSource): void
    {
        const textures = this._texturesBySource.get(source);

        if(textures) for(const texture of textures) this.markDirty(texture);
    }

    private static onSourceDestroy(source: TextureSource): void
    {
        const textures = this._texturesBySource.get(source);

        if(textures) for(const texture of [ ...textures ]) this.onTextureDestroy(texture);
    }

    private static onTextureDestroy(texture: Texture): void
    {
        const filters = this._entries.get(texture);

        if(!filters) return;

        for(const entry of [ ...filters.values() ]) this.remove(entry);
    }

    // Render textures lose their pixels with the context; every drawing is redrawn in place
    // before it is next shown.
    private static _contextListener = { contextChange: (): void => WiredHighlightCache.markAllDirty() };

    private static markAllDirty(): void
    {
        for(const filters of this._entries.values())
        {
            for(const entry of filters.values()) entry.dirty = true;
        }
    }

    private static watchRenderer(renderer: Renderer): void
    {
        if(this._renderer === renderer) return;

        // A new renderer: drawings of the old one belong to its context.
        if(this._renderer)
        {
            try
            {
                this._renderer.runners?.contextChange?.remove(this._contextListener);
            }
            catch
            {
                // A destroyed renderer has no runners left to leave.
            }

            for(const filters of [ ...this._entries.values() ])
            {
                for(const entry of [ ...filters.values() ]) this.remove(entry);
            }
        }

        this._renderer = renderer;

        renderer?.runners?.contextChange?.add(this._contextListener);
    }
}
