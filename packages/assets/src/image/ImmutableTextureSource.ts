import { TextureSource } from 'pixi.js';

// Canvas-backed sources that are drawn once and never again: decoded sprite sheets that fell
// back to a canvas, and the half-size avatar parts. Caches that key on a source's pixels
// (the shared avatar frames) may treat them like a loaded image.
const immutableSources = new WeakSet<TextureSource>();

export const markImmutableTextureSource = (source: TextureSource): void =>
{
    if(source) immutableSources.add(source);
};

export const isImmutableTextureSource = (source: TextureSource): boolean => (!!source && immutableSources.has(source));
