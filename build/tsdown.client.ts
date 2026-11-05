/**
 * Shared tsdown preset for UI plugin client bundles. Emits a closure-factory
 * artifact: the bundle calls window.__ModuleLoader__.load({id, factory})
 * and resolves externals through the injected require (loader module table —
 * cordis DI entities, no globals, no import map). CSS is compiled by
 * lightningcss inside the bundle: `x.module.css` yields its hashed class map
 * and injects a tagged style at factory execution, while `x.css?inline`
 * exports compiled text for a plugin-owned lifecycle effect. The virtual
 * loaders register each real stylesheet as a watch dependency.
 *
 * Standalone copy of DeepSeek Harness `packages/client/tsdown.client.ts` at
 * 0.2.2-rc.1. This repository builds outside the monorepo (see
 * scripts/build-package.mjs and each package's tsdown.config.ts), so the
 * monorepo-only imports are restated or dropped here:
 * - `PLATFORM_MODULES` / `PRELOADED_CLIENT_EXTERNALS` are copied from
 *   `packages/client/web/src/platform.ts`;
 * - `optionalStringArray` is copied from `packages/client/modules/src/client/manifest.ts`;
 * - the package-asset pipeline (`src/client/assets/`), the static-linked and
 *   dual-client faces, experimental-input isolation, and the repository's
 *   `DSH_CLIENT_*` build-environment defines are not used here and are omitted;
 * - `clientBundle` keeps the `(id, libEntry)` call shape and reads the manifest
 *   from the calling package's root (`packageRoot`, default the repository
 *   root package).
 *
 * Additions for this pnpm workspace:
 * - `conditions` prepends export conditions in every face, so a package can
 *   inline a sibling workspace package from its TypeScript source (the
 *   `dsh-portable-source` condition) — its CSS Modules then compile through
 *   this preset under the consuming package's id;
 * - `client: false` builds only the Node half, for a package with no Client
 *   plugin entry yet; `browserLibrary` emits an ESM browser entry (such as a
 *   React embedding surface) with the same CSS handling;
 * - CSS Module class hashes are computed from package-relative stylesheet
 *   paths (lightningcss `projectRoot`), and the CSS virtual ids rolldown prints
 *   into a bundle are rewritten package-relative, so committed output does not
 *   depend on where the repository is checked out.
 */
import { readFile, stat, utimes } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire, isBuiltin } from 'node:module'
import { basename, dirname, isAbsolute, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Rolldown, type TsdownPlugin, type UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

/**
 * The module specifiers the shell shares into the frozen module table
 * (upstream `packages/client/web/src/platform.ts`).
 */
export const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  'zod', '@tanstack/react-virtual',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
] as const

/** Client-bundle specifiers whose factories the parser preloads before the shell starts. */
export const PRELOADED_CLIENT_EXTERNALS = [
] as const

/**
 * Virtual-id wrapper keeping module CSS away from tsdown's own css pipeline
 * (which requires @tsdown/css). The suffix matters: tsdown's guard matches ids
 * ending in `.css`, so the virtual id must not.
 */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const GLOBAL_CSS_VIRTUAL_PREFIX = '\0dsh-global-css:'
const INLINE_CSS_VIRTUAL_PREFIX = '\0dsh-inline-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'
const INLINE_CSS_QUERY = '?inline'

/**
 * Emit one plugin-owned style injector and an optional CSS Modules export.
 * @param css - JavaScript expression yielding the stylesheet text.
 */
function styleInjectionModule(
  id: string,
  fileId: string,
  css: string,
  classMap?: Readonly<Record<string, string>>,
): string {
  const source = [
    `const css = ${css};`,
    `const tagId = ${JSON.stringify(`${id}/${basename(fileId)}`)};`,
    'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
    '  const tag = document.createElement(\'style\');',
    `  tag.dataset.plugin = ${JSON.stringify(id)};`,
    '  tag.dataset.pluginCss = tagId;',
    '  tag.textContent = css;',
    '  document.head.appendChild(tag);',
    '}',
  ]
  source.push(classMap === undefined ? 'export {};' : `export default ${JSON.stringify(classMap)};`)
  return source.join('\n')
}

/**
 * Contract layers and pure folds a client bundle may inline: browser-safe
 * values with no runtime identity to share (no Symbol/instanceof/singleton state).
 * Everything else under @deepseek-ai/* is either a module-table entry
 * (external) or a leak the purity gate rejects.
 */
