import { describe, expect, it } from 'vitest';
import { getBadgePartUrl } from './GroupBadgePartUrl';

const template = 'https://hotel.example/gamedata/badgeparts/badgepart_%part%.png';

describe('getBadgePartUrl', () =>
{
    it('fills in a plain part name', () =>
    {
        expect(getBadgePartUrl(template, 'symbol_star_1')).toBe('https://hotel.example/gamedata/badgeparts/badgepart_symbol_star_1.png');
        expect(getBadgePartUrl(template, 'base-basic')).toBe('https://hotel.example/gamedata/badgeparts/badgepart_base-basic.png');
    });

    it('never lets a part name change the path', () =>
    {
        expect(getBadgePartUrl(template, '../../secret')).toBeNull();
        expect(getBadgePartUrl(template, 'a/b')).toBeNull();
        expect(getBadgePartUrl(template, 'x?y=1')).toBeNull();
        expect(getBadgePartUrl(template, '')).toBeNull();
    });

    it('needs a template with %part%', () =>
    {
        expect(getBadgePartUrl('', 'symbol_star')).toBeNull();
        expect(getBadgePartUrl('https://hotel.example/badgeparts/', 'symbol_star')).toBeNull();
    });
});
