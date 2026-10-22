import { RoomObjectWidgetRequestEvent } from '@octane/events';
import { FurnitureLogic } from './FurnitureLogic';

/**
 * Official `furniture_nft_reward_box` logic: double-clicking a closed (state 0) collectibles reward box
 * asks to open it; the client confirms and sends the open request.
 */
export class FurnitureNftRewardBoxLogic extends FurnitureLogic
{
    public getEventTypes(): string[]
    {
        return this.mergeTypes(super.getEventTypes(), [RoomObjectWidgetRequestEvent.NFT_REWARD_BOX]);
    }

    public useObject(): void
    {
        if(!this.object || !this.eventDispatcher) return;

        if((this.object.getState(0) ?? 0) !== 0) return;

        this.eventDispatcher.dispatchEvent(new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.NFT_REWARD_BOX, this.object));
    }
}
