# Exported Svelte Bundle

Files in this folder are ready to move into your Astro/Svelte repo.

- `PretextVideoSection.svelte`
- `settings.json`
- `coding.mp4`
- `runtime/index.js`

Example:

```svelte
<script lang="ts">
  import PretextVideoSection from './PretextVideoSection.svelte'
</script>

<div style="height: 100vh;">
  <PretextVideoSection />
</div>
```

This generated component is portable. Copy the whole folder, including `runtime/`, into your Astro/Svelte repo.
