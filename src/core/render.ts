import { rgbToHex } from './color'
import type { PretextVideoSettings, SampledCell } from './types'

export function sampleVideoField(args: {
  samplingContext: CanvasRenderingContext2D
  samplingCanvas: HTMLCanvasElement
  video: HTMLVideoElement
  columns: number
  rows: number
  stageWidth: number
  stageHeight: number
  cellWidth: number
  cellHeight: number
  settings: PretextVideoSettings
}): SampledCell[][] {
  const {
    samplingContext,
    samplingCanvas,
    video,
    columns,
    rows,
    stageWidth,
    stageHeight,
    cellWidth,
    cellHeight,
    settings,
  } = args

  if (columns === 0 || rows === 0) return []

  const sampleWidth = Math.max(1, Math.round(stageWidth))
  const sampleHeight = Math.max(1, Math.round(stageHeight))
  samplingCanvas.width = sampleWidth
  samplingCanvas.height = sampleHeight
  samplingContext.clearRect(0, 0, sampleWidth, sampleHeight)

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
    samplingContext.drawImage(video, 0, 0, sampleWidth, sampleHeight)
  }

  const pixels = samplingContext.getImageData(0, 0, sampleWidth, sampleHeight).data
  const field: SampledCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, (): SampledCell => ({ alpha: 0, color: settings.textColor })),
  )

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const startX = Math.floor(column * cellWidth)
      const endX = Math.max(startX + 1, Math.min(sampleWidth, Math.ceil((column + 1) * cellWidth)))
      const startY = Math.floor(row * cellHeight)
      const endY = Math.max(startY + 1, Math.min(sampleHeight, Math.ceil((row + 1) * cellHeight)))

      let totalRed = 0
      let totalGreen = 0
      let totalBlue = 0
      let totalLuma = 0
      let totalPixels = 0

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const offset = (y * sampleWidth + x) * 4
          const red = pixels[offset] ?? 0
          const green = pixels[offset + 1] ?? 0
          const blue = pixels[offset + 2] ?? 0
          totalRed += red
          totalGreen += green
          totalBlue += blue
          totalLuma += (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
          totalPixels++
        }
      }

      if (totalPixels === 0) continue

      const averageRed = Math.round(totalRed / totalPixels)
      const averageGreen = Math.round(totalGreen / totalPixels)
      const averageBlue = Math.round(totalBlue / totalPixels)
      const baseLuma = totalLuma / totalPixels
      const luma = settings.invert ? 1 - baseLuma : baseLuma
      const boosted = Math.max(
        0,
        Math.min(1, ((luma - settings.threshold) * settings.contrast) / (1 - settings.threshold || 1)),
      )

      field[row]![column] = {
        alpha: Math.pow(boosted, settings.gamma),
        color: rgbToHex(averageRed, averageGreen, averageBlue),
      }
    }
  }

  return field
}

export function drawCharacterField(args: {
  context: CanvasRenderingContext2D
  grid: string[][]
  field: SampledCell[][]
  stageWidth: number
  stageHeight: number
  settings: PretextVideoSettings
  cellWidth: number
}): void {
  const { context, grid, field, stageWidth, stageHeight, settings, cellWidth } = args

  context.fillStyle = settings.backgroundColor
  context.fillRect(0, 0, Math.max(1, stageWidth), Math.max(1, stageHeight))

  context.save()
  context.font = `${settings.fontSize}px "${settings.fontFamily}"`
  context.textBaseline = 'top'
  context.textAlign = 'center'
  context.shadowColor = 'rgba(248, 243, 223, 0.16)'
  context.shadowBlur = 8

  for (let row = 0; row < grid.length; row++) {
    const y = row * settings.lineHeight
    const rowCells = grid[row] ?? []
    const rowField = field[row] ?? []
    for (let column = 0; column < rowCells.length; column++) {
      const char = rowCells[column] ?? ' '
      const sample = rowField[column]
      if (char === ' ' || sample === undefined || sample.alpha <= 0) continue
      context.fillStyle = settings.colorMode === 'video' ? sample.color : settings.textColor
      context.globalAlpha = sample.alpha
      context.fillText(char, column * cellWidth + cellWidth / 2, y)
    }
  }

  context.restore()
}
