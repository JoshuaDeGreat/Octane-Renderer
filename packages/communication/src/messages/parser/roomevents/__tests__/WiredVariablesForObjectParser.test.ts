import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { WiredGetVariablesForObjectComposer } from '../../../outgoing/roomevents/WiredGetVariablesForObjectComposer';
import { WiredVariablesForObjectParser } from '../WiredVariablesForObjectParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(238, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

describe('WiredVariablesForObjectParser', () =>
{
    it('reads a furni: item id, values and the boxes that pick it', () =>
    {
        const parser = new WiredVariablesForObjectParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter()
            .writeInt(0).writeInt(501)
            .writeInt(2).writeString('furni:10').writeInt(7).writeString('furni:11').writeInt(0)
            .writeInt(2).writeInt(900).writeInt(901)))).toBe(true);

        expect(parser.type).toBe(WiredVariablesForObjectParser.TYPE_FURNI);
        expect(parser.objectId).toBe(501);
        expect([ ...parser.values ]).toEqual([ [ 'furni:10', 7 ], [ 'furni:11', 0 ] ]);
        expect(parser.configuredInWireds).toEqual([ 900, 901 ]);
    });

    it('reads a user by room index, without a box list', () =>
    {
        const parser = new WiredVariablesForObjectParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter().writeInt(1).writeInt(3).writeInt(1).writeString('user:4').writeInt(12)))).toBe(true);

        expect(parser.userIndex).toBe(3);
        expect(parser.values.get('user:4')).toBe(12);
        expect(parser.configuredInWireds).toEqual([]);
    });

    it('reads the room without an object id', () =>
    {
        const parser = new WiredVariablesForObjectParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter().writeInt(-10).writeInt(1).writeString('room:2').writeInt(99)))).toBe(true);

        expect(parser.type).toBe(WiredVariablesForObjectParser.TYPE_ROOM);
        expect(parser.values.get('room:2')).toBe(99);
    });

    it('requests one object by type and id', () =>
    {
        expect(new WiredGetVariablesForObjectComposer(1, 3).getMessageArray()).toEqual([ 1, 3 ]);
    });
});
