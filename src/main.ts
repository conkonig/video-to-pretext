import { layoutWithLines, prepareWithSegments, type LayoutLine, type PreparedTextWithSegments } from '@chenglou/pretext'
import defaultText from '../lorem.txt?raw'
import defaultFontUrl from '../matrix code nfi.ttf'
import defaultVideoUrl from '../output.mp4'
import './styles.css'

const DEFAULT_TEXT = defaultText.trim()
const DEFAULT_FONT_FAMILY = 'Matrix Code NFI'

type Controls = {
  columns: number
  fontSize: number
  lineHeight: number
  textScrollSpeed: number
  threshold: number
  contrast: number
  gamma: number
  invert: boolean
  textColor: string
  backgroundColor: string
}

type Cell = {
  char: string
  lit: boolean
}

type LayoutState = {
  prepared: PreparedTextWithSegments | null
  allLines: LayoutLine[]
  visibleRows: number
  cellWidth: number
  stageWidth: number
  stageHeight: number
}

const controls: Controls = {
  columns: 118,
  fontSize: 13,
  lineHeight: 16,
  textScrollSpeed: 1,
  threshold: 0.18,
  contrast: 1.35,
  gamma: 0.9,
  invert: false,
  textColor: '#f8f3df',
  backgroundColor: '#101216',
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const app = document.querySelector<HTMLDivElement>('#app')
if (app === null) throw new Error('app root not found')

app.innerHTML = `
  <div class="shell">
    <aside class="controls">
      <div class="panel-title">
        <p class="eyebrow">PreText Video Surface</p>
        <h1>Read the film while it plays.</h1>
        <p class="lede">Upload a clip, paste a script, and the video will reappear as illuminated text laid out with PreText.</p>
      </div>

      <label class="field">
        <span>Video file</span>
        <input id="video-input" type="file" accept="video/*" />
      </label>

      <div class="media-actions">
        <button id="play-toggle" type="button">Play</button>
        <button id="mute-toggle" type="button">Mute</button>
      </div>

      <label class="field grow">
        <span>Script</span>
        <textarea id="script-input" spellcheck="false">${DEFAULT_TEXT}</textarea>
      </label>

      <div class="slider-grid">
        <label class="field">
          <span>Columns <output id="columns-value">${controls.columns}</output></span>
          <input id="columns-input" type="range" min="48" max="180" step="1" value="${controls.columns}" />
        </label>

        <label class="field">
          <span>Font size <output id="font-size-value">${controls.fontSize}</output></span>
          <input id="font-size-input" type="range" min="9" max="22" step="1" value="${controls.fontSize}" />
        </label>

        <label class="field">
          <span>Line height <output id="line-height-value">${controls.lineHeight}</output></span>
          <input id="line-height-input" type="range" min="11" max="28" step="1" value="${controls.lineHeight}" />
        </label>

        <label class="field">
          <span>Text scroll <output id="text-scroll-value">${controls.textScrollSpeed.toFixed(2)}</output></span>
          <input id="text-scroll-input" type="range" min="0" max="3" step="0.05" value="${controls.textScrollSpeed}" />
        </label>

        <label class="field">
          <span>Threshold <output id="threshold-value">${controls.threshold.toFixed(2)}</output></span>
          <input id="threshold-input" type="range" min="0" max="0.7" step="0.01" value="${controls.threshold}" />
        </label>

        <label class="field">
          <span>Contrast <output id="contrast-value">${controls.contrast.toFixed(2)}</output></span>
          <input id="contrast-input" type="range" min="0.4" max="2.5" step="0.01" value="${controls.contrast}" />
        </label>

        <label class="field">
          <span>Gamma <output id="gamma-value">${controls.gamma.toFixed(2)}</output></span>
          <input id="gamma-input" type="range" min="0.4" max="1.8" step="0.01" value="${controls.gamma}" />
        </label>
      </div>

      <label class="check-field">
        <input id="invert-input" type="checkbox" />
        <span>Invert brightness mapping</span>
      </label>
    </aside>

    <main class="stage-panel">
      <div class="stage-header">
        <div>
          <p class="eyebrow">Live canvas render</p>
          <h2>Brightness decides which characters survive.</h2>
        </div>
        <p id="status-line" class="status-line">Loading default text and video.</p>
      </div>

      <div id="stage-frame" class="stage-frame">
        <canvas id="render-canvas"></canvas>
      </div>

      <div class="meta-bar">
        <span id="meta-lines">0 visible rows</span>
        <span id="meta-grid">0 columns</span>
        <span id="meta-time">00:00 / 00:00</span>
      </div>
    </main>
  </div>
`

const videoInput = getInput('video-input')
const playToggle = getButton('play-toggle')
const muteToggle = getButton('mute-toggle')
const scriptInput = getTextArea('script-input')
const columnsInput = getInput('columns-input')
const fontSizeInput = getInput('font-size-input')
const lineHeightInput = getInput('line-height-input')
const textScrollInput = getInput('text-scroll-input')
const thresholdInput = getInput('threshold-input')
const contrastInput = getInput('contrast-input')
const gammaInput = getInput('gamma-input')
const invertInput = getInput('invert-input')
const stageFrame = getDiv('stage-frame')
const renderCanvas = getCanvas('render-canvas')
const statusLine = getParagraph('status-line')
const metaLines = getSpan('meta-lines')
const metaGrid = getSpan('meta-grid')
const metaTime = getSpan('meta-time')

const renderContext = getCanvasContext(renderCanvas, { alpha: false })

const samplingCanvas = document.createElement('canvas')
const samplingContext = getCanvasContext(samplingCanvas, { willReadFrequently: true })

const video = document.createElement('video')
video.playsInline = true
video.loop = true
video.muted = true
video.crossOrigin = 'anonymous'

const layoutState: LayoutState = {
  prepared: null,
  allLines: [],
  visibleRows: 0,
  cellWidth: 0,
  stageWidth: 0,
  stageHeight: 0,
}

let videoUrl: string | null = null
let rafId = 0
let fontLoadPromise: Promise<void> | null = null

function main(): void {
  syncCssVars()
  bindControls()
  observeStage()
  fontLoadPromise = loadDefaultFont()
  loadDefaultVideo()
  void prepareTextLayout()
  render()
}

function bindControls(): void {
  videoInput.addEventListener('change', onVideoSelected)
  playToggle.addEventListener('click', onTogglePlayback)
  muteToggle.addEventListener('click', onToggleMute)
  scriptInput.addEventListener('input', () => {
    void prepareTextLayout()
  })

  bindRange(columnsInput, 'columns', value => {
    controls.columns = Number(value)
    metaGrid.textContent = `${controls.columns} columns`
    void prepareTextLayout()
  })

  bindRange(fontSizeInput, 'font-size', value => {
    controls.fontSize = Number(value)
    syncCssVars()
    void prepareTextLayout()
  })

  bindRange(lineHeightInput, 'line-height', value => {
    controls.lineHeight = Number(value)
    syncCssVars()
    void prepareTextLayout()
  })

  bindRange(textScrollInput, 'text-scroll', value => {
    controls.textScrollSpeed = Number(value)
    render()
  }, numeric => numeric.toFixed(2))

  bindRange(thresholdInput, 'threshold', value => {
    controls.threshold = Number(value)
  }, numeric => numeric.toFixed(2))

  bindRange(contrastInput, 'contrast', value => {
    controls.contrast = Number(value)
  }, numeric => numeric.toFixed(2))

  bindRange(gammaInput, 'gamma', value => {
    controls.gamma = Number(value)
  }, numeric => numeric.toFixed(2))

  invertInput.addEventListener('change', () => {
    controls.invert = invertInput.checked
    render()
  })

  video.addEventListener('loadedmetadata', () => {
    statusLine.textContent = `Loaded ${video.videoWidth}×${video.videoHeight} video`
    resizeStage()
    render()
  })

  video.addEventListener('play', () => {
    playToggle.textContent = 'Pause'
    tick()
  })

  video.addEventListener('pause', () => {
    playToggle.textContent = 'Play'
    cancelAnimationFrame(rafId)
  })

  video.addEventListener('ended', () => {
    playToggle.textContent = 'Play'
  })
}

function observeStage(): void {
  const observer = new ResizeObserver(() => {
    void prepareTextLayout()
  })
  observer.observe(stageFrame)
}

async function prepareTextLayout(): Promise<void> {
  if (fontLoadPromise !== null) {
    await fontLoadPromise
  }

  if ('fonts' in document) {
    await document.fonts.ready
  }

  const stageWidth = Math.max(320, Math.floor(stageFrame.clientWidth - 2))
  const videoAspect = getVideoAspect()
  const stageHeight = Math.max(240, Math.floor(stageWidth / videoAspect))
  const visibleRows = Math.max(1, Math.floor(stageHeight / controls.lineHeight))
  const cellWidth = stageWidth / controls.columns
  const font = `${controls.fontSize}px "${DEFAULT_FONT_FAMILY}"`
  const text = scriptInput.value.trim() || DEFAULT_TEXT

  layoutState.prepared = prepareWithSegments(text, font)
  layoutState.allLines = layoutWithLines(layoutState.prepared, stageWidth, controls.lineHeight).lines
  layoutState.visibleRows = visibleRows
  layoutState.cellWidth = cellWidth
  layoutState.stageWidth = stageWidth
  layoutState.stageHeight = visibleRows * controls.lineHeight

  resizeStage()
  updateMeta()
  render()
}

function resizeStage(): void {
  if (layoutState.stageWidth === 0 || layoutState.stageHeight === 0) return
  const pixelRatio = window.devicePixelRatio || 1
  renderCanvas.width = Math.max(1, Math.floor(layoutState.stageWidth * pixelRatio))
  renderCanvas.height = Math.max(1, Math.floor(layoutState.stageHeight * pixelRatio))
  renderCanvas.style.width = `${layoutState.stageWidth}px`
  renderCanvas.style.height = `${layoutState.stageHeight}px`
  renderContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
}

function onVideoSelected(event: Event): void {
  const input = event.currentTarget
  if (!(input instanceof HTMLInputElement)) return
  const file = input.files?.[0]
  if (file === undefined) return

  if (videoUrl !== null) URL.revokeObjectURL(videoUrl)
  videoUrl = URL.createObjectURL(file)
  video.src = videoUrl
  video.load()
  void video.play()
}

function loadDefaultVideo(): void {
  video.src = defaultVideoUrl
  video.load()
  statusLine.textContent = 'Loaded default video: output.mp4'
}

async function loadDefaultFont(): Promise<void> {
  const fontFace = new FontFace(DEFAULT_FONT_FAMILY, `url("${defaultFontUrl}")`)
  const loadedFont = await fontFace.load()
  document.fonts.add(loadedFont)
  await document.fonts.load(`16px "${DEFAULT_FONT_FAMILY}"`)
}

function onTogglePlayback(): void {
  if (video.src === '') return
  if (video.paused) void video.play()
  else video.pause()
}

function onToggleMute(): void {
  video.muted = !video.muted
  muteToggle.textContent = video.muted ? 'Unmute' : 'Mute'
}

function tick(): void {
  render()
  if (!video.paused && !video.ended) rafId = requestAnimationFrame(tick)
}

function render(): void {
  const { stageWidth, stageHeight, visibleRows, allLines, cellWidth } = layoutState
  renderContext.fillStyle = controls.backgroundColor
  renderContext.fillRect(0, 0, Math.max(1, stageWidth), Math.max(1, stageHeight))

  if (stageWidth === 0 || stageHeight === 0 || visibleRows === 0 || allLines.length === 0) return

  const visibleLines = selectVisibleLines(allLines, visibleRows)
  renderContext.font = `${controls.fontSize}px "${DEFAULT_FONT_FAMILY}"`
  const grid = buildGrid(visibleLines, controls.columns, cellWidth)
  const brightness = sampleBrightness(grid[0]?.length ?? 0, grid.length)

  renderContext.save()
  renderContext.textBaseline = 'top'
  renderContext.textAlign = 'center'
  renderContext.fillStyle = controls.textColor
  renderContext.shadowColor = 'rgba(248, 243, 223, 0.16)'
  renderContext.shadowBlur = 8

  for (let row = 0; row < grid.length; row++) {
    const y = row * controls.lineHeight
    const cells = grid[row]!
    const rowBrightness = brightness[row]!
    for (let column = 0; column < cells.length; column++) {
      const cell = cells[column]!
      if (!cell.lit || cell.char === ' ') continue
      const alpha = rowBrightness[column]!
      renderContext.globalAlpha = alpha
      renderContext.fillText(cell.char, column * cellWidth + cellWidth / 2, y)
    }
  }

  renderContext.restore()
  syncClock()
}

function selectVisibleLines(lines: LayoutLine[], visibleRows: number): LayoutLine[] {
  if (lines.length <= visibleRows) return lines
  const progress = video.duration > 0 ? video.currentTime / video.duration : 0
  const adjustedProgress = Math.min(1, progress * controls.textScrollSpeed)
  const maxOffset = Math.max(0, lines.length - visibleRows)
  const start = Math.min(maxOffset, Math.floor(adjustedProgress * maxOffset))
  return lines.slice(start, start + visibleRows)
}

function buildGrid(lines: LayoutLine[], columns: number, cellWidth: number): Cell[][] {
  return Array.from({ length: layoutState.visibleRows }, (_, rowIndex) => {
    const row = Array.from({ length: columns }, (): Cell => ({ char: ' ', lit: false }))
    const line = lines[rowIndex]
    if (line === undefined) return row

    let cursorX = 0
    for (const grapheme of segmenter.segment(line.text)) {
      const char = grapheme.segment
      const width = renderContext.measureText(char).width
      const center = cursorX + width / 2
      const column = Math.max(0, Math.min(columns - 1, Math.floor(center / cellWidth)))
      row[column] = { char, lit: true }
      cursorX += width
    }

    return row
  })
}

function sampleBrightness(columns: number, rows: number): number[][] {
  if (columns === 0 || rows === 0) return []

  samplingCanvas.width = columns
  samplingCanvas.height = rows
  samplingContext.clearRect(0, 0, columns, rows)

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
    samplingContext.drawImage(video, 0, 0, columns, rows)
  }

  const pixels = samplingContext.getImageData(0, 0, columns, rows).data
  const field: number[][] = Array.from({ length: rows }, () => Array.from({ length: columns }, () => 0))

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const offset = (row * columns + column) * 4
      const red = pixels[offset] ?? 0
      const green = pixels[offset + 1] ?? 0
      const blue = pixels[offset + 2] ?? 0
      const baseLuma = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
      const luma = controls.invert ? 1 - baseLuma : baseLuma
      const boosted = Math.max(0, Math.min(1, ((luma - controls.threshold) * controls.contrast) / (1 - controls.threshold || 1)))
      field[row]![column] = Math.pow(boosted, controls.gamma)
    }
  }

  return field
}

