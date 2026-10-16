import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredUserVisualizationStateParser } from '../../parser';

/** The room unit transparency and highlight a room shows on entry. */
export class WiredUserVisualizationStateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredUserVisualizationStateParser);
    }

    public getParser(): WiredUserVisualizationStateParser
    {
        return this.parser as WiredUserVisualizationStateParser;
    }
}
