import { isImmutableTextureSource } from '@octane/assets';
import { GetRenderer, GetTexturePool } from '@octane/utils';
import { Container, ImageSource, Renderer, Sprite, Texture, TextureSource } from 'pixi.js';

export type AvatarFrameTexture = {
    texture: Texture;
    key: string;
    references: number;
    cached: boolean;
    bytes: number;
};

// Outputs are immutable while cached or borrowed. Only unborrowed frames can be recycled.
export class AvatarFrameTextureCache
{
    private static _revision: number = 0;
    private static _trackedTextures: WeakSet<Texture> = new WeakSet();

    public static get revision(): number
    {
        return this._revision;
    }

    private static _sourceVersions: WeakMap<TextureSource, { value: number }> = new WeakMap();

    private _frames: Map<string, AvatarFrameTexture> = new Map();
    private _bytes: number = 0;
    private _disposed: boolean = false;
    private _renderer: Renderer = null;

    // Four 90x130 walking frames for 500 different avatars use about 89.3 MiB.
    constructor(private _maxEntries: number = 2048, private _maxBytes: number = 96 * 1024 * 1024)
    {}

    private syncRenderer(): void
    {
        const renderer = GetRenderer();

        if(renderer !== this._renderer)
        {
            this._renderer?.runners.contextChange?.remove(this);
            this.clear();
            this._renderer = renderer;
            this._renderer?.runners.contextChange?.add(this);
        }
    }

    // A memo is a non-owning hint: eviction and context loss can invalidate it at any time.
    public acquireCached(frame: AvatarFrameTexture): AvatarFrameTexture
    {
        if(this._disposed || !frame) return null;

        this.syncRenderer();

        if(!frame.cached || this._frames.get(frame.key) !== frame) return null;

        this._frames.delete(frame.key);
        this._frames.set(frame.key, frame);
        frame.references++;

        return frame;
    }

    public acquire(container: Container, width: number, height: number): AvatarFrameTexture
    {
        if(this._disposed) return null;

        this.syncRenderer();

        const composition: (number | string)[] = [width, height];

        if(!this.appendComposition(container, composition)) return null;

        const key = JSON.stringify(composition);
        const existing = this._frames.get(key);

        if(existing)
        {
            this._frames.delete(key);
            this._frames.set(key, existing);
            existing.references++;

            return existing;
        }

        const estimatedBytes = width * height * 4;

        if(!this.makeRoom(estimatedBytes)) return null;

        const texture = GetTexturePool().getTexture(width, height);

        if(!texture) return null;

        const bytes = texture.source.pixelWidth * texture.source.pixelHeight * 4;

        if(bytes > estimatedBytes && !this.makeRoom(bytes))
        {
            GetTexturePool().putTexture(texture);

            return null;
        }

        try
        {
            GetRenderer().render({ target: texture, container, clear: true });
            texture.source.hitMapDirty = true;
        }
        catch (error)
        {
            GetTexturePool().putTexture(texture);
            throw error;
        }

        const frame: AvatarFrameTexture = { texture, key, references: 1, cached: true, bytes };

        this._frames.set(key, frame);
        this._bytes += bytes;

        return frame;
    }

    private makeRoom(bytes: number): boolean
    {
        if(bytes > this._maxBytes || this._maxEntries < 1) return false;

        while(this._frames.size >= this._maxEntries || this._bytes + bytes > this._maxBytes)
        {
            let oldestKey: string = null;

            for(const [key, frame] of this._frames)
            {
                if(frame.references) continue;

                oldestKey = key;
                break;
            }

            // A full cache of visible frames must not recycle a texture still used by an avatar.
            if(oldestKey === null) return false;

            const oldest = this._frames.get(oldestKey);

            this._frames.delete(oldestKey);
            this._bytes -= oldest.bytes;
            oldest.cached = false;
            GetTexturePool().putTexture(oldest.texture);
        }

        return true;
    }

    public release(frame: AvatarFrameTexture): void
    {
        frame.references--;

        if(!frame.references && !frame.cached) GetTexturePool().putTexture(frame.texture);
    }

    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._renderer?.runners.contextChange?.remove(this);
        this._renderer = null;
        this.clear();
    }

    public contextChange(): void
    {
        // Restored WebGL contexts have lost all pixels in rendered output textures.
        this.clear();
    }

    private clear(): void
    {
        for(const frame of this._frames.values())
        {
            frame.cached = false;

            if(!frame.references) GetTexturePool().putTexture(frame.texture);
        }

        this._frames.clear();
        this._bytes = 0;
    }

    private appendComposition(container: Container, composition: (number | string)[]): boolean
    {
        // Only the plain Container/Sprite tree built by AvatarImage is supported.
        // Filters, masks, custom drawables and mutable sources keep the private rendering path.
        if((container.constructor !== Container && container.constructor !== Sprite) ||
            container.filters?.length || container.mask) return false;

        container.updateLocalTransform();

        const matrix = container.localTransform;

        composition.push(container.children.length, matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty,
            container.tint, container.alpha, Number(container.visible), Number(container.renderable));
        composition.push(container.blendMode);

        if(container instanceof Sprite)
        {
            const texture = container.texture;
            const source = texture.source;

            if(texture.destroyed || !source || source.destroyed) return false;

            const resource = source.resource;
            const staticImage = source instanceof ImageSource &&
                ((typeof HTMLImageElement !== 'undefined' && resource instanceof HTMLImageElement) ||
                (typeof ImageBitmap !== 'undefined' && resource instanceof ImageBitmap));

            if(!staticImage && !isImmutableTextureSource(source) && texture !== Texture.EMPTY && texture !== Texture.WHITE) return false;

            if(!AvatarFrameTextureCache._trackedTextures.has(texture))
            {
                AvatarFrameTextureCache._trackedTextures.add(texture);
                // Listeners capture no avatar/cache and live only as long as the asset.
                const changed = () => AvatarFrameTextureCache._revision++;

                texture.on('update', changed);
                texture.on('destroy', changed);
            }

            const uvs = texture.uvs;
            const bounds = texture.orig;
            const trim = texture.trim;
            const style = source.style;

            composition.push(1, texture.uid, source.uid, AvatarFrameTextureCache.getSourceVersion(source),
                source.resolution, source.pixelWidth, source.pixelHeight, source.alphaMode,
                style.magFilter, style.minFilter, style.mipmapFilter, style.addressModeU, style.addressModeV, style.addressModeW,
                style.lodMinClamp, style.lodMaxClamp, style.maxAnisotropy, style.compare,
                uvs.x0, uvs.y0, uvs.x1, uvs.y1, uvs.x2, uvs.y2, uvs.x3, uvs.y3,
                bounds.width, bounds.height, Number(!!trim), trim?.x || 0, trim?.y || 0, trim?.width || 0, trim?.height || 0,
                container.anchor.x, container.anchor.y, Number(container.roundPixels));
        }
        else composition.push(0);

        for(const child of container.children)
        {
            if(!this.appendComposition(child, composition)) return false;
        }

        return true;
    }

    private static getSourceVersion(source: TextureSource): number
    {
        let version = this._sourceVersions.get(source);

        if(!version)
        {
            version = { value: 0 };
            this._sourceVersions.set(source, version);

            // The source owns these callbacks; they retain only this tiny revision record,
            // never a cache or avatar. The WeakMap does not keep unloaded assets alive.
            const changed = () =>
            {
                version.value++;
                AvatarFrameTextureCache._revision++;
            };

            source.on('update', changed);
            source.on('resize', changed);
            source.on('styleChange', changed);
            source.on('change', changed);
            source.on('destroy', changed);
        }

        return version.value;
    }
}
