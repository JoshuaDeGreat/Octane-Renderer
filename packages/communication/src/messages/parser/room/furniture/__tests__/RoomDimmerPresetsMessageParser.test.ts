import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../../codec/evawire/EvaWireDataWrapper';
import { RoomDimmerPresetsMessageParser } from '../RoomDimmerPresetsMessageParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(2710, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

const presets = () => new BinaryWriter()
    .writeInt(2).writeInt(2)
    .writeInt(1).writeInt(1).writeString('#74F5F5').writeInt(255)
    .writeInt(2).writeInt(2).writeString('#0053F7').writeInt(200);

describe('RoomDimmerPresetsMessageParser', () =>
{
    it('reads the presets, then whether the dimmer is on and its item id', () =>
    {
        const parser = new RoomDimmerPresetsMessageParser();

        parser.flush();
        expect(parser.parse(wrapperOf(presets().writeByte(1).writeInt(812)))).toBe(true);

        expect(parser.selectedPresetId).toBe(2);
        expect(parser.presetCount).toBe(2);
        expect(parser.getPreset(1).color).toBe(0x0053F7);
        expect(parser.isOn).toBe(true);
        expect(parser.itemId).toBe(812);
    });

    it('defaults the tail when an older server leaves it out', () =>
    {
        const parser = new RoomDimmerPresetsMessageParser();

        parser.flush();
        expect(parser.parse(wrapperOf(presets()))).toBe(true);

        expect(parser.isOn).toBe(false);
        expect(parser.itemId).toBe(0);
    });
});
