import { IMessageComposer } from '@octane/api';

type FurnitureStackHeightData = [ number, number ] | [ number, number, boolean ];

/**
 * Official `CustomStackHeightWidget` (AIR 13, `SetStackHelperHeight`): the slider,
 * the input and the two level buttons send `[ id, height * 100 ]`; the multi-walk
 * checkbox of a walk tile appends its state, `[ id, height * 100, multiWalk ]`.
 * The server reads the boolean only when it is present.
 */
export class FurnitureStackHeightComposer implements IMessageComposer<FurnitureStackHeightData>
{
    private _data: FurnitureStackHeightData;

    constructor(itemId: number, height: number = -100, multiWalk: boolean = null)
    {
        this._data = (multiWalk === null) ? [ itemId, height ] : [ itemId, height, multiWalk ];
    }

    public getMessageArray(): FurnitureStackHeightData
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
