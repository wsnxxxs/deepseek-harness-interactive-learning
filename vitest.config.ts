import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@deepseek-ai/dsh-client-ui-primitives': resolve(import.meta.dirname, 'tests/browser/markdown-stub.tsx'),
    },
  },
  test: {
    restoreMocks: true,
  },
})
