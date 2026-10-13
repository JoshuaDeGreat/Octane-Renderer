import { AvatarScaleType, IAssetData, IAvatarEffectListener, IAvatarImage, IAvatarImageListener, IObjectVisualizationData } from '@octane/api';
import { GetAvatarRenderManager } from '@octane/avatar';

export class AvatarVisualizationData implements IObjectVisualizationData
{
    public initialize(asset: IAssetData): boolean
    {
        return true;
    }

    public dispose(): void
    {
    }

    public createAvatarImage(figure: string, size: number, gender: string = null, avatarListener: IAvatarImageListener = null, effectListener: IAvatarEffectListener = null): IAvatarImage
    {
        let avatarImage: IAvatarImage = null;

        if(size > 48) avatarImage = GetAvatarRenderManager().createAvatarImage(figure, AvatarScaleType.LARGE, gender, avatarListener, effectListener);
        else avatarImage = GetAvatarRenderManager().createAvatarImage(figure, AvatarScaleType.SMALL, gender, avatarListener, effectListener);

        return avatarImage;
    }

    public createBlockedAvatarImage(size: number): IAvatarImage
    {
        return GetAvatarRenderManager().createPlaceholderAvatarImage((size > 48) ? AvatarScaleType.LARGE : AvatarScaleType.SMALL);
    }

    public get layerCount(): number
    {
        return 0;
    }
}
