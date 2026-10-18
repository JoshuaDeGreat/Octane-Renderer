// One sprite of the camera scene (AIR com.sulake.room.data.RoomObjectSpriteData).
export class RoomObjectSpriteData
{
    public objectId: number = 0;
    public x: number = 0;
    public y: number = 0;
    public z: number;
    public name: string;
    public blendMode: string;
    public flipH: boolean = false;
    public skew: number;
    public frame: boolean = false;
    public color: string;
    public alpha: number;
    public width: number = 0;
    public height: number = 0;
    public type: string;
    // The room object type (AIR objectType), e.g. boutique_mannequin1.
    public objectType: string;
    public posture: string;
}
