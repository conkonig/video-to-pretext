import { t as e } from "./settings-C7CjK20-.js";
import { copyFile as t, mkdir as n, readFile as r, writeFile as i } from "node:fs/promises";
import { basename as a, dirname as o, resolve as s } from "node:path";
//#region src/server/settings-file.ts
async function c(t) {
	let n = await r(s(t), "utf8");
	return e(JSON.parse(n));
}
async function l(t, n) {
	let r = s(t), a = e(n);
	await i(r, `${JSON.stringify(a, null, 2)}\n`, "utf8");
}
//#endregion
//#region src/server/export-svelte.ts
async function u(e) {
	let t = await c(e.settingsPath), r = s(e.outFile);
	await n(o(r), { recursive: !0 }), await i(r, d(t, e.componentName), "utf8");
}
function d(e, t = "PretextVideoExport") {
	return `<script lang="ts">
  import { onMount } from 'svelte'
  import { mount, type PretextVideoHandle, type PretextVideoSettings } from 'video-to-pretext'

  export let videoSrc: string
  export let settings: Partial<PretextVideoSettings> = ${JSON.stringify(e, null, 2)}
  export let className = ''

  let container: HTMLDivElement
  let handle: PretextVideoHandle | null = null

  onMount(() => {
    let active = true

    void mount(container, {
      ...settings,
      videoSrc,
      autoplay: true,
      muted: true,
      className,
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
<\/script>

<div bind:this={container} data-component="${t}" />`;
}
async function f(e) {
	let r = await c(e.settingsPath), o = s(e.outDir), l = e.componentName ?? "PretextVideoSection", u = e.componentFileName ?? `${l}.svelte`, d = e.settingsFileName ?? "settings.json", f = e.videoFileName ?? a(e.videoPath), m = {
		...r,
		videoSrc: ""
	};
	await n(o, { recursive: !0 }), await t(s(e.videoPath), s(o, f)), await i(s(o, d), `${JSON.stringify(m, null, 2)}\n`, "utf8"), await i(s(o, u), p({
		componentName: l,
		settingsImportPath: `./${d}`,
		videoImportPath: `./${f}`
	}), "utf8");
}
function p(e) {
	let t = e.componentName ?? "PretextVideoSection";
	return `<script lang="ts">
  import { onMount } from 'svelte'
  import settings from '${e.settingsImportPath ?? "./settings.json"}'
  import videoSrc from '${e.videoImportPath ?? "./video.mp4"}'
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
<\/script>

<div bind:this={container} data-component="${t}" />`;
}
//#endregion
export { p as createPortableSvelteComponentSource, d as createSvelteComponentSource, f as exportPortableSvelteBundle, u as exportSvelteComponent, c as readSettingsFile, l as writeSettingsFile };
