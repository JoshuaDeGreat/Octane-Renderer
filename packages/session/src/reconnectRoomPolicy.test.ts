import { OctaneEventType } from '@octane/events';
import { describe, expect, it } from 'vitest';
import { shouldAttemptRoomReEntry, shouldRestoreStoredRoom } from './reconnectRoomPolicy';

describe('shouldRestoreStoredRoom', () =>
{
    it('enters the stored room when no session exists yet', () =>
    {
        expect(shouldRestoreStoredRoom(405, null)).toBe(true);
    });

    it('does not replace the session a first restore already started for that room', () =>
    {
        expect(shouldRestoreStoredRoom(405, 405)).toBe(false);
    });

    it('enters the stored room when the current session is another room', () =>
    {
        expect(shouldRestoreStoredRoom(405, 7)).toBe(true);
    });

    it('ignores a stored id that is not a room', () =>
    {
        expect(shouldRestoreStoredRoom(0, null)).toBe(false);
        expect(shouldRestoreStoredRoom(-3, null)).toBe(false);
    });
});

describe('shouldAttemptRoomReEntry', () =>
{
    it('waits for reauthentication before restoring the room', () =>
    {
        expect(shouldAttemptRoomReEntry(OctaneEventType.SOCKET_RECONNECTED)).toBe(false);
        expect(shouldAttemptRoomReEntry(OctaneEventType.SOCKET_REAUTHENTICATED)).toBe(true);
    });

    it('keeps the existing room session when Polaris resumed that same room in place', () =>
    {
        expect(shouldAttemptRoomReEntry(
            OctaneEventType.SOCKET_REAUTHENTICATED,
            { sessionResumed: true, roomId: 42 },
            42)).toBe(false);
    });

    it('falls back to room re-entry for old emulators without resume metadata', () =>
    {
        expect(shouldAttemptRoomReEntry(
            OctaneEventType.SOCKET_REAUTHENTICATED,
            { sessionResumed: false, roomId: 0 },
            42)).toBe(true);
    });
});
