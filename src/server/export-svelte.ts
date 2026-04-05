import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { PretextVideoSettings } from '../core/types'
import { readSettingsFile } from './settings-file'

export async function exportSvelteComponent(options: {
  settingsPath: string
  outFile: string
  componentName?: string
}): Promise<void> {
  const settings = await readSettingsFile(options.settingsPath)
  const absoluteOutFile = resolve(options.outFile)
  await mkdir(dirname(absoluteOutFile), { recursive: true })
  await writeFile(absoluteOutFile, createSvelteComponentSource(settings, options.componentName), 'utf8')
}

export function createSvelteComponentSource(
  settings: PretextVideoSettings,
  componentName = 'PretextVideoExport',
): string {
  const serializedSettings = JSON.stringify(settings, null, 2)
  return `<script lang="ts">
  import { onMount } from 'svelte'
  import { mount, type PretextVideoHandle, type PretextVideoSettings } from 'video-to-pretext'

  export let videoSrc: string
  export let settings: Partial<PretextVideoSettings> = ${serializedSettings}
  export let className = ''

  let container: HTMLDivElement
  let handle: PretextVideoHandle | null = null

  onMount(() => {
    let active = true

    void mount(container, {
      ...settings,
      videoSrc,
      autoplay: true,
      muted: true,
      className,
    }).then(instance => {
      if (!active) {
        instance.destroy()
        return
      }
      handle = instance
    })

    return () => {
      active = false
      handle?.destroy()
      handle = null
    }
  })
</script>

<div bind:this={container} data-component="${componentName}" />`
}
