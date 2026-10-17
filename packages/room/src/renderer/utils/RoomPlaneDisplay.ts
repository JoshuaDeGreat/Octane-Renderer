import { IRoomPlaneDrawData } from '@octane/api';
import { GlProgram, Matrix, Mesh, MeshGeometry, Shader, Texture, TextureSource, TextureStyle, UniformGroup } from 'pixi.js';

// Baked patches a plane can carry; RoomPlane bakes the whole plane when its masks need more.
export const MAX_ROOM_PLANE_PATCHES = 8;

const PATCH_INDICES = Array.from({ length: MAX_ROOM_PLANE_PATCHES }, (_, index) => index);

// GLSL ES 3.0 (textureLod, texelFetch): Pixi only skips its WebGL1 compatibility defines when the source says so.
const VERTEX = `#version 300 es
in vec2 aPosition;
in vec2 aUV;

out vec2 vPosition;
out vec2 vUV;
out mediump vec4 vColor;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform vec4 uWorldColorAlpha;
uniform mat3 uTransformMatrix;
uniform vec4 uColor;

void main(void)
{
    mat3 modelViewProjectionMatrix = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;

    gl_Position = vec4((modelViewProjectionMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

    vPosition = aPosition;
    vUV = aUV;
    vColor = uColor * uWorldColorAlpha;
}`;

// Rebuilds what the old bake produced: a TilingSprite drawn through the plane's skew matrix into a
// w x h RGBA8 texture (Pixi's tiling math, tint, 8-bit store, PlaneMaskFilter's black cut-out), which
// the canvas then sampled with a clamp-to-edge sampler of the default scale mode (nearest in the
// reference client, linear in plain Pixi). Each fragment rebuilds the texel(s) that sampler would have read and blends
// them the same way. Texels under a baked patch (door
// and window masks, landscapes) are read from that patch instead, so every texel has exactly one source.
const FRAGMENT = `#version 300 es
in vec2 vPosition;
in vec2 vUV;
in mediump vec4 vColor;

out vec4 finalColor;

uniform sampler2D uTileTexture;
${ PATCH_INDICES.map(index => `uniform sampler2D uPatch${ index };`).join('\n') }

uniform vec2 uPlaneSize;
uniform mat3 uPlaneToTile;
uniform mat3 uTextureTransform;
uniform mat3 uMapCoord;
uniform vec4 uClampFrame;
uniform vec2 uClampOffset;
uniform mediump vec4 uTileTint;
uniform float uTileSimple;
uniform float uLinear;
uniform float uDirect;
uniform float uBlackIsTransparent;
uniform float uPatchCount;
uniform vec4 uPatchRects[${ MAX_ROOM_PLANE_PATCHES }];

vec4 tiledTexel(vec2 texel)
{
    vec2 local = (uPlaneToTile * vec3(texel + 0.5, 1.0)).xy;

    // The TilingSprite quad's coverage of this texel's centre. Its corners are whole pixels and its
    // edges run 2:1 or vertical, so no texel centre ever sits exactly on an edge.
    if((local.x < 0.0) || (local.y < 0.0) || (local.x >= 1.0) || (local.y >= 1.0)) return vec4(0.0);

    vec2 uv = (uTextureTransform * vec3(local, 1.0)).xy;
    vec4 color;

    if(uTileSimple > 0.5)
    {
        color = textureLod(uTileTexture, uv, 0.0);
    }
    else
    {
        vec2 coord = uv + ceil(uClampOffset - uv);

        coord = (uMapCoord * vec3(coord, 1.0)).xy;
        coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);

        color = textureLod(uTileTexture, coord, 0.0);
    }

    // At mediump like Pixi's sprite and tiling shaders, for GPUs that really run those in 16 bits. The
    // 8-bit store below still rounds a few percent of tinted channels one step away from what the GPU's
    // own store did (its rounding is not plain round-to-nearest); never more than that.
    mediump vec4 sampled = color;
    mediump vec4 tinted = sampled * uTileTint;

    color = floor((tinted * 255.0) + 0.5) / 255.0;

    if((uBlackIsTransparent > 0.5) && (color.r == 0.0) && (color.g == 0.0) && (color.b == 0.0)) return vec4(0.0);

    return color;
}

vec4 patchTexel(int index, ivec2 position)
{
${ PATCH_INDICES.map(index => `    if(index == ${ index }) return texelFetch(uPatch${ index }, position, 0);`).join('\n') }

    return vec4(0.0);
}

vec4 bakedTexel(vec2 texel)
{
    for(int i = 0; i < ${ MAX_ROOM_PLANE_PATCHES }; i++)
    {
        if(float(i) >= uPatchCount) break;

        vec4 rect = uPatchRects[i];

        if((texel.x >= rect.x) && (texel.y >= rect.y) && (texel.x < rect.z) && (texel.y < rect.w)) return patchTexel(i, ivec2(texel - rect.xy));
    }

    if(uDirect < 0.5) return vec4(0.0);

    return tiledTexel(texel);
}

void main(void)
{
    vec2 maxTexel = uPlaneSize - 1.0;

    if(uLinear < 0.5)
    {
        // Like the sampler: the texture coordinate snapped to 1/256 of a texel, then the texel it falls in.
        // Pixel centres land exactly on texel edges at zoom 0.5 and fractional resolutions; this tips them
        // the same way the GPU did.
        vec2 picked = floor(floor(((vUV * uPlaneSize) * 256.0) + 0.5) / 256.0);

        mediump vec4 nearest = bakedTexel(clamp(picked, vec2(0.0), maxTexel));

        finalColor = nearest * vColor;

        return;
    }

    vec2 position = vPosition - 0.5;
    vec2 base = floor(position);
    vec2 weight = position - base;

    // Linear samplers weigh texels in 1/256 steps.
    weight = floor((weight * 256.0) + 0.5) / 256.0;

    vec2 texel0 = clamp(base, vec2(0.0), maxTexel);
    vec4 color = bakedTexel(texel0);

    if((weight.x != 0.0) || (weight.y != 0.0))
    {
        vec2 texel1 = clamp(base + 1.0, vec2(0.0), maxTexel);
        vec4 color10 = bakedTexel(vec2(texel1.x, texel0.y));
        vec4 color01 = bakedTexel(vec2(texel0.x, texel1.y));
        vec4 color11 = bakedTexel(texel1);

        color = mix(mix(color, color10, weight.x), mix(color01, color11, weight.x), weight.y);
    }

    mediump vec4 baked = color;

    finalColor = baked * vColor;
}`;

