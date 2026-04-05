import type { PretextVideoSettings } from '../core/types';
export declare function exportSvelteComponent(options: {
    settingsPath: string;
    outFile: string;
    componentName?: string;
}): Promise<void>;
export declare function createSvelteComponentSource(settings: PretextVideoSettings, componentName?: string): string;
export declare function exportPortableSvelteBundle(options: {
    settingsPath: string;
    videoPath: string;
    outDir: string;
    runtimeDir?: string;
    componentName?: string;
    componentFileName?: string;
    settingsFileName?: string;
    videoFileName?: string;
}): Promise<void>;
export declare function createPortableSvelteComponentSource(options: {
    componentName?: string;
    settingsImportPath?: string;
    videoImportPath?: string;
    runtimeImportPath?: string;
}): string;
