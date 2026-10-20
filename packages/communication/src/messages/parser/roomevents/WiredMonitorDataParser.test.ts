import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { WiredMonitorDataParser } from './WiredMonitorDataParser';

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

const writeSnapshot = (writer: BinaryWriter) =>
{
    writer.writeInt(120).writeInt(10000); // usage, usage limit
    writer.writeByte(1); // isHeavy
    for(let i = 0; i < 14; i++) writer.writeInt(i + 1); // delayed events .. heavy delayed percent
    writer.writeInt(1); // one log row
    // The latest detail only: category, count and time are AIR's error list (15).
    writer.writeString('KILLED').writeString('loop').writeString('wf_act_move').writeInt(55);
    writer.writeInt(0); // no history
};

describe('WiredMonitorDataParser', () =>
{
    it('reads the snapshot to its end; the room counters come in their own packet (1891)', () =>
    {
        const writer = new BinaryWriter();

        writeSnapshot(writer);

        const parser = new WiredMonitorDataParser();
        const data = wrapper(writer);

        expect(parser.parse(data)).toBe(true);
        expect(parser.usageCurrentWindow).toBe(120);
        expect(parser.isHeavy).toBe(true);
        expect(parser.heavyDelayedThresholdPercent).toBe(14);
        expect(parser.logs).toHaveLength(1);
        expect(parser.logs[0]).toEqual({ type: 'KILLED', latestReason: 'loop', latestSourceLabel: 'wf_act_move', latestSourceId: 55 });
        expect(parser.history).toEqual([]);
        expect(data.bytesAvailable).toBe(false);
        expect('roomStats' in parser).toBe(false);
    });
});
