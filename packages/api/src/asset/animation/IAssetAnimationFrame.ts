import { IAssetAnimationDirection } from './IAssetAnimationDirection';
import { IAssetAnimationFramePart } from './IAssetAnimationFramePart';

export interface IAssetAnimationFrame
{
    repeats?: number;
    directions?: IAssetAnimationDirection[];
    fxs?: IAssetAnimationFramePart[];
    bodyparts?: IAssetAnimationFramePart[];
}
