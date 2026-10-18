import { IMessageDataWrapper } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { ExtendedForumData } from './ExtendedForumData';

const wrapperOf = (values: (number | string | boolean)[]) =>
{
    const queue = [ ...values ];

    return {
        readInt: () => queue.shift() as number,
        readString: () => queue.shift() as string,
        readBoolean: () => queue.shift() as boolean
    } as unknown as IMessageDataWrapper;
};

// ForumData (12 fields), the four permission levels, the five permission errors, canChangeSettings and isStaff (class_3173.readFromMessage).
const forum = (errors: string[], isStaff: boolean) => ExtendedForumData.parse(wrapperOf([
    7, 'Forum', 'About', 'b0503', 3, 10, 40, 2, 99, 5, 'Author', 60,
    0, 1, 2, 3,
    ...errors,
    true, isStaff
]));

describe('ExtendedForumData', () =>
{
    it('allows what the server gave no permission error for, like AIR class_3173', () =>
    {
        const data = forum([ '', '', '', '', '' ], true);

        expect(data.canRead).toBe(true);
        expect(data.canPostMessage).toBe(true);
        expect(data.canPostThread).toBe(true);
        expect(data.canModerate).toBe(true);
        expect(data.canChangeSettings).toBe(true);
        expect(data.isStaff).toBe(true);
    });

    it('refuses what the server gave a permission error for', () =>
    {
        const data = forum([ 'not_member', 'not_member', 'not_admin', 'not_admin', '' ], false);

        expect(data.canRead).toBe(false);
        expect(data.canPostMessage).toBe(false);
        expect(data.canPostThread).toBe(false);
        expect(data.canModerate).toBe(false);
        expect(data.postThreadPermissionError).toBe('not_admin');
        expect(data.isStaff).toBe(false);
    });
});

describe('ExtendedForumData old getter names', () =>
{
    it('keep answering like the AIR-named getters', () =>
    {
        const data = forum([ '', 'not_member', '', 'not_admin', '' ], true);

        expect(data.hasReadPermissionError).toBe(data.canRead);
        expect(data.hasPostMessagePermissionError).toBe(data.canPostMessage);
        expect(data.hasPostThreadPermissionError).toBe(data.canPostThread);
        expect(data.hasModeratePermissionError).toBe(data.canModerate);
        expect(data.isStaf).toBe(data.isStaff);
    });
});
