import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    outDir: 'dist/lib',
    emptyOutDir: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        server: resolve(__dirname, 'src/server/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['node:fs/promises', 'node:path', 'svelte'],
    },
  },
})
