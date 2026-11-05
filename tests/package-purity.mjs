import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildTimeWorkspaceDependencies, repositoryRoot } from '../scripts/workspace.mjs'

// Require the first path-segment character so CSS such as `content:\"\"`
// cannot be mistaken for a Windows drive path ending at an escaped quote.
const WINDOWS_ABSOLUTE_PATH = /[A-Za-z]:[\\/]+[A-Za-z0-9_.-]/
const WINDOWS_FILE_URL = /file:\/\/[A-Za-z]:[\\/]/i
const HASHED_CHUNK_NAME = /-[A-Za-z0-9_-]{8,16}\.js$/
const RELATIVE_JS_REFERENCE = /["'](\.{1,2}\/[^"']+\.js)["']/g
const SOURCE_MAP_REFERENCE = /\/\/# sourceMappingURL=([^\s]+)/g

// Harness 0.2 roster: `slots` comes from the UI renderer (the retired
// dsh-client-runtime provided it in 0.1), `locale` from the locale plugin, the
// composer chain and keyed tool-view slots from conversation/tool, the pending
// Learning question carrier from the question plugin, and the optional recall
// RPC from the Connection plugin.
export const EXPECTED_WEB_CLIENT_INJECT = Object.freeze([
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-tool',
  '@deepseek-ai/dsh-client-ui-user-questions',
  '@deepseek-ai/dsh-client-connection',
])

/**
 * Every workspace package's audited web client roster. A package absent here
 * must not declare a `dsh.client` roster at all until one is audited.
 */
export const AUDITED_WEB_CLIENT_INJECT = Object.freeze({
  '@dsh-portable/interactive-learning': EXPECTED_WEB_CLIENT_INJECT,
})

function normalizePath(path) {
  return resolve(path).replaceAll('\\', '/')
}

