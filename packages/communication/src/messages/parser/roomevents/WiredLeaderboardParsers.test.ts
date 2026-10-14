import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { WiredActionDefinition } from './WiredActionDefinition';
import { WiredLeaderboardChunkParser } from './WiredLeaderboardChunkParser';
import { WiredLeaderboardSnapshotParser } from './WiredLeaderboardSnapshotParser';

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

const writeLong = (writer: BinaryWriter, value: number) =>
{
    writer.writeInt(Math.floor(value / 4294967296));
    writer.writeInt(value % 4294967296 | 0);
};

describe('WiredLeaderboardSnapshotParser', () =>
{
    it('reads every panel in the official field order', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(1);
        writer.writeInt(55); // overlayId
        writer.writeInt(9); // revision
        writer.writeString('Top');
        writer.writeString('Desc');
        writer.writeInt(4);
        writer.writeInt(5);
        writer.writeInt(-3);
        writer.writeInt(20);
        writer.writeInt(1); // sortMode
        writer.writeInt(1);
        writer.writeInt(0);
        writer.writeString('Username');
        writer.writeInt(3);
        writer.writeInt(1);
        writer.writeString('812');
        writer.writeString('Coins');
        writer.writeString('812');
        writer.writeInt(2);

        const parser = new WiredLeaderboardSnapshotParser();

        expect(parser.parse(wrapper(writer))).toBe(true);
        expect(parser.valid).toBe(true);
        expect(parser.descriptors).toEqual([ {
            overlayId: 55, revision: 9, title: 'Top', description: 'Desc', tileX: 4, tileY: 5, offsetX: -3, altitude: 20, sortMode: 1,
            columns: [ { type: 0, label: 'Username', width: 3 } ],
            choices: [ { variableId: '812', displayName: 'Coins' } ],
            defaultVariableId: '812', pageSizeOption: 2
        } ]);
    });

    it('drops a snapshot with more than four panels', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(5);

        const parser = new WiredLeaderboardSnapshotParser();

        parser.parse(wrapper(writer));
        expect(parser.valid).toBe(false);
        expect(parser.descriptors).toEqual([]);
    });
});

describe('WiredLeaderboardChunkParser', () =>
{
    it('reads rows with 64-bit times and optional level and text', () =>
    {
        const created = 1760000000000;
        const writer = new BinaryWriter();

        writer.writeInt(55);
        writer.writeInt(9);
        writer.writeString('812');
        writer.writeInt(1);
        writer.writeInt(51);
        writer.writeInt(1);
        writer.writeInt(51);
        writer.writeInt(7);
        writer.writeString('Bob');
        writer.writeString('hd-180-1');
        writer.writeString('300');
        writeLong(writer, created);
        writeLong(writer, created + 1000);
        writer.writeByte(1);
        writer.writeString('4');
        writer.writeByte(0);

        const parser = new WiredLeaderboardChunkParser();

        parser.parse(wrapper(writer));
        expect(parser.overlayId).toBe(55);
        expect(parser.chunkIndex).toBe(1);
        expect(parser.totalCount).toBe(51);
        expect(parser.rows).toEqual([ {
            rank: 51, userId: 7, username: 'Bob', figure: 'hd-180-1', rawValue: '300',
            creationTime: created, lastUpdateTime: created + 1000, level: '4', text: null
        } ]);
    });
});

describe('WiredActionDefinition leaderboard context', () =>
{
    // The official definition layout up to the editor contexts.
    const writeAddon = (writer: BinaryWriter) =>
    {
        writer.writeInt(0); // furni limit
        writer.writeInt(0); // furni picks
        writer.writeInt(0); // second furni picks
        writer.writeInt(4321); // spriteId
        writer.writeInt(99); // id
        writer.writeString('');
        writer.writeInt(0); // int params
        writer.writeInt(0); // variable ids
        writer.writeInt(0); // furni sources
        writer.writeInt(0); // user sources
        writer.writeInt(1005); // code
        writer.writeInt(0); // delay
        writer.writeByte(0); // advanced mode
        writer.writeInt(0); // allowed furni sources
        writer.writeInt(0); // allowed user sources
        writer.writeInt(0); // default furni sources
        writer.writeInt(0); // default user sources
        writer.writeByte(0); // allow wall furni
    };

    it('reads context type 8 after the addon fields', () =>
    {
        const writer = new BinaryWriter();

        writeAddon(writer);
        writer.writeInt(1);
        writer.writeInt(8);
        writer.writeInt(99);
        writer.writeInt(3);
        writer.writeInt(4);
        writer.writeInt(1);
        writer.writeInt(1);
        writer.writeString('812');
        writer.writeString('coins_won');
        writer.writeByte(1);
        writer.writeByte(1);
        writer.writeInt(0);
        writer.writeInt(0); // default int params

        const definition = new WiredActionDefinition(wrapper(writer));

        expect(definition.code).toBe(1005);
        expect(definition.leaderboardContext).toEqual({
            overlayInstanceId: 99, physicalTileX: 3, physicalTileY: 4, totalCandidateCount: 1,
            choices: [ { variableId: '812', technicalName: 'coins_won', persistent: true, hasValue: true, applicableLevelUpCount: 0 } ]
        });
    });

    it('has no context when the box sends none', () =>
    {
        const writer = new BinaryWriter();

        writeAddon(writer);
        writer.writeInt(0); // no contexts
        writer.writeInt(0); // default int params

        expect(new WiredActionDefinition(wrapper(writer)).leaderboardContext).toBeNull();
    });
});
