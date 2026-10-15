import { IMessageDataWrapper } from '@octane/api';
import { Triggerable } from './Triggerable';

export class ConditionDefinition extends Triggerable
{
    constructor(wrapper: IMessageDataWrapper)
    {
        super(wrapper, 'condition');
    }

    public get type(): number
    {
        return this.code;
    }
}
