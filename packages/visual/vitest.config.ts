import { configDefaults, defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@deepseek-ai/dsh-client-ui-primitives': resolve(import.meta.dirname, 'tests/browser/markdown-stub.tsx'),
    },
  },
  test: {
    name: '@dsh-portable/visual',
    restoreMocks: true,
    // Agent worktrees live under .claude/; never collect their copies of the suite.
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
})
