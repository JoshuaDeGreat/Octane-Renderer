import { IRoomSession, RoomControllerLevel } from '@octane/api';
import { GetEventDispatcher, OctaneEventType, RoomSessionEvent } from '@octane/events';
import { describe, expect, it, vi } from 'vitest';
import { RoomSession } from './RoomSession';
import { RoomSessionManager } from './RoomSessionManager';

const startableSession = (): IRoomSession =>
{
    const session = new RoomSession();

    session.roomId = 12;
    vi.spyOn(session, 'start').mockReturnValue(true);

    return session;
};

describe('RoomSession playtest mode (AIR RoomSession.controllerLevel)', () =>
{
    it('reports no rights while playtest is on and gives the stored level back when it goes off', () =>
    {
        const session = new RoomSession();

        session.setControllerLevel(RoomControllerLevel.ROOM_OWNER);

        expect(session.controllerLevel).toBe(RoomControllerLevel.ROOM_OWNER);

        session.playTestMode = true;

        expect(session.playTestMode).toBe(true);
        expect(session.controllerLevel).toBe(RoomControllerLevel.NONE);

        // a rights update while testing is stored but still reads as none
        session.setControllerLevel(RoomControllerLevel.GUEST);
        expect(session.controllerLevel).toBe(RoomControllerLevel.NONE);

        session.playTestMode = false;

        expect(session.controllerLevel).toBe(RoomControllerLevel.GUEST);
    });

    it('leaves the owner flag alone, as AIR does', () =>
    {
        const session = new RoomSession();

        session.setRoomOwner();
        session.playTestMode = true;

        expect(session.isRoomOwner).toBe(true);
    });
});

describe('RoomSessionManager playtest mode (AIR WiredMenuController.setPlayTestMode)', () =>
{
    it('puts the preference on the current session and refreshes the session snapshot', () =>
    {
        const manager = new RoomSessionManager();
        const session = startableSession();
        const updated = vi.fn();

        session.setControllerLevel(RoomControllerLevel.ROOM_OWNER);
        manager.startSession(session);
        (manager as unknown as { _viewerSession: IRoomSession })._viewerSession = session;

        expect(manager.getActiveRoomSessionSnapshot().controllerLevel).toBe(RoomControllerLevel.ROOM_OWNER);

        GetEventDispatcher().addEventListener(OctaneEventType.ROOM_SESSION_UPDATED, updated);
        manager.setPlayTestMode(true);
        GetEventDispatcher().removeEventListener(OctaneEventType.ROOM_SESSION_UPDATED, updated);

        expect(manager.playTestMode).toBe(true);
        expect(session.playTestMode).toBe(true);
        expect(updated).toHaveBeenCalledTimes(1);
        expect(manager.getActiveRoomSessionSnapshot().controllerLevel).toBe(RoomControllerLevel.NONE);
    });

    it('applies the kept preference to every session that starts (room enter)', () =>
    {
        const manager = new RoomSessionManager();

        manager.setPlayTestMode(true);

        const session = startableSession();
        let seenOnStart: boolean = null;
        const onStarted = (event: RoomSessionEvent) => (seenOnStart = event.session.playTestMode);

        GetEventDispatcher().addEventListener(RoomSessionEvent.STARTED, onStarted);
        manager.startSession(session);
        GetEventDispatcher().removeEventListener(RoomSessionEvent.STARTED, onStarted);

        expect(session.playTestMode).toBe(true);
        expect(seenOnStart).toBe(true);

        manager.setPlayTestMode(false);

        const next = startableSession();

        manager.startSession(next);

        expect(next.playTestMode).toBe(false);
    });
});
