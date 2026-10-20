import { RoomObjectCategory, RoomObjectOperationType, RoomObjectVariable } from '@octane/api';
import { FurnitureFloorUpdateComposer, FurnitureMultiStateComposer, FurniturePickupComposer, FurnitureWallMultiStateComposer } from '@octane/communication';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomObjectEventHandler } from './RoomObjectEventHandler';

const send = vi.fn();
const session = { playTestMode: false };

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

vi.mock('@octane/communication', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@octane/communication')>()),
    GetCommunication: () => ({ connection: { send } })
}));

vi.mock('@octane/session', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@octane/session')>()),
    GetRoomSessionManager: () => ({ getSession: () => session })
}));

const ROOM_ID = 3;

const createHandler = (options: { usagePolicy?: number; freeMode?: boolean } = {}) =>
{
    const { usagePolicy = 0, freeMode = false } = options;
    const values = new Map<string, unknown>([[ RoomObjectVariable.FURNITURE_USAGE_POLICY, usagePolicy ]]);
    const roomObject = {
        id: 8,
        type: 'chair',
        model: { getValue: (key: string) => values.get(key) },
        getLocation: () => ({ x: 2, y: 5, z: 0 }),
        getDirection: () => ({ x: 90, y: 0, z: 0 })
    };
    const handler = Object.create(RoomObjectEventHandler.prototype) as RoomObjectEventHandler;

    Object.assign(handler, {
        _roomEngine: {
            activeRoomHasFreeFurniMovementsMode: freeMode,
            getRoomObject: () => roomObject,
            getRoomObjectCategoryForType: (type: string) => (type === 'wall' ? RoomObjectCategory.WALL : RoomObjectCategory.FLOOR),
            getFurnitureStackingHeightMap: () => ({})
        },
        getValidRoomObjectDirection: () => 180,
        isValidLocation: () => true,
        resetSelectedObjectData: vi.fn()
    });

    return handler as unknown as Pick<RoomObjectEventHandler, 'modifyRoomObject'> & { changeObjectState: (roomId: number, objectId: number, type: string, state: number, isRandom: boolean) => void };
};

const sentComposers = () => send.mock.calls.map(call => call[0]);

describe('RoomObjectEventHandler playtest mode (AIR modifyRoomObject / useObject)', () =>
{
    beforeEach(() =>
    {
        send.mockClear();
        session.playTestMode = false;
    });

    it('rotates and picks up normally while playtest is off', () =>
    {
        const handler = createHandler();

        expect(handler.modifyRoomObject(ROOM_ID, 8, RoomObjectCategory.FLOOR, RoomObjectOperationType.OBJECT_ROTATE_POSITIVE)).toBe(true);
        expect(handler.modifyRoomObject(ROOM_ID, 8, RoomObjectCategory.FLOOR, RoomObjectOperationType.OBJECT_PICKUP)).toBe(true);

        expect(sentComposers()[0]).toBeInstanceOf(FurnitureFloorUpdateComposer);
        expect(sentComposers()[1]).toBeInstanceOf(FurniturePickupComposer);
    });

    it.each([
        RoomObjectOperationType.OBJECT_ROTATE_POSITIVE,
        RoomObjectOperationType.OBJECT_ROTATE_NEGATIVE,
        RoomObjectOperationType.OBJECT_PICKUP,
        RoomObjectOperationType.OBJECT_EJECT,
        RoomObjectOperationType.OBJECT_MOVE,
        RoomObjectOperationType.OBJECT_MOVE_TO
    ])('refuses %s while playtest is on', (operation) =>
    {
        session.playTestMode = true;

        const handler = createHandler();

        expect(handler.modifyRoomObject(ROOM_ID, 8, RoomObjectCategory.FLOOR, operation)).toBe(false);
        expect(send).not.toHaveBeenCalled();
    });

    it('lets the room free furni movements mode through while playtest is on', () =>
    {
        session.playTestMode = true;

        expect(createHandler({ freeMode: true }).modifyRoomObject(ROOM_ID, 8, RoomObjectCategory.FLOOR, RoomObjectOperationType.OBJECT_ROTATE_POSITIVE)).toBe(true);
        expect(sentComposers()[0]).toBeInstanceOf(FurnitureFloorUpdateComposer);
    });

    it('in playtest only uses furni that everybody may use', () =>
    {
        session.playTestMode = true;

        createHandler({ usagePolicy: 1 }).changeObjectState(ROOM_ID, 8, 'chair', 1, false);
        createHandler({ usagePolicy: 0 }).changeObjectState(ROOM_ID, 8, 'wall', 1, false);
        expect(send).not.toHaveBeenCalled();

        createHandler({ usagePolicy: 2 }).changeObjectState(ROOM_ID, 8, 'chair', 1, false);
        createHandler({ usagePolicy: 2 }).changeObjectState(ROOM_ID, 8, 'wall', 1, false);
        expect(sentComposers()[0]).toBeInstanceOf(FurnitureMultiStateComposer);
        expect(sentComposers()[1]).toBeInstanceOf(FurnitureWallMultiStateComposer);
    });

    it('uses rights-only furni with playtest off or in free furni movements mode', () =>
    {
        createHandler({ usagePolicy: 1 }).changeObjectState(ROOM_ID, 8, 'chair', 1, false);

        session.playTestMode = true;
        createHandler({ usagePolicy: 1, freeMode: true }).changeObjectState(ROOM_ID, 8, 'chair', 1, false);

        expect(send).toHaveBeenCalledTimes(2);
    });
});
