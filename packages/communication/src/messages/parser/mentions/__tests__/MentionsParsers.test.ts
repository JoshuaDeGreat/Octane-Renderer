import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { MentionReceivedParser } from '../MentionReceivedParser';
import { MentionsListParser } from '../MentionsListParser';
import { MentionsPageParser } from '../MentionsPageParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readByte()
    {
        return this.reader.readByte();
    }
    readBytes(n: number)
    {
        return this.reader.readBytes(n);
    }
    readBoolean()
    {
        return this.reader.readByte() === 1;
    }
    readShort()
    {
        return this.reader.readShort();
    }
    readInt()
    {
        return this.reader.readInt();
    }
    readFloat()
    {
        return this.reader.readFloat();
    }
    readDouble()
    {
        return this.reader.readDouble();
    }
    readString()
    {
        const len = this.reader.readShort(); return this.reader.readBytes(len).toString();
    }
    header = 0;
    get bytesAvailable()
    {
        return this.reader.remaining() > 0;
    }
}

describe('MentionReceivedParser', () =>
{
    it('parses a single mention without read flag', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(7); w.writeInt(42); w.writeString('Bob'); w.writeString('hd-180-2.ch-210-66'); w.writeInt(99);
        w.writeString('My Room'); w.writeString('ciao @me'); w.writeInt(0); w.writeInt(1717000000);
        const parser = new MentionReceivedParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())));
        const m = parser.mention;
        expect(m.mentionId).toBe(7);
        expect(m.senderId).toBe(42);
        expect(m.senderUsername).toBe('Bob');
        expect(m.senderFigure).toBe('hd-180-2.ch-210-66');
        expect(m.roomId).toBe(99);
        expect(m.roomName).toBe('My Room');
        expect(m.message).toBe('ciao @me');
        expect(m.mentionType).toBe(0);
        expect(m.timestamp).toBe(1717000000);
        expect(m.read).toBe(false);
    });
});

describe('MentionsListParser', () =>
{
    it('parses a count-prefixed list with read flags', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(1);
        w.writeInt(3); w.writeInt(42); w.writeString('Bob'); w.writeString('hd-180-2.ch-210-66'); w.writeInt(99);
        w.writeString('My Room'); w.writeString('@all festa'); w.writeInt(1); w.writeInt(1717000000); w.writeByte(1);
        const parser = new MentionsListParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())));
        expect(parser.mentions).toHaveLength(1);
        expect(parser.mentions[0].mentionId).toBe(3);
        expect(parser.mentions[0].senderUsername).toBe('Bob');
        expect(parser.mentions[0].senderFigure).toBe('hd-180-2.ch-210-66');
        expect(parser.mentions[0].read).toBe(true);
        expect(parser.mentions[0].mentionType).toBe(1);
        expect(parser.mentions[0].message).toBe('@all festa');
    });

    it('parses an empty list', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(0);
        const parser = new MentionsListParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())));
        expect(parser.mentions).toHaveLength(0);
    });
});

const writeMention = (w: BinaryWriter, id: number): void =>
{
    w.writeInt(id); w.writeInt(42); w.writeString('Bob'); w.writeString('hd-180-2'); w.writeInt(99);
    w.writeString('My Room'); w.writeString('hi @me'); w.writeInt(0); w.writeInt(1717000000); w.writeByte(0);
};

describe('MentionsListParser paging flag', () =>
{
    it('reads whether older mentions remain', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(1);
        writeMention(w, 5);
        w.writeByte(1);
        const parser = new MentionsListParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())));
        expect(parser.mentions).toHaveLength(1);
        expect(parser.hasMore).toBe(true);
    });

    it('treats a list from a server that does not page as complete', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(1);
        writeMention(w, 5);
        const parser = new MentionsListParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())));
        expect(parser.hasMore).toBe(false);
    });
});

describe('MentionsPageParser', () =>
{
    it('parses the mentions of a page and the flag after them', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(2);
        writeMention(w, 4);
        writeMention(w, 3);
        w.writeByte(0);
        const parser = new MentionsPageParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())));
        expect(parser.mentions.map((mention) => mention.mentionId)).toEqual([4, 3]);
        expect(parser.hasMore).toBe(false);
    });
});
