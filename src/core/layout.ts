import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext'
import type { LayoutSnapshot, PretextVideoSettings } from './types'

export function buildLayoutSnapshot(
  text: string,
  settings: PretextVideoSettings,
  stageWidth: number,
  stageHeight: number,
): LayoutSnapshot {
  const safeStageWidth = Math.max(320, Math.floor(stageWidth))
  const visibleRows = Math.max(1, Math.floor(stageHeight / settings.lineHeight))
  const font = `${settings.fontSize}px "${settings.fontFamily}"`
  const prepared = prepareWithSegments(text.trim() || settings.text, font)
  const lines = layoutWithLines(prepared, safeStageWidth, settings.lineHeight).lines.map(line => line.text)
  return {
    lines,
    visibleRows,
    cellWidth: safeStageWidth / settings.columns,
    stageWidth: safeStageWidth,
    stageHeight: visibleRows * settings.lineHeight,
  }
}

export function selectVisibleLines(
  lines: string[],
  visibleRows: number,
  currentTime: number,
  duration: number,
  scrollSpeed: number,
): string[] {
  if (lines.length <= visibleRows) return lines
  const progress = duration > 0 ? currentTime / duration : 0
  const adjustedProgress = Math.min(1, progress * scrollSpeed)
  const maxOffset = Math.max(0, lines.length - visibleRows)
  const start = Math.min(maxOffset, Math.floor(adjustedProgress * maxOffset))
  return lines.slice(start, start + visibleRows)
}

export function buildCharacterGrid(
  lines: string[],
  visibleRows: number,
  columns: number,
  cellWidth: number,
  measureText: (value: string) => number,
): string[][] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return Array.from({ length: visibleRows }, (_, rowIndex) => {
    const row = Array.from({ length: columns }, () => ' ')
    const line = lines[rowIndex]
    if (line === undefined) return row

    let cursorX = 0
    for (const grapheme of segmenter.segment(line)) {
      const char = grapheme.segment
      const width = measureText(char)
      const center = cursorX + width / 2
      const column = Math.max(0, Math.min(columns - 1, Math.floor(center / cellWidth)))
      row[column] = char
      cursorX += width
    }

    return row
  })
}
