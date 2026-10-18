import { BLEND_MODES, Filter, Texture } from 'pixi.js';
import { IRoomPlaneDrawData } from './IRoomPlaneDrawData';

export interface IRoomObjectSprite
{
    dispose(): void;
    increaseUpdateCounter(): void;
    id: number;
    name: string;
    type: string;
    spriteType: number;
    texture: Texture;
    width: number;
    height: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    flipH: boolean;
    flipV: boolean;
    direction: number;
    alpha: number;
    blendMode: BLEND_MODES;
    color: number;
    relativeDepth: number;
    varyingDepth: boolean;
    libraryAssetName: string;
    clickHandling: boolean;
    visible: boolean;
    tag: string;
    posture: string;
    alphaTolerance: number;
    filters: Filter[];
    updateCounter: number;
    skipMouseHandling: boolean;
    // Room planes drawn directly (room.planes.direct): drawn from this instead of texture, which stays Texture.EMPTY.
    planeDrawData: IRoomPlaneDrawData;
}
