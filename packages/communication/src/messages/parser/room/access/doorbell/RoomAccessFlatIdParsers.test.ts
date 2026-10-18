import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../../codec/evawire/EvaWireDataWrapper';
import { FlatAccessDeniedMessageParser } from '../../../navigator/FlatAccessDeniedMessageParser';
import { YouAreSpectatorMessageParser } from '../../session/YouAreSpectatorMessageParser';
import { RoomDoorbellAcceptedParser } from './RoomDoorbellAcceptedParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(1, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

describe('room access packets start with the flat id', () =>
{
    it('FlatAccessDenied reads the flat id, then the user name', () =>
    {
        const parser = new FlatAccessDeniedMessageParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter().writeInt(321).writeString('alice')))).toBe(true);
        expect(parser.flatId).toBe(321);
        expect(parser.userName).toBe('alice');
    });

    it('FlatAccessible reads the flat id, then the user name', () =>
    {
        const parser = new RoomDoorbellAcceptedParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter().writeInt(77).writeString('')))).toBe(true);
        expect(parser.flatId).toBe(77);
        expect(parser.userName).toBe('');
    });

    it('YouAreSpectator reads the flat id', () =>
    {
        const parser = new YouAreSpectatorMessageParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter().writeInt(9)))).toBe(true);
        expect(parser.flatId).toBe(9);
    });
});
