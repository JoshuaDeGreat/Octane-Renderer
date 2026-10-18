import { AvatarImageBodyPartContainer } from '../AvatarImageBodyPartContainer';
import { AvatarImagePartContainer } from '../AvatarImagePartContainer';

export class AvatarImageDirectionCache
{
    // Longest key cycle worth remembering; a part list whose frame counts never line up below this
    // builds its key every time, as before.
    private static MAX_KEY_PERIOD: number = 240;

    private _partList: AvatarImagePartContainer[];
    private _images: Map<string, AvatarImageBodyPartContainer>;
    // Every part's key depends only on (frame % its frame count), so the whole key repeats every
    // _keyPeriod frames (the lcm of the counts). Building it concatenated a string per part per call,
    // for every body part of every avatar each animation frame; it is now built once per slot.
    private _keyPeriod: number;
    private _keys: Map<number, string>;

    constructor(parts: AvatarImagePartContainer[])
    {
        this._partList = parts;
        this._images = new Map();
        this._keyPeriod = AvatarImageDirectionCache.getKeyPeriod(parts);
        this._keys = new Map();
    }

    private static getKeyPeriod(parts: AvatarImagePartContainer[]): number
    {
        let period = 1;

        for(const part of parts)
        {
            const count = part.frameCount;

            // No frames: its key is the same for every frame.
            if(count <= 1) continue;

            let a = period;
            let b = count;

            while(b)
            {
                const t = (a % b);

                a = b;
                b = t;
            }

            period = ((period / a) * count);

            if(period > AvatarImageDirectionCache.MAX_KEY_PERIOD) return 0;
        }

        return period;
    }

    public dispose(): void
    {
        if(!this._images) return;

        for(const image of this._images.values()) image && image.dispose();

        this._images = null;
        this._keys.clear();
        this._partList = [];
    }

    public getPartList(): AvatarImagePartContainer[]
    {
        return this._partList;
    }

    public getImageContainer(frameCount: number): AvatarImageBodyPartContainer
    {
        const existing = this._images.get(this.getCacheKey(frameCount));

        if(!existing) return null;

        return existing;
    }

    public updateImageContainer(container: AvatarImageBodyPartContainer, frameCount: number): void
    {
        const name = this.getCacheKey(frameCount);

        const existing = this._images.get(name);

        if(existing) existing.dispose();

        this._images.set(name, container);
    }

    private getCacheKey(frameCount: number): string
    {
        if(!this._keyPeriod) return this.buildCacheKey(frameCount);

        // (k % period) % count === k % count for every part, so the slot's key is k's key.
        const slot = (frameCount % this._keyPeriod);
        const existing = this._keys.get(slot);

        if(existing !== undefined) return existing;

        const key = this.buildCacheKey(frameCount);

        this._keys.set(slot, key);

        return key;
    }

    private buildCacheKey(frameCount: number): string
    {
        let name = '';

        for(const part of this._partList) name += (part.getCacheableKey(frameCount) + '/');

        return name;
    }

    private debugInfo(message: string): void
    {
    }
}