export const INLINE_SAFE = /^(?:@deepseek-ai\/dsh-(?:file-reference|fs-patch|session|llm|tools|brand|official-bundles|deque|output-retention|typert-protocol|util-crypto|util-time|util-values|util-workspace-path)(?:\/|$)|@deepseek-ai\/dsh-util-file-drag$|@deepseek-ai\/dsh-token-meter\/client$|@deepseek-ai\/dsh-commands\/builtin$|@deepseek-ai\/dsh-native-command\/types$|@deepseek-ai\/dsh-host-open-in-app\/shared$|@deepseek-ai\/dsh-plugin-manager\/registry$|@deepseek-ai\/dsh-agent-preset-registry\/display$|@deepseek-ai\/dsh-api-workspace-controller\/default-workspace$|@deepseek-ai\/dsh-spill-policy\/notice$)/

/**
 * Vendored framework libraries: rescoped into @deepseek-ai, so the gate below
 * would read them as plugin packages. They carry no cross-plugin runtime
 * identity to share — the framework itself is a requested module-table row
 * (external), while these are ordinary libraries a browser bundle inlines.
 */
const VENDORED_LIBRARY = /^@deepseek-ai\/(?:(?:cosmokit|schemastery)(?:\/|$)|cordis-plugin-timer$)/

/** Generated descriptor/codec contribution with no shared runtime identity. */
const GENERATED_REMOTE = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/

/**
 * Workspace mode replaces an empty config array with the root defaults. A
 * falsey entry instead removes this package before entry resolution.
 */
const SKIP_WORKSPACE_BUILD: UserConfig = { entry: '' }

/** Standalone package root (this preset lives one level below it, in build/). */
const REPOSITORY_ROOT = fileURLToPath(new URL('..', import.meta.url))

/** Rebase a physical lib-relative source onto a browser URL that mirrors the repository directories. */
function browserSourcePath(source: string, sourcemapPath: string): string {
  if (!source.startsWith('.')) return source
  const physicalSource = resolvePath(dirname(sourcemapPath), source)
  const repositoryPath = relative(REPOSITORY_ROOT, physicalSource).split(sep).join('/')
  return repositoryPath.startsWith('packages/') ? `../../../${repositoryPath}` : source
}

/**
 * Build the tsdown config for one UI plugin package: the node-half lib build
 * plus the browser client bundle. Client packages emit both halves during the
 * Client pass by default; packages needed for Host reflection may opt into the
 * earlier Host pass. A package-level tsdown.config.ts REPLACES the root
 * workspace layout, so the lib half must be restated here — dropping it leaves
 * the package without lib/index.js and the host Loader cannot import its node
 * half. The Client build consumes `lib/types` when a build face is selected and
 * chains those tsc maps, with original source content, into the plugin map.
 * @param id - plugin id (package name), stamped into the __ModuleLoader__.load
 * handoff and onto the injected style tags; must match the package manifest.
 * @param libEntry - node-half entries (an array, or output name → input file).
 * @param options - package root, source conditions, phase placement, lib
 * overrides, companion Node configs, and per-file Client banner.
 * @returns ENV-selected tsdown config for the current build face.
 */
export function clientBundle(
  id: string,
  libEntry: LibEntry,
  options: ClientBundleOptions = {},
): BuildFaceConfig {
  const packageRoot = options.packageRoot ?? REPOSITORY_ROOT
  const manifest = packageManifestFor(id, packageRoot, 'clientBundle')
  const conditions = options.conditions ?? []
  const lib = clientLibraryConfig(manifest, libEntry, conditions, options.lib)
  return ({ env }) => {
    const face = buildFace(env?.DSH_BUILD_FACE)
    const node = [lib, ...(options.companions ?? [])]
    if (options.client === false) {
      if (face === 'host') return options.hostPhase === true ? node : [SKIP_WORKSPACE_BUILD]
      if (face === 'client') return options.hostPhase === true ? [SKIP_WORKSPACE_BUILD] : node
      return node
    }
    const clientEntry = face === undefined ? 'src/client/index.ts' : 'lib/types/client/index.js'
    const client = clientConfig(manifest, packageRoot, clientEntry, conditions, options.clientBanner)
    if (face === 'host') return options.hostPhase === true ? node : [SKIP_WORKSPACE_BUILD]
    if (face === 'client') return options.hostPhase === true ? [client] : [...node, client]
    return [...node, client]
  }
}

