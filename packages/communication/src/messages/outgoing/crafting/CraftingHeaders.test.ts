import { describe, expect, it } from 'vitest';
import { OctaneMessages } from '../../../OctaneMessages';
import { OutgoingHeader } from '../OutgoingHeader';
import { GetCraftableProductsComposer } from './GetCraftableProductsComposer';
import { GetCraftingRecipeComposer } from './GetCraftingRecipeComposer';

describe('crafting composer headers', () =>
{
    it('names each header after the composer it carries, keeping the payload routing', () =>
    {
        const composers = new OctaneMessages().composers;

        // The server reads a recipe name at 633 (CraftingAddRecipeEvent) and an item id at 1173 (RequestCraftingRecipesEvent).
        expect(OutgoingHeader.GET_CRAFTING_RECIPE).toBe(633);
        expect(OutgoingHeader.GET_CRAFTABLE_PRODUCTS).toBe(1173);
        expect(composers.get(OutgoingHeader.GET_CRAFTING_RECIPE)).toBe(GetCraftingRecipeComposer);
        expect(composers.get(OutgoingHeader.GET_CRAFTABLE_PRODUCTS)).toBe(GetCraftableProductsComposer);
    });
});
