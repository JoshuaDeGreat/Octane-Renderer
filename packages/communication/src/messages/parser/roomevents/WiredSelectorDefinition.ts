import { IMessageDataWrapper } from '@octane/api';
import { Triggerable } from './Triggerable';

/** An official wired selector (2509) definition. */
export class WiredSelectorDefinition extends Triggerable
{
    constructor(wrapper: IMessageDataWrapper)
    {
        super(wrapper, 'selector');
    }

    /** The official "filter" switch: narrow down the incoming selection instead of replacing it. */
    public get filter(): boolean
    {
        return this.isFilter;
    }

    /** The official "invert" switch. */
    public get invert(): boolean
    {
        return this.isInvert;
    }
}
