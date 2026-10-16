import { IMessageDataWrapper } from '@octane/api';
import { Triggerable } from './Triggerable';

/** An official wired addon (2168) definition. */
export class WiredAddonDefinition extends Triggerable
{
    constructor(wrapper: IMessageDataWrapper)
    {
        super(wrapper, 'addon');
    }
}
