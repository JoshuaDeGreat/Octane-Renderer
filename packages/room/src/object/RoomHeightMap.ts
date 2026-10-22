import { Point } from 'pixi.js';

/** A tile nobody can stand on. */
export const TILE_BLOCKED: number = -110;

/** A tile cut out of the floor. */
export const TILE_HOLE: number = -100;

// The height map of a room, as the parser reads it: rows of tile heights, padded and trimmed around the room.

export function getFloorHeight(matricies: number[][]): number
{
    const length = matricies.length;

    if(!length) return 0;

    let tileHeight = 0;

    let i = 0;

    while(i < length)
    {
        const matrix = matricies[i];

        let j = 0;

        while(j < matrix.length)
        {
            const height = matrix[j];

            if(height > tileHeight) tileHeight = height;

            j++;
        }

        i++;
    }

    return tileHeight;
}

export function findEntranceTile(matricies: number[][]): Point
{
    if(!matricies) return null;

    const length = matricies.length;

    if(!length) return null;

    const entranceColumns: number[] = [];

    let i = 0;

    while(i < length)
    {
        const matrix = matricies[i];

        if(!matrix || !matrix.length) return null;

        let j = 0;

        while(j < matrix.length)
        {
            if(matrix[j] >= 0)
            {
                entranceColumns.push(j);

                break;
            }

            j++;
        }

        if(entranceColumns.length < (i + 1)) entranceColumns.push((matrix.length + 1));

        i++;
    }

    i = 1;

    while(i < (entranceColumns.length - 1))
    {
        if(((Math.trunc(entranceColumns[i]) <= (Math.trunc(entranceColumns[(i - 1)]) - 1)) && (Math.trunc(entranceColumns[i]) <= (Math.trunc(entranceColumns[(i + 1)]) - 1)))) return new Point(Math.trunc((entranceColumns[i]) | 0), i);

        i++;
    }

    return null;
}

export function expandFloorTiles(tiles: number[][]): number[][]
{
    let col: number;
    let row: number;
    let subCol: number;
    let subRow: number;
    let expandedCol: number;
    let value: number;
    let baseHeight: number;
    let cornerA: number;
    let cornerB: number;
    let cornerC: number;
    let cornerD: number;
    let next: number;
    const rows = tiles.length;
    const columns: number = tiles[0].length;
    const expanded: number[][] = [];
    row = 0;
    while(row < (rows * 4))
    {
        expanded[row] = [];
        row++;
    }
    let expandedRow = 0;
    row = 0;
    while(row < rows)
    {
        expandedCol = 0;
        col = 0;
        while(col < columns)
        {
            value = tiles[row][col];
            if(((value < 0) || (value <= 0xFF)))
            {
                subRow = 0;
                while(subRow < 4)
                {
                    subCol = 0;
                    while(subCol < 4)
                    {
                        if(expanded[(expandedRow + subRow)] === undefined) expanded[(expandedRow + subRow)] = [];

                        expanded[(expandedRow + subRow)][(expandedCol + subCol)] = ((value < 0) ? value : (value * 4));
                        subCol++;
                    }
                    subRow++;
                }
            }
            else
            {
                baseHeight = ((value & 0xFF) * 4);
                cornerA = (baseHeight + (((value >> 11) & 0x01) * 3));
                cornerB = (baseHeight + (((value >> 10) & 0x01) * 3));
                cornerC = (baseHeight + (((value >> 9) & 0x01) * 3));
                cornerD = (baseHeight + (((value >> 8) & 0x01) * 3));
                subCol = 0;
                while(subCol < 3)
                {
                    next = (subCol + 1);
                    expanded[expandedRow][(expandedCol + subCol)] = (((cornerA * (3 - subCol)) + (cornerB * subCol)) / 3);
                    expanded[(expandedRow + 3)][(expandedCol + next)] = (((cornerC * (3 - next)) + (cornerD * next)) / 3);
                    expanded[(expandedRow + next)][expandedCol] = (((cornerA * (3 - next)) + (cornerC * next)) / 3);
                    expanded[(expandedRow + subCol)][(expandedCol + 3)] = (((cornerB * (3 - subCol)) + (cornerD * subCol)) / 3);
                    subCol++;
                }
                expanded[(expandedRow + 1)][(expandedCol + 1)] = ((cornerA > baseHeight) ? (baseHeight + 2) : (baseHeight + 1));
                expanded[(expandedRow + 1)][(expandedCol + 2)] = ((cornerB > baseHeight) ? (baseHeight + 2) : (baseHeight + 1));
                expanded[(expandedRow + 2)][(expandedCol + 1)] = ((cornerC > baseHeight) ? (baseHeight + 2) : (baseHeight + 1));
                expanded[(expandedRow + 2)][(expandedCol + 2)] = ((cornerD > baseHeight) ? (baseHeight + 2) : (baseHeight + 1));
            }
            expandedCol = (expandedCol + 4);
            col++;
        }
        expandedRow = (expandedRow + 4);
        row++;
    }
    return expanded;
}

export function addTileTypes(heightMap: number[][]): void
{
    let col: number;
    let value: number;
    let nw: number;
    let n: number;
    let ne: number;
    let w: number;
    let e: number;
    let sw: number;
    let s: number;
    let se: number;
    let higher: number;
    let lower: number;
    let mask: number;
    const maxRow: number = (heightMap.length - 1);
    const maxCol: number = (heightMap[0].length - 1);
    let row = 1;
    while(row < maxRow)
    {
        col = 1;
        while(col < maxCol)
        {
            value = heightMap[row][col];
            if(value < 0)
            {
                //
            }
            else
            {
                nw = (heightMap[(row - 1)][(col - 1)] & 0xFF);
                n = (heightMap[(row - 1)][col] & 0xFF);
                ne = (heightMap[(row - 1)][(col + 1)] & 0xFF);
                w = (heightMap[row][(col - 1)] & 0xFF);
                e = (heightMap[row][(col + 1)] & 0xFF);
                sw = (heightMap[(row + 1)][(col - 1)] & 0xFF);
                s = (heightMap[(row + 1)][col] & 0xFF);
                se = (heightMap[(row + 1)][(col + 1)] & 0xFF);
                higher = (value + 1);
                lower = (value - 1);
                mask = (((((((nw == higher) || (n == higher)) || (w == higher)) ? 8 : 0) | ((((ne == higher) || (n == higher)) || (e == higher)) ? 4 : 0)) | ((((sw == higher) || (s == higher)) || (w == higher)) ? 2 : 0)) | ((((se == higher) || (s == higher)) || (e == higher)) ? 1 : 0));
                if(mask == 15)
                {
                    mask = 0;
                }
                heightMap[row][col] = (value | (mask << 8));
            }
            col++;
        }
        row++;
    }
}

export function unpadHeightMap(heightMap: number[][]): void
{
    heightMap.shift();
    heightMap.pop();

    for(const row of heightMap)
    {
        row.shift();
        row.pop();
    }
}

export function padHeightMap(heightMap: number[][]): void
{
    const topRow: number[] = [];
    const bottomRow: number[] = [];
    for(const row of heightMap)
    {
        row.push(TILE_BLOCKED);
        row.unshift(TILE_BLOCKED);
    }
    for(const column of heightMap[0])
    {
        topRow.push(TILE_BLOCKED);
        bottomRow.push(TILE_BLOCKED);
    }
    heightMap.push(bottomRow);
    heightMap.unshift(topRow);
}
