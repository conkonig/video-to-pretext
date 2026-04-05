<script lang="ts">
  import { onMount } from 'svelte'
  import settings from './settings.json'
  import videoSrc from './coding.mp4'
  import { mount, type PretextVideoHandle } from 'video-to-pretext'

  export let className = ''
  export let autoplay = true
  export let muted = true
  export let loop = true

  let container: HTMLDivElement
  let handle: PretextVideoHandle | null = null

  onMount(() => {
    let active = true

    void mount(container, {
      ...settings,
      videoSrc,
      className,
      autoplay,
      muted,
      loop,
    }).then(instance => {
      if (!active) {
        instance.destroy()
        return
      }
      handle = instance
    })

    return () => {
      active = false
      handle?.destroy()
      handle = null
    }
  })
</script>

<div bind:this={container} data-component="PretextVideoSection" />