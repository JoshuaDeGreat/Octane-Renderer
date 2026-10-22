import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SelectedNftWardrobeOutfitParser } from '../../parser';

export class SelectedNftWardrobeOutfitEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SelectedNftWardrobeOutfitParser);
    }

    public getParser(): SelectedNftWardrobeOutfitParser
    {
        return this.parser as SelectedNftWardrobeOutfitParser;
    }
}
