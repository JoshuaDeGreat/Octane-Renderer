import { IMessageDataWrapper } from '@octane/api';
import { Triggerable } from './Triggerable';

export class TriggerDefinition extends Triggerable
{
    constructor(wrapper: IMessageDataWrapper)
    {
        super(wrapper, 'trigger');
    }

    /** Legacy field; the official trigger definition has no conflict list. */
    public get conflictingActions(): number[]
    {
        return [];
    }
}
