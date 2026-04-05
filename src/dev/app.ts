import defaultSettingsJson from '../../settings.json'
import defaultVideoUrl from '../../output.mp4'
import { defaultSettings } from '../core/defaults'
import { resolveSettings } from '../core/settings'
import { mount } from '../client'
import type { PretextVideoSettings } from '../core/types'
import './styles.css'

type DevApp = {
  destroy(): void
}

export async function startDevApp(root: HTMLElement): Promise<DevApp> {
  const state: PretextVideoSettings = resolveSettings({
    ...defaultSettings,
    ...(defaultSettingsJson as Partial<PretextVideoSettings>),
    videoSrc: (defaultSettingsJson as Partial<PretextVideoSettings>).videoSrc || defaultVideoUrl,
  })

  root.innerHTML = `
    <div class="shell">
      <aside class="controls">
        <div class="panel-title">
          <p class="eyebrow">PreText Video Surface</p>
          <h1>Tune once, export the playback surface.</h1>
          <p class="lede">This local app stays focused on testing videos and dialing settings. The reusable output ships separately as an embeddable player and Svelte component.</p>
        </div>

        <label class="field">
          <span>Video file</span>
          <input id="video-input" type="file" accept="video/*" />
        </label>

        <div class="media-actions">
          <button id="play-toggle" type="button">Play</button>
          <button id="mute-toggle" type="button">Mute</button>
        </div>

        <div class="settings-actions">
          <button id="save-settings" type="button">Save settings.json</button>
          <button id="load-settings" class="secondary" type="button">Load settings.json</button>
          <input id="load-settings-input" type="file" accept="application/json" hidden />
          <button id="copy-export" type="button">Copy export snippet</button>
          <button id="reset-settings" class="secondary" type="button">Reset defaults</button>
        </div>

        <label class="field grow">
          <span>Script</span>
          <textarea id="script-input" spellcheck="false">${escapeHtml(state.text)}</textarea>
        </label>

        <div class="slider-grid">
          ${renderRangeField('columns', 'Columns', state.columns, 48, 180, 1)}
          ${renderRangeField('font-size', 'Font size', state.fontSize, 9, 22, 1)}
          ${renderRangeField('line-height', 'Line height', state.lineHeight, 11, 28, 1)}
          ${renderRangeField('text-scroll', 'Vertical flow', state.textScrollSpeed, 0, 3, 0.05)}
          ${renderRangeField('threshold', 'Threshold', state.threshold, 0, 0.7, 0.01)}
          ${renderRangeField('contrast', 'Contrast', state.contrast, 0.4, 2.5, 0.01)}
          ${renderRangeField('gamma', 'Gamma', state.gamma, 0.4, 1.8, 0.01)}
        </div>

        <div class="appearance-grid">
          <label class="field">
            <span>Character color</span>
            <select id="color-mode-input">
              <option value="video"${state.colorMode === 'video' ? ' selected' : ''}>Sample from video</option>
              <option value="tint"${state.colorMode === 'tint' ? ' selected' : ''}>Tint all text</option>
            </select>
          </label>

          <label class="field">
            <span>Tint color</span>
            <input id="text-color-input" type="color" value="${state.textColor}" />
          </label>
        </div>

        <label class="check-field">
          <input id="invert-input" type="checkbox"${state.invert ? ' checked' : ''} />
          <span>Invert brightness mapping</span>
        </label>
      </aside>

      <main class="stage-panel">
        <div class="stage-header">
          <div>
            <p class="eyebrow">Embeddable runtime preview</p>
            <h2>The canvas below is the same player API your Astro/Svelte site will mount.</h2>
          </div>
          <p id="status-line" class="status-line">Preparing player.</p>
        </div>

        <div id="stage-frame" class="stage-frame"></div>

        <div class="meta-bar">
          <span id="meta-lines">0 visible rows</span>
          <span id="meta-grid">0 columns</span>
          <span id="meta-time">00:00 / 00:00</span>
        </div>
      </main>
    </div>
  `

  const videoInput = getInput(root, 'video-input')
  const playToggle = getButton(root, 'play-toggle')
  const muteToggle = getButton(root, 'mute-toggle')
  const saveSettingsButton = getButton(root, 'save-settings')
  const loadSettingsButton = getButton(root, 'load-settings')
  const loadSettingsInput = getInput(root, 'load-settings-input')
  const copyExportButton = getButton(root, 'copy-export')
  const resetSettingsButton = getButton(root, 'reset-settings')
  const scriptInput = getTextArea(root, 'script-input')
  const columnsInput = getInput(root, 'columns-input')
  const fontSizeInput = getInput(root, 'font-size-input')
  const lineHeightInput = getInput(root, 'line-height-input')
  const textScrollInput = getInput(root, 'text-scroll-input')
  const thresholdInput = getInput(root, 'threshold-input')
  const contrastInput = getInput(root, 'contrast-input')
  const gammaInput = getInput(root, 'gamma-input')
  const colorModeInput = getSelect(root, 'color-mode-input')
  const textColorInput = getInput(root, 'text-color-input')
  const invertInput = getInput(root, 'invert-input')
  const statusLine = getParagraph(root, 'status-line')
  const stageFrame = getDiv(root, 'stage-frame')
  const metaLines = getSpan(root, 'meta-lines')
  const metaGrid = getSpan(root, 'meta-grid')
  const metaTime = getSpan(root, 'meta-time')

  const player = await mount(stageFrame, {
    ...state,
    autoplay: false,
    muted: true,
  })

  statusLine.textContent = 'Ready. Tune the preview and export the saved settings when it looks right.'
  syncMeta()
  syncOutput('columns', state.columns)
  syncOutput('font-size', state.fontSize)
  syncOutput('line-height', state.lineHeight)
  syncOutput('text-scroll', state.textScrollSpeed.toFixed(2))
  syncOutput('threshold', state.threshold.toFixed(2))
  syncOutput('contrast', state.contrast.toFixed(2))
  syncOutput('gamma', state.gamma.toFixed(2))

  const clockInterval = window.setInterval(() => {
    metaTime.textContent = player.player.getStatus().label
  }, 120)

  const objectUrls = new Set<string>()

  bindRange(columnsInput, 'columns', value => {
    state.columns = Number(value)
    void syncPlayer()
  })
  bindRange(fontSizeInput, 'font-size', value => {
    state.fontSize = Number(value)
    void syncPlayer()
  })
  bindRange(lineHeightInput, 'line-height', value => {
    state.lineHeight = Number(value)
    void syncPlayer()
  })
  bindRange(textScrollInput, 'text-scroll', value => {
    state.textScrollSpeed = Number(value)
    void syncPlayer()
  }, numeric => numeric.toFixed(2))
  bindRange(thresholdInput, 'threshold', value => {
    state.threshold = Number(value)
    void syncPlayer()
  }, numeric => numeric.toFixed(2))
  bindRange(contrastInput, 'contrast', value => {
    state.contrast = Number(value)
    void syncPlayer()
  }, numeric => numeric.toFixed(2))
  bindRange(gammaInput, 'gamma', value => {
    state.gamma = Number(value)
    void syncPlayer()
  }, numeric => numeric.toFixed(2))

  scriptInput.addEventListener('input', () => {
    state.text = scriptInput.value.trim() || defaultSettings.text
    void syncPlayer()
  })

  colorModeInput.addEventListener('change', () => {
    state.colorMode = colorModeInput.value === 'tint' ? 'tint' : 'video'
    void syncPlayer()
  })

  textColorInput.addEventListener('input', () => {
    state.textColor = textColorInput.value
    void syncPlayer()
  })

  invertInput.addEventListener('change', () => {
    state.invert = invertInput.checked
    void syncPlayer()
  })

  playToggle.addEventListener('click', () => {
    if (player.player.video.paused) void player.play()
    else player.pause()
    playToggle.textContent = player.player.video.paused ? 'Play' : 'Pause'
  })

  muteToggle.addEventListener('click', () => {
    player.player.video.muted = !player.player.video.muted
    muteToggle.textContent = player.player.video.muted ? 'Unmute' : 'Mute'
  })

  videoInput.addEventListener('change', () => {
    const file = videoInput.files?.[0]
    if (file === undefined) return
    const objectUrl = URL.createObjectURL(file)
    objectUrls.add(objectUrl)
    state.videoSrc = objectUrl
    statusLine.textContent = `Loaded ${file.name} for preview`
    void syncPlayer()
  })

  saveSettingsButton.addEventListener('click', () => {
    downloadSettings(state)
    statusLine.textContent = 'Saved settings.json for export.'
  })

  loadSettingsButton.addEventListener('click', () => {
    loadSettingsInput.click()
  })

  loadSettingsInput.addEventListener('change', async () => {
    const file = loadSettingsInput.files?.[0]
    if (file === undefined) return
    const loadedSettings = JSON.parse(await file.text()) as Partial<PretextVideoSettings>
    const next = resolveSettings({
      ...state,
      ...loadedSettings,
    })
    applyState(next)
    statusLine.textContent = `Loaded settings from ${file.name}`
  })

  copyExportButton.addEventListener('click', async () => {
    const snippet = createSvelteUsageSnippet()
    await navigator.clipboard.writeText(snippet)
    statusLine.textContent = 'Copied Astro/Svelte lazy-load snippet.'
  })

  resetSettingsButton.addEventListener('click', () => {
    applyState(resolveSettings(defaultSettings))
    statusLine.textContent = 'Reset to default settings.'
  })

  player.player.video.addEventListener('play', () => {
    playToggle.textContent = 'Pause'
  })

  player.player.video.addEventListener('pause', () => {
    playToggle.textContent = 'Play'
  })

  return {
    destroy() {
      window.clearInterval(clockInterval)
      player.destroy()
      for (const objectUrl of objectUrls) URL.revokeObjectURL(objectUrl)
      root.innerHTML = ''
    },
  }

  async function syncPlayer(): Promise<void> {
    await player.update(state)
    syncMeta()
  }

  function syncMeta(): void {
    const height = Math.max(240, Math.floor(stageFrame.clientWidth / getVideoAspect(player.player.video)))
    metaLines.textContent = `${Math.max(1, Math.floor(height / state.lineHeight))} visible rows`
    metaGrid.textContent = `${state.columns} columns`
    metaTime.textContent = player.player.getStatus().label
  }

  function applyState(next: PretextVideoSettings): void {
    Object.assign(state, next)
    scriptInput.value = state.text
    columnsInput.value = String(state.columns)
    fontSizeInput.value = String(state.fontSize)
    lineHeightInput.value = String(state.lineHeight)
    textScrollInput.value = String(state.textScrollSpeed)
    thresholdInput.value = String(state.threshold)
    contrastInput.value = String(state.contrast)
    gammaInput.value = String(state.gamma)
    colorModeInput.value = state.colorMode
    textColorInput.value = state.textColor
    invertInput.checked = state.invert

    syncOutput('columns', state.columns)
    syncOutput('font-size', state.fontSize)
    syncOutput('line-height', state.lineHeight)
    syncOutput('text-scroll', state.textScrollSpeed.toFixed(2))
    syncOutput('threshold', state.threshold.toFixed(2))
    syncOutput('contrast', state.contrast.toFixed(2))
    syncOutput('gamma', state.gamma.toFixed(2))
    void syncPlayer()
  }

  function syncOutput(prefix: string, value: string | number): void {
    const output = root.querySelector<HTMLOutputElement>(`#${prefix}-value`)
    if (output !== null) output.value = String(value)
  }
}

