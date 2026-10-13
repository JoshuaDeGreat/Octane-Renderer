import { IMessageDataWrapper } from '@octane/api';

/** Entry types of the official furniture labels and regions packets. */
export const WIRED_LABEL_TYPE_LABEL = 0;
export const WIRED_LABEL_TYPE_REGION = 1;

export const WIRED_LABEL_VISIBILITY_EVERYONE = 0;
export const WIRED_LABEL_VISIBILITY_WIRED_INSPECTORS = 1;

/** The official colours, in the settings window's order: blue, teal, green, gold, orange, red, purple, charcoal. */
export const WIRED_LABEL_COLORS = [ 4278912, 2651759, 4157508, 8416562, 8409402, 8404554, 6834048, 5592405 ];

/** One furniture label (wf_label): a note in a bubble above its furni. */
export interface IWiredLabel
{
    furnitureId: number;
    text: string;
    color: number;
    visibility: number;
    alwaysOpen: boolean;
}

/**
 * Reads one entry. A label (type 0) is returned; a region (type 1, not used by this client yet)
 * is read past and returned as null. An unknown type cannot be read past, so it throws.
 */
export const readWiredLabelEntry = (wrapper: IMessageDataWrapper): IWiredLabel | null =>
{
    const type = wrapper.readInt();
    const furnitureId = wrapper.readInt();
    const text = wrapper.readString();

    if(type === WIRED_LABEL_TYPE_LABEL)
    {
        return { furnitureId, text, color: wrapper.readInt(), visibility: wrapper.readInt(), alwaysOpen: wrapper.readBoolean() };
    }

    if(type !== WIRED_LABEL_TYPE_REGION) throw new Error(`Unknown furniture label type ${ type }`);

    wrapper.readString();
    wrapper.readInt();
    wrapper.readInt();
    wrapper.readInt();
    wrapper.readInt();
    wrapper.readString();

    const rectangles = wrapper.readInt();

    for(let i = 0; i < rectangles; i++)
    {
        wrapper.readInt();
        wrapper.readInt();
        wrapper.readInt();
        wrapper.readInt();
    }

    return null;
};
