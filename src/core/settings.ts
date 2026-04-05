import { defaultSettings } from './defaults'
import type { PretextVideoMountOptions, PretextVideoSettings } from './types'

export function resolveSettings(overrides: Partial<PretextVideoSettings> = {}): PretextVideoSettings {
  return {
    ...defaultSettings,
    ...overrides,
    text: (overrides.text ?? defaultSettings.text).trim() || defaultSettings.text,
    videoSrc: overrides.videoSrc ?? defaultSettings.videoSrc,
    fontFamily: overrides.fontFamily ?? defaultSettings.fontFamily,
  }
}

export function settingsFromMountOptions(options: PretextVideoMountOptions = {}): PretextVideoSettings {
  return resolveSettings(options)
}
