<script lang="ts">
  import type { PretextVideoSettings } from '../core/types'

  export let settings: PretextVideoSettings
  export let playLabel = 'Play'
  export let muteLabel = 'Mute'
  export let onSettingsChange: ((next: PretextVideoSettings) => void) | undefined = undefined
  export let onVideoPick: ((event: Event) => void) | undefined = undefined
  export let onSaveSettings: (() => void) | undefined = undefined
  export let onCopyExport: (() => void) | undefined = undefined
  export let onReset: (() => void) | undefined = undefined
  export let onTogglePlay: (() => void) | undefined = undefined
  export let onToggleMute: (() => void) | undefined = undefined
  export let onSettingsFileChange: ((file: File | undefined) => void) | undefined = undefined

  let loadSettingsInput: HTMLInputElement

  function handleSettingsFileChange(): void {
    onSettingsFileChange?.(loadSettingsInput.files?.[0])
    loadSettingsInput.value = ''
  }

  function patchSettings(patch: Partial<PretextVideoSettings>): void {
    onSettingsChange?.({
      ...settings,
      ...patch,
    })
  }
</script>

<aside class="controls">
  <div class="panel-title">
    <p class="eyebrow">PreText Video Surface</p>
    <h1>Tune once, export the playback surface.</h1>
    <p class="lede">
      This local Svelte app is for testing videos and dialing settings. The reusable output ships separately as
      a component-only playback surface.
    </p>
  </div>

  <label class="field">
    <span>Video file</span>
    <input type="file" accept="video/*" onchange={event => onVideoPick?.(event)} />
  </label>

  <div class="media-actions">
    <button type="button" onclick={onTogglePlay}>{playLabel}</button>
    <button type="button" onclick={onToggleMute}>{muteLabel}</button>
  </div>

  <div class="settings-actions">
    <button type="button" onclick={onSaveSettings}>Save settings.json</button>
    <button class="secondary" type="button" onclick={() => loadSettingsInput.click()}>Load settings.json</button>
    <input bind:this={loadSettingsInput} hidden type="file" accept="application/json" onchange={handleSettingsFileChange} />
    <button type="button" onclick={onCopyExport}>Copy export snippet</button>
    <button class="secondary" type="button" onclick={onReset}>Reset defaults</button>
  </div>

  <label class="field grow">
    <span>Script</span>
    <textarea value={settings.text} spellcheck="false" oninput={event => patchSettings({ text: event.currentTarget.value })}></textarea>
  </label>

  <div class="slider-grid">
    <label class="field">
      <span>Columns <output>{settings.columns}</output></span>
      <input value={settings.columns} type="range" min="48" max="180" step="1" oninput={event => patchSettings({ columns: Number(event.currentTarget.value) })} />
    </label>

    <label class="field">
      <span>Font size <output>{settings.fontSize}</output></span>
      <input value={settings.fontSize} type="range" min="9" max="22" step="1" oninput={event => patchSettings({ fontSize: Number(event.currentTarget.value) })} />
    </label>

    <label class="field">
      <span>Line height <output>{settings.lineHeight}</output></span>
      <input value={settings.lineHeight} type="range" min="11" max="28" step="1" oninput={event => patchSettings({ lineHeight: Number(event.currentTarget.value) })} />
    </label>

    <label class="field">
      <span>Vertical flow <output>{settings.textScrollSpeed.toFixed(2)}</output></span>
      <input value={settings.textScrollSpeed} type="range" min="0" max="3" step="0.05" oninput={event => patchSettings({ textScrollSpeed: Number(event.currentTarget.value) })} />
    </label>

    <label class="field">
      <span>Threshold <output>{settings.threshold.toFixed(2)}</output></span>
      <input value={settings.threshold} type="range" min="0" max="0.7" step="0.01" oninput={event => patchSettings({ threshold: Number(event.currentTarget.value) })} />
    </label>

    <label class="field">
      <span>Contrast <output>{settings.contrast.toFixed(2)}</output></span>
      <input value={settings.contrast} type="range" min="0.4" max="2.5" step="0.01" oninput={event => patchSettings({ contrast: Number(event.currentTarget.value) })} />
    </label>

    <label class="field">
      <span>Gamma <output>{settings.gamma.toFixed(2)}</output></span>
      <input value={settings.gamma} type="range" min="0.4" max="1.8" step="0.01" oninput={event => patchSettings({ gamma: Number(event.currentTarget.value) })} />
    </label>
  </div>

  <div class="appearance-grid">
    <label class="field">
      <span>Character color</span>
      <select value={settings.colorMode} onchange={event => patchSettings({ colorMode: event.currentTarget.value === 'tint' ? 'tint' : 'video' })}>
        <option value="video">Sample from video</option>
        <option value="tint">Tint all text</option>
      </select>
    </label>

    <label class="field">
      <span>Tint color</span>
      <input value={settings.textColor} type="color" oninput={event => patchSettings({ textColor: event.currentTarget.value })} />
    </label>
  </div>

  <label class="check-field">
    <input checked={settings.invert} type="checkbox" onchange={event => patchSettings({ invert: event.currentTarget.checked })} />
    <span>Invert brightness mapping</span>
  </label>
</aside>

<style>
  .controls {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(28, 31, 39, 0.92), rgba(17, 19, 24, 0.96));
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(18px);
  }

  .panel-title h1 {
    margin: 6px 0 10px;
    font-size: clamp(2rem, 4vw, 3.2rem);
    line-height: 0.95;
    letter-spacing: -0.04em;
  }

  .lede,
  .field span {
    color: #b5b2a2;
  }

  .eyebrow {
    margin: 0;
    color: #ffd7c8;
    font-size: 0.82rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field.grow {
    flex: 1;
  }

  .field input[type='file'],
  .field textarea,
  .field select,
  .field input[type='color'] {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
  }

  .field input[type='file'] {
    padding: 14px;
  }

  .field textarea {
    min-height: 220px;
    padding: 16px;
    resize: vertical;
    line-height: 1.5;
  }

  .field select,
  .field input[type='color'] {
    min-height: 52px;
    padding: 12px 14px;
  }

  .field input[type='color'] {
    padding: 8px;
  }

  .slider-grid,
  .appearance-grid,
  .settings-actions,
  .media-actions {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .media-actions button,
  .settings-actions button {
    width: 100%;
    border: none;
    border-radius: 999px;
    padding: 14px 18px;
    background: linear-gradient(135deg, #ff8b5e, #ffb485);
    color: #120e0b;
    font-weight: 700;
  }

  .settings-actions button.secondary {
    background: rgba(255, 255, 255, 0.08);
    color: #f6f1df;
  }

  .slider-grid input[type='range'] {
    width: 100%;
    accent-color: #ff8b5e;
  }

  .check-field {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .check-field input {
    inline-size: 18px;
    block-size: 18px;
    accent-color: #ff8b5e;
  }

  @media (max-width: 640px) {
    .controls {
      padding: 18px;
      border-radius: 22px;
    }

    .slider-grid,
    .appearance-grid,
    .settings-actions,
    .media-actions {
      grid-template-columns: 1fr;
    }
  }
</style>
