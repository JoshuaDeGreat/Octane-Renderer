import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { WiredValidationErrorParser } from '../WiredValidationErrorParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(156, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

describe('WiredValidationErrorParser', () =>
{
    it('reads the key and its placeholder pairs', () =>
    {
        const parser = new WiredValidationErrorParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter()
            .writeString('wiredfurni.error.usernames_count')
            .writeInt(2)
            .writeString('max_usernames').writeString('20')
            .writeString('other').writeString('x')))).toBe(true);

        expect(parser.info).toBe('wiredfurni.error.usernames_count');
        expect(parser.parameters).toEqual([ { key: 'max_usernames', value: '20' }, { key: 'other', value: 'x' } ]);
    });

    it('reads a key without pairs from an older server', () =>
    {
        const parser = new WiredValidationErrorParser();

        parser.flush();
        expect(parser.parse(wrapperOf(new BinaryWriter().writeString('Invalid wired effect settings')))).toBe(true);

        expect(parser.info).toBe('Invalid wired effect settings');
        expect(parser.parameters).toEqual([]);
    });
});
