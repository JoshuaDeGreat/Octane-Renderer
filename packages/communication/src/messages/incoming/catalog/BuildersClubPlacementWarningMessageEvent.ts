import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BuildersClubPlacementWarningMessageParser } from '../../parser';

export class BuildersClubPlacementWarningMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BuildersClubPlacementWarningMessageParser);
    }

    public getParser(): BuildersClubPlacementWarningMessageParser
    {
        return this.parser as BuildersClubPlacementWarningMessageParser;
    }
}
