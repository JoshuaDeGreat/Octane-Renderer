import { VariableFxBitmap } from './VariableFxBitmap';

/** The bitmap a renderer last drew, with the anchor the stack places it by (AIR's fx frame). */
export class VariableFxFrame
{
    public bitmap: VariableFxBitmap = null;
    public width: number = 0;
    public height: number = 0;
    public anchorX: number = 0;
    public anchorY: number = 0;
    public updateId: number = 0;

    /** Takes a new bitmap of the given size, dropping the old one. */
    public allocate(width: number, height: number): VariableFxBitmap
    {
        this.release();

        this.bitmap = VariableFxBitmap.create(width, height);
        this.width = this.bitmap.width;
        this.height = this.bitmap.height;

        return this.bitmap;
    }

    /** Whether the bitmap is there and has the given size. */
    public fits(width: number, height: number): boolean
    {
        return (!!this.bitmap && (this.width === width) && (this.height === height));
    }

    public release(): void
    {
        if(this.bitmap) this.bitmap.dispose();

        this.bitmap = null;
        this.width = 0;
        this.height = 0;
    }
}
