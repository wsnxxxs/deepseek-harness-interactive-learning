import { browserLibrary, clientBundle } from '../../build/tsdown.client.ts'

const PACKAGE_ID = '@dsh-portable/visual'
const packageRoot = import.meta.dirname

export default clientBundle(PACKAGE_ID, {
  index: 'lib/types/index.js',
  protocol: 'lib/types/protocol/index.js',
}, {
  packageRoot,
  // The closure-factory Client bundle arrives with the Client plugin entry.
  client: false,
  companions: [browserLibrary(PACKAGE_ID, { react: 'src/react.ts' }, { packageRoot })],
})