/**
 * An ESM browser library entry — for example a React embedding surface that
 * other Client bundles inline. Its CSS compiles exactly as in the Client
 * bundle, stamped with this package's id; the package's production
 * dependencies stay imports and everything else is bundled.
 * @param id - package name; must match the package manifest.
 * @param entry - output name → input file.
 * @param options - package root and export conditions resolved before the defaults.
 * @returns one tsdown config emitting `lib/<name>.js`.
 */
export function browserLibrary(
  id: string,
  entry: Readonly<Record<string, string>>,
  options: { readonly packageRoot?: string; readonly conditions?: readonly string[] } = {},
): UserConfig {
  const packageRoot = options.packageRoot ?? REPOSITORY_ROOT
  const manifest = packageManifestFor(id, packageRoot, 'browserLibrary')
  const conditions = options.conditions ?? []
  let externals: readonly RegExp[] | undefined
  const isProductionDependency = (specifier: string): boolean =>
    matchesSpecifier(externals ??= productionExternals(manifest), specifier)
  return {
    name: `${id}/${Object.keys(entry).join('+')}`,
    entry: { ...entry },
    outDir: 'lib',
    format: ['esm'],
    platform: 'browser',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    deps: {
      neverBundle: isProductionDependency,
      alwaysBundle: (specifier: string) => !isBuiltin(specifier) && !isProductionDependency(specifier),
    },
    ...(conditions.length === 0 ? {} : {
      inputOptions: { resolve: { conditionNames: [...conditions, 'import', 'browser', 'default'] } },
    }),
    plugins: [...cssPlugins(id, packageRoot), packageRelativeCssIds(packageRoot)],
  }
}

/** Node-half entries: input files, or output name → input file. */
type LibEntry = readonly string[] | Readonly<Record<string, string>>

/**
 * Select arbitrary package-local configs only during the Client pass.
 * @param configs - Node-side configs emitted after Client tsc.
 * @returns ENV-selected tsdown config for the Client build face.
 */
export function clientOnly(configs: readonly UserConfig[]): BuildFaceConfig {
  return ({ env }) => buildFace(env?.DSH_BUILD_FACE) === 'host'
    ? [SKIP_WORKSPACE_BUILD]
    : [...configs]
}

interface ClientBundleOptions {
  /** Root of the package whose config calls this preset; defaults to the repository root package. */
  readonly packageRoot?: string
  /**
   * Export conditions resolved before the defaults in every build face, e.g.
   * the workspace source condition that inlines a sibling package from source.
   */
  readonly conditions?: readonly string[]
  /** `false` builds only the Node half (the package has no Client plugin entry yet). */
  readonly client?: boolean
  /** Emit the Node-side artifacts during the Host pass instead of the Client pass. */
  readonly hostPhase?: boolean
  /** Additional Node-side configs emitted alongside the package library. */
  readonly companions?: readonly UserConfig[]
  /** Overrides for the package's primary Node-side library config. */
  readonly lib?: UserConfig
  /** Optional legal or attribution text selected by emitted client filename. */
  readonly clientBanner?: (fileName: string) => string | undefined
}

type BuildFace = 'host' | 'client' | undefined

type BuildFaceConfig = (inlineConfig: Pick<UserConfig, 'env'>) => UserConfig[]

function buildFace(value: unknown): BuildFace {
  if (value === undefined || value === 'host' || value === 'client') return value
  throw new Error(`tsdown: --env.DSH_BUILD_FACE must be host or client, received ${String(value)}`)
}

