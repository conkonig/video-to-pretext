<script lang="ts">
  import defaultSettingsJson from '../settings.json'
  import defaultVideoUrl from '../coding.mp4'
  import { onDestroy } from 'svelte'
  import ControlPanel from './components/ControlPanel.svelte'
  import StagePanel from './components/StagePanel.svelte'
  import { defaultSettings } from './core/defaults'
  import { resolveSettings } from './core/settings'
  import type { PretextVideoSettings } from './core/types'

  type PlayerStatus = {
    currentTime: number
    duration: number
    label: string
    muted: boolean
    paused: boolean
  }

  let stagePanel: StagePanel
  let objectUrls = new Set<string>()
  let statusLine = 'Ready. Tune the preview and export the saved settings when it looks right.'
  let playerStatus: PlayerStatus = {
    currentTime: 0,
    duration: 0,
    label: '00:00 / 00:00',
    muted: true,
    paused: true,
  }

  let settings = resolveSettings({
    ...defaultSettings,
    ...(defaultSettingsJson as Partial<PretextVideoSettings>),
  })

  let videoSrc = (defaultSettingsJson as Partial<PretextVideoSettings>).videoSrc || defaultVideoUrl

  const meta = {
    visibleRows: 0,
    columns: settings.columns,
  }

  $: meta.columns = settings.columns
  $: meta.visibleRows = Math.max(1, Math.floor(getStageHeight() / settings.lineHeight))

  onDestroy(() => {
    for (const objectUrl of objectUrls) URL.revokeObjectURL(objectUrl)
  })

  function handlePlayerStatus(next: PlayerStatus): void {
    playerStatus = next
  }

  async function togglePlayback(): Promise<void> {
    if (stagePanel.getPaused()) await stagePanel.play()
    else stagePanel.pause()
  }

  function toggleMute(): void {
    stagePanel.toggleMute()
  }

  async function handleVideoPick(event: Event): Promise<void> {
    const input = event.currentTarget
    if (!(input instanceof HTMLInputElement)) return
    const file = input.files?.[0]
    if (file === undefined) return
    const objectUrl = URL.createObjectURL(file)
    objectUrls.add(objectUrl)
    videoSrc = objectUrl
    statusLine = `Loaded ${file.name} for preview`
  }

  function updateSettings(next: PretextVideoSettings): void {
    settings = next
  }

  function saveSettings(): void {
    const blob = new Blob(
      [
        `${JSON.stringify(
          {
            ...settings,
            text: settings.text.trim(),
            videoSrc: '',
          },
          null,
          2,
        )}\n`,
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'settings.json'
    link.click()
    URL.revokeObjectURL(url)
    statusLine = 'Saved settings.json for export.'
  }

  async function loadSettings(file: File | undefined): Promise<void> {
    if (file === undefined) return
    const loaded = JSON.parse(await file.text()) as Partial<PretextVideoSettings>
    settings = resolveSettings({
      ...settings,
      ...loaded,
    })
    statusLine = `Loaded settings from ${file.name}`
  }

  async function copyExportSnippet(): Promise<void> {
    const snippet = `<script lang="ts">
  import PretextVideoSection from './PretextVideoSection.svelte'
<\/script>

<div style="height: 100vh;">
  <PretextVideoSection></PretextVideoSection>
</div>`
    await navigator.clipboard.writeText(snippet)
    statusLine = 'Copied Astro/Svelte usage snippet.'
  }

  function resetSettings(): void {
    settings = resolveSettings(defaultSettings)
    videoSrc = defaultVideoUrl
    statusLine = 'Reset to default settings.'
  }

  function getStageHeight(): number {
    if (typeof window === 'undefined') return 420
    return Math.min(window.innerHeight * 0.7, 860)
  }
</script>

<svelte:head>
  <title>Video to PreText</title>
</svelte:head>

<div class="shell">
  <ControlPanel
    {settings}
    playLabel={playerStatus.paused ? 'Play' : 'Pause'}
    muteLabel={playerStatus.muted ? 'Unmute' : 'Mute'}
    onSettingsChange={updateSettings}
    onVideoPick={handleVideoPick}
    onSaveSettings={saveSettings}
    onCopyExport={copyExportSnippet}
    onReset={resetSettings}
    onTogglePlay={togglePlayback}
    onToggleMute={toggleMute}
    onSettingsFileChange={loadSettings}
  ></ControlPanel>

  <StagePanel
    bind:this={stagePanel}
    {settings}
    {videoSrc}
    muted={playerStatus.muted}
    statusLine={statusLine}
    onStatusChange={handlePlayerStatus}
  ></StagePanel>
</div>

<div class="meta-bar">
  <span>{meta.visibleRows} visible rows</span>
  <span>{meta.columns} columns</span>
  <span>{playerStatus.label}</span>
</div>

<style>
  .shell {
    display: grid;
    grid-template-columns: minmax(320px, 390px) minmax(0, 1fr);
    gap: 24px;
    min-height: calc(100vh - 90px);
    padding: 24px 24px 12px;
  }

  .meta-bar {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 0 28px 28px;
    color: #b5b2a2;
    font-size: 0.94rem;
  }

  @media (max-width: 980px) {
    .shell {
      grid-template-columns: 1fr;
    }

    .meta-bar {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 640px) {
    .shell {
      padding: 14px 14px 10px;
    }

    .meta-bar {
      padding: 0 18px 18px;
    }
  }
</style>
