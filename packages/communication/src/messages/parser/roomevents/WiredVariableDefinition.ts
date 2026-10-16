import { IMessageDataWrapper } from '@octane/api';
import { Triggerable } from './Triggerable';

/** An official wired variable definition (2955) definition. */
export class WiredVariableDefinition extends Triggerable
{
    constructor(wrapper: IMessageDataWrapper)
    {
        super(wrapper, 'variable');
    }
}
