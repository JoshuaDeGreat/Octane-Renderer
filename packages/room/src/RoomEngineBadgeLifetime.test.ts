import { IRoomObjectController, RoomObjectCategory } from '@octane/api';
import { BadgeImageReadyEvent, GetEventDispatcher } from '@octane/events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import { RoomManager } from './RoomManager';
import { RoomObjectLogicBase } from './object/logic/RoomObjectLogicBase';

vi.mock('./GetRoomEngine', () => ({ GetRoomEngine: () => null }));
vi.mock('./GetRoomManager', () => ({ GetRoomManager: () => null }));
vi.mock('./GetRoomMessageHandler', () => ({ GetRoomMessageHandler: () => ({ dispose: vi.fn() }) }));

const fixture = () =>
{
    const rooms = new RoomManager();
    const engine = Object.create(RoomEngine.prototype) as RoomEngine;

    Object.assign(engine, {
        _roomManager: rooms,
        _roomObjectEventHandler: { setGameInputHandler: vi.fn() },
        _roomInstanceDatas: new Map(), _roomDatas: new Map(), _areaHideHoleCounts: new Map(),
        _roomsWithInitializedObjects: new Set(), _initializedRooms: new Set(),
        _badgeListenerObjects: new Map(), _badgeImageReadyCallback: null,
        _imageCallbacks: new Map(), _thumbnailCallbacks: new Map(),
        _sessionDataManager: { loadGroupBadgeImage: () => null, loadBadgeImage: () => null },
        clearRoomObjectImageCache: vi.fn(), putBadgeInObjectAssets: vi.fn(),
        getRoomObjectFloor: (roomId: number, objectId: number) => rooms.getRoomInstance(`${ roomId }`)?.getRoomObject(objectId, RoomObjectCategory.FLOOR)
    });

    const add = (roomId: number) =>
    {
        const room = rooms.getRoomInstance(`${ roomId }`) ?? rooms.createRoomInstance(`${ roomId }`);
        const object = room.createRoomObject(1, 1, 'badge_furni', RoomObjectCategory.FLOOR) as IRoomObjectController;

        object.setLogic(new RoomObjectLogicBase());
        engine.loadRoomObjectBadgeImage(roomId, 1, RoomObjectCategory.FLOOR, 'pending-badge');

        return object;
    };

    return { engine, rooms, add };
};

const readyListeners = () => (GetEventDispatcher() as any)._listeners.get(BadgeImageReadyEvent.IMAGE_READY)?.length ?? 0;
const pending = (engine: RoomEngine) => (engine as any)._badgeListenerObjects as Map<string, unknown[]>;

afterEach(() => GetEventDispatcher().removeAllListeners());

describe('pending room badge image lifetime', () =>
{
    it('drops a left room and unsubscribes without waiting for the download', () =>
    {
        const { engine, add } = fixture();

        add(14);
        expect(readyListeners()).toBe(1);

        engine.removeRoomInstance(14);
        expect(pending(engine).size).toBe(0);
        expect(readyListeners()).toBe(0);

        GetEventDispatcher().dispatchEvent(new BadgeImageReadyEvent('pending-badge', null));
        expect((engine as any).putBadgeInObjectAssets).not.toHaveBeenCalled();
    });

    it('keeps a live object waiting for the same badge in another room', () =>
    {
        const { engine, add } = fixture();

        add(14);
        const other = add(15);

        engine.removeRoomInstance(14);
        expect(pending(engine).get('pending-badge')).toHaveLength(1);
        expect(readyListeners()).toBe(1);

        GetEventDispatcher().dispatchEvent(new BadgeImageReadyEvent('pending-badge', null));
        expect((engine as any).putBadgeInObjectAssets).toHaveBeenCalledExactlyOnceWith(other, 'pending-badge', true);
        expect(readyListeners()).toBe(0);
    });

    it('subscribes only once, and again after the engine let go', () =>
    {
        const { engine, add } = fixture();

        add(14);
        add(15);
        expect(readyListeners()).toBe(1);

        engine.removeRoomInstance(14);
        engine.removeRoomInstance(15);
        expect(readyListeners()).toBe(0);

        add(16);
        expect(readyListeners()).toBe(1);
    });
});
