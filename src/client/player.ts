import defaultFontUrl from '../../matrix code nfi.ttf'
import { buildCharacterGrid, buildLayoutSnapshot, selectVisibleLines } from '../core/layout'
import { drawCharacterField, sampleVideoField } from '../core/render'
import { settingsFromMountOptions } from '../core/settings'
import { formatTime } from '../core/time'
import type { LayoutSnapshot, PretextVideoMountOptions, PretextVideoSettings } from '../core/types'
import { ensurePlayerStyles } from './style'

export type PretextVideoPlayer = {
  mount(): Promise<void>
  play(): Promise<void>
  pause(): void
  update(next: Partial<PretextVideoSettings>): Promise<void>
  destroy(): void
  getSettings(): PretextVideoSettings
  getStatus(): { currentTime: number; duration: number; label: string }
  readonly canvas: HTMLCanvasElement
  readonly element: HTMLDivElement
  readonly video: HTMLVideoElement
}

type PlayerElements = {
  root: HTMLDivElement
  surface: HTMLDivElement
  canvas: HTMLCanvasElement
  video: HTMLVideoElement
  message: HTMLDivElement
  diagnostics: HTMLDivElement
}

type DiagnosticsState = {
  resolvedVideoSrc: string
  readyState: number
  videoWidth: number
  videoHeight: number
  loadedMetadataFired: boolean
  canvasWidth: number
  canvasHeight: number
  containerWidth: number
  containerHeight: number
  initialRenderRan: boolean
  layoutLineCount: number
  sampledFieldHasAlpha: boolean
  currentTime: number
  duration: number
  paused: boolean
  renderLoopActive: boolean
  videoError: string | null
  fallbackMessage: string | null
  fallbackTone: 'warning' | 'error' | null
}

