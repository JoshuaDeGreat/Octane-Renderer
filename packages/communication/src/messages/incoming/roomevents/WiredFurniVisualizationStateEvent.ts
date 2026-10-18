import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredFurniVisualizationStateParser } from '../../parser';

/** The furni transparency and highlight a room shows on entry. */
export class WiredFurniVisualizationStateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniVisualizationStateParser);
    }

    public getParser(): WiredFurniVisualizationStateParser
    {
        return this.parser as WiredFurniVisualizationStateParser;
    }
}
