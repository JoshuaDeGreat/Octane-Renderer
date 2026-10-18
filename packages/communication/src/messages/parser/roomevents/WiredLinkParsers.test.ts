import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { WiredLinkCreateNetworkComposer, WiredLinkGetConnectionsComposer, WiredLinkRenameNetworkComposer, WiredLinkSaveSelectionComposer } from '../../outgoing/roomevents';
import { WiredLinkConfigurationParser } from './WiredLinkConfigurationParser';
import { WiredLinkConnectionsParser } from './WiredLinkConnectionsParser';
import { WiredLinkNetworkInvalidatedParser } from './WiredLinkNetworkInvalidatedParser';
import { WiredLinkOpenParser } from './WiredLinkOpenParser';
import { WiredLinkOperationResultParser } from './WiredLinkOperationResultParser';

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
}

const wrapper = (writer: BinaryWriter) => new TestWrapper(new BinaryReader(writer.getBuffer())) as any;

const writeBoolean = (writer: BinaryWriter, value: boolean) => writer.writeByte(value ? 1 : 0);

const writeNetwork = (writer: BinaryWriter, id: string, name: string, count: number, linked: boolean) =>
{
    writer.writeString(id);
    writer.writeString(name);
    writer.writeInt(count);
    writeBoolean(writer, linked);
};

describe('WIRED Link parsers', () =>
{
    it('reads the open push', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(77);
        const parser = new WiredLinkOpenParser();
        parser.flush();
        parser.parse(wrapper(writer));
        expect(parser.furniId).toBe(77);
    });

    it('reads the configuration in the official field order', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(5);
        writer.writeInt(77);
        writer.writeString('12');
        writeBoolean(writer, true);
        writer.writeInt(2);
        writeNetwork(writer, '12', 'Games', 3, true);
        writeNetwork(writer, '13', 'Lobby', 0, false);

        const parser = new WiredLinkConfigurationParser();
        parser.flush();
        parser.parse(wrapper(writer));

        expect(parser.roomId).toBe(5);
        expect(parser.furniId).toBe(77);
        expect(parser.selectedNetworkId).toBe('12');
        expect(parser.receiveLocal).toBe(true);
        expect(parser.networks).toEqual([
            { id: '12', name: 'Games', connectionCount: 3, linkedInCurrentRoom: true },
            { id: '13', name: 'Lobby', connectionCount: 0, linkedInCurrentRoom: false }
        ]);
    });

    it('reads a save result with its configuration', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(5);
        writer.writeInt(77);
        writer.writeInt(WiredLinkOperationResultParser.OPERATION_SAVE);
        writer.writeInt(0);
        writeBoolean(writer, true);
        writer.writeString('12');
        writeBoolean(writer, false);
        writer.writeString('0');
        writer.writeInt(1);
        writeNetwork(writer, '12', 'Games', 1, true);

        const parser = new WiredLinkOperationResultParser();
        parser.flush();
        parser.parse(wrapper(writer));

        expect(parser.operation).toBe(1);
        expect(parser.resultCode).toBe(0);
        expect(parser.hasConfiguration).toBe(true);
        expect(parser.selectedNetworkId).toBe('12');
        expect(parser.receiveLocal).toBe(false);
        expect(parser.removedNetworkId).toBe('0');
        expect(parser.networks).toHaveLength(1);
    });

    it('reads a failed result without the configuration block', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(5);
        writer.writeInt(77);
        writer.writeInt(WiredLinkOperationResultParser.OPERATION_CREATE);
        writer.writeInt(4);
        writeBoolean(writer, false);
        writer.writeString('0');
        writer.writeInt(0);

        const parser = new WiredLinkOperationResultParser();
        parser.flush();
        parser.parse(wrapper(writer));

        expect(parser.resultCode).toBe(4);
        expect(parser.hasConfiguration).toBe(false);
        expect(parser.selectedNetworkId).toBe('0');
        expect(parser.networks).toEqual([]);
    });

    it('reads the connections and the invalidated push', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(5);
        writer.writeInt(77);
        writer.writeString('12');
        writer.writeInt(1);
        writer.writeInt(9);
        writer.writeString('Arcade');
        writer.writeInt(88);
        writeBoolean(writer, false);
        writeBoolean(writer, true);

        const connections = new WiredLinkConnectionsParser();
        connections.flush();
        connections.parse(wrapper(writer));
        expect(connections.networkId).toBe('12');
        expect(connections.connections).toEqual([ { roomId: 9, roomName: 'Arcade', furniId: 88, isBuildersClub: false, receiveLocal: true } ]);

        const pushed = new BinaryWriter();
        pushed.writeInt(5);
        pushed.writeInt(77);
        pushed.writeString('12');
        const invalidated = new WiredLinkNetworkInvalidatedParser();
        invalidated.flush();
        invalidated.parse(wrapper(pushed));
        expect(invalidated.deletedNetworkId).toBe('12');
    });

    it('composes the requests in the official order', () =>
    {
        expect(new WiredLinkSaveSelectionComposer(77, '12', true).getMessageArray()).toEqual([ 77, '12', true ]);
        expect(new WiredLinkCreateNetworkComposer(77, 'Games').getMessageArray()).toEqual([ 77, 'Games' ]);
        expect(new WiredLinkRenameNetworkComposer(77, '12', 'Arcade').getMessageArray()).toEqual([ 77, '12', 'Arcade' ]);
        expect(new WiredLinkGetConnectionsComposer(77, '12').getMessageArray()).toEqual([ 77, '12' ]);
    });
});
