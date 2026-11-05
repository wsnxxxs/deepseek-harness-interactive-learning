import { clientBundle } from './build/tsdown.client.ts'

const PACKAGE_ID = '@dsh-portable/interactive-learning'

/**
 * Workspace packages are inlined from their TypeScript source: the published
 * Learning package never imports `@dsh-portable/visual` at runtime (it is a
 * build-time devDependency), and the visual core's CSS Modules compile
 * through this package's own style plugin under this package's id.
 */
const WORKSPACE_SOURCE_CONDITIONS = ['dsh-portable-source']

export default clientBundle(PACKAGE_ID, [
  'lib/types/index.js',
  'lib/types/agent.js',
  'lib/types/bootstrap.js',
  'lib/types/protocol.js',
  'lib/types/installer.js',
  'lib/types/installer-cli.js',
  'lib/types/preset.js',
  'lib/types/eval.js',
  'lib/types/eval-cli.js',
], { conditions: WORKSPACE_SOURCE_CONDITIONS })
