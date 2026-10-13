import { describe, expect, it } from 'vitest';
import { isAllowedUserImageUrl, isWebUrl, parseHostList } from './ExternalUrls';

const LOCATION = 'https://hotel.example/client/';

describe('isWebUrl', () =>
{
    it('accepts only absolute http(s) urls', () =>
    {
        expect(isWebUrl('https://example.com/x')).toBe(true);
        expect(isWebUrl('http://example.com')).toBe(true);
        expect(isWebUrl('javascript:alert(1)')).toBe(false);
        expect(isWebUrl('data:text/html,hi')).toBe(false);
        expect(isWebUrl('/relative')).toBe(false);
        expect(isWebUrl('')).toBe(false);
    });
});

describe('isAllowedUserImageUrl', () =>
{
    it('allows any web image when no hosts are configured', () =>
    {
        expect(isAllowedUserImageUrl('https://i.imgur.com/a.png', [], LOCATION)).toBe(true);
        expect(isAllowedUserImageUrl('/c_images/ads/a.png', [], LOCATION)).toBe(true);
    });

    it('refuses other schemes', () =>
    {
        expect(isAllowedUserImageUrl('local://room', [], LOCATION)).toBe(false);
        expect(isAllowedUserImageUrl('javascript:alert(1)', [], LOCATION)).toBe(false);
    });

    it('limits hosts when a list is configured', () =>
    {
        const hosts = parseHostList('imgur.com, hotel.example');

        expect(isAllowedUserImageUrl('https://i.imgur.com/a.png', hosts, LOCATION)).toBe(true);
        expect(isAllowedUserImageUrl('/c_images/a.png', hosts, LOCATION)).toBe(true);
        expect(isAllowedUserImageUrl('https://evilimgur.com/a.png', hosts, LOCATION)).toBe(false);
        expect(isAllowedUserImageUrl('https://tracker.example/a.png', hosts, LOCATION)).toBe(false);
    });
});