export function createPretextVideoPlayer(
  container: HTMLElement,
  options: PretextVideoMountOptions = {},
): PretextVideoPlayer {
  ensurePlayerStyles()

  const settings = settingsFromMountOptions({
    ...options,
  })

  const elements = createPlayerDom(container, options.className)
  const context = getCanvasContext(elements.canvas, { alpha: false })
  const samplingCanvas = document.createElement('canvas')
  const samplingContext = getCanvasContext(samplingCanvas, { willReadFrequently: true })
  const resizeObserver = new ResizeObserver(() => {
    void prepareLayout()
  })
  const diagnostics: DiagnosticsState = {
    resolvedVideoSrc: settings.videoSrc,
    readyState: 0,
    videoWidth: 0,
    videoHeight: 0,
    loadedMetadataFired: false,
    canvasWidth: 0,
    canvasHeight: 0,
    containerWidth: 0,
    containerHeight: 0,
    initialRenderRan: false,
    layoutLineCount: 0,
    sampledFieldHasAlpha: false,
    currentTime: 0,
    duration: 0,
    paused: true,
    renderLoopActive: false,
    videoError: null,
    fallbackMessage: 'Waiting for player mount.',
    fallbackTone: 'warning',
  }

  let rafId = 0
  let layout: LayoutSnapshot = {
    lines: [],
    visibleRows: 0,
    cellWidth: 0,
    stageWidth: 0,
    stageHeight: 0,
  }
  let destroyed = false
  let fontReady: Promise<void> | null = null

  updateDiagnostics()

  elements.video.playsInline = true
  elements.video.loop = options.loop ?? true
  elements.video.muted = options.muted ?? true
  elements.video.crossOrigin = 'anonymous'
  elements.video.preload = 'auto'

  elements.video.addEventListener('loadedmetadata', () => {
    diagnostics.loadedMetadataFired = true
    diagnostics.videoError = null
    void prepareLayout()
    render()
  })

  elements.video.addEventListener('play', () => {
    diagnostics.paused = false
    diagnostics.renderLoopActive = true
    updateDiagnostics()
    tick()
  })

  elements.video.addEventListener('pause', () => {
    diagnostics.paused = true
    diagnostics.renderLoopActive = false
    updateDiagnostics()
    cancelAnimationFrame(rafId)
  })

  elements.video.addEventListener('timeupdate', () => {
    updateDiagnostics()
  })

  elements.video.addEventListener('error', () => {
    diagnostics.videoError = getVideoErrorMessage(elements.video)
    diagnostics.fallbackMessage = `Video failed to load. ${diagnostics.videoError}`
    diagnostics.fallbackTone = 'error'
    updateDiagnostics()
    cancelAnimationFrame(rafId)
  })

  async function mount(): Promise<void> {
    if (destroyed) throw new Error('player already destroyed')
    resizeObserver.observe(container)
    fontReady ??= loadDefaultFont()
    await fontReady
    if (settings.videoSrc !== '') {
      setVideoSource(settings.videoSrc)
    } else {
      diagnostics.fallbackMessage = 'No video source was provided to the player.'
      diagnostics.fallbackTone = 'warning'
    }
    await prepareLayout()
    if (options.autoplay ?? true) {
      try {
        await elements.video.play()
      } catch {
        diagnostics.fallbackMessage = 'Autoplay was blocked before the first frame could play.'
        diagnostics.fallbackTone = 'warning'
        render()
      }
    } else {
      render()
    }

    window.setTimeout(() => {
      if (!diagnostics.loadedMetadataFired && diagnostics.videoError === null) {
        diagnostics.fallbackMessage = 'Metadata never loaded. Check the video import path, MIME handling, or network access.'
        diagnostics.fallbackTone = 'warning'
        updateDiagnostics()
      }
    }, 3000)
  }

  async function update(next: Partial<PretextVideoSettings>): Promise<void> {
    Object.assign(settings, next)
    elements.root.style.setProperty('--pretext-background', settings.backgroundColor)

    if (next.videoSrc !== undefined && next.videoSrc !== '') {
      setVideoSource(next.videoSrc)
    }

    await prepareLayout()
    render()
  }

  function destroy(): void {
    destroyed = true
    cancelAnimationFrame(rafId)
    resizeObserver.disconnect()
    elements.video.pause()
    elements.video.removeAttribute('src')
    elements.video.load()
    elements.root.remove()
  }

  async function play(): Promise<void> {
    await elements.video.play()
  }

  function pause(): void {
    elements.video.pause()
  }

  function getStatus(): { currentTime: number; duration: number; label: string } {
    return {
      currentTime: elements.video.currentTime,
      duration: elements.video.duration,
      label: `${formatTime(elements.video.currentTime)} / ${formatTime(elements.video.duration)}`,
    }
  }

  function getSettings(): PretextVideoSettings {
    return { ...settings }
  }

  function syncPlaybackDiagnostics(): void {
    syncPlaybackSnapshot(elements.video, diagnostics)
  }

  function updateDiagnostics(): void {
    syncPlaybackDiagnostics()
    elements.message.textContent = diagnostics.fallbackMessage ?? 'Player rendered a drawable frame.'
    if (diagnostics.fallbackTone === null) {
      elements.message.hidden = true
      elements.message.removeAttribute('data-tone')
    } else {
      elements.message.hidden = false
      elements.message.dataset.tone = diagnostics.fallbackTone
    }

    elements.diagnostics.innerHTML = `
      <p class="pretext-video-player__diagnostics-title">Runtime Diagnostics</p>
      <dl class="pretext-video-player__diagnostics-grid">
        ${renderDiagnosticItem('resolved videoSrc', diagnostics.resolvedVideoSrc || '(empty)')}
        ${renderDiagnosticItem('video.readyState', String(diagnostics.readyState))}
        ${renderDiagnosticItem('video dimensions', `${diagnostics.videoWidth} x ${diagnostics.videoHeight}`)}
        ${renderDiagnosticItem('loadedmetadata fired', formatBoolean(diagnostics.loadedMetadataFired))}
        ${renderDiagnosticItem('canvas size', `${diagnostics.canvasWidth} x ${diagnostics.canvasHeight}`)}
        ${renderDiagnosticItem('container size', `${diagnostics.containerWidth} x ${diagnostics.containerHeight}`)}
        ${renderDiagnosticItem('initial render()', formatBoolean(diagnostics.initialRenderRan))}
        ${renderDiagnosticItem('layout.lines.length', String(diagnostics.layoutLineCount))}
        ${renderDiagnosticItem('sampled nonzero alpha', formatBoolean(diagnostics.sampledFieldHasAlpha))}
        ${renderDiagnosticItem(
          'playback time',
          `${formatTime(diagnostics.currentTime)} / ${formatTime(diagnostics.duration)}`,
        )}
        ${renderDiagnosticItem('paused', formatBoolean(diagnostics.paused))}
        ${renderDiagnosticItem('render loop active', formatBoolean(diagnostics.renderLoopActive))}
        ${renderDiagnosticItem('video error', diagnostics.videoError ?? 'none')}
      </dl>
    `
  }

  function tick(): void {
    render()
    if (!elements.video.paused && !elements.video.ended) {
      diagnostics.renderLoopActive = true
      rafId = requestAnimationFrame(tick)
    } else {
      diagnostics.renderLoopActive = false
      updateDiagnostics()
    }
  }

  async function prepareLayout(): Promise<void> {
    if (fontReady !== null) await fontReady
    if ('fonts' in document) await document.fonts.ready

    diagnostics.containerWidth = Math.floor(container.clientWidth || 0)
    diagnostics.containerHeight = Math.floor(container.clientHeight || 0)

    if (diagnostics.containerWidth <= 0 || diagnostics.containerHeight <= 0) {
      diagnostics.fallbackMessage = 'Container size is zero. Give the embed a real width and height before mounting.'
      diagnostics.fallbackTone = 'error'
    }

    const hasWidth = diagnostics.containerWidth > 0
    const hasHeight = diagnostics.containerHeight > 0
    const stageWidth = hasWidth ? diagnostics.containerWidth : 320
    const stageHeight = hasHeight
      ? diagnostics.containerHeight
      : Math.max(240, Math.floor(stageWidth / getVideoAspect(elements.video)))
    layout = buildLayoutSnapshot(settings.text, settings, stageWidth, stageHeight)
    diagnostics.layoutLineCount = layout.lines.length
    resizeCanvas(elements.canvas, context, layout.stageWidth, layout.stageHeight)
    diagnostics.canvasWidth = elements.canvas.width
    diagnostics.canvasHeight = elements.canvas.height
    updateDiagnostics()
  }

  function render(): void {
    diagnostics.initialRenderRan = true
    updateDiagnostics()

    if (layout.stageWidth === 0 || layout.stageHeight === 0) {
      diagnostics.fallbackMessage = 'Render skipped because the canvas layout is still zero-sized.'
      diagnostics.fallbackTone = 'error'
      updateDiagnostics()
      return
    }

    if (layout.lines.length === 0) {
      diagnostics.fallbackMessage = 'Render skipped because layout produced zero lines.'
      diagnostics.fallbackTone = 'error'
      updateDiagnostics()
      return
    }

    context.font = `${settings.fontSize}px "${settings.fontFamily}"`
    const visibleLines = selectVisibleLines(
      layout.lines,
      layout.visibleRows,
      elements.video.currentTime,
      elements.video.duration,
      settings.textScrollSpeed,
    )
    const grid = buildCharacterGrid(
      visibleLines,
      layout.visibleRows,
      settings.columns,
      layout.cellWidth,
      value => context.measureText(value).width,
    )
    const field = sampleVideoField({
      samplingContext,
      samplingCanvas,
      video: elements.video,
      columns: settings.columns,
      rows: layout.visibleRows,
      stageWidth: layout.stageWidth,
      stageHeight: layout.stageHeight,
      cellWidth: layout.cellWidth,
      cellHeight: settings.lineHeight,
      settings,
    })
    diagnostics.sampledFieldHasAlpha = fieldHasDrawableAlpha(field)

    drawCharacterField({
      context,
      grid,
      field,
      stageWidth: layout.stageWidth,
      stageHeight: layout.stageHeight,
      settings,
      cellWidth: layout.cellWidth,
    })
    syncPlaybackDiagnostics()

    if (diagnostics.videoError !== null) {
      diagnostics.fallbackMessage = `Video failed to load. ${diagnostics.videoError}`
      diagnostics.fallbackTone = 'error'
    } else if (!diagnostics.loadedMetadataFired) {
      diagnostics.fallbackMessage = 'Waiting for loadedmetadata before the first drawable frame.'
      diagnostics.fallbackTone = 'warning'
    } else if (!diagnostics.sampledFieldHasAlpha) {
      diagnostics.fallbackMessage = 'Render ran, but the sampled video field produced no nonzero alpha values.'
      diagnostics.fallbackTone = 'warning'
    } else {
      diagnostics.fallbackMessage = null
      diagnostics.fallbackTone = null
    }

    updateDiagnostics()
  }

  function setVideoSource(videoSrc: string): void {
    if (elements.video.src === videoSrc) return
    diagnostics.resolvedVideoSrc = videoSrc
    diagnostics.loadedMetadataFired = false
    diagnostics.videoError = null
    diagnostics.fallbackMessage = 'Loading video source.'
    diagnostics.fallbackTone = 'warning'
    elements.video.src = videoSrc
    elements.video.load()
    updateDiagnostics()
  }

  return {
    mount,
    play,
    pause,
    update,
    destroy,
    getSettings,
    getStatus,
    canvas: elements.canvas,
    element: elements.root,
    video: elements.video,
  }
}

