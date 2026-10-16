import { AlphaTolerance } from '@octane/api';
import { GetRenderer, TextureUtils } from '@octane/utils';
import { DestroyOptions, Filter, Point, Sprite, Texture, TextureSource, WebGLRenderer, WebGPURenderer } from 'pixi.js';

const BYTES_PER_PIXEL = 4;

export class ExtendedSprite extends Sprite
{
    private static SCRATCH_POINT: Point = new Point();

    private _offsetX: number = 0;
    private _offsetY: number = 0;
    private _tag: string = '';
    private _alphaTolerance: number = AlphaTolerance.MATCH_OPAQUE_PIXELS;
    private _varyingDepth: boolean = false;
    private _clickHandling: boolean = false;
    private _skipMouseHandling: boolean = false;

    private _updateId1: number = -1;
    private _updateId2: number = -1;
    private _filterSource: Filter[] = null;

    constructor(options?: ConstructorParameters<typeof Sprite>[0])
    {
        super(options);
    }

    public needsUpdate(updateId1: number, updateId2: number): boolean
    {
        if((this._updateId1 === updateId1) && (this._updateId2 === updateId2)) return false;

        this._updateId1 = updateId1;
        this._updateId2 = updateId2;

        return true;
    }

    // Pixi copies and freezes every array handed to `filters`, so the reference a room
    // sprite gave us is remembered here to skip the copy when it has not changed.
    public setFilters(filters: Filter[]): void
    {
        if(filters === this._filterSource) return;

        this._filterSource = filters;
        this.filters = filters;
    }

    public setTexture(texture: Texture): void
    {
        if(!texture || texture.destroyed || !texture.source) texture = Texture.EMPTY;

        if(texture !== this.texture)
        {
            if(texture === Texture.EMPTY)
            {
                this._updateId1 = -1;
                this._updateId2 = -1;
            }

            this.texture = texture;
        }
    }

    // A pooled or asset texture can be destroyed while this sprite still sits in the
    // display list (TexturePool overflow, RoomPlane / AvatarImage disposal). Pixi would
    // then batch a texture without a source, so drop it here, in the same call that
    // destroys it, and let the next render pass pick up whatever the room sprite holds.
    public override get texture(): Texture
    {
        return super.texture;
    }

    public override set texture(texture: Texture)
    {
        const previous = super.texture;

        if(previous && (previous !== texture)) ExtendedSprite.unwatchTexture(previous, this);

        super.texture = texture;

        const current = super.texture;

        if(current && (current !== previous) && (current !== Texture.EMPTY)) ExtendedSprite.watchTexture(current, this);
    }

    // Thousands of room sprites can share one texture, and an emitter rebuilds its whole
    // listener list on every off(). One listener per texture keeps each sprite's watch O(1).
    private static TEXTURE_SPRITES: WeakMap<Texture, Set<ExtendedSprite>> = new WeakMap();

    private static watchTexture(texture: Texture, sprite: ExtendedSprite): void
    {
        let sprites = ExtendedSprite.TEXTURE_SPRITES.get(texture);

        if(!sprites)
        {
            sprites = new Set();

            ExtendedSprite.TEXTURE_SPRITES.set(texture, sprites);
            texture.on('destroy', ExtendedSprite.onSharedTextureDestroyed);
        }

        sprites.add(sprite);
    }

    private static unwatchTexture(texture: Texture, sprite: ExtendedSprite): void
    {
        const sprites = ExtendedSprite.TEXTURE_SPRITES.get(texture);

        if(!sprites?.delete(sprite) || sprites.size) return;

        ExtendedSprite.TEXTURE_SPRITES.delete(texture);
        texture.off('destroy', ExtendedSprite.onSharedTextureDestroyed);
    }

    // Like the emitter it replaces: every sprite watching when the texture is destroyed is
    // told, in the order it started watching, even if an earlier one stops watching meanwhile.
    private static onSharedTextureDestroyed(texture: Texture): void
    {
        const sprites = ExtendedSprite.TEXTURE_SPRITES.get(texture);

        if(!sprites) return;

        ExtendedSprite.TEXTURE_SPRITES.delete(texture);

        for(const sprite of [ ...sprites ]) sprite.onTextureDestroyed();
    }

    private onTextureDestroyed(): void
    {
        this.setTexture(null);
    }

    public override destroy(options?: DestroyOptions): void
    {
        if(super.texture) ExtendedSprite.unwatchTexture(super.texture, this);

        super.destroy(options);
    }

