import { RoomWidgetEnum } from '@octane/api';
import { FurnitureLogic } from './FurnitureLogic';

/**
 * Official `furniture_vimeo` logic: double click opens the `RWE_VIMEO` widget
 * (OPEN_WIDGET / CLOSE_WIDGET through the base furniture logic). The widget
 * reads the `videoId` from the furni's map stuff data.
 */
export class FurnitureVimeoLogic extends FurnitureLogic
{
    public get widget(): string
    {
        return RoomWidgetEnum.VIMEO;
    }
}
