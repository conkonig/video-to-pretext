<script lang="ts">
  import { onMount } from 'svelte'
  import { mount, type PretextVideoHandle } from '../client'
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
  export let autoplay = false
  export let muted = true
  export let loop = true
  export let className = ''
  export let onStatusChange: ((status: PlayerStatus) => void) | undefined = undefined

  let container: HTMLDivElement
  let handle: PretextVideoHandle | null = null
  let syncTimer = 0

  onMount(() => {
    let active = true

    void createOrUpdateHandle()

    return () => {
      active = false
      if (syncTimer !== 0) window.clearInterval(syncTimer)
      handle?.destroy()
      handle = null
    }

    async function createOrUpdateHandle(): Promise<void> {
      if (!active) return

      const options = {
        ...settings,
        videoSrc,
        autoplay,
        muted,
        loop,
        className,
      }

      if (handle === null) {
        const nextHandle = await mount(container, options)
        if (!active) {
          nextHandle.destroy()
          return
        }

        handle = nextHandle
        syncStatus()
        syncTimer = window.setInterval(syncStatus, 120)
        return
      }

      await handle.update(options)
      handle.player.video.muted = muted
      handle.player.video.loop = loop
      syncStatus()
    }
  })

  $: if (handle !== null) {
    void handle.update({
      ...settings,
      videoSrc,
    })
    handle.player.video.muted = muted
    handle.player.video.loop = loop
    syncStatus()
  }

  export async function play(): Promise<void> {
    await handle?.play()
    syncStatus()
  }

  export function pause(): void {
    handle?.pause()
    syncStatus()
  }

  export function toggleMute(): void {
    if (handle === null) return
    handle.player.video.muted = !handle.player.video.muted
    syncStatus()
  }

  export function getMuted(): boolean {
    return handle?.player.video.muted ?? muted
  }

  export function getPaused(): boolean {
    return handle?.player.video.paused ?? true
  }

  export function getStatusLabel(): string {
    return handle?.player.getStatus().label ?? '00:00 / 00:00'
  }

  function syncStatus(): void {
    if (handle === null || onStatusChange === undefined) return
    const status = handle.player.getStatus()
    onStatusChange({
      ...status,
      muted: handle.player.video.muted,
      paused: handle.player.video.paused,
    })
  }
</script>

<div bind:this={container} class={className} style="width: 100%; height: 100%;"></div>