    public containsPoint(point: Point): boolean
    {
        if(!point || (this.alphaTolerance > 255) || !this.texture || (this.texture === Texture.EMPTY)) return false;

        point = ExtendedSprite.SCRATCH_POINT.set((point.x * this.scale.x), (point.y * this.scale.y));

        if(!super.containsPoint(point)) return false;

        const texture = this.texture;
        const textureSource = this.texture.source;

        if((!textureSource || !textureSource.hitMap) && !ExtendedSprite.generateHitMapForTextureSource(textureSource)) return false;

        if(textureSource.hitMapDirty && ((Date.now() - (textureSource.hitMapTime ?? 0)) > 100)) ExtendedSprite.generateHitMapForTextureSource(textureSource);

        const hitMap = (textureSource.hitMap as Uint8Array);

        if(!hitMap) return false;

        let dx = (point.x + texture.frame.x);
        let dy = (point.y + texture.frame.y);

        if(this.texture.trim)
        {
            dx -= texture.trim.x;
            dy -= texture.trim.y;
        }

        dx = (Math.round(dx) * textureSource.resolution);
        dy = (Math.round(dy) * textureSource.resolution);

        const index = (dx + dy * textureSource.width) * 4;

        return (hitMap[index + 3] >= this.alphaTolerance);
    }

    private static generateHitMapForTextureSource(textureSource: TextureSource): boolean
    {
        if(!textureSource) return false;

        const renderer = GetRenderer();
        const width = Math.max(Math.round(textureSource.width * textureSource.resolution), 1);
        const height = Math.max(Math.round(textureSource.height * textureSource.resolution), 1);

        let pixels: Uint8ClampedArray = ExtendedSprite.getImagePixels(textureSource, width, height);

        if(pixels)
        {
            // Read from the decoded image itself, no GPU round trip.
        }

        else if(renderer instanceof WebGPURenderer)
        {
            pixels = TextureUtils.getPixels(new Texture(textureSource))?.pixels ?? null;
        }

        else if(renderer instanceof WebGLRenderer)
        {
            pixels = new Uint8ClampedArray(BYTES_PER_PIXEL * width * height);

            const gl = renderer.gl;
            const adaptor = renderer.renderTarget.adaptor;
            const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;

            // Bind through the adaptor: it caches the bound framebuffer, and a raw
            // gl.bindFramebuffer would leave the next draw on the hit-test target.
            try
            {
                const renderTarget = renderer.renderTarget.getRenderTarget(textureSource);
                const glRenderTarget = renderer.renderTarget.getGpuRenderTarget(renderTarget);

                adaptor.bindFramebuffer(glRenderTarget.resolveTargetFramebuffer);

                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            }
            finally
            {
                adaptor.bindFramebuffer(framebuffer);
            }
        }

        if(!pixels) return false;

        textureSource.hitMap = pixels;
        textureSource.hitMapDirty = false;
        textureSource.hitMapTime = Date.now();

        return true;
    }

    // A decoded image still holds its pixels on the CPU. Reading them there spares the GPU
    // read back, which waits for every queued frame. Render textures (avatars, palette
    // results) and other sources still go through the GPU.
    private static getImagePixels(textureSource: TextureSource, width: number, height: number): Uint8ClampedArray
    {
        const resource = textureSource.resource;

        let image: ImageBitmap | HTMLImageElement = null;
        let imageWidth = 0;
        let imageHeight = 0;

        if((typeof ImageBitmap !== 'undefined') && (resource instanceof ImageBitmap))
        {
            image = resource;
            imageWidth = resource.width;
            imageHeight = resource.height;
        }

        else if((typeof HTMLImageElement !== 'undefined') && (resource instanceof HTMLImageElement))
        {
            image = resource;
            imageWidth = resource.naturalWidth;
            imageHeight = resource.naturalHeight;
        }

        if(!image || (typeof OffscreenCanvas === 'undefined')) return null;

        // The hit map is indexed in texture pixels; an image of another size would not line up.
        if((imageWidth !== width) || (imageHeight !== height)) return null;

        try
        {
            const context = new OffscreenCanvas(width, height).getContext('2d', { willReadFrequently: true });

            if(!context) return null;

            context.drawImage(image, 0, 0);

            return context.getImageData(0, 0, width, height).data;
        }
        catch
        {
            // A closed bitmap or a cross-origin image: the GPU path tries instead.
            return null;
        }
    }

    public get offsetX(): number
    {
        return this._offsetX;
    }

    public set offsetX(offset: number)
    {
        this._offsetX = offset;
    }

    public get offsetY(): number
    {
        return this._offsetY;
    }

    public set offsetY(offset: number)
    {
        this._offsetY = offset;
    }

    public get tag(): string
    {
        return this._tag;
    }

    public set tag(tag: string)
    {
        this._tag = tag;
    }

    public get alphaTolerance(): number
    {
        return this._alphaTolerance;
    }

    public set alphaTolerance(tolerance: number)
    {
        this._alphaTolerance = tolerance;
    }

    public get varyingDepth(): boolean
    {
        return this._varyingDepth;
    }

    public set varyingDepth(flag: boolean)
    {
        this._varyingDepth = flag;
    }

    public get clickHandling(): boolean
    {
        return this._clickHandling;
    }

    public set clickHandling(flag: boolean)
    {
        this._clickHandling = flag;
    }

    public get skipMouseHandling(): boolean
    {
        return this._skipMouseHandling;
    }

    public set skipMouseHandling(flag: boolean)
    {
        this._skipMouseHandling = flag;
    }
}
