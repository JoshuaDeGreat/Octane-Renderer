import { IMessageDataWrapper } from '@octane/api';
import { Triggerable } from './Triggerable';

export class WiredActionDefinition extends Triggerable
{
    constructor(wrapper: IMessageDataWrapper)
    {
        super(wrapper, 'action');
    }

    public get type(): number
    {
        return this.code;
    }

    /** Legacy field; the official action definition has no conflict list. */
    public get conflictingTriggers(): number[]
    {
        return [];
    }
}
