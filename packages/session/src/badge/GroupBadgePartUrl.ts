/** A part name as the emulator's guilds_elements holds it, without extension: letters, digits, `_` and `-`. */
const PART_NAME = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * The URL of a badge part image from `badge.asset.grouparts.url` (%part% is the name), or null when the template
 * has no %part% or the name is not a plain part name (so a part name can never change the URL's path).
 */
export const getBadgePartUrl = (template: string, partName: string): string | null =>
{
    if(!template || !template.includes('%part%') || !PART_NAME.test(partName ?? '')) return null;

    return template.replace('%part%', partName);
};
