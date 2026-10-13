import { describe, expect, it } from 'vitest';
import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { ConfirmBreedingRequestParser } from './ConfirmBreedingRequestParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(634, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

const writeString = (writer: BinaryWriter, value: string) => writer.writeString(value);

const writePet = (writer: BinaryWriter, id: number, name: string) =>
{
    writer.writeInt(id);
    writeString(writer, name);
    writer.writeInt(7);
    writeString(writer, '1 0 ffffff');
    writeString(writer, 'owner');
};

describe('ConfirmBreedingRequestParser', () =>
{
    it('can be flushed before its first parse (the codec always does this)', () =>
    {
        expect(() => new ConfirmBreedingRequestParser().flush()).not.toThrow();
    });

    it('reads both pets, the rarity rows and the result type', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(55);
        writePet(writer, 1, 'Rex');
        writePet(writer, 2, 'Bella');
        writer.writeInt(2);
        writer.writeInt(80).writeInt(2).writeInt(1).writeInt(2);
        writer.writeInt(20).writeInt(1).writeInt(9);
        writer.writeInt(3);

        const parser = new ConfirmBreedingRequestParser();

        parser.flush();

        expect(parser.parse(wrapperOf(writer))).toBe(true);
        expect(parser.nestId).toBe(55);
        expect(parser.pet1.name).toBe('Rex');
        expect(parser.pet2.webId).toBe(2);
        expect(parser.rarityCategories.map((category) => category.chance)).toEqual([80, 20]);
        expect(parser.rarityCategories[1].breeds).toEqual([9]);
        expect(parser.resultPetType).toBe(3);

        parser.flush();
        expect(parser.rarityCategories).toEqual([]);
    });
});
