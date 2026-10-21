import { RoomObjectLogicType, RoomWidgetEnum } from '@octane/api';
import { RoomObjectWidgetRequestEvent } from '@octane/events';
import { describe, expect, it } from 'vitest';
import { FurnitureVimeoLogic } from './object';
import { RoomObjectLogicFactory } from './RoomObjectLogicFactory';

describe('furniture_vimeo logic', () =>
{
    it('maps the official logic type to the Vimeo logic', () =>
    {
        expect(new RoomObjectLogicFactory().getLogicType(RoomObjectLogicType.FURNITURE_VIMEO)).toBe(FurnitureVimeoLogic);
    });

    it('opens and closes the RWE_VIMEO widget', () =>
    {
        const logic = new FurnitureVimeoLogic();

        expect(logic.widget).toBe(RoomWidgetEnum.VIMEO);
        expect(logic.getEventTypes()).toEqual(expect.arrayContaining([
            RoomObjectWidgetRequestEvent.OPEN_WIDGET,
            RoomObjectWidgetRequestEvent.CLOSE_WIDGET
        ]));
    });
});
