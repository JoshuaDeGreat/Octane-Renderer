import { RoomObjectVariable } from '@octane/api';
import { ObjectRemoveMultipleEvent } from '@octane/communication';
import { describe, expect, it, vi } from 'vitest';
import './RoomEngine';
import { RoomMessageHandler } from './RoomMessageHandler';

vi.mock('./GetRoomMessageHandler', () => ({ GetRoomMessageHandler: () => ({}) }));
vi.mock('./GetRoomEngine', () => ({ GetRoomEngine: () => null }));
vi.mock('@octane/session', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@octane/session')>()),
    GetSessionDataManager: () => ({ getFloorItemDataByName: (): null => null })
}));

const ROOM_ID = 5;

const fixture = () =>
{
    const engine = {
        removeRoomObjectFloor: vi.fn(),
        refreshTileObjectMap: vi.fn(),
        updateAreaHide: vi.fn(),
        getRoomObjects: (): unknown[] => []
    };
    const handler = Object.create(RoomMessageHandler.prototype) as RoomMessageHandler;
    const controllers = new Map<number, unknown>();

    Object.assign(handler, {
        _roomEngine: engine,
        _currentRoomId: ROOM_ID,
        _activeConfInvisHiddenItemIds: new Set<number>(),
        _activeAreaHideControllers: controllers
    });

    const removeMultiple = (...ids: number[]) =>
    {
        const event = Object.create(ObjectRemoveMultipleEvent.prototype) as ObjectRemoveMultipleEvent;

        Object.assign(event, { getParser: () => ({ ids, pickerId: 1 }) });
        Object.defineProperty(event, 'connection', { value: {} });

        (handler as unknown as { onObjectRemoveMultipleEvent: (event: ObjectRemoveMultipleEvent) => void }).onObjectRemoveMultipleEvent(event);
    };

    return { engine, handler, controllers, removeMultiple };
};

const model = (values: Record<string, unknown>) => ({ getValue: (key: string) => values[key] });

describe('RoomMessageHandler area hider', () =>
{
    it('closes the floor hole of a switched-on area hider that leaves the room', () =>
    {
        const { engine, controllers, removeMultiple } = fixture();

        controllers.set(41, { rootX: 1, rootY: 1, width: 2, length: 2, invert: false, wallItems: false, invisibility: false });

        removeMultiple(41, 42);

        expect(controllers.has(41)).toBe(false);
        expect(engine.updateAreaHide).toHaveBeenCalledTimes(1);
        expect(engine.updateAreaHide).toHaveBeenCalledWith(ROOM_ID, 41, false, 0, 0, 0, 0, false);
        expect(engine.removeRoomObjectFloor).toHaveBeenCalledTimes(2);
    });

    it('leaves the floor alone when an ordinary furni leaves', () =>
    {
        const { engine, removeMultiple } = fixture();

        removeMultiple(42);

        expect(engine.updateAreaHide).not.toHaveBeenCalled();
    });

    it('recognises an area hider by the area its logic wrote, not by the size of an int array', () =>
    {
        const { handler } = fixture();
        const isController = (roomObject: unknown) => (handler as unknown as { isAreaHideControllerObject: (roomObject: unknown) => boolean }).isAreaHideControllerObject(roomObject);

        expect(isController({ type: 'conf_area_hide', model: model({ [RoomObjectVariable.FURNITURE_AREA_HIDE_ROOT_X]: 0 }) })).toBe(true);
        expect(isController({ type: 'vote_counter', model: model({ [RoomObjectVariable.FURNITURE_DATA]: [ 1, 2, 3, 4, 5, 6, 7, 8 ] }) })).toBe(false);
    });
});