let glProgram: GlProgram = null;

const getGlProgram = (): GlProgram =>
{
    if(!glProgram) glProgram = GlProgram.from({ vertex: VERTEX, fragment: FRAGMENT, name: 'room-plane', preferredFragmentPrecision: 'highp' });

    return glProgram;
};

const writeTint = (color: number, out: Float32Array): void =>
{
    out[0] = ((color >> 16) & 0xFF) / 255;
    out[1] = ((color >> 8) & 0xFF) / 255;
    out[2] = (color & 0xFF) / 255;
    out[3] = 1;
};

/**
 * Draws a room plane from its draw data, as one quad over the plane's bounding box. Lives as the only
 * child of the canvas sprite that stands for the plane, so that sprite's tint, alpha, filters and
 * position apply to it unchanged.
 */
export class RoomPlaneDisplay extends Mesh<MeshGeometry, Shader>
{
    private _uniforms: UniformGroup;
    private _data: IRoomPlaneDrawData = null;
    private _version: number = -1;
    private _meshWidth: number = -1;
    private _meshHeight: number = -1;

    constructor()
    {
        const uniforms = new UniformGroup({
            uPlaneSize: { value: new Float32Array(2), type: 'vec2<f32>' },
            uPlaneToTile: { value: new Matrix(), type: 'mat3x3<f32>' },
            uTextureTransform: { value: new Matrix(), type: 'mat3x3<f32>' },
            uMapCoord: { value: new Matrix(), type: 'mat3x3<f32>' },
            uClampFrame: { value: new Float32Array(4), type: 'vec4<f32>' },
            uClampOffset: { value: new Float32Array(2), type: 'vec2<f32>' },
            uTileTint: { value: new Float32Array([ 1, 1, 1, 1 ]), type: 'vec4<f32>' },
            uTileSimple: { value: 0, type: 'f32' },
            uLinear: { value: 0, type: 'f32' },
            uDirect: { value: 0, type: 'f32' },
            uBlackIsTransparent: { value: 0, type: 'f32' },
            uPatchCount: { value: 0, type: 'f32' },
            uPatchRects: { value: new Float32Array(MAX_ROOM_PLANE_PATCHES * 4), type: 'vec4<f32>', size: MAX_ROOM_PLANE_PATCHES }
        });

        const resources: Record<string, unknown> = { planeUniforms: uniforms, uTileTexture: Texture.WHITE.source };

        for(const index of PATCH_INDICES) resources[`uPatch${ index }`] = Texture.EMPTY.source;

        super({
            geometry: new MeshGeometry({
                positions: new Float32Array(8),
                uvs: new Float32Array([ 0, 0, 1, 0, 1, 1, 0, 1 ]),
                indices: new Uint32Array([ 0, 1, 2, 0, 2, 3 ])
            }),
            shader: new Shader({ glProgram: getGlProgram(), resources })
        });

        this._uniforms = uniforms;
        this.visible = false;
    }

