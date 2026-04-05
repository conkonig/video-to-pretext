import { type PretextVideoPlayer } from './player';
import type { PretextVideoMountOptions } from '../core/types';
export type PretextVideoHandle = {
    update(next: PretextVideoMountOptions): Promise<void>;
    destroy(): void;
    play(): Promise<void>;
    pause(): void;
    readonly player: PretextVideoPlayer;
};
export declare function mount(container: HTMLElement, options?: PretextVideoMountOptions): Promise<PretextVideoHandle>;
