import { OctaneEventType } from '@octane/events';

export interface SessionResumeMetadata
{
    sessionResumed: boolean;
    roomId: number;
}

/**
 * Whether a stored room still has to be entered. The restore runs from a mount effect, so
 * it can run twice in a row (a development double mount, a remount of the main view); the
 * second run must not replace the session the first one started, because replacing it
 * disposes the room instance that is already being built and leaves the view black.
 */
export const shouldRestoreStoredRoom = (storedRoomId: number, currentSessionRoomId: number | null): boolean =>
    storedRoomId > 0 && storedRoomId !== currentSessionRoomId;

export const shouldAttemptRoomReEntry = (
    eventType: string,
    resume: SessionResumeMetadata = { sessionResumed: false, roomId: 0 },
    lastRoomId: number = -1): boolean =>
    eventType === OctaneEventType.SOCKET_REAUTHENTICATED &&
    !(resume.sessionResumed && resume.roomId > 0 && resume.roomId === lastRoomId);
