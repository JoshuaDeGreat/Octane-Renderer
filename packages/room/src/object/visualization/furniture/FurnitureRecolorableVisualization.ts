import { RoomObjectVariable } from '@octane/api';
import { FurnitureAnimatedVisualization } from './FurnitureAnimatedVisualization';

/**
 * Habbo's recolourable Builders Club furni (visualization "furniture_recolorable"): one furni per
 * shape whose colour is chosen per item. The colour travels in the furni's data map as decimal "r",
 * "g" and "b" (0-255) and multiplies the layer tagged "recolorable"; without a valid colour the
 * layer stays white, i.e. untinted, as in the official client.
 */
export class FurnitureRecolorableVisualization extends FurnitureAnimatedVisualization
{
    public static readonly RECOLORABLE_TAG: string = 'recolorable';
    public static readonly WHITE: number = 0xFFFFFF;

    private _recolor: number = FurnitureRecolorableVisualization.WHITE;

    /** One colour channel as the official logic reads it: 0-255, anything else is 255. */
    public static readChannel(data: { [index: string]: string }, key: string): number
    {
        const value = data ? data[key] : undefined;

        if((value === undefined) || (value === null) || !/^[0-9]{1,3}$/.test(value)) return 255;

        const channel = parseInt(value, 10);

        return (channel > 255) ? 255 : channel;
    }

    /** The packed 0xRRGGBB colour of a furni data map; white when it has none. */
    public static colorOf(data: { [index: string]: string }): number
    {
        if(!data) return FurnitureRecolorableVisualization.WHITE;

        const read = FurnitureRecolorableVisualization.readChannel;

        return ((read(data, 'r') << 16) | (read(data, 'g') << 8) | read(data, 'b'));
    }

    protected updateModel(scale: number): boolean
    {
        const changed = super.updateModel(scale);
        const data = this.object?.model?.getValue<{ [index: string]: string }>(RoomObjectVariable.FURNITURE_DATA);
        const color = FurnitureRecolorableVisualization.colorOf(data);

        if(color === this._recolor) return changed;

        this._recolor = color;
        // Layer colours are cached per layer; the tinted one has to be worked out again.
        this._spriteColors = [];

        return true;
    }

    protected getLayerColor(scale: number, layerId: number, colorId: number): number
    {
        if(this.getLayerTag(scale, this._direction, layerId) === FurnitureRecolorableVisualization.RECOLORABLE_TAG) return this._recolor;

        return super.getLayerColor(scale, layerId, colorId);
    }
}