function clientLibraryConfig(
  manifest: PackageManifest,
  libEntry: LibEntry,
  conditions: readonly string[],
  overrides: UserConfig = {},
): UserConfig {
  let externals: readonly RegExp[] | undefined
  const isProductionDependency = (specifier: string): boolean =>
    matchesSpecifier(externals ??= productionExternals(manifest), specifier)
  return {
    name: manifest.name,
    entry: Array.isArray(libEntry) ? [...libEntry] : { ...libEntry as Readonly<Record<string, string>> },
    // The Node half inlines only package-local modules (every third-party
    // import is a production dependency or a builtin), so stating one list for
    // import and require resolution cannot re-resolve an inlined dependency.
    ...(conditions.length === 0 ? {} : {
      inputOptions: { resolve: { conditionNames: [...conditions, 'import', 'node', 'default'] } },
    }),
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    deps: {
      // The Node half runs from a real install: a production dependency is on
      // disk there and stays an import, everything else inlines. Stating both
      // halves takes the artifact off tsdown's getProductionDeps fallback, where
      // moving a dependency between npm sections silently re-bundles it.
      // Builtins keep tsdown's own handling (neither side claims them).
      neverBundle: isProductionDependency,
      alwaysBundle: (specifier: string) => !isBuiltin(specifier) && !isProductionDependency(specifier),
    },
    ...overrides,
  }
}

/** The manifest fields the build faces read to name the package and state its own module edges. */
interface PackageManifest {
  /** Package name: the tsdown config name, the Client loader id, and the diagnostic subject. */
  readonly name: string
  /** Sections a real install materializes on disk next to the built package. */
  readonly dependencies?: Record<string, string>
  readonly peerDependencies?: Record<string, string>
  readonly optionalDependencies?: Record<string, string>
  readonly dsh?: { readonly client?: { readonly external?: unknown } }
}

/**
 * Read the manifest of the package whose config calls a preset.
 * @param packageDir - the package's own directory.
 * @returns the parsed manifest.
 * @throws {Error} when `package.json` is unreadable, is not JSON, or declares no string name.
 */
function readPackageManifest(packageDir: string): PackageManifest {
  const manifestPath = resolvePath(packageDir, 'package.json')
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    throw new Error(`tsdown: cannot read ${manifestPath}`, { cause: error })
  }
  if (typeof parsed !== 'object' || parsed === null || !('name' in parsed) || typeof parsed.name !== 'string') {
    throw new Error(`tsdown: ${manifestPath} declares no string package name`)
  }
  return parsed as PackageManifest
}

/**
 * Read the calling package's manifest and check it names the bundle id.
 * @throws {Error} when the manifest is unreadable or names another package.
 */
function packageManifestFor(id: string, packageDir: string, preset: string): PackageManifest {
  const manifest = readPackageManifest(packageDir)
  if (manifest.name !== id) {
    throw new Error(`tsdown: ${preset} id ${JSON.stringify(id)} does not match package name ${JSON.stringify(manifest.name)}`)
  }
  return manifest
}

/**
 * External patterns for one package's Node half: its own production sections,
 * subpaths included.
 * @param manifest - the package's own manifest.
 * @returns one `^name(/|$)` pattern per production dependency, name-sorted.
 */
function productionExternals(manifest: PackageManifest): readonly RegExp[] {
  const names = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ])
  return [...names].sort().map(name => new RegExp(`^${escapeSpecifier(name)}(/|$)`))
}

/** Upstream `optionalStringArray` (`packages/client/modules/src/client/manifest.ts`). */
function optionalStringArray(subject: string, field: string, value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`client-modules: ${subject} ${field} must be a string array`)
  }
  return value as string[]
}

/**
 * Module-table specifiers one `dsh.client` declaration requests. Matching is
 * exact, never normalized: a package declares the specifier its own code
 * imports, and the loader keys static entries the same way.
 * @param subject - package name, used in diagnostics.
 * @param declaration - the package's `dsh.client` object.
 * @returns the requested specifiers, empty when the package declares none.
 * @throws {Error} when `external` is not a string array.
 */
export function requestedExternals(
  subject: string,
  declaration: { readonly external?: unknown },
): ReadonlySet<string> {
  return new Set(optionalStringArray(subject, 'dsh.client.external', declaration.external) ?? [])
}

/**
 * Module-table specifiers one package requests. The shell baseline is implicit
 * for every dynamic bundle; `dsh.client.external` only adds package-specific
 * dynamic rows or subpaths.
 * @param manifest - the package's own manifest, whose `dsh.client` declaration adds requests.
 * @returns the baseline plus the package's explicit requests.
 */
function clientExternals(manifest: PackageManifest): ReadonlySet<string> {
  return new Set([
    ...PLATFORM_MODULES,
    ...PRELOADED_CLIENT_EXTERNALS,
    ...requestedExternals(manifest.name, manifest.dsh?.client ?? {}),
  ])
}

