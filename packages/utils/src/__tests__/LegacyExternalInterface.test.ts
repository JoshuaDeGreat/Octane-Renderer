import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegacyExternalInterface } from '../LegacyExternalInterface';

const withAncestorOrigins = (origins: string[] | undefined) =>
{
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, ancestorOrigins: origins as unknown as DOMStringList });
};

describe('LegacyExternalInterface.getParentOrigin', () =>
{
    afterEach(() => vi.restoreAllMocks());

    it('targets the known parent origin', () =>
    {
        withAncestorOrigins([ 'https://hotel.example' ]);

        expect(LegacyExternalInterface.getParentOrigin()).toBe('https://hotel.example');
    });

    it('falls back to * for the opaque "null" origin Firefox reports without a referrer', () =>
    {
        withAncestorOrigins([ 'null' ]);

        expect(LegacyExternalInterface.getParentOrigin()).toBe('*');
    });

    it('falls back to * when the browser has no ancestor origins', () =>
    {
        withAncestorOrigins(undefined);

        expect(LegacyExternalInterface.getParentOrigin()).toBe('*');
    });
});
