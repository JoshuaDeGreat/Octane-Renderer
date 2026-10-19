import { Color, ColorSource, Filter, FilterSystem, GlProgram, RenderSurface, Texture } from 'pixi.js';

export interface WiredFilterOptions
{
    lineColor: ColorSource;
    color: ColorSource;
    /** How far the colour pulls the furni towards it (0 keeps the furni's own colours). */
    mix?: number;
    /** Whether black outline pixels take the line colour. */
    replaceLine?: boolean;
    /** Applied last, per channel: colour * scale + offset (offset 0..1), as a Flash ColorMatrixFilter does. */
    scale?: [number, number, number];
    offset?: [number, number, number];
    alpha?: number;
}

export class WiredFilter extends Filter
{
    public static readonly DEFAULT_OPTIONS: WiredFilterOptions = {
        lineColor: 0x000000,
        color: 0x000000,
        mix: 0.28,
        replaceLine: true,
        scale: [ 1, 1, 1 ],
        offset: [ 0, 0, 0 ],
        alpha: 1,
    };

    // uMix, uReplaceLine, uScale, uOffset and uAlpha are set once, when the filter is made; only the
    // two colours change afterwards (WiredHighlightCache redraws when they do).
    public uniforms: {
        uLineColor: Float32Array,
        uColor: Float32Array,
        uMix: number,
        uReplaceLine: number,
        uScale: Float32Array,
        uOffset: Float32Array,
        uAlpha: number
    };

    private _lineColor!: Color;
    private _color!: Color;

    constructor(options: WiredFilterOptions)
    {
        options = { ...WiredFilter.DEFAULT_OPTIONS, ...options };

        const glProgram = GlProgram.from({
            vertex: `in vec2 aPosition;
            out vec2 vTextureCoord;
            
            uniform vec4 uInputSize;
            uniform vec4 uOutputFrame;
            uniform vec4 uOutputTexture;
            
            vec4 filterVertexPosition( void )
            {
                vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
                
                position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
                position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
            
                return vec4(position, 0.0, 1.0);
            }
            
            vec2 filterTextureCoord( void )
            {
                return aPosition * (uOutputFrame.zw * uInputSize.zw);
            }
            
            void main(void)
            {
                gl_Position = filterVertexPosition();
                vTextureCoord = filterTextureCoord();
            }`,
            fragment: `
            in vec2 vTextureCoord;
            out vec4 finalColor;

            uniform sampler2D uTexture;
            uniform vec3 uLineColor;
            uniform vec3 uColor;
            uniform float uMix;
            uniform float uReplaceLine;
            uniform vec3 uScale;
            uniform vec3 uOffset;
            uniform float uAlpha;

            void main(void) {
                vec4 currentColor = texture(uTexture, vTextureCoord);

                if(currentColor.a <= 0.0) {
                    finalColor = vec4(0.0);
                    return;
                }

                // The texture is premultiplied; the colour work happens on the straight colour.
                vec3 rgb = currentColor.rgb / currentColor.a;

                if(uReplaceLine > 0.5 && currentColor.r == 0.0 && currentColor.g == 0.0 && currentColor.b == 0.0) {
                    rgb = uLineColor;
                } else {
                    rgb = mix(rgb, uColor, uMix);
                }

                rgb = clamp(rgb * uScale + uOffset, 0.0, 1.0);

                float alpha = currentColor.a * uAlpha;

                finalColor = vec4(rgb * alpha, alpha);
            }
            `,
            name: 'wired-filter',
        });

        super({
            gpuProgram: null,
            glProgram,
            resources: {
                planeMaskUniforms: {
                    uLineColor: { value: new Float32Array(3), type: 'vec3<f32>' },
                    uColor: { value: new Float32Array(3), type: 'vec3<f32>' },
                    uMix: { value: options.mix, type: 'f32' },
                    uReplaceLine: { value: options.replaceLine ? 1 : 0, type: 'f32' },
                    uScale: { value: new Float32Array(options.scale), type: 'vec3<f32>' },
                    uOffset: { value: new Float32Array(options.offset), type: 'vec3<f32>' },
                    uAlpha: { value: options.alpha, type: 'f32' }
                },
            },
        });

        this.uniforms = this.resources.planeMaskUniforms.uniforms;

        this._lineColor = new Color();
        this.lineColor = options.lineColor ?? 0x000000;

        this._color = new Color();
        this.color = options.color ?? 0x000000;
    }

    public apply(
        filterManager: FilterSystem,
        input: Texture,
        output: RenderSurface,
        clearMode: boolean,
    ): void
    {

        filterManager.applyFilter(this, input, output, clearMode);
    }

    public get lineColor(): ColorSource
    {
        return this._lineColor.value;
    }

    public set lineColor(value: ColorSource)
    {
        this._lineColor.setValue(value);

        const [r, g, b] = this._lineColor.toArray();

        this.uniforms.uLineColor[0] = r;
        this.uniforms.uLineColor[1] = g;
        this.uniforms.uLineColor[2] = b;
    }

    public get color(): ColorSource
    {
        return this._color.value;
    }

    public set color(value: ColorSource)
    {
        this._color.setValue(value);

        const [r, g, b] = this._color.toArray();

        this.uniforms.uColor[0] = r;
        this.uniforms.uColor[1] = g;
        this.uniforms.uColor[2] = b;
    }
}
