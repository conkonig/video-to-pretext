import { t as e } from "./settings-C7CjK20-.js";
import { mkdir as t, readFile as n, writeFile as r } from "node:fs/promises";
import { dirname as i, resolve as a } from "node:path";
//#region src/server/settings-file.ts
async function o(t) {
	let r = await n(a(t), "utf8");
	return e(JSON.parse(r));
}
async function s(t, n) {
	let i = a(t), o = e(n);
	await r(i, `${JSON.stringify(o, null, 2)}\n`, "utf8");
}
//#endregion
//#region src/server/export-svelte.ts
async function c(e) {
	let n = await o(e.settingsPath), s = a(e.outFile);
	await t(i(s), { recursive: !0 }), await r(s, l(n, e.componentName), "utf8");
}
function l(e, t = "PretextVideoExport") {
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
//#endregion
export { l as createSvelteComponentSource, c as exportSvelteComponent, o as readSettingsFile, s as writeSettingsFile };
