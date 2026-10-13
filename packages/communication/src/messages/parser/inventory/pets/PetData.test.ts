import { describe, expect, it } from 'vitest';
import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { PetData } from './PetData';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(3522, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

const writePet = (writer: BinaryWriter, id: number, rarity: number) =>
{
    writer.writeInt(id);
    writer.writeString('Plant');
    writer.writeInt(16).writeInt(0);
    writer.writeString('ffffff');
    writer.writeInt(0).writeInt(0);
    writer.writeInt(7);
    writer.writeInt(rarity);
};

describe('PetData', () =>
{
    it('reads the rarity level after the level, pet after pet', () =>
    {
        const writer = new BinaryWriter();

        writePet(writer, 1, 8);
        writePet(writer, 2, -1);

        const wrapper = wrapperOf(writer);
        const first = new PetData(wrapper);
        const second = new PetData(wrapper);

        expect(first.level).toBe(7);
        expect(first.rarityLevel).toBe(8);
        expect(second.id).toBe(2);
        expect(second.rarityLevel).toBe(-1);
    });
});
