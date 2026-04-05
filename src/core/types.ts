export type ColorMode = 'tint' | 'video'

export type PretextVideoSettings = {
  text: string
  videoSrc: string
  autoplay: boolean
  columns: number
  fontSize: number
  lineHeight: number
  textScrollEnabled: boolean
  textScrollSpeed: number
  threshold: number
  contrast: number
  gamma: number
  invert: boolean
  colorMode: ColorMode
  textColor: string
  backgroundColor: string
  fontFamily: string
}

export type PretextVideoMountOptions = Partial<PretextVideoSettings> & {
  loop?: boolean
  muted?: boolean
  className?: string
}

export type LayoutMetrics = {
  stageWidth: number
  stageHeight: number
  visibleRows: number
  cellWidth: number
}

export type LayoutSnapshot = LayoutMetrics & {
  lines: string[]
}

export type SampledCell = {
  alpha: number
  color: string
}
