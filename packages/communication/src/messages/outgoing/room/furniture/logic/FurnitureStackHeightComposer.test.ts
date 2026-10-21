import { describe, expect, it } from 'vitest';
import { FurnitureStackHeightComposer } from './FurnitureStackHeightComposer';

describe('FurnitureStackHeightComposer', () =>
{
    it('sends the item and the height for a slider update', () =>
    {
        expect(new FurnitureStackHeightComposer(7, 250).getMessageArray()).toEqual([ 7, 250 ]);
    });

    it('appends the multi-walk state when the checkbox changes', () =>
    {
        expect(new FurnitureStackHeightComposer(7, 250, true).getMessageArray()).toEqual([ 7, 250, true ]);
        expect(new FurnitureStackHeightComposer(7, 250, false).getMessageArray()).toEqual([ 7, 250, false ]);
    });
});
