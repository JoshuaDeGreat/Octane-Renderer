import { RoomObjectCategory, RoomObjectUserType } from '@octane/api';
import { ClickUserMessageComposer } from '@octane/communication';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomObjectEventHandler } from './RoomObjectEventHandler';

const send = vi.fn();

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: () => null
}));

vi.mock('@octane/communication', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@octane/communication')>()),
    GetCommunication: () => ({ connection: { send } })
}));

const createHandler = () =>
{
    const handler = Object.create(RoomObjectEventHandler.prototype) as RoomObjectEventHandler;

    Object.assign(handler, {
        _roomEngine: {
            getRoomObjectCategoryForType: (type: string) => (type === 'floor' ? RoomObjectCategory.FLOOR : RoomObjectCategory.UNIT)
        }
    });

    return handler as unknown as { clickRoomObject: (event: unknown) => void };
};

const click = (objectType: string, extra: Record<string, boolean> = {}) => ({ objectId: 7, objectType, altKey: false, ctrlKey: false, shiftKey: false, ...extra });

describe('RoomObjectEventHandler click user', () =>
{
    beforeEach(() => send.mockClear());

    it.each([RoomObjectUserType.USER, RoomObjectUserType.BOT, RoomObjectUserType.RENTABLE_BOT, RoomObjectUserType.PET])('sends ClickUser for a clicked %s, as the AIR client', (type) =>
    {
        createHandler().clickRoomObject(click(type));

        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0][0]).toBeInstanceOf(ClickUserMessageComposer);
        expect(send.mock.calls[0][0].getMessageArray()).toEqual([7]);
    });

    it('sends nothing for a modified click', () =>
    {
        createHandler().clickRoomObject(click(RoomObjectUserType.BOT, { shiftKey: true }));

        expect(send).not.toHaveBeenCalled();
    });
});
