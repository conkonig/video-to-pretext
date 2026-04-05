import type { PretextVideoMountOptions, PretextVideoSettings } from '../core/types';
export type PretextVideoPlayer = {
    mount(): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    update(next: Partial<PretextVideoSettings>): Promise<void>;
    destroy(): void;
    getSettings(): PretextVideoSettings;
    getStatus(): {
        currentTime: number;
        duration: number;
        label: string;
    };
    readonly canvas: HTMLCanvasElement;
    readonly element: HTMLDivElement;
    readonly video: HTMLVideoElement;
};
export declare function createPretextVideoPlayer(container: HTMLElement, options?: PretextVideoMountOptions): PretextVideoPlayer;
