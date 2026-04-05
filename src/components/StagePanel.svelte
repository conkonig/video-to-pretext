<script lang="ts">
  import PlayerSurface from './PlayerSurface.svelte'
  import type { PretextVideoSettings } from '../core/types'

  type PlayerStatus = {
    currentTime: number
    duration: number
    label: string
    muted: boolean
    paused: boolean
  }

  export let settings: PretextVideoSettings
  export let videoSrc: string
  export let statusLine = 'Preparing player.'
  export let autoplay = false
  export let muted = true
  export let loop = true
  export let onStatusChange: ((status: PlayerStatus) => void) | undefined = undefined

  let surface: PlayerSurface

  export async function play(): Promise<void> {
    await surface.play()
  }

  export function pause(): void {
    surface.pause()
  }

  export function toggleMute(): void {
    surface.toggleMute()
  }

  export function getMuted(): boolean {
    return surface.getMuted()
  }

  export function getPaused(): boolean {
    return surface.getPaused()
  }
</script>

<main class="stage-panel">
  <div class="stage-header">
    <div>
      <p class="eyebrow">Embeddable runtime preview</p>
      <h2>The stage below is the same exported playback component your portfolio will use.</h2>
    </div>
    <p class="status-line">{statusLine}</p>
  </div>

  <div class="stage-frame">
    <PlayerSurface
      bind:this={surface}
      {settings}
      {videoSrc}
      {autoplay}
      {muted}
      {loop}
      onStatusChange={onStatusChange}
      className="stage-surface"
    ></PlayerSurface>
  </div>
</main>

<style>
  .stage-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 22px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(28, 31, 39, 0.92), rgba(17, 19, 24, 0.96));
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(18px);
  }

  .stage-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
  }

  .stage-header h2 {
    margin: 6px 0 10px;
    font-size: clamp(1.4rem, 2vw, 2rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .eyebrow {
    margin: 0;
    color: #ffd7c8;
    font-size: 0.82rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .status-line {
    margin: 0;
    max-width: 320px;
    text-align: right;
    color: #b5b2a2;
  }

  .stage-frame {
    position: relative;
    min-height: 420px;
    height: min(70vh, 860px);
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.08), transparent 36%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.18));
  }

  :global(.stage-surface) {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 980px) {
    .stage-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .status-line {
      max-width: none;
      text-align: left;
    }
  }

  @media (max-width: 640px) {
    .stage-panel {
      padding: 18px;
      border-radius: 22px;
    }

    .stage-frame {
      min-height: 340px;
      height: 60vh;
    }
  }
</style>
