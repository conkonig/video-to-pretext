# Exported Svelte Bundle

Files in this folder are ready to move into your Astro/Svelte repo.

- `PretextVideoSection.svelte`
- `settings.json`
- `coding.mp4`

Example:

```svelte
<script lang="ts">
  import PretextVideoSection from './PretextVideoSection.svelte'
</script>

<PretextVideoSection />
```

This generated component expects the `video-to-pretext` package to be available in the consuming repo or workspace.