/** Escape a package name for literal use inside a RegExp source. */
function escapeSpecifier(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Whether an import specifier is the package a pattern names, or one of its subpaths. */
function matchesSpecifier(patterns: readonly RegExp[], specifier: string): boolean {
  return patterns.some(pattern => pattern.test(specifier))
}

/** Render package-local dynamic imports through the Client module loader's asynchronous operation. */
function asyncChunkRequirePlugin(): TsdownPlugin {
  return {
    name: 'dsh-client-async-chunk-require',
    renderChunk(code, chunk, outputOptions) {
      if (outputOptions.format !== 'cjs') return null
      const transformed = new Rolldown.RolldownMagicString(code)
      for (const dynamicImport of chunk.dynamicImports) {
        const fileName = dynamicImport.startsWith('./') ? dynamicImport.slice(2) : dynamicImport
        if (!/^client\.[A-Za-z0-9][A-Za-z0-9._-]*\.js$/.test(fileName)) continue
        const specifier = `./${fileName}`
        const call = new RegExp(
          `Promise\\.resolve\\(\\)\\.then\\(\\(\\)\\s*=>\\s*require\\((['"])${escapeSpecifier(specifier)}\\1\\)\\)`,
          'gu',
        )
        const matches = [...code.matchAll(call)]
        if (matches.length === 0) {
          throw new Error(`client bundle compiler: dynamic chunk ${JSON.stringify(specifier)} has no generated import expression`)
        }
        for (const match of matches) {
          transformed.overwrite(match.index, match.index + match[0].length, `require.async(${JSON.stringify(specifier)})`)
        }
      }
      return transformed.hasChanged() ? transformed : null
    },
    async writeBundle(outputOptions, bundle) {
      const entry = Object.values(bundle).find(output => output.type === 'chunk' && output.isEntry)
      if (entry === undefined || outputOptions.dir === undefined) return
      const entryPath = resolvePath(outputOptions.dir, entry.fileName)
      const current = await stat(entryPath)
      const completedAt = new Date(Math.max(Date.now(), current.mtimeMs + 1))
      await utimes(entryPath, current.atime, completedAt)
    },
  }
}

function clientConfig(
  manifest: PackageManifest,
  packageRoot: string,
  entry: string,
  conditions: readonly string[],
  clientBanner?: (fileName: string) => string | undefined,
): UserConfig {
  const id = manifest.name
  let requested: ReadonlySet<string> | undefined
  const isRequested = (specifier: string): boolean => (requested ??= clientExternals(manifest)).has(specifier)
  return {
    name: `${id}/client`,
    entry: { client: entry },
    // Browser bundle lands beside the Node artifacts. clean must stay off:
    // cleaning this invocation would wipe the independently emitted Node entry.
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    // Types ship from lib/types (tsc); dts here would wrap the banner/footer into .d.cts and break parsing.
    dts: false,
    // Plugin code is fetched outside Vite's module graph, so its own bundle
    // must carry the TS/TSX mapping consumed by browser profiling tools.
    sourcemap: true,
    clean: false,
    deps: {
      neverBundle: isRequested,
      // Anything NOT requested from the loader module table must inline
      // (wire/type layers, clsx — every non-shared dep). A require() the
      // table cannot answer is a guaranteed runtime throw, so the rule is the
      // package's own request list: requested specifiers stay imports,
      // everything else is bundled.
      alwaysBundle: (specifier: string) => !isRequested(specifier),
    },
    // Dual-mode libraries resolve their static flavor matching the NODE_ENV
    // the defines below bake in.
    inputOptions: {
      resolve: {
        conditionNames: [
          ...conditions,
          (process.env.NODE_ENV ?? 'production') === 'development' ? 'development' : 'production',
          'browser', 'import', 'module', 'default',
        ],
      },
    },
    // Browser bundles inline node-idiom deps (zustand/immer read
    // process.env.NODE_ENV; zustand's esm build also probes
    // import.meta.env.MODE, which a CJS output cannot carry — rolldown flags
    // EMPTY_IMPORT_META). Both keys honor the build's NODE_ENV so a dev build
    // keeps the dev-branch semantics; artifacts default to production. The
    // bare `import.meta.env` key is required alongside the precise MODE key:
    // zustand probes `import.meta.env ? import.meta.env.MODE : ...`, and the
    // truthiness probe would otherwise survive as an empty import.meta.
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    plugins: [{
      // Bundle purity gate (build-time mirror of the module-edge rules): the
      // baseline and package-specific requests stay external, inline-safe wire layers
      // inline, and every other @deepseek-ai value import is a build error — a
      // cross-plugin value import either inlines a duplicate runtime instance
      // or requires a specifier the module table cannot answer for this package.
      // Cross-plugin collaboration goes through cordis services instead.
      name: 'dsh-client-bundle-purity',
      resolveId(source: string) {
        if (!source.startsWith('@deepseek-ai/')) return null
        if (isRequested(source)) return null // requested module-table row: external wins
        if (VENDORED_LIBRARY.test(source)) return null // vendored library: inline, no shared identity
        if (INLINE_SAFE.test(source) || GENERATED_REMOTE.test(source)) return null // wire contribution: inline is the point
        throw new Error(
          `client bundle purity: "${source}" is not in the default client externals or ${id}'s dsh.client.external, an inline-safe wire layer, or a generated /remote contribution — `
          + 'cross-plugin value imports are forbidden; declare a non-default module request or collaborate through cordis services '
          + '(type-only imports are erased and never reach this gate)',
        )
      },
    }, tscSourceMapPlugin(), asyncChunkRequirePlugin(), ...cssPlugins(id, packageRoot), packageRelativeCssIds(packageRoot)],
    outputOptions: {
      entryFileNames: 'client.js',
      // The imported source basename becomes the published chunk name; package
      // files lists and artifact tests pin every intentional chunk.
      chunkFileNames: 'client.[name].js',
      sourcemapExcludeSources: false,
      // The map is served from /plugins/<scoped-package>/client.js.map. The
      // browser resolves its local sources back into URLs that mirror the
      // /packages/<group>/<package>/src directories; sourcesContent keeps them usable
      // without exposing that tree as an HTTP route.
      sourcemapPathTransform: browserSourcePath,
      banner: (chunk) => {
        const registration = `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, ${chunk.isEntry ? '' : `chunk: ${JSON.stringify(chunk.fileName)}, `}factory: (require) => {`
        const prefix = clientBanner?.(chunk.fileName)
        return prefix === undefined ? registration : `${prefix}\n${registration}`
      },
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  }
}

/**
 * The CSS loaders every browser output of a package shares: `x.module.css`
 * yields its hashed class map and injects a tagged style at module
 * execution, `x.css?inline` exports compiled text, and any other `.css`
 * import injects a tagged global style. Style tags are stamped with `id`.
 * Class hashes derive from the stylesheet's path relative to `packageRoot`,
 * so they do not depend on the checkout location.
 * @param id - the owning package's plugin id.
 * @param packageRoot - the owning package's root directory.
 */
export function cssPlugins(id: string, packageRoot: string): TsdownPlugin[] {
  return [{
    name: 'dsh-css-modules-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
      return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      // The virtual id otherwise hides the physical stylesheet from Rolldown's watch graph.
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({
        filename: fileId,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        // `[hash]` hashes the stylesheet path; relative to the package root it
        // is the same in every checkout, so committed class names are stable.
        projectRoot: packageRoot,
        minify: true,
      })
      // lightningcss does not guarantee a stable iteration order for its
      // exports, so an unsorted map makes every rebuild rewrite the committed
      // client bundle with an identical-but-reordered class table. This
      // package ships lib/ for direct GitHub installs, where that churn buries
      // real changes in the diff.
      const classMap: Record<string, string> = {}
      const exportEntries = Object.entries(cssExports ?? {})
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      for (const [local, exp] of exportEntries) classMap[local] = exp.name
      return styleInjectionModule(id, fileId, JSON.stringify(code.toString()), classMap)
    },
  }, {
    name: 'dsh-css-text-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith(`.css${INLINE_CSS_QUERY}`)) return null
      const stylesheet = source.slice(0, -INLINE_CSS_QUERY.length)
      const abs = importer !== undefined ? sourceAssetPath(stylesheet, importer) : stylesheet
      return INLINE_CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(INLINE_CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(INLINE_CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code } = transform({ filename: fileId, code: source, minify: true })
      return `export default ${JSON.stringify(code.toString())};`
    },
  }, {
    name: 'dsh-css-global-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.css') || source.endsWith('.module.css')) return null
      const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
      return GLOBAL_CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(GLOBAL_CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(GLOBAL_CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code } = transform({ filename: fileId, code: source, minify: true })
      return styleInjectionModule(id, fileId, JSON.stringify(code.toString()))
    },
  }]
}

