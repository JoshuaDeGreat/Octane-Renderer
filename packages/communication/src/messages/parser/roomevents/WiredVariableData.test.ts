import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { parseWiredVariableData } from './WiredVariableData';

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

/** The official WiredVariable block: id, type, name, availability, target, nine flags, then the text connector. */
const variable = (flags: boolean[], connector?: { entries: [number, string][]; fallback?: string }) =>
{
    const writer = new BinaryWriter();
    writer.writeString('furni:9');
    writer.writeInt(2);
    writer.writeString('target');
    writer.writeInt(0);
    writer.writeInt(2);
    for(const flag of flags) writer.writeByte(flag ? 1 : 0);
    writer.writeByte(connector ? 1 : 0);
    if(connector)
    {
        writer.writeInt(connector.entries.length);
        for(const [ key, value ] of connector.entries)
        {
            writer.writeInt(key);
            writer.writeString(value);
        }
        writer.writeByte(connector.fallback !== undefined ? 1 : 0);
        if(connector.fallback !== undefined) writer.writeString(connector.fallback);
    }
    writer.writeInt(12345);

    return writer;
};

describe('parseWiredVariableData', () =>
{
    it('reads requiresExecutionContext between isInvisible and canReadCreationTime, as AIR does', () =>
    {
        const reader = wrapper(variable([ true, true, true, true, false, false, true, false, true ]));
        const data = parseWiredVariableData(reader);

        expect(data.variableId).toBe('furni:9');
        expect(data.isInvisible).toBe(false);
        expect(data.requiresExecutionContext).toBe(true);
        expect(data.canReadCreationTime).toBe(false);
        expect(data.canReadLastUpdateTime).toBe(true);
        expect(data.textConnector).toBeNull();
        expect(data.textConnectorFallback).toBeNull();
        expect(reader.readInt()).toBe(12345);
    });

    it('reads the text connector table and its fallback text', () =>
    {
        const reader = wrapper(variable(new Array(9).fill(false), { entries: [ [ 1, 'Sword' ] ], fallback: 'Fists' }));
        const data = parseWiredVariableData(reader);

        expect(data.textConnector).toEqual([ { key: 1, value: 'Sword' } ]);
        expect(data.textConnectorFallback).toBe('Fists');
        expect(reader.readInt()).toBe(12345);
    });

    it('reads a table without a fallback', () =>
    {
        const reader = wrapper(variable(new Array(9).fill(false), { entries: [] }));
        const data = parseWiredVariableData(reader);

        expect(data.textConnector).toEqual([]);
        expect(data.textConnectorFallback).toBeNull();
        expect(reader.readInt()).toBe(12345);
    });
});