function createPlayerDom(container: HTMLElement, className?: string): PlayerElements {
  const root = document.createElement('div')
  root.className = className ? `pretext-video-player ${className}` : 'pretext-video-player'
  const surface = document.createElement('div')
  surface.className = 'pretext-video-player__surface'
  const canvas = document.createElement('canvas')
  const video = document.createElement('video')
  const message = document.createElement('div')
  message.className = 'pretext-video-player__message'
  const diagnostics = document.createElement('div')
  diagnostics.className = 'pretext-video-player__diagnostics'
  surface.append(canvas, video, message)
  root.append(surface, diagnostics)
  container.append(root)
  return { root, surface, canvas, video, message, diagnostics }
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  stageWidth: number,
  stageHeight: number,
): void {
  const pixelRatio = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.floor(stageWidth * pixelRatio))
  canvas.height = Math.max(1, Math.floor(stageHeight * pixelRatio))
  canvas.style.width = `${stageWidth}px`
  canvas.style.height = `${stageHeight}px`
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
}

function fieldHasDrawableAlpha(field: Array<Array<{ alpha: number }>>): boolean {
  for (const row of field) {
    for (const cell of row) {
      if (cell.alpha > 0) return true
    }
  }
  return false
}

function getVideoErrorMessage(video: HTMLVideoElement): string {
  if (video.error === null) return 'Unknown media error.'
  switch (video.error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'The video load was aborted.'
    case MediaError.MEDIA_ERR_NETWORK:
      return 'A network error interrupted the video load.'
    case MediaError.MEDIA_ERR_DECODE:
      return 'The browser could not decode the video.'
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'The video source is not supported.'
    default:
      return 'Unknown media error.'
  }
}

function syncPlaybackSnapshot(video: HTMLVideoElement, diagnostics: DiagnosticsState): void {
  diagnostics.readyState = video.readyState
  diagnostics.videoWidth = video.videoWidth
  diagnostics.videoHeight = video.videoHeight
  diagnostics.currentTime = video.currentTime
  diagnostics.duration = video.duration
  diagnostics.paused = video.paused
}

function formatBoolean(value: boolean): string {
  return value ? 'yes' : 'no'
}

function renderDiagnosticItem(label: string, value: string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

async function loadDefaultFont(): Promise<void> {
  const fontFace = new FontFace('Matrix Code NFI', `url("${defaultFontUrl}")`)
  const loadedFont = await fontFace.load()
  document.fonts.add(loadedFont)
  await document.fonts.load('16px "Matrix Code NFI"')
}

function getCanvasContext(
  canvas: HTMLCanvasElement,
  options?: CanvasRenderingContext2DSettings,
): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', options)
  if (context === null) throw new Error('2d rendering context unavailable')
  return context
}

function getVideoAspect(video: HTMLVideoElement): number {
  if (video.videoWidth > 0 && video.videoHeight > 0) return video.videoWidth / video.videoHeight
  return 16 / 9
}
