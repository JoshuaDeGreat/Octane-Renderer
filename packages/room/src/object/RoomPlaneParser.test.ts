import { IVector3D } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { RoomPlaneParser } from './RoomPlaneParser';

/**
 * The planes the parser builds for a room: floors, walls and landscape. These are pinned as snapshots of the numbers
 * the room drawing reads, so a change in how the parser is organised cannot move a wall or a floor unnoticed.
 */

const round = (value: number) => Math.round(value * 10000) / 10000;

const vector = (value: IVector3D | null) => (value ? [ round(value.x), round(value.y), round(value.z) ] : null);

const BLOCKED = 'x';

const build = (rows: string[], options: { wallHeight?: number; holes?: [number, number, number, number, boolean?][] } = {}) =>
{
    const parser = new RoomPlaneParser();

    parser.initializeTileMap(rows[0].length, rows.length);

    rows.forEach((row, y) => [ ...row ].forEach((cell, x) =>
    {
        if(cell === BLOCKED) return;

        parser.setTileHeight(x, y, parseInt(cell, 36));
    }));

    (options.holes ?? []).forEach(([ x, y, width, height, invert ], index) => parser.addFloorHole(index + 1, x, y, width, height, !!invert));

    const initialized = parser.initializeFromTileData(options.wallHeight ?? -1);

    return { parser, initialized };
};

const describePlanes = (parser: RoomPlaneParser) =>
{
    const planes = [];

    for(let index = 0; index < parser.planeCount; index++)
    {
        const masks = [];

        for(let mask = 0; mask < parser.getPlaneMaskCount(index); mask++)
        {
            masks.push([
                parser.getPlaneMaskLeftSideLoc(index, mask),
                parser.getPlaneMaskRightSideLoc(index, mask),
                parser.getPlaneMaskLeftSideLength(index, mask),
                parser.getPlaneMaskRightSideLength(index, mask)
            ].map(round));
        }

        planes.push(JSON.stringify({
            type: parser.getPlaneType(index),
            location: vector(parser.getPlaneLocation(index)),
            normal: vector(parser.getPlaneNormal(index)),
            leftSide: vector(parser.getPlaneLeftSide(index)),
            rightSide: vector(parser.getPlaneRightSide(index)),
            normalDirection: vector(parser.getPlaneNormalDirection(index)),
            secondaryNormals: parser.getPlaneSecondaryNormals(index).map(vector),
            temporaryHighlighter: parser.isPlaneTemporaryHighlighter(index),
            masks
        }));
    }

    const tiles = [];

    for(let y = 0; y < parser.tileMapHeight; y++)
    {
        const row = [];

        for(let x = 0; x < parser.tileMapWidth; x++) row.push(round(parser.getTileHeight(x, y)));

        tiles.push(row.join(' '));
    }

    return {
        planeCount: parser.planeCount,
        bounds: [ parser.minX, parser.maxX, parser.minY, parser.maxY ],
        size: [ parser.tileMapWidth, parser.tileMapHeight ],
        wallHeight: round(parser.wallHeight),
        floorHeight: round(parser.floorHeight),
        tiles,
        planes
    };
};

describe('RoomPlaneParser', () =>
{
    it('builds the floor and the walls of a flat room', () =>
    {
        const { parser, initialized } = build([
            'xxxxxx',
            'x0000x',
            'x0000x',
            'x0000x',
            'xxxxxx'
        ]);

        expect(initialized).toBe(true);
        expect(describePlanes(parser)).toMatchSnapshot();
    });

    it('builds the planes of a room with a staircase', () =>
    {
        const { parser, initialized } = build([
            'xxxxxxx',
            'x01230x',
            'x01230x',
            'x01230x',
            'xxxxxxx'
        ]);

        expect(initialized).toBe(true);
        expect(describePlanes(parser)).toMatchSnapshot();
    });

    it('builds the planes of an L shaped room', () =>
    {
        const { parser, initialized } = build([
            'xxxxxxx',
            'x000xxx',
            'x000xxx',
            'x00000x',
            'x00000x',
            'xxxxxxx'
        ]);

        expect(initialized).toBe(true);
        expect(describePlanes(parser)).toMatchSnapshot();
    });

    it('cuts the floor around a hole and can invert it', () =>
    {
        const withHole = build([
            'xxxxxxx',
            'x00000x',
            'x00000x',
            'x00000x',
            'x00000x',
            'xxxxxxx'
        ], { holes: [ [ 2, 2, 2, 2 ] ] });

        const inverted = build([
            'xxxxxxx',
            'x00000x',
            'x00000x',
            'x00000x',
            'x00000x',
            'xxxxxxx'
        ], { holes: [ [ 2, 2, 2, 2, true ] ] });

        expect(withHole.initialized).toBe(true);
        expect(describePlanes(withHole.parser)).toMatchSnapshot('hole');
        expect(describePlanes(inverted.parser)).toMatchSnapshot('inverted hole');
    });

    it('takes the wall height from the call, and keeps the walls of a raised room above its highest tile', () =>
    {
        const fixed = build([
            'xxxxx',
            'x000x',
            'x000x',
            'xxxxx'
        ], { wallHeight: 5 });

        const raised = build([
            'xxxxx',
            'x022x',
            'x022x',
            'xxxxx'
        ]);

        expect(describePlanes(fixed.parser)).toMatchSnapshot('fixed wall height');
        expect(describePlanes(raised.parser)).toMatchSnapshot('raised room');
    });

    it('reads the height of a tile: the absolute value inside the map, blocked outside it', () =>
    {
        const { parser } = build([
            'xxxx',
            'x00x',
            'xxxx'
        ]);

        expect(parser.getTileHeight(1, 1)).toBe(0);
        // a blocked tile inside the map is stored as -110 and read back as its absolute value
        expect(parser.getTileHeight(0, 0)).toBe(Math.abs(RoomPlaneParser.TILE_BLOCKED));
        expect(parser.getTileHeight(99, 99)).toBe(RoomPlaneParser.TILE_BLOCKED);
        expect(parser.getTileHeight(-1, 0)).toBe(RoomPlaneParser.TILE_BLOCKED);
    });

    it('has no planes and no size after a reset', () =>
    {
        const { parser } = build([
            'xxxx',
            'x00x',
            'xxxx'
        ]);

        expect(parser.planeCount).toBeGreaterThan(0);

        parser.reset();

        expect(parser.planeCount).toBe(0);
        expect(parser.tileMapWidth).toBe(0);
        expect(parser.tileMapHeight).toBe(0);
    });
});