function syncCssVars(): void {
  document.documentElement.style.setProperty('--bg', controls.backgroundColor)
  document.documentElement.style.setProperty('--panel', '#171a20')
  document.documentElement.style.setProperty('--panel-strong', '#20242d')
  document.documentElement.style.setProperty('--text', '#f6f1df')
  document.documentElement.style.setProperty('--muted', '#b5b2a2')
  document.documentElement.style.setProperty('--accent', '#ff8b5e')
  document.documentElement.style.setProperty('--accent-soft', '#ffd7c8')
}

function updateMeta(): void {
  metaLines.textContent = `${layoutState.visibleRows} visible rows`
  metaGrid.textContent = `${controls.columns} columns`
  syncClock()
}

function syncClock(): void {
  const current = formatTime(video.currentTime)
  const total = formatTime(video.duration)
  metaTime.textContent = `${current} / ${total}`
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '00:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getVideoAspect(): number {
  if (video.videoWidth > 0 && video.videoHeight > 0) return video.videoWidth / video.videoHeight
  return 16 / 9
}

function bindRange(
  input: HTMLInputElement,
  outputIdPrefix: string,
  onChange: (value: string) => void,
  formatter: (numeric: number) => string = numeric => String(numeric),
): void {
  const output = document.querySelector<HTMLOutputElement>(`#${outputIdPrefix}-value`)
  if (output === null) throw new Error(`output #${outputIdPrefix}-value missing`)
  input.addEventListener('input', () => {
    const numeric = Number(input.value)
    output.value = formatter(numeric)
    onChange(input.value)
    render()
  })
}

function getInput(id: string): HTMLInputElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLInputElement)) throw new Error(`#${id} missing`)
  return element
}

function getTextArea(id: string): HTMLTextAreaElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLTextAreaElement)) throw new Error(`#${id} missing`)
  return element
}

function getButton(id: string): HTMLButtonElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLButtonElement)) throw new Error(`#${id} missing`)
  return element
}

function getDiv(id: string): HTMLDivElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLDivElement)) throw new Error(`#${id} missing`)
  return element
}

function getParagraph(id: string): HTMLParagraphElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLParagraphElement)) throw new Error(`#${id} missing`)
  return element
}

function getSpan(id: string): HTMLSpanElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLSpanElement)) throw new Error(`#${id} missing`)
  return element
}

function getCanvas(id: string): HTMLCanvasElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLCanvasElement)) throw new Error(`#${id} missing`)
  return element
}

function getCanvasContext(
  canvas: HTMLCanvasElement,
  options?: CanvasRenderingContext2DSettings,
): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', options)
  if (context === null) throw new Error('2d rendering context unavailable')
  return context
}

main()
