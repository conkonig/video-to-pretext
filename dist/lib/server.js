import { t as e } from "./settings-dr0yAGTC.js";
import { copyFile as t, mkdir as n, readFile as r, readdir as i, writeFile as a } from "node:fs/promises";
import { dirname as o, resolve as s } from "node:path";
//#region src/server/settings-file.ts
async function c(t) {
	let n = await r(s(t), "utf8");
	return e(JSON.parse(n));
}
async function l(t, n) {
	let r = s(t), i = e(n);
	await a(r, `${JSON.stringify(i, null, 2)}\n`, "utf8");
}
//#endregion
//#region src/server/export-svelte.ts
async function u(e) {
	let t = await c(e.settingsPath), r = s(e.outFile);
	await n(o(r), { recursive: !0 }), await a(r, d(t, e.componentName), "utf8");
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
	let r = await c(e.settingsPath), i = s(e.outDir), o = s(e.runtimeDir ?? "dist/lib"), l = e.componentName ?? "PretextVideoSection", u = e.componentFileName ?? `${l}.svelte`, d = e.settingsFileName ?? "settings.json", f = e.videoFileName ?? "coding.mp4", h = s(i, "runtime"), g = {
		...r,
		videoSrc: ""
	};
	await n(i, { recursive: !0 }), await n(h, { recursive: !0 }), await t(s(e.videoPath), s(i, f)), await a(s(i, d), `${JSON.stringify(g, null, 2)}\n`, "utf8"), await m(o, h), await a(s(i, u), p({
		componentName: l,
		settingsImportPath: `./${d}`,
		videoImportPath: `./${f}`,
		runtimeImportPath: "./runtime/index.js"
	}), "utf8");
}
function p(e) {
	let t = e.componentName ?? "PretextVideoSection";
	return `<script lang="ts">
  import { onMount } from 'svelte'
  import settings from '${e.settingsImportPath ?? "./settings.json"}'
  import videoSrc from '${e.videoImportPath ?? "./video.mp4"}'
  import { mount } from '${e.runtimeImportPath ?? "./runtime/index.js"}'

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
<\/script>

<div bind:this={container} class={className} data-component="${t}" style="width: 100%; height: 100%;"></div>`;
}
async function m(e, n) {
	let r = await i(e, { withFileTypes: !0 });
	for (let i of r) i.isFile() && i.name !== "server.js" && await t(s(e, i.name), s(n, i.name));
}
//#endregion
export { p as createPortableSvelteComponentSource, d as createSvelteComponentSource, f as exportPortableSvelteBundle, u as exportSvelteComponent, c as readSettingsFile, l as writeSettingsFile };
