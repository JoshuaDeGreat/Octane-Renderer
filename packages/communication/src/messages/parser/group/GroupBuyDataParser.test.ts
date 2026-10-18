import { IBinaryWriter, RoomObjectCategory } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../codec/evawire/EvaWireDataWrapper';
import { FurniturePlaceComposer } from '../../outgoing/room/furniture/FurniturePlaceComposer';
import { GroupBuyDataParser } from './GroupBuyDataParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(2159, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

const rooms = () => new BinaryWriter().writeInt(10).writeInt(1).writeInt(44).writeString('Lobby').writeByte(0);

describe('GroupBuyDataParser', () =>
{
    it('reads the default badge parts after the rooms', () =>
    {
        const parser = new GroupBuyDataParser();

        parser.flush();
        expect(parser.parse(wrapperOf(rooms().writeInt(2).writeInt(10).writeInt(3).writeInt(4).writeInt(25).writeInt(17).writeInt(5)))).toBe(true);

        expect(parser.groupCost).toBe(10);
        expect(parser.availableRooms.get(44)).toBe('Lobby');
        expect(parser.badgeParts.map(part => part.code)).toEqual([ 'b010034', 's025175' ]);
    });

    it('has no parts when the server sends none', () =>
    {
        const parser = new GroupBuyDataParser();

        parser.flush();
        expect(parser.parse(wrapperOf(rooms()))).toBe(true);
        expect(parser.badgeParts).toEqual([]);
    });
});

describe('FurniturePlaceComposer', () =>
{
    it('sends a wall placement without a trailing space', () =>
    {
        expect(new FurniturePlaceComposer(7, RoomObjectCategory.WALL, ':w=1,2 l=3,4 r', 0, 0, 0).getMessageArray()).toEqual([ '7 :w=1,2 l=3,4 r' ]);
    });
});
