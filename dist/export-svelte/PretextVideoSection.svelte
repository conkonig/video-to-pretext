<script lang="ts">
  import { onMount } from 'svelte'
  import settings from './settings.json'
  import videoSrc from './coding.mp4'
  import { mount } from './runtime/index.js'

  export let className = ''
  export let autoplay = true
  export let muted = true
  export let loop = true

  let container: HTMLDivElement
  let handle: { destroy(): void } | null = null

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

<div bind:this={container} class={className} data-component="PretextVideoSection" style="width: 100%; height: 100%;"></div>