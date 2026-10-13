import { describe, expect, it, vi } from 'vitest';
import { AssetManager } from './AssetManager';

const BUNDLE_URL = 'https://cdn.example/chair.nitro';

const createResource = () => ({ texture: { label: '' }, format: 'png' as const, animated: false, dispose: vi.fn() });

const createManager = (fetch: (url: string) => Promise<unknown>) =>
{
    const dependencies = {
        fetch: fetch as (url: string) => Promise<Response>,
        wait: vi.fn().mockResolvedValue(undefined),
        parseAssetData: vi.fn(),
        loadImageResource: vi.fn().mockResolvedValue(createResource()),
        loadOctaneBundle: vi.fn().mockImplementation(async (_buffer, decodeTexture) => ({
            texture: await decodeTexture(new ArrayBuffer(8), 'chair.png'),
            jsonFile: { name: 'chair' }
        }))
    };
    const manager = new AssetManager(dependencies);

    vi.spyOn(manager as unknown as { processAsset(texture: unknown, data: unknown): Promise<unknown> }, 'processAsset').mockResolvedValue(null);

    return { manager, dependencies };
};

const ok = () => ({ ok: true, status: 200, arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)) });

describe('AssetManager downloads', () =>
{
    it('retries a server error and a dropped connection', async () =>
    {
        const fetch = vi.fn()
            .mockResolvedValueOnce({ ok: false, status: 503 })
            .mockRejectedValueOnce(new Error('connection reset'))
            .mockResolvedValueOnce(ok());
        const { manager, dependencies } = createManager(fetch);

        await expect(manager.downloadAsset(BUNDLE_URL)).resolves.toBe(true);

        expect(fetch).toHaveBeenCalledTimes(3);
        expect(dependencies.wait).toHaveBeenCalledTimes(2);
    });

    it('does not retry a missing file', async () =>
    {
        const fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
        const { manager } = createManager(fetch);

        await expect(manager.downloadAsset(BUNDLE_URL)).rejects.toThrow(/HTTP 404/);

        expect(fetch).toHaveBeenCalledOnce();
    });

    it('gives up after the last retry', async () =>
    {
        const fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
        const { manager } = createManager(fetch);

        await expect(manager.downloadAsset(BUNDLE_URL)).rejects.toThrow(/HTTP 500/);

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('shares one download between callers of the same url, and allows a new one afterwards', async () =>
    {
        const fetch = vi.fn().mockResolvedValue(ok());
        const { manager } = createManager(fetch);

        const first = manager.downloadAsset(BUNDLE_URL);
        const second = manager.downloadAsset(BUNDLE_URL);

        expect(second).toBe(first);
        await Promise.all([ first, second ]);
        expect(fetch).toHaveBeenCalledOnce();

        await manager.downloadAsset(BUNDLE_URL);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});