/** A CSS virtual id as rolldown prints it (raw NUL or escaped `\0`) around an absolute stylesheet path. */
const ABSOLUTE_CSS_VIRTUAL_ID = /(\0|\\0)(dsh-(?:global-|inline-)?css):((?:[A-Za-z]:[\\/]|\/)[^\r\n"'`]*?\.css\.mjs)/g

/**
 * Rewrite absolute CSS virtual ids under `packageRoot` into package-relative,
 * forward-slash ids. Ids outside the package are left for the published-path
 * purity gate to reject.
 * @param packageRoot - the owning package's root directory.
 */
export function packageRelativeVirtualIds(packageRoot: string): (code: string) => string {
  const root = resolvePath(packageRoot).replaceAll('\\', '/').replace(/\/+$/, '')
  return code => code.replace(ABSOLUTE_CSS_VIRTUAL_ID, (match, marker: string, prefix: string, path: string) => {
    // Inside a JSON string every backslash is escaped; normalize either spelling.
    const normalized = path.replaceAll('\\\\', '/').replaceAll('\\', '/')
    if (!normalized.startsWith(`${root}/`)) return match
    return `${marker}${prefix}:${normalized.slice(root.length + 1)}`
  })
}

/**
 * Keep machine-local CSS virtual ids (the `//#region` markers rolldown prints
 * for each stylesheet module) out of committed and published bundles.
 * @param packageRoot - the owning package's root directory.
 */
export function packageRelativeCssIds(packageRoot: string): TsdownPlugin {
  const rewrite = packageRelativeVirtualIds(packageRoot)
  return {
    name: 'dsh-css-package-relative-ids',
    generateBundle(_options, outputBundle) {
      for (const file of Object.values(outputBundle)) {
        if (file.type === 'chunk') file.code = rewrite(file.code)
        else if (typeof file.source === 'string') file.source = rewrite(file.source)
      }
    },
  }
}

/** Chain tsc's emitted maps into any Client bundle that consumes `lib/types`. */
function tscSourceMapPlugin() {
  return {
    name: 'dsh-tsc-sourcemap',
    async load(id: string) {
      if (!id.includes(TYPES_MARKER) || !id.endsWith('.js') || !existsSync(`${id}.map`)) return null
      const code = await readFile(id, 'utf8')
      const mapPath = `${id}.map`
      const map = JSON.parse(await readFile(mapPath, 'utf8')) as {
        sourceRoot?: unknown
        sources?: unknown
        sourcesContent?: unknown
        [key: string]: unknown
      }
      if (!Array.isArray(map.sources) || map.sources.some(source => typeof source !== 'string')) {
        throw new Error(`client sourcemap: ${mapPath} has invalid sources`)
      }
      const sources = map.sources as string[]
      if (
        !Array.isArray(map.sourcesContent)
        || map.sourcesContent.length !== sources.length
        || map.sourcesContent.some(source => typeof source !== 'string')
      ) {
        const sourceRoot = typeof map.sourceRoot === 'string' ? map.sourceRoot : ''
        map.sourcesContent = await Promise.all(sources.map(async source =>
          await readFile(resolvePath(dirname(mapPath), sourceRoot, source), 'utf8')))
      }
      return { code: code.replace(SOURCEMAP_COMMENT, ''), map }
    },
  }
}

/** Path segment separating a package's tsc output from the sources it was emitted from. */
const TYPES_MARKER = `${sep}lib${sep}types${sep}`

/** Trailing sourcemap reference tsc appends to every emitted module. */
const SOURCEMAP_COMMENT = /\n\/\/# sourceMappingURL=.*\s*$/

/** Resolve an emitted JS asset import against its source-tree counterpart. */
function sourceAssetPath(source: string, importer: string): string {
  if (!source.startsWith('.') && !isAbsolute(source)) return createRequire(importer).resolve(source)
  const emitted = resolvePath(dirname(importer), source)
  if (existsSync(emitted)) return emitted
  const boundary = emitted.indexOf(TYPES_MARKER)
  if (boundary < 0) return emitted
  return resolvePath(emitted.slice(0, boundary), 'src', emitted.slice(boundary + TYPES_MARKER.length))
}
