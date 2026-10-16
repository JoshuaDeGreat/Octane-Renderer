import { describe, expect, it, vi } from 'vitest';
import { RoomObjectManager } from './RoomObjectManager';
import { RoomObjectLogicBase } from './object/logic/RoomObjectLogicBase';

describe('RoomObjectManager', () =>
{
    it('tears every object down when the whole room is removed', () =>
    {
        const manager = new RoomObjectManager();
        const logic = new RoomObjectLogicBase();
        const tearDown = vi.spyOn(logic, 'tearDown');

        manager.createObject(1, 1, 'furni').setLogic(logic);
        manager.removeAllObjects();

        expect(tearDown).toHaveBeenCalledOnce();
        expect(manager.totalObjects).toBe(0);
    });
});
