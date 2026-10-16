import { BinaryReader } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { ConditionDefinition } from './ConditionDefinition';
import { TriggerDefinition } from './TriggerDefinition';
import { WiredAddonDefinition } from './WiredAddonDefinition';
import { WiredActionDefinition } from './WiredActionDefinition';

// Framed bytes the server's WiredPacketGoldenCompatibilityTest pins (outgoing-packets-v1.txt), so the
// renderer reads exactly what the emulator writes: the official AIR definition layout.
const GOLDEN = {
    trigger: '00000057017f00000005000000010a0b0c0d000000000000002a0102030400057769726564000000020000000100000002000000000000000000000000000000030000000000000000000000000000000000000000000000000000',
    action: '0000005b059a00000005000000010a0b0c0d000000000000002a010203040005776972656400000002000000010000000200000000000000000000000000000003000000040000000000000000000000000000000000000000000000000000',
    condition: '0000005d045400000005000000010a0b0c0d000000000000002a0102030400057769726564000000020000000100000002000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000',
    addon: '00000057087800000005000000010a0b0c0d000000000000002a0102030400057769726564000000020000000100000002000000000000000000000000000000110000000000000000000000000000000000000000000000000000'
};

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

const body = (hex: string) =>
{
    const bytes = new Uint8Array(hex.match(/../g).map(pair => parseInt(pair, 16))).slice(6);
    const reader = new BinaryReader(bytes.buffer);

    return { wrapper: new TestWrapper(reader) as any, reader };
};

describe('official wired definition layout', () =>
{
    it.each([
        [ 'trigger', (w: any) => new TriggerDefinition(w) ],
        [ 'action', (w: any) => new WiredActionDefinition(w) ],
        [ 'condition', (w: any) => new ConditionDefinition(w) ],
        [ 'addon', (w: any) => new WiredAddonDefinition(w) ]
    ] as const)('reads the %s the emulator sends, to the last byte', (holder, read) =>
    {
        const { wrapper, reader } = body(GOLDEN[holder]);
        const definition = read(wrapper);

        expect(definition.maximumItemSelectionCount).toBe(5);
        expect(definition.selectedItems).toEqual([ 0x0a0b0c0d ]);
        expect(definition.selectedItems2).toEqual([]);
        expect(definition.spriteId).toBe(42);
        expect(definition.id).toBe(0x01020304);
        expect(definition.stringData).toBe('wired');
        expect(definition.intData).toEqual([ 1, 2 ]);
        expect(definition.variableIds).toEqual([]);
        // The addon goes out with its official code (execute in order, 17).
        expect(definition.code).toBe(holder === 'addon' ? 17 : 3);
        expect(definition.delayInPulses).toBe(holder === 'action' ? 4 : 0);
        expect(definition.contexts).toEqual([]);
        expect(definition.defaultIntParams).toEqual([]);
        expect(reader.remaining()).toBe(0);
    });
});