function jsTargetUnderLib(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`)
  const normalized = value.replace(/^\.\//, '').replaceAll('\\', '/')
  assert.ok(
    normalized.startsWith('lib/')
      && normalized.endsWith('.js')
      && !normalized.includes('../'),
    `${label} must name a JavaScript file under lib: ${value}`,
  )
  return normalized.slice('lib/'.length)
}

/** Derive the only runtime DFS roots from package.json public and bin entries. */
export function publicJsEntriesFromManifest(manifest) {
  assert.equal(typeof manifest, 'object')
  assert.ok(manifest !== null)
  const targets = [jsTargetUnderLib(manifest.main, 'package.main')]
  for (const [name, entry] of Object.entries(manifest.exports ?? {})) {
    if (typeof entry !== 'object' || entry === null || !Object.hasOwn(entry, 'default')) continue
    targets.push(jsTargetUnderLib(entry.default, `package.exports[${JSON.stringify(name)}].default`))
  }
  const bins = typeof manifest.bin === 'string' ? { default: manifest.bin } : manifest.bin ?? {}
  for (const [name, target] of Object.entries(bins)) {
    targets.push(jsTargetUnderLib(target, `package.bin[${JSON.stringify(name)}]`))
  }
  return [...new Set(targets)].sort()
}

/**
 * Ensure no public package command can bypass the controlled build/prune path.
 * @param manifest - the package manifest.
 * @param options - `scriptsDir`: the repository's `scripts/` directory relative to the package.
 */
export function assertGuardedPackageScripts(manifest, { scriptsDir = 'scripts' } = {}) {
  assert.equal(manifest.scripts?.build, `node ${scriptsDir}/build-package.mjs`)
  assert.equal(manifest.scripts?.bundle, 'pnpm run build')
  assert.equal(
    manifest.scripts?.['package:prepare'],
    `pnpm run build && pnpm run test:package:purity && node ${scriptsDir}/assert-package-output.mjs`,
  )
  assert.equal(manifest.scripts?.prepack, 'pnpm run package:prepare')
  assert.equal(
    manifest.scripts?.prepublishOnly,
    'pnpm run package:prepare',
  )
}

/**
 * Hold each package to its audited web client roster (see
 * {@link AUDITED_WEB_CLIENT_INJECT}); a package without one declares none.
 */
export function assertAuditedWebClientRoster(manifest) {
  if (Object.hasOwn(AUDITED_WEB_CLIENT_INJECT, manifest.name)) {
    assertWebClientInjectRoster(manifest, AUDITED_WEB_CLIENT_INJECT[manifest.name])
    return
  }
  assert.equal(
    manifest.dsh?.client,
    undefined,
    `${manifest.name} declares a dsh.client module roster without an audited web client module roster`,
  )
}

/** Keep readiness dependencies limited to concrete web client modules. */
export function assertWebClientInjectRoster(manifest, expected = EXPECTED_WEB_CLIENT_INJECT) {
  assert.equal(manifest.dsh?.client?.platform, 'web')
  assert.deepEqual(
    manifest.dsh?.client?.inject,
    [...expected],
    'dsh.client.inject must exactly match the audited web client module roster',
  )
}

/** Every module specifier a JS file imports, re-exports, dynamically imports or requires. */
const MODULE_SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["']([^"'\n]+)["']/g

/**
 * A workspace package a package depends on only at build time is inlined by
 * its build, so no published runtime file may import it: an installed package
 * must work whether or not that sibling is installed.
 * @param root - the published `lib` directory.
 * @param manifest - the owning package's manifest.
 * @returns the number of JS files scanned and the specifiers forbidden.
 */
export async function assertNoBuildTimeWorkspaceImports(root, manifest) {
  const forbidden = buildTimeWorkspaceDependencies(manifest)
  const files = (await publishedFiles(root)).filter(path => extname(path) === '.js')
  const failures = []
  for (const path of files) {
    const contents = await readFile(path, 'utf8')
    for (const match of contents.matchAll(MODULE_SPECIFIER)) {
      const specifier = match[1]
      if (forbidden.some(name => specifier === name || specifier.startsWith(`${name}/`))) {
        failures.push(`${relative(resolve(root), path).replaceAll('\\', '/')} imports ${specifier}`)
      }
    }
  }
  assert.deepEqual(failures, [], `published runtime imports a build-time workspace package:\n${failures.join('\n')}`)
  return { filesScanned: files.length, forbidden }
}

async function publishedFiles(root) {
  const files = []
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile() && ['.js', '.map'].includes(extname(entry.name))) files.push(path)
    }
  }
  await visit(resolve(root))
  return files
}

/**
 * Fail when a published hashed chunk is not reachable from a stable JS entry.
 * Without a clean build and this gate, a retired implementation can remain in
 * source lib or a tarball even though no current public entry imports it.
 */
export async function assertPublishedChunkReachability(root, options = {}) {
  const libRoot = resolve(root)
  const manifest = options.manifest
    ?? JSON.parse(await readFile(resolve(libRoot, '..', 'package.json'), 'utf8'))
  const published = await publishedFiles(libRoot)
  const files = published.filter(path => extname(path) === '.js')
  const sourceMaps = published.filter(path => path.endsWith('.js.map'))
  const known = new Set(files)
  const knownMaps = new Set(sourceMaps)
  const relativePath = path => relative(libRoot, path).replaceAll('\\', '/')
  const knownByRelativePath = new Map(files.map(path => [relativePath(path), path]))
  const isHashedChunk = path => dirname(path) === libRoot && HASHED_CHUNK_NAME.test(basename(path))
  const publicEntries = publicJsEntriesFromManifest(manifest)
  const typeFiles = options.typeFiles ?? []
  const expectedStable = new Set([...publicEntries, ...typeFiles])
  const stable = files.filter(path => !isHashedChunk(path)).map(relativePath).sort()
  const missingExpected = [...expectedStable].filter(path => !knownByRelativePath.has(path)).sort()
  const unexpectedStable = stable.filter(path => !expectedStable.has(path))
  const roots = publicEntries.flatMap(path => {
    const entry = knownByRelativePath.get(path)
    return entry === undefined ? [] : [entry]
  })
  const reachable = new Set()
  const pending = [...roots]
  const missing = []
  const orphanedMaps = []

  for (const map of sourceMaps) {
    const owner = map.slice(0, -'.map'.length)
    if (!known.has(owner)) {
      orphanedMaps.push(`${relativePath(map)} (missing ${relativePath(owner)})`)
      continue
    }
    const ownerContents = await readFile(owner, 'utf8')
    const references = [...ownerContents.matchAll(SOURCE_MAP_REFERENCE)].map(match => match[1])
    if (!references.includes(basename(map))) {
      orphanedMaps.push(`${relativePath(map)} (not referenced by ${relativePath(owner)})`)
    }
  }

  for (const path of files) {
    const contents = await readFile(path, 'utf8')
    for (const match of contents.matchAll(RELATIVE_JS_REFERENCE)) {
      const target = resolve(dirname(path), match[1])
      if (!known.has(target)) missing.push(`${relativePath(path)} -> ${match[1]}`)
    }
    for (const match of contents.matchAll(SOURCE_MAP_REFERENCE)) {
      const target = resolve(dirname(path), match[1])
      if (!knownMaps.has(target)) missing.push(`${relativePath(path)} -> ${match[1]}`)
    }
  }

  while (pending.length > 0) {
    const path = pending.pop()
    if (path === undefined || reachable.has(path)) continue
    reachable.add(path)
    const contents = await readFile(path, 'utf8')
    for (const match of contents.matchAll(RELATIVE_JS_REFERENCE)) {
      const target = resolve(dirname(path), match[1])
      if (!known.has(target)) continue
      if (!reachable.has(target)) pending.push(target)
    }
  }

  const orphaned = files
    .filter(path => isHashedChunk(path) && !reachable.has(path))
    .map(path => basename(path))
    .sort()
  assert.deepEqual(missingExpected, [], `published JS is missing expected files:\n${missingExpected.join('\n')}`)
  assert.deepEqual(unexpectedStable, [], `published unexpected stable JS files:\n${unexpectedStable.join('\n')}`)
  assert.deepEqual(missing, [], `published JS has missing relative imports:\n${missing.join('\n')}`)
  assert.deepEqual(orphaned, [], `published orphan hashed chunks:\n${orphaned.join('\n')}`)
  assert.deepEqual(orphanedMaps, [], `published orphan source maps:\n${orphanedMaps.join('\n')}`)
  return {
    publicEntries: roots.length,
    stableFiles: stable.length,
    hashedChunks: files.filter(isHashedChunk).length,
    sourceMaps: sourceMaps.length,
  }
}

export async function assertPublishedPathPurity(root, options = {}) {
  const checkoutRoot = options.checkoutRoot === undefined ? undefined : normalizePath(options.checkoutRoot)
  const checkoutWindows = checkoutRoot?.replaceAll('/', '\\')
  const failures = []
  const files = await publishedFiles(root)

  for (const path of files) {
    const contents = await readFile(path, 'utf8')
    const reason = WINDOWS_ABSOLUTE_PATH.test(contents)
      ? 'Windows drive path'
      : WINDOWS_FILE_URL.test(contents)
        ? 'Windows file URL'
        : checkoutRoot !== undefined && (contents.includes(checkoutRoot) || contents.includes(checkoutWindows))
          ? 'checkout absolute path'
          : undefined
    if (reason !== undefined) failures.push(`${path}: ${reason}`)
  }

  assert.deepEqual(failures, [], `published path-purity violations:\n${failures.join('\n')}`)
  return { filesScanned: files.length }
}

/**
 * Check one package's published `lib`: guarded scripts, its audited client
 * roster, checkout-path purity (against the whole repository checkout),
 * chunk reachability, and no runtime import of a build-time workspace package.
 * @param target - the package's `lib` directory.
 */
export async function assertPublishedPackage(target) {
  const libRoot = resolve(target)
  const packageRoot = dirname(libRoot)
  const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
  assertGuardedPackageScripts(manifest, {
    scriptsDir: relative(packageRoot, join(repositoryRoot, 'scripts')).replaceAll('\\', '/'),
  })
  assertAuditedWebClientRoster(manifest)
  const result = await assertPublishedPathPurity(libRoot, { checkoutRoot: repositoryRoot })
  const reachability = await assertPublishedChunkReachability(libRoot, { manifest })
  const workspaceImports = await assertNoBuildTimeWorkspaceImports(libRoot, manifest)
  return { package: manifest.name, pathPurity: 'pass', ...result, reachability, workspaceImports }
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(resolve(process.argv[1])).href
if (invokedPath === import.meta.url) {
  const targets = process.argv.slice(2)
  assert.ok(targets.length > 0, 'Usage: node tests/package-purity.mjs <lib-directory>...')
  const results = []
  for (const target of targets) results.push(await assertPublishedPackage(target))
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2))
}
