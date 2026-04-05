import type { LayoutSnapshot, PretextVideoSettings } from './types';
export declare function buildLayoutSnapshot(text: string, settings: PretextVideoSettings, stageWidth: number, stageHeight: number): LayoutSnapshot;
export declare function selectVisibleLines(lines: string[], visibleRows: number, currentTime: number, duration: number, scrollEnabled: boolean, scrollSpeed: number): string[];
export declare function buildCharacterGrid(lines: string[], visibleRows: number, columns: number, cellWidth: number, measureText: (value: string) => number): string[][];
