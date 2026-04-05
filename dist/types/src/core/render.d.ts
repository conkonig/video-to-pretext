import type { PretextVideoSettings, SampledCell } from './types';
export declare function sampleVideoField(args: {
    samplingContext: CanvasRenderingContext2D;
    samplingCanvas: HTMLCanvasElement;
    video: HTMLVideoElement;
    columns: number;
    rows: number;
    stageWidth: number;
    stageHeight: number;
    cellWidth: number;
    cellHeight: number;
    settings: PretextVideoSettings;
}): SampledCell[][];
export declare function drawCharacterField(args: {
    context: CanvasRenderingContext2D;
    grid: string[][];
    field: SampledCell[][];
    stageWidth: number;
    stageHeight: number;
    settings: PretextVideoSettings;
    cellWidth: number;
}): void;