function renderRangeField(
  prefix: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
): string {
  return `
    <label class="field">
      <span>${label} <output id="${prefix}-value">${value}</output></span>
      <input id="${prefix}-input" type="range" min="${min}" max="${max}" step="${step}" value="${value}" />
    </label>
  `
}

function bindRange(
  input: HTMLInputElement,
  prefix: string,
  onChange: (value: string) => void,
  formatter: (numeric: number) => string = numeric => String(numeric),
): void {
  const output = document.querySelector<HTMLOutputElement>(`#${prefix}-value`)
  if (output === null) throw new Error(`output #${prefix}-value missing`)
  input.addEventListener('input', () => {
    const numeric = Number(input.value)
    output.value = formatter(numeric)
    onChange(input.value)
  })
}

function downloadSettings(settings: PretextVideoSettings): void {
  const exported = {
    ...settings,
    text: settings.text.trim(),
  }
  const blob = new Blob([`${JSON.stringify(exported, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'settings.json'
  link.click()
  URL.revokeObjectURL(url)
}

function createSvelteUsageSnippet(): string {
  return `<script lang="ts">
  import PretextVideoSection from 'video-to-pretext/svelte'
  import settings from './settings.json'
  import videoSrc from './output.mp4'
</script>

<PretextVideoSection settings={settings} videoSrc={videoSrc} />`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function getInput(root: HTMLElement, id: string): HTMLInputElement {
  const element = root.querySelector(`#${id}`)
  if (!(element instanceof HTMLInputElement)) throw new Error(`#${id} missing`)
  return element
}

function getSelect(root: HTMLElement, id: string): HTMLSelectElement {
  const element = root.querySelector(`#${id}`)
  if (!(element instanceof HTMLSelectElement)) throw new Error(`#${id} missing`)
  return element
}

function getTextArea(root: HTMLElement, id: string): HTMLTextAreaElement {
  const element = root.querySelector(`#${id}`)
  if (!(element instanceof HTMLTextAreaElement)) throw new Error(`#${id} missing`)
  return element
}

function getButton(root: HTMLElement, id: string): HTMLButtonElement {
  const element = root.querySelector(`#${id}`)
  if (!(element instanceof HTMLButtonElement)) throw new Error(`#${id} missing`)
  return element
}

function getDiv(root: HTMLElement, id: string): HTMLDivElement {
  const element = root.querySelector(`#${id}`)
  if (!(element instanceof HTMLDivElement)) throw new Error(`#${id} missing`)
  return element
}

function getParagraph(root: HTMLElement, id: string): HTMLParagraphElement {
  const element = root.querySelector(`#${id}`)
  if (!(element instanceof HTMLParagraphElement)) throw new Error(`#${id} missing`)
  return element
}

function getSpan(root: HTMLElement, id: string): HTMLSpanElement {
  const element = root.querySelector(`#${id}`)
  if (!(element instanceof HTMLSpanElement)) throw new Error(`#${id} missing`)
  return element
}

function getVideoAspect(video: HTMLVideoElement): number {
  if (video.videoWidth > 0 && video.videoHeight > 0) return video.videoWidth / video.videoHeight
  return 16 / 9
}
