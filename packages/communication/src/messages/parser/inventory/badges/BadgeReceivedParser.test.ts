import { describe, expect, it } from 'vitest';
import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { BadgeReceivedParser } from './BadgeReceivedParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(2493, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

const parse = (writer: BinaryWriter) =>
{
    const parser = new BadgeReceivedParser();

    parser.flush();
    expect(parser.parse(wrapperOf(writer))).toBe(true);

    return parser;
};

describe('BadgeReceivedParser', () =>
{
    it('reads the owner count and rarity tier', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(12);
        writer.writeString('ACH_Test1');
        writer.writeString('Alice');
        writer.writeInt(3).writeInt(5);

        const parser = parse(writer);

        expect(parser.badgeCode).toBe('ACH_Test1');
        expect(parser.senderName).toBe('Alice');
        expect(parser.ownerCount).toBe(3);
        expect(parser.rarityTier).toBe(5);
    });

    it('accepts the older packet without sender or rarity', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(12);
        writer.writeString('ACH_Test1');

        const parser = parse(writer);

        expect(parser.senderName).toBe('');
        expect(parser.ownerCount).toBe(0);
        expect(parser.rarityTier).toBe(0);
    });
});
