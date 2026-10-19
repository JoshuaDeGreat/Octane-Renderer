/**
 * One drawn bitmap of a wired variable fx (AIR's VariableFxVisualizer frame). The stack draws it with
 * its centre on the holder's axis, moved by the anchor, and its bottom on the fx's place in the pile.
 */
export interface IRoomObjectVariableFxFrame
{
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly anchorX: number;
    readonly anchorY: number;
    /** Changes whenever the bitmap was redrawn, so the stack knows to compose again. */
    readonly updateId: number;
}

/** Paints one fx; the client owns the drawing, the room object visualization asks it for frames. */
export interface IRoomObjectVariableFxVisualizer
{
    readonly frame: IRoomObjectVariableFxFrame;
    /** Whether `update` would draw a different frame at `now` (a value still animating, no frame yet). */
    needsUpdate(now: number): boolean;
    /** Draws the frame for `now`; true when it changed. */
    update(now: number): boolean;
}

/**
 * One fx in a holder's stack (AIR's VariableFxStackAddition). The stack sorts by `layer`, then
 * `createdAt`, `configId` and `variableId`; the first sits lowest. `visible` false fades the fx out
 * but keeps it (AIR's invisible status); an entry that is no longer sent fades out and leaves.
 */
export interface IRoomObjectVariableFxEntry
{
    readonly key: string;
    readonly layer: number;
    readonly createdAt: number;
    readonly configId: number;
    readonly variableId: string;
    readonly visible: boolean;
    readonly visualizer: IRoomObjectVariableFxVisualizer;
}
