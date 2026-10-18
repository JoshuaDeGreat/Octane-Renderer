import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../codec/evawire/EvaWireDataWrapper';
import { GetIgnoredUsersComposer } from '../../outgoing/user/data/GetIgnoredUsersComposer';
import { IgnoreUserComposer } from '../../outgoing/user/data/IgnoreUserComposer';
import { UnignoreUserComposer } from '../../outgoing/user/data/UnignoreUserComposer';
import { IgnoreResultParser } from './IgnoreResultParser';
import { IgnoredUsersParser } from './IgnoredUsersParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(1, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

describe('ignores keyed by user id', () =>
{
    it('reads the ignored user ids', () =>
    {
        const parser = new IgnoredUsersParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter().writeInt(2).writeInt(14).writeInt(99)))).toBe(true);
        expect(parser.ignoredUserIds).toEqual([ 14, 99 ]);
    });

    it('reads the result, then the user id', () =>
    {
        const parser = new IgnoreResultParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter().writeInt(3).writeInt(14)))).toBe(true);
        expect(parser.result).toBe(3);
        expect(parser.userId).toBe(14);
    });

    it('sends user ids, and no fields to ask for the list', () =>
    {
        expect(new IgnoreUserComposer(14).getMessageArray()).toEqual([ 14 ]);
        expect(new UnignoreUserComposer(14).getMessageArray()).toEqual([ 14 ]);
        expect(new GetIgnoredUsersComposer().getMessageArray()).toEqual([]);
    });
});
