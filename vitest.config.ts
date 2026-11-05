import { configDefaults, defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

/**
 * Workspace packages resolve to their TypeScript source through this export
 * condition (see `tsconfig.base.json`), so Learning's specs exercise the
 * visual package's current source rather than its committed build.
 */
const WORKSPACE_SOURCE_CONDITIONS = ['dsh-portable-source']

export default defineConfig({
  resolve: {
    conditions: WORKSPACE_SOURCE_CONDITIONS,
    alias: {
      '@deepseek-ai/dsh-client-ui-primitives': resolve(import.meta.dirname, 'packages/visual/tests/browser/markdown-stub.tsx'),
    },
  },
  // Node-environment specs resolve through Vite's SSR environment, which has
  // its own condition list.
  ssr: {
    resolve: {
      conditions: WORKSPACE_SOURCE_CONDITIONS,
    },
  },
  test: {
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: '@dsh-portable/interactive-learning',
          // Workspace packages run as their own projects. Agent worktrees live
          // under .claude/; never collect their copies of the suite.
          exclude: [...configDefaults.exclude, 'packages/**', '**/.claude/**'],
        },
      },
      'packages/visual',
    ],
  },
})
