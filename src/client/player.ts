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
  canvas: HTMLCanvasElement
  video: HTMLVideoElement
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

  elements.video.playsInline = true
  elements.video.loop = options.loop ?? true
  elements.video.muted = options.muted ?? true
  elements.video.crossOrigin = 'anonymous'
  elements.video.preload = 'auto'

  elements.video.addEventListener('loadedmetadata', () => {
    void prepareLayout()
    render()
  })

  elements.video.addEventListener('play', () => {
    tick()
  })

  elements.video.addEventListener('pause', () => {
    cancelAnimationFrame(rafId)
  })

  async function mount(): Promise<void> {
    if (destroyed) throw new Error('player already destroyed')
    resizeObserver.observe(container)
    fontReady ??= loadDefaultFont()
    await fontReady
    if (settings.videoSrc !== '') {
      setVideoSource(settings.videoSrc)
    }
    await prepareLayout()
    if (options.autoplay ?? true) {
      try {
        await elements.video.play()
      } catch {
        render()
      }
    } else {
      render()
    }
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

  function tick(): void {
    render()
    if (!elements.video.paused && !elements.video.ended) {
      rafId = requestAnimationFrame(tick)
    }
  }

  async function prepareLayout(): Promise<void> {
    if (fontReady !== null) await fontReady
    if ('fonts' in document) await document.fonts.ready

    const stageWidth = Math.max(320, Math.floor(container.clientWidth || 320))
    const stageHeight = Math.max(240, Math.floor(stageWidth / getVideoAspect(elements.video)))
    layout = buildLayoutSnapshot(settings.text, settings, stageWidth, stageHeight)
    resizeCanvas(elements.canvas, context, layout.stageWidth, layout.stageHeight)
  }

  function render(): void {
    if (layout.stageWidth === 0 || layout.stageHeight === 0 || layout.lines.length === 0) return

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

    drawCharacterField({
      context,
      grid,
      field,
      stageWidth: layout.stageWidth,
      stageHeight: layout.stageHeight,
      settings,
      cellWidth: layout.cellWidth,
    })
  }

  function setVideoSource(videoSrc: string): void {
    if (elements.video.src === videoSrc) return
    elements.video.src = videoSrc
    elements.video.load()
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
  const canvas = document.createElement('canvas')
  const video = document.createElement('video')
  root.append(canvas, video)
  container.append(root)
  return { root, canvas, video }
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
