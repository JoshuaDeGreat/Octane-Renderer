import { IRoomObjectVariableFxFrame, IRoomObjectVariableFxVisualizer } from '@octane/api';
import { IVariableFxAssetProvider, VariableFxAssetLibrary } from './rendering/VariableFxAssetProvider';
import { IVariableFxRenderer, IVariableFxWireConfig, IVariableFxWireStatus, VariableFxConfig, VariableFxRendererContext, VariableFxStatusData } from './VariableFxConfig';
import { VariableFxRendererRegistry } from './VariableFxRendererRegistry';

/**
 * Paints one fx value with AIR's painter for its renderer (VariableFxVisualizer): it resolves the
 * range (the status's override min / max, the config's otherwise), the progress on it, and hands
 * both to the renderer the registry picks. The holder's stack asks it for frames. When the fx
 * assets are not loaded yet it tries again a little later instead of failing.
 */
export class VariableFxVisualizer implements IRoomObjectVariableFxVisualizer
{
    public static RETRY_DELAY_MS: number = 500;

    private _renderer: IVariableFxRenderer = null;
    private _frame: IRoomObjectVariableFxFrame = null;
    private _frameUpdateId: number = -1;
    private _frameBitmap: unknown = null;
    private _retryAt: number = 0;
    private _failed: boolean = false;
    private _pendingData: boolean = false;

    constructor(
        private _config: VariableFxConfig,
        private _status: VariableFxStatusData,
        now: number,
        private readonly _assets: IVariableFxAssetProvider = VariableFxAssetLibrary.getInstance(),
        private readonly _registry: VariableFxRendererRegistry = VariableFxRendererRegistry.getDefault())
    {
        this.createRenderer(now);
    }

    /** A visualizer for a config and value as the server sent them. */
    public static fromWire(config: IVariableFxWireConfig, status: IVariableFxWireStatus, now: number, initialize: boolean = !!status?.initialize): VariableFxVisualizer
    {
        return new VariableFxVisualizer(VariableFxConfig.forWire(config), VariableFxStatusData.fromWire(status, initialize), now);
    }

    public get config(): VariableFxConfig
    {
        return this._config;
    }

    public get renderer(): IVariableFxRenderer
    {
        return this._renderer;
    }

    public get frame(): IRoomObjectVariableFxFrame
    {
        const frame = this._renderer?.frame;

        if(!frame || !frame.bitmap || !frame.bitmap.source) return null;

        if(!this._frame || (this._frameUpdateId !== frame.updateId) || (this._frameBitmap !== frame.bitmap))
        {
            this._frame = { source: frame.bitmap.source, width: frame.width, height: frame.height, anchorX: frame.anchorX, anchorY: frame.anchorY, updateId: frame.updateId };
            this._frameUpdateId = frame.updateId;
            this._frameBitmap = frame.bitmap;
        }

        return this._frame;
    }

    /** A new value for the same config; an "initialize" value is drawn without animating. */
    public updateData(status: VariableFxStatusData, now: number): void
    {
        this._status = status;

        if(!this._renderer)
        {
            this._pendingData = true;

            return;
        }

        this._renderer.updateData(this.createContext(), now);
    }

    public needsUpdate(now: number): boolean
    {
        if(!this._renderer) return (!this._failed && (now >= this._retryAt));

        return (this._renderer.needsUpdate(now) || this._renderer.isContinuous);
    }

    public update(now: number): boolean
    {
        if(!this._renderer)
        {
            if(this._failed || (now < this._retryAt) || !this.createRenderer(now)) return false;
        }
        else if(this._pendingData)
        {
            this._renderer.updateData(this.createContext(), now);
        }

        this._pendingData = false;

        return this._renderer.update(now);
    }

    public dispose(): void
    {
        this._renderer?.dispose();
        this._renderer = null;
        this._frame = null;
    }

    /** The range and progress the renderer draws: AIR clamps the progress to 0..1 and draws 0 on an empty range. */
    public createContext(): VariableFxRendererContext
    {
        const overrideMin = this._status.effectiveOverrideMinValue;
        const overrideMax = this._status.effectiveOverrideMaxValue;
        const min = ((overrideMin === null) ? this._config.minValue : overrideMin);
        const max = ((overrideMax === null) ? this._config.maxValue : overrideMax);

        return new VariableFxRendererContext(this._assets, this._config, this._status, min, max, VariableFxVisualizer.calculateProgress(this._status.value, min, max), this._registry);
    }

    public static calculateProgress(value: number, min: number, max: number): number
    {
        if(!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || (max === min)) return 0;

        return Math.max(0, Math.min(1, ((value - min) / (max - min))));
    }

    private createRenderer(now: number): boolean
    {
        const create = (((this._config.rendererId >= 0) ? this._registry.resolveById(this._config.rendererId) : null) ?? this._registry.resolve(this._config.category, this._config.renderer));

        if(!create)
        {
            // An id the client has no painter for never gets one.
            this._failed = true;

            return false;
        }

        try
        {
            const context = this.createContext();
            const renderer = create(context);

            renderer.updateData(context, now);

            this._renderer = renderer;
            this._pendingData = false;

            return true;
        }
        catch (error)
        {
            // The fx assets are loaded with the room's libraries; until then a painter cannot find its layers.
            this._retryAt = (now + VariableFxVisualizer.RETRY_DELAY_MS);

            return false;
        }
    }
}
