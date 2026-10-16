import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { UserSettingsParser } from '../UserSettingsParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readByte()
    {
        return this.reader.readByte();
    }
    readBytes(length: number)
    {
        return this.reader.readBytes(length);
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
        const length = this.reader.readShort(); return this.reader.readBytes(length).toString();
    }
    header = 0;
    get bytesAvailable()
    {
        return this.reader.remaining() > 0;
    }
}

const writeLegacySettings = (writer: BinaryWriter) =>
{
    writer.writeInt(10);
    writer.writeInt(20);
    writer.writeInt(30);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeByte(1);
    writer.writeInt(12);
    writer.writeInt(4);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeByte(1);
};

describe('UserSettingsParser Soundboard volume', () =>
{
    it('reads the optional trailing Soundboard volume', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);
        writer.writeInt(40);

        const parser = new UserSettingsParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.volumeSoundboard).toBe(40);
    });

    it('defaults the Soundboard volume for legacy packets and after flush', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);

        const parser = new UserSettingsParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.volumeSoundboard).toBe(80);

        parser.flush();
        expect(parser.volumeSoundboard).toBe(80);
    });
});

describe('UserSettingsParser per-user preferences', () =>
{
    const parse = (writer: BinaryWriter) =>
    {
        const parser = new UserSettingsParser();
        parser.flush();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        return parser;
    };

    it('reads the trailing wired whisper, chat and friend-online preferences', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);
        writer.writeInt(40);
        writer.writeByte(1);
        writer.writeInt(1);
        writer.writeInt(2);
        writer.writeInt(0);
        writer.writeInt(2);

        const parser = parse(writer);

        expect(parser.volumeSoundboard).toBe(40);
        expect(parser.wiredWhisperDisabled).toBe(true);
        expect(parser.chatMode).toBe(1);
        expect(parser.chatBubbleWidth).toBe(2);
        expect(parser.chatScrollSpeed).toBe(0);
        expect(parser.onlineIndicatorPreference).toBe(2);
    });

    it('reads whether the extended profile is visible to others', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);
        writer.writeInt(40);
        writer.writeByte(0);
        writer.writeInt(1);
        writer.writeInt(2);
        writer.writeInt(0);
        writer.writeInt(2);
        writer.writeByte(0);

        expect(parse(writer).profileVisible).toBe(false);
    });

    it('reads the stored wired menu preferences after the profile flag', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);
        writer.writeInt(40);
        writer.writeByte(0);
        writer.writeInt(1);
        writer.writeInt(2);
        writer.writeInt(0);
        writer.writeInt(2);
        writer.writeByte(1);
        writer.writeString('1,0,0,1,volter');

        expect(parse(writer).wiredMenuPreferences).toBe('1,0,0,1,volter');
    });

    it('has no wired menu preferences from an emulator that does not send them', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);
        writer.writeInt(40);

        expect(parse(writer).wiredMenuPreferences).toBe('');
    });

    it('keeps the profile visible when the emulator does not send the flag', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);
        writer.writeInt(40);

        expect(parse(writer).profileVisible).toBe(true);
    });

    it('keeps the official defaults when the emulator stops at the soundboard volume', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);
        writer.writeInt(40);

        const parser = parse(writer);

        expect(parser.chatType).toBe(4);
        expect(parser.wiredWhisperDisabled).toBe(false);
        expect(parser.chatMode).toBe(0);
        expect(parser.chatBubbleWidth).toBe(1);
        expect(parser.chatScrollSpeed).toBe(1);
        expect(parser.onlineIndicatorPreference).toBe(0);
    });

    it('keeps the official defaults for the legacy packet without the soundboard volume', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);

        const parser = parse(writer);

        expect(parser.volumeSoundboard).toBe(80);
        expect(parser.chatBubbleWidth).toBe(1);
        expect(parser.onlineIndicatorPreference).toBe(0);
    });
});
