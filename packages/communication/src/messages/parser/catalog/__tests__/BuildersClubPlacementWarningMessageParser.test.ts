import { BinaryReader } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { BuildersClubPlaceRoomItemMessageComposer, BuildersClubPlaceWallItemMessageComposer } from '../../../outgoing';
import { BuildersClubPlacementWarningMessageParser } from '../BuildersClubPlacementWarningMessageParser';

class PacketWriter
{
    private readonly _bytes: number[] = [];

    public int(value: number): this
    {
        this._bytes.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);

        return this;
    }

    public string(value: string): this
    {
        const encoded = new TextEncoder().encode(value);

        this._bytes.push((encoded.length >>> 8) & 0xff, encoded.length & 0xff, ...encoded);

        return this;
    }

    public wrapper(): EvaWireDataWrapper
    {
        return new EvaWireDataWrapper(0, new BinaryReader(Uint8Array.from(this._bytes).buffer));
    }
}

describe('BuildersClubPlacementWarningMessageParser', () =>
{
    it('reads a floor warning with its position and direction', () =>
    {
        const parser = new BuildersClubPlacementWarningMessageParser();

        parser.flush();
        expect(parser.parse(new PacketWriter().int(0).int(12).int(345).string('').int(4).int(7).int(2).wrapper())).toBe(true);

        expect(parser.typeCode).toBe(BuildersClubPlacementWarningMessageParser.TYPE_FLOOR);
        expect([ parser.pageId, parser.offerId, parser.extraParam ]).toEqual([ 12, 345, '' ]);
        expect([ parser.x, parser.y, parser.direction ]).toEqual([ 4, 7, 2 ]);
    });

    it('reads a wall warning with its wall location', () =>
    {
        const parser = new BuildersClubPlacementWarningMessageParser();

        parser.flush();
        parser.parse(new PacketWriter().int(1).int(-1).int(99).string('255,0,0').string(':w=1,2 l=3,4 r').wrapper());

        expect(parser.typeCode).toBe(BuildersClubPlacementWarningMessageParser.TYPE_WALL);
        expect([ parser.pageId, parser.offerId, parser.extraParam ]).toEqual([ -1, 99, '255,0,0' ]);
        expect(parser.wallLocation).toBe(':w=1,2 l=3,4 r');
    });
});

describe('Builders Club place composers', () =>
{
    it('send the trailing confirmed flag, false unless the warning was confirmed', () =>
    {
        expect(new BuildersClubPlaceRoomItemMessageComposer(1, 2, '', 3, 4, 6).getMessageArray()).toEqual([ 1, 2, '', 3, 4, 6, false ]);
        expect(new BuildersClubPlaceRoomItemMessageComposer(1, 2, '', 3, 4, 6, true).getMessageArray()).toEqual([ 1, 2, '', 3, 4, 6, true ]);
        expect(new BuildersClubPlaceWallItemMessageComposer(1, 2, '', ':w=1,2 l=3,4 r', true).getMessageArray()).toEqual([ 1, 2, '', ':w=1,2 l=3,4 r', true ]);
    });
});
