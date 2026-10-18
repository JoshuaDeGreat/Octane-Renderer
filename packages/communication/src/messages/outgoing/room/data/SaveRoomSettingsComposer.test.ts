import { describe, expect, it } from 'vitest';
import { SaveRoomSettingsComposer } from './SaveRoomSettingsComposer';

const compose = (password: string, tags: string[]) => new SaveRoomSettingsComposer(
    5, 'Room', 'Desc', 1, password, 25, 2, tags.length, tags,
    0, true, false, true, false, 0, 0, 0, 1, 1, 0, 1, 1, 14, 1).getMessageArray();

describe('SaveRoomSettingsComposer', () =>
{
    it('leaves empty tags out of the count and the list', () =>
    {
        const data = compose('secret', [ 'games', '', 'chill' ]);

        expect(data.slice(7, 10)).toEqual([ 2, 'games', 'chill' ]);
        expect(data[10]).toBe(0);
    });

    it('sends a null password as an empty string', () =>
    {
        expect(compose(null, [])[4]).toBe('');
        expect(compose(null, [])[7]).toBe(0);
    });
});