    public get data(): IRoomPlaneDrawData
    {
        return this._data;
    }

    public setData(data: IRoomPlaneDrawData): void
    {
        if((data === this._data) && data && (data.version === this._version)) return;

        this._data = data;
        this._version = (data ? data.version : -1);

        const resources = this.shader.resources;

        if(!data || (data.width <= 0) || (data.height <= 0) || (!data.direct && !data.patches.length))
        {
            // Drop the textures too: a hidden display must not keep a released patch alive.
            for(const index of PATCH_INDICES) resources[`uPatch${ index }`] = Texture.EMPTY.source;

            this.visible = false;

            return;
        }

        const width = data.width;
        const height = data.height;

        if((width !== this._meshWidth) || (height !== this._meshHeight))
        {
            this._meshWidth = width;
            this._meshHeight = height;

            this.geometry.positions = new Float32Array([ 0, 0, width, 0, width, height, 0, height ]);
        }

        const uniforms = this._uniforms.uniforms;
        const planeSize = uniforms.uPlaneSize as Float32Array;
        const patchRects = uniforms.uPatchRects as Float32Array;
        const tileTexture = (data.tileTexture ?? Texture.WHITE);

        planeSize[0] = width;
        planeSize[1] = height;

        uniforms.uPlaneToTile = data.planeToTile;
        uniforms.uTextureTransform = data.textureTransform;
        uniforms.uMapCoord = data.mapCoord;
        uniforms.uClampFrame = data.clampFrame;
        uniforms.uClampOffset = data.clampOffset;
        uniforms.uTileSimple = (data.tileSimple ? 1 : 0);
        // The baked texture got the default scale mode, and so did its sampler on the canvas: nearest on
        // whole-number pixel ratios (DprRenderingMode), else Pixi's own default, linear.
        uniforms.uLinear = (((TextureSource.defaultOptions.scaleMode ?? TextureStyle.defaultOptions.scaleMode) === 'linear') ? 1 : 0);
        uniforms.uDirect = ((data.direct && data.tileTexture) ? 1 : 0);
        uniforms.uBlackIsTransparent = (data.blackIsTransparent ? 1 : 0);

        writeTint(data.tileTint, uniforms.uTileTint as Float32Array);

        const patchCount = Math.min(data.patches.length, MAX_ROOM_PLANE_PATCHES);

        for(const index of PATCH_INDICES)
        {
            const patch = ((index < patchCount) ? data.patches[index] : null);

            resources[`uPatch${ index }`] = ((patch && patch.texture) ? patch.texture.source : Texture.EMPTY.source);

            if(!patch) continue;

            patchRects[(index * 4)] = patch.x;
            patchRects[(index * 4) + 1] = patch.y;
            patchRects[(index * 4) + 2] = (patch.x + patch.width);
            patchRects[(index * 4) + 3] = (patch.y + patch.height);
        }

        uniforms.uPatchCount = patchCount;

        this._uniforms.update();

        resources.uTileTexture = tileTexture.source;

        // A simple tile is tiled by Pixi's batcher with a repeat sampler, which it switches on the source itself.
        if(data.direct && data.tileSimple && (tileTexture.source.style.addressMode !== 'repeat'))
        {
            tileTexture.source.style.addressMode = 'repeat';
            tileTexture.source.style.update();
        }

        this.visible = true;
    }

    public destroy(): void
    {
        const geometry = this.geometry;
        const shader = this.shader;

        this._data = null;
        this._uniforms = null;

        super.destroy();

        geometry?.destroy();
        shader?.destroy();
    }
}
