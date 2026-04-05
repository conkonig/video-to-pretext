import type { PretextVideoSettings } from '../core/types';
export declare function exportSvelteComponent(options: {
    settingsPath: string;
    outFile: string;
    componentName?: string;
}): Promise<void>;
export declare function createSvelteComponentSource(settings: PretextVideoSettings, componentName?: string): string;
