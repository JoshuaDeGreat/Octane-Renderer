import { OctaneLogger, TextureUtils } from '@octane/utils';
import { Texture } from 'pixi.js';

export class TexturePool
{
    private static MAX_IDLE_MS: number = 30000;
    private static SWEEP_INTERVAL_MS: number = 1000;
    private static MAX_POOL_BYTES: number = 64 * 1024 * 1024;

    private _released: { texture: Texture, destroySource: boolean }[] = [];
    private _releasedNext: { texture: Texture, destroySource: boolean }[] = [];

    private _textures: { [index: string]: { [index: string]: Texture[] } } = {};
    private _pooledAt: WeakMap<Texture, number> = new WeakMap();
    private _totalTextures: number = 0;
    private _totalBytes: number = 0;
    private _lastSweepAt: number = 0;

    public getTotalTextures(): number
    {
        let total = 0;
        let bytes = 0;

        for(const width in this._textures)
        {
            for(const height in this._textures[width])
            {
                for(const texture of this._textures[width][height])
                {
                    total++;
                    bytes += TexturePool.getTextureBytes(texture);
                }
            }
        }

        this._totalTextures = total;
        this._totalBytes = bytes;

        return this._totalTextures;
    }

    public getTotalBytes(): number
    {
        return this._totalBytes;
    }

    public getTexture(width: number, height: number): Texture
    {
        if(!this._textures[width]) this._textures[width] = {};

        if(!this._textures[width][height]) this._textures[width][height] = [];

        if(this._textures[width][height].length)
        {
            const texture = this._textures[width][height].shift();

            if(texture)
            {
                this._pooledAt.delete(texture);
                this._totalTextures--;
                this._totalBytes -= TexturePool.getTextureBytes(texture);

                return texture;
            }
        }

        return TextureUtils.createRenderTexture(width, height);
    }

    public putTexture(texture: Texture)
    {
        if(!texture || texture.destroyed || !texture.source) return;

        const bytes = TexturePool.getTextureBytes(texture);

        if(bytes > TexturePool.MAX_POOL_BYTES)
        {
            TexturePool.releaseTexture(texture);

            return;
        }

        while((this._totalBytes + bytes) > TexturePool.MAX_POOL_BYTES)
        {
            if(!this.evictOldest()) break;
        }

        if(!this._textures[texture.width]) this._textures[texture.width] = {};

        if(!this._textures[texture.width][texture.height]) this._textures[texture.width][texture.height] = [];

        delete texture.source.hitMap;
        delete texture.source.hitMapDirty;

        this._textures[texture.width][texture.height].push(texture);
        this._pooledAt.set(texture, Date.now());

        this._totalTextures++;
        this._totalBytes += bytes;
    }

    public run(): void
    {
        if(!this._totalTextures) return;

        const now = Date.now();

        if((now - this._lastSweepAt) < TexturePool.SWEEP_INTERVAL_MS) return;

        this._lastSweepAt = now;

        for(const width in this._textures)
        {
            for(const height in this._textures[width])
            {
                const textures = this._textures[width][height];

                for(let i = textures.length - 1; i >= 0; i--)
                {
                    const texture = textures[i];
                    const pooledAt = this._pooledAt.get(texture);

                    if((pooledAt === undefined) || ((now - pooledAt) <= TexturePool.MAX_IDLE_MS)) continue;

                    this.removeAt(textures, i);
                }
            }
        }
    }

    private evictOldest(): boolean
    {
        let oldestTextures: Texture[] = null;
        let oldestAt = Infinity;

        for(const width in this._textures)
        {
            for(const height in this._textures[width])
            {
                const textures = this._textures[width][height];

                if(!textures.length) continue;

                const pooledAt = this._pooledAt.get(textures[0]) ?? -Infinity;

                if(pooledAt < oldestAt)
                {
                    oldestAt = pooledAt;
                    oldestTextures = textures;
                }
            }
        }

        if(!oldestTextures) return false;

        this.removeAt(oldestTextures, 0);

        return true;
    }

    private removeAt(textures: Texture[], index: number): void
    {
        const texture = textures[index];

        textures.splice(index, 1);
        this._pooledAt.delete(texture);

        this._totalTextures--;
        this._totalBytes -= TexturePool.getTextureBytes(texture);

        TexturePool.releaseTexture(texture);
    }

    private static releaseTexture(texture: Texture): void
    {
        delete texture.source?.hitMap;
        delete texture.source?.hitMapDirty;

        if(!texture.destroyed) texture.destroy(true);
    }

    private static getTextureBytes(texture: Texture): number
    {
        const width = texture.source?.pixelWidth || texture.width;
        const height = texture.source?.pixelHeight || texture.height;

        return (width * height * 4);
    }

    // Destroyed after the next flush but one: a canvas display may still draw it until it picks up
    // what replaced it (room plane patches).
    public releaseTexture(texture: Texture, destroySource: boolean): void
    {
        if(!texture || texture.destroyed) return;

        delete texture.source?.hitMap;
        delete texture.source?.hitMapDirty;

        this._releasedNext.push({ texture, destroySource });
    }

    // Once per room engine update.
    public flushReleased(): void
    {
        for(const { texture, destroySource } of this._released)
        {
            if(!texture.destroyed) texture.destroy(destroySource);
        }

        this._released = this._releasedNext;
        this._releasedNext = [];
    }

    public get textures(): { [index: string]: { [index: string]: Texture[] } }
    {
        return this._textures;
    }
}
