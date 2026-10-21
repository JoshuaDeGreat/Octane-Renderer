import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { MarketplaceItemStatsParser } from '../MarketplaceItemStatsParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readInt()
    {
        return this.reader.readInt();
    }
    get bytesAvailable()
    {
        return this.reader.remaining() > 0;
    }
}

const writeStats = (writer: BinaryWriter): BinaryWriter =>
{
    writer.writeInt(120);
    writer.writeInt(4);
    writer.writeInt(30);
    writer.writeInt(2);
    writer.writeInt(-3);
    writer.writeInt(110);
    writer.writeInt(5);
    writer.writeInt(-1);
    writer.writeInt(130);
    writer.writeInt(2);
    writer.writeInt(2);
    writer.writeInt(4021);

    return writer;
};

describe('MarketplaceItemStatsParser', () =>
{
    it('reads the AIR layout: summary, history rows, category and sprite id', () =>
    {
        const parser = new MarketplaceItemStatsParser();
        parser.flush();

        expect(parser.parse(new TestWrapper(new BinaryReader(writeStats(new BinaryWriter()).getBuffer())) as any)).toBe(true);
        expect(parser.averagePrice).toBe(120);
        expect(parser.offerCount).toBe(4);
        expect(parser.historyLength).toBe(30);
        expect(parser.dayOffsets).toEqual([-3, -1]);
        expect(parser.averagePrices).toEqual([110, 130]);
        expect(parser.soldAmounts).toEqual([5, 2]);
        expect(parser.furniCategoryId).toBe(2);
        expect(parser.furniTypeId).toBe(4021);
        expect(parser.lowestCurrentPrice).toBe(0);
        expect(parser.suggestedPrice).toBe(0);
    });

    it('reads the trailing lowest and suggested prices when the server sends them', () =>
    {
        const writer = writeStats(new BinaryWriter());
        writer.writeInt(99);
        writer.writeInt(115);

        const parser = new MarketplaceItemStatsParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any);

        expect(parser.lowestCurrentPrice).toBe(99);
        expect(parser.suggestedPrice).toBe(115);
    });
});
