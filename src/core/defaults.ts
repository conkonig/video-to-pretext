import defaultSettingsJson from '../../settings.json'
import defaultText from '../../lorem.txt?raw'
import type { PretextVideoSettings } from './types'

export const DEFAULT_FONT_FAMILY = 'Matrix Code NFI'

const baseSettings = defaultSettingsJson as Partial<PretextVideoSettings>

export const defaultSettings: PretextVideoSettings = {
  ...baseSettings,
  text: baseSettings.text || defaultText.trim(),
  videoSrc: baseSettings.videoSrc || '',
  autoplay: baseSettings.autoplay ?? false,
  columns: baseSettings.columns ?? 118,
  fontSize: baseSettings.fontSize ?? 13,
  lineHeight: baseSettings.lineHeight ?? 16,
  textScrollEnabled: baseSettings.textScrollEnabled ?? true,
  textScrollSpeed: baseSettings.textScrollSpeed ?? 1,
  threshold: baseSettings.threshold ?? 0.18,
  contrast: baseSettings.contrast ?? 1.35,
  gamma: baseSettings.gamma ?? 0.9,
  invert: baseSettings.invert ?? false,
  colorMode: baseSettings.colorMode ?? 'video',
  textColor: baseSettings.textColor ?? '#f8f3df',
  backgroundColor: baseSettings.backgroundColor ?? '#101216',
  fontFamily: baseSettings.fontFamily || DEFAULT_FONT_FAMILY,
}
