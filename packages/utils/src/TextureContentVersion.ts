import { Texture, TextureSource } from 'pixi.js';

// Render textures are drawn into again in place (pooled planes and avatars, particles), and keep their
// uid when that happens. Hit-testing caches a texture's pixels, so it needs to know when they changed:
// every render into a texture bumps this version (RoomPlane bumps it after drawing a patch).
const CONTENT_VERSION = '__octaneContentVersion';

const getSource = (target: unknown): TextureSource =>
{
    if(!target) return null;

    if(target instanceof Texture) return target.source;

    if(target instanceof TextureSource) return target;

    return null;
};

export const BumpTextureContentVersion = (target: unknown): void =>
{
    const source = getSource(target);

    if(!source) return;

    source[CONTENT_VERSION] = ((source[CONTENT_VERSION] ?? 0) + 1);
};

export const GetTextureContentVersion = (source: TextureSource): number =>
{
    if(!source) return 0;

    return (source[CONTENT_VERSION] ?? 0);
};
