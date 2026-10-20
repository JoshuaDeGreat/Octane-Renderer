import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { IncomingHeader } from '../../incoming/IncomingHeader';
import { OutgoingHeader } from '../../outgoing/OutgoingHeader';
import { WiredErrorLogsClearComposer } from '../../outgoing/roomevents/WiredErrorLogsClearComposer';
import { WiredErrorLogsRequestComposer } from '../../outgoing/roomevents/WiredErrorLogsRequestComposer';
import { WiredErrorLogsParser } from './WiredErrorLogsParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
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
}

const writeLong = (writer: BinaryWriter, value: number) =>
{
    const high = Math.floor(value / 0x100000000);

    writer.writeInt(high).writeInt(value - (high * 0x100000000));
};

describe('WiredErrorLogsParser', () =>
{
    it('uses AIR\'s headers: 1132 asks, 1632 clears, 15 answers, the requests have no fields', () =>
    {
        expect(OutgoingHeader.WIRED_ERROR_LOGS_REQUEST).toBe(1132);
        expect(OutgoingHeader.WIRED_ERROR_LOGS_CLEAR).toBe(1632);
        expect(IncomingHeader.WIRED_ERROR_LOGS).toBe(15);
        expect(new WiredErrorLogsRequestComposer().getMessageArray()).toEqual([]);
        expect(new WiredErrorLogsClearComposer().getMessageArray()).toEqual([]);
    });

    it('reads WiredErrorLogs: per row the id, name, category, amount and the ms since the latest (-1 when unused)', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(2);
        writer.writeInt(3).writeString('MARKED_AS_HEAVY').writeString('WARNING').writeInt(4);
        writeLong(writer, 6_000_000_000);
        writer.writeInt(6).writeString('TOO_MANY_VARIABLES').writeString('ERROR').writeInt(0);
        writeLong(writer, -1);

        const data = new TestWrapper(new BinaryReader(writer.getBuffer())) as any;
        const parser = new WiredErrorLogsParser();

        expect(parser.parse(data)).toBe(true);
        expect(parser.errors).toEqual([
            { errorId: 3, errorName: 'MARKED_AS_HEAVY', category: 'WARNING', amount: 4, msSinceLatest: 6_000_000_000 },
            { errorId: 6, errorName: 'TOO_MANY_VARIABLES', category: 'ERROR', amount: 0, msSinceLatest: -1 }
        ]);
        expect(data.bytesAvailable).toBe(false);
        expect(parser.flush()).toBe(true);
        expect(parser.errors).toEqual([]);
    });
});
