import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveSettings } from '../core/settings'
import type { PretextVideoSettings } from '../core/types'

export async function readSettingsFile(filePath: string): Promise<PretextVideoSettings> {
  const absolutePath = resolve(filePath)
  const raw = await readFile(absolutePath, 'utf8')
  return resolveSettings(JSON.parse(raw) as Partial<PretextVideoSettings>)
}

export async function writeSettingsFile(filePath: string, settings: Partial<PretextVideoSettings>): Promise<void> {
  const absolutePath = resolve(filePath)
  const resolvedSettings = resolveSettings(settings)
  await writeFile(absolutePath, `${JSON.stringify(resolvedSettings, null, 2)}\n`, 'utf8')
}
