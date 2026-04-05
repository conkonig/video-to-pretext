import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { exportPortableSvelteBundle } from '../dist/lib/server.js'

const args = parseArgs(process.argv.slice(2))
const root = process.cwd()

const settingsPath = resolve(root, args.settings ?? 'settings.json')
const videoPath = resolve(root, args.video ?? 'coding.mp4')
const outDir = resolve(root, args.out ?? 'dist/export-svelte')
const componentName = args.name ?? 'PretextVideoSection'
const componentFileName = `${componentName}.svelte`

await exportPortableSvelteBundle({
  settingsPath,
  videoPath,
  outDir,
  componentName,
  componentFileName,
  settingsFileName: 'settings.json',
  videoFileName: 'coding.mp4',
})

const usageFile = resolve(outDir, 'README.md')
await mkdir(dirname(usageFile), { recursive: true })
await writeFile(
  usageFile,
  `# Exported Svelte Bundle

Files in this folder are ready to move into your Astro/Svelte repo.

- \`${componentFileName}\`
- \`settings.json\`
- \`coding.mp4\`
- \`runtime/index.js\`

Example:

\`\`\`svelte
<script lang="ts">
  import ${componentName} from './${componentFileName}'
</script>

<div style="height: 100vh;">
  <${componentName} />
</div>
\`\`\`

This generated component is portable. Copy the whole folder, including \`runtime/\`, into your Astro/Svelte repo.
`,
  'utf8',
)

console.log(`Exported ${componentFileName} bundle to ${outDir}`)

function parseArgs(argv) {
  const parsed = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    const next = argv[index + 1]

    if (token === '--settings' && next) {
      parsed.settings = next
      index += 1
      continue
    }

    if (token === '--video' && next) {
      parsed.video = next
      index += 1
      continue
    }

    if (token === '--out' && next) {
      parsed.out = next
      index += 1
      continue
    }

    if (token === '--name' && next) {
      parsed.name = next
      index += 1
    }
  }

  return parsed
}
