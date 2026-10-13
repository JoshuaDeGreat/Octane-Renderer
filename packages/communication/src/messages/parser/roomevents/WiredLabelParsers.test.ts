import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { WiredLabelsParser } from './WiredLabelsParser';
import { WiredLabelsUpdateParser } from './WiredLabelsUpdateParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readByte()
    {
        return this.reader.readByte();
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
    readString()
    {
        const length = this.reader.readShort(); return this.reader.readBytes(length).toString();
    }
    header = 0;
    get bytesAvailable()
    {
        return this.reader.remaining() > 0;
    }
    get remainingBytes()
    {
        return this.reader.remaining();
    }
}

const wrapper = (writer: BinaryWriter) => new TestWrapper(new BinaryReader(writer.getBuffer())) as any;

const writeLabel = (writer: BinaryWriter, furnitureId: number, text: string) =>
{
    writer.writeInt(0);
    writer.writeInt(furnitureId);
    writer.writeString(text);
    writer.writeInt(2651759);
    writer.writeInt(0);
    writer.writeByte(1);
};

describe('WiredLabelsParser', () =>
{
    it('reads labels and reads past regions', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(2);
        writeLabel(writer, 42, 'Line one\nline two');
        writer.writeInt(1);
        writer.writeInt(43);
        writer.writeString('region');
        writer.writeString('extra');
        writer.writeInt(1);
        writer.writeInt(2);
        writer.writeInt(3);
        writer.writeInt(4);
        writer.writeString('more');
        writer.writeInt(1);
        writer.writeInt(0);
        writer.writeInt(0);
        writer.writeInt(1);
        writer.writeInt(1);

        const parser = new WiredLabelsParser();

        expect(parser.parse(wrapper(writer))).toBe(true);
        expect(parser.labels).toEqual([ { furnitureId: 42, text: 'Line one\nline two', color: 2651759, visibility: 0, alwaysOpen: true } ]);
    });
});

describe('WiredLabelsUpdateParser', () =>
{
    it('reads changes then removed ids', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(1);
        writeLabel(writer, 42, 'Hi');
        writer.writeInt(2);
        writer.writeInt(7);
        writer.writeInt(8);

        const parser = new WiredLabelsUpdateParser();

        parser.parse(wrapper(writer));
        expect(parser.changed.map(label => label.furnitureId)).toEqual([ 42 ]);
        expect(parser.removedIds).toEqual([ 7, 8 ]);
    });
});
