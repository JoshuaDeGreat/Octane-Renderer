import { RoomUnitStatusAction, RoomUnitStatusEvent, RoomUnitStatusMessage } from '@octane/communication';
import { describe, expect, it, vi } from 'vitest';
import './RoomEngine';
import { RoomMessageHandler } from './RoomMessageHandler';

vi.mock('./GetRoomMessageHandler', () => ({ GetRoomMessageHandler: () => ({}) }));
vi.mock('./GetRoomEngine', () => ({ GetRoomEngine: () => null }));

const fixture = () =>
{
    const engine = {
        getRoomInstance: () => ({ model: { getValue: () => 1 } }),
        updateRoomObjectUserLocation: vi.fn(),
        updateRoomObjectUserFlatControl: vi.fn(),
        updateRoomObjectUserAction: vi.fn(),
        updateRoomObjectUserPetGesture: vi.fn(),
        updateRoomObjectUserPosture: vi.fn()
    };
    const handler = Object.create(RoomMessageHandler.prototype) as RoomMessageHandler;

    Object.assign(handler, {
        _roomEngine: engine,
        _currentRoomId: 1,
        _ownRoomIndex: -1,
        _walkingUnitIds: new Set<number>(),
        _jumpingUnitIds: new Set<number>(),
        _activeRoomUserWalks: new Map(),
        getReleasedWiredStatusLocation: () => null,
        shouldSuppressWiredStatusLocation: () => false,
        trackRoomUserWalkStatus: () => undefined,
        updateGuideMarker: () => undefined
    });

    const receive = (...actions: RoomUnitStatusAction[]) =>
    {
        const status = new RoomUnitStatusMessage(7, 3, 4, 0, 0, 2, 2, 0, 0, 0, false, false, actions);
        const event = Object.create(RoomUnitStatusEvent.prototype) as RoomUnitStatusEvent;

        Object.assign(event, { getParser: () => ({ statuses: [ status ] }) });
        Object.defineProperty(event, 'connection', { value: {} });

        (handler as any).onRoomUnitStatusEvent(event);
    };

    return { engine, receive };
};

describe('user status actions', () =>
{
    it('ignores AIR\'s wf status instead of turning it into a posture', () =>
    {
        const { engine, receive } = fixture();

        receive(new RoomUnitStatusAction('wf', ''));

        expect(engine.updateRoomObjectUserPosture).not.toHaveBeenCalledWith(1, 7, 'wf', expect.anything());
    });

    it('keeps the other posture of the same status', () =>
    {
        const { engine, receive } = fixture();

        receive(new RoomUnitStatusAction('wf', ''), new RoomUnitStatusAction('sit', '0.5'));

        expect(engine.updateRoomObjectUserPosture).toHaveBeenCalledWith(1, 7, 'sit', '0.5');
        expect(engine.updateRoomObjectUserPosture).not.toHaveBeenCalledWith(1, 7, 'wf', expect.anything());
    });
});
