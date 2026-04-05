import { createPretextVideoPlayer, type PretextVideoPlayer } from './player'
import type { PretextVideoMountOptions } from '../core/types'

export type PretextVideoHandle = {
  update(next: PretextVideoMountOptions): Promise<void>
  destroy(): void
  play(): Promise<void>
  pause(): void
  readonly player: PretextVideoPlayer
}

export async function mount(container: HTMLElement, options: PretextVideoMountOptions = {}): Promise<PretextVideoHandle> {
  const player = createPretextVideoPlayer(container, options)
  await player.mount()

  return {
    update: next => player.update(next),
    destroy: () => player.destroy(),
    play: () => player.play(),
    pause: () => player.pause(),
    player,
  }
}
