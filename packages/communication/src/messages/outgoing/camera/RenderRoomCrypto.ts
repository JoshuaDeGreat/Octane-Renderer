// Behaviour from the AIR client: com.sulake.habbo.utils.StringUtil.makeMagicString and
// com.sulake.core.communication.encryption.CryptoTools (stringToByteArray, fletcher100).
// The render room composer builds its JSON keys and its checksum with these.

// The empty entries are in the AIR table too; they decode to nothing and only pad the lookup.
const MAGIC_CHARACTERS: string[] = ['p', 'e', ',', 'i', '"', 'r', '', 'm', 'o', '}', 'n', 'g', '', '{', 'x', 'l', ':', 'q', 'a', 'c', ':', 's', 'o', ' ', '(', '', 'p', 't', 'i', 'v', 'h', 'f', '', ' ', 'c', 'd', '', 'k', ')', 's', 'z', '', 'y', 'w', 'b', '-', 't', 'j', '', 'u', ':', '.', ' ', 'a', '"', '"', 'e', 'm', ' ', ','];

export const makeMagicString = (key: number, ...codes: number[]): string =>
{
    let value = '';

    for(const code of codes) value += (MAGIC_CHARACTERS[code - key] ?? '');

    return value;
};

// AS3 ByteArray.writeByte keeps the low 8 bits of each UTF-16 code unit.
export const stringToByteArray = (value: string): Uint8Array =>
{
    const bytes = new Uint8Array(value.length);

    for(let i = 0; i < value.length; i++) bytes[i] = (value.charCodeAt(i) & 0xFF);

    return bytes;
};

export const fletcher100 = (bytes: Uint8Array, sumA: number, sumB: number): number =>
{
    let a = sumA;
    let b = sumB;

    for(let i = 0; i < bytes.length; i++)
    {
        a = (a + bytes[i]) % 255;
        b = (a + b) % 255;
    }

    return (a + b) % 100;
};
