import type { PretextVideoSettings } from '../core/types';
export declare function readSettingsFile(filePath: string): Promise<PretextVideoSettings>;
export declare function writeSettingsFile(filePath: string, settings: Partial<PretextVideoSettings>): Promise<void>;
