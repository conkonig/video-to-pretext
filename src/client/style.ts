import playerCss from './player.css?inline'

let styleTag: HTMLStyleElement | null = null

export function ensurePlayerStyles(): void {
  if (styleTag !== null) return
  styleTag = document.createElement('style')
  styleTag.dataset.pretextVideoPlayer = 'true'
  styleTag.textContent = playerCss
  document.head.append(styleTag)
}
