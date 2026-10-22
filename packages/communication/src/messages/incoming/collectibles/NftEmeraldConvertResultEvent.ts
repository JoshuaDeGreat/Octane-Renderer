import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NftEmeraldConvertResultParser } from '../../parser';

export class NftEmeraldConvertResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NftEmeraldConvertResultParser);
    }

    public getParser(): NftEmeraldConvertResultParser
    {
        return this.parser as NftEmeraldConvertResultParser;
    }
}
