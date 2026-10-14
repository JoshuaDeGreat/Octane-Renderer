import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RecolorFurniUpdateParser } from '../../../parser';

export class RecolorFurniUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RecolorFurniUpdateParser);
    }

    public getParser(): RecolorFurniUpdateParser
    {
        return this.parser as RecolorFurniUpdateParser;
    }
}
