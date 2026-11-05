import { fileURLToPath } from 'node:url'

export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    // Resolve the visual workspace package from its TypeScript source, ahead of
    // Vite's default client conditions.
    conditions: ['dsh-portable-source', 'module', 'browser', 'development|production'],
    alias: [
      {
        find: '@deepseek-ai/dsh-client-ui-primitives',
        replacement: fileURLToPath(new URL('../../packages/visual/tests/browser/markdown-stub.tsx', import.meta.url)),
      },
      {
        find: 'katex/dist/katex.min.css',
        replacement: fileURLToPath(new URL('../../node_modules/katex/dist/katex.min.css', import.meta.url)),
      },
      {
        find: 'katex',
        replacement: fileURLToPath(new URL('../../node_modules/katex/dist/katex.mjs', import.meta.url)),
      },
    ],
  },
  server: { host: '127.0.0.1', port: 41739, strictPort: true },
}
