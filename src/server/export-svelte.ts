import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises'
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

export async function exportPortableSvelteBundle(options: {
  settingsPath: string
  videoPath: string
  outDir: string
  runtimeDir?: string
  componentName?: string
  componentFileName?: string
  settingsFileName?: string
  videoFileName?: string
}): Promise<void> {
  const settings = await readSettingsFile(options.settingsPath)
  const outDir = resolve(options.outDir)
  const runtimeDir = resolve(options.runtimeDir ?? 'dist/lib')
  const componentName = options.componentName ?? 'PretextVideoSection'
  const componentFileName = options.componentFileName ?? `${componentName}.svelte`
  const settingsFileName = options.settingsFileName ?? 'settings.json'
  const videoFileName = options.videoFileName ?? 'coding.mp4'
  const portableRuntimeDir = resolve(outDir, 'runtime')

  const portableSettings: PretextVideoSettings = {
    ...settings,
    videoSrc: '',
  }

  await mkdir(outDir, { recursive: true })
  await mkdir(portableRuntimeDir, { recursive: true })
  await copyFile(resolve(options.videoPath), resolve(outDir, videoFileName))
  await writeFile(resolve(outDir, settingsFileName), `${JSON.stringify(portableSettings, null, 2)}\n`, 'utf8')
  await copyPortableRuntime(runtimeDir, portableRuntimeDir)
  await writeFile(
    resolve(outDir, componentFileName),
    createPortableSvelteComponentSource({
      componentName,
      settingsImportPath: `./${settingsFileName}`,
      videoImportPath: `./${videoFileName}`,
      runtimeImportPath: './runtime/index.js',
    }),
    'utf8',
  )
}

export function createPortableSvelteComponentSource(options: {
  componentName?: string
  settingsImportPath?: string
  videoImportPath?: string
  runtimeImportPath?: string
}): string {
  const componentName = options.componentName ?? 'PretextVideoSection'
  const settingsImportPath = options.settingsImportPath ?? './settings.json'
  const videoImportPath = options.videoImportPath ?? './video.mp4'
  const runtimeImportPath = options.runtimeImportPath ?? './runtime/index.js'

  return `<script lang="ts">
  import { onMount } from 'svelte'
  import settings from '${settingsImportPath}'
  import videoSrc from '${videoImportPath}'
  import { mount } from '${runtimeImportPath}'

  export let className = ''
  export let autoplay = true
  export let muted = true
  export let loop = true

  let container: HTMLDivElement
  let handle: { destroy(): void } | null = null

  onMount(() => {
    let active = true

    void mount(container, {
      ...settings,
      videoSrc,
      className,
      autoplay,
      muted,
      loop,
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

<div bind:this={container} class={className} data-component="${componentName}" style="width: 100%; height: 100%;"></div>`
}

async function copyPortableRuntime(sourceDir: string, destinationDir: string): Promise<void> {
  const entries = await readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (entry.name === 'server.js') continue
    await copyFile(resolve(sourceDir, entry.name), resolve(destinationDir, entry.name))
  }
}
