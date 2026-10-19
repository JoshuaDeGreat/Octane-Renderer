import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { IncomingHeader } from '../../incoming/IncomingHeader';
import { OutgoingHeader } from '../../outgoing/OutgoingHeader';
import { WiredRoomStatsRequestComposer } from '../../outgoing/roomevents/WiredRoomStatsRequestComposer';
import { WiredRoomStatsParser } from './WiredRoomStatsParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readBoolean()
    {
        return this.reader.readByte() === 1;
    }
    readInt()
    {
        return this.reader.readInt();
    }
    readDouble()
    {
        return this.reader.readDouble();
    }
    header = 0;
    get bytesAvailable()
    {
        return this.reader.remaining() > 0;
    }
}

const writeDouble = (writer: BinaryWriter, value: number) =>
{
    const view = new DataView(new ArrayBuffer(8));

    view.setFloat64(0, value);
    writer.writeBytes(view.buffer);
};

describe('WiredRoomStatsParser', () =>
{
    it('uses AIR\'s headers: 1957 asks, 1891 answers, the request has no fields', () =>
    {
        expect(OutgoingHeader.WIRED_ROOM_STATS_REQUEST).toBe(1957);
        expect(IncomingHeader.WIRED_ROOM_STATS).toBe(1891);
        expect(new WiredRoomStatsRequestComposer().getMessageArray()).toEqual([]);
    });

    it('reads WiredRoomStatsData: usage and limit as doubles, the heavy flag, then each count with its limit', () =>
    {
        const writer = new BinaryWriter();

        writeDouble(writer, 120);
        writeDouble(writer, 500);
        writer.writeByte(1);
        [ 12, 4000, 3, 4000, 4, 23, 50, 93, 60, 70 ].forEach(value => writer.writeInt(value));

        const reader = new BinaryReader(writer.getBuffer());
        const parser = new WiredRoomStatsParser();

        expect(parser.parse(new TestWrapper(reader) as any)).toBe(true);
        expect(reader.remaining()).toBe(0);
        expect(parser.roomStats).toEqual({
            usage: 120,
            usageLimit: 500,
            isHeavy: true,
            floorCount: 12,
            floorLimit: 4000,
            wallCount: 3,
            wallLimit: 4000,
            permanentFurniVariables: 4,
            permanentFurniVariablesLimit: 23,
            permanentUserVariables: 50,
            permanentUserVariablesLimit: 93,
            permanentGlobalVariables: 60,
            permanentGlobalVariablesLimit: 70
        });

        parser.flush();

        expect(parser.roomStats).toBeNull();
    });
});
