/**
 * Tarball install lifecycle for `@dsh-portable/visual`: the committed lib is
 * pure and complete, `pnpm pack` ships exactly the whitelisted inventory, and
 * the installed tarball works in an isolated consumer with no workspace links.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  assertAuditedWebClientRoster,
  assertNoBuildTimeWorkspaceImports,
  assertPublishedChunkReachability,
  assertPublishedPathPurity,
  publicJsEntriesFromManifest,
} from '../../../tests/package-purity.mjs'
import { assertPackageOutput } from '../../../scripts/assert-package-output.mjs'
import { publicDeclarationClosure } from '../../../scripts/declaration-closure.mjs'
import { repositoryRoot } from '../../../scripts/workspace.mjs'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const suppliedTarball = process.argv[2] === undefined ? undefined : resolve(process.argv[2])

function assertInside(root, target) {
  const offset = relative(resolve(root), resolve(target))
  assert.ok(
    offset !== '' && offset !== '..' && !offset.startsWith(`..${sep}`) && !isAbsolute(offset),
    `refusing to manage a path outside the smoke root: ${target}`,
  )
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options })
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')} failed:\n${result.error?.stack || `${result.stderr}\n${result.stdout}`}`,
  )
  return result.stdout.trim()
}

function runPnpm(args, cwd) {
  const pnpmEntrypoint = process.env.npm_execpath
  if (pnpmEntrypoint?.toLowerCase().includes('pnpm')) {
    if (pnpmEntrypoint.toLowerCase().endsWith('.exe')) return run(pnpmEntrypoint, args, { cwd })
    return run(process.execPath, [pnpmEntrypoint, ...args], { cwd })
  }
  return run(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
    cwd,
    // Node cannot CreateProcess a .cmd shim directly. All arguments on this
    // fallback path are script-owned temp paths/options (no user input).
    shell: process.platform === 'win32',
  })
}

async function collectRelativeFiles(root) {
  const files = []
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) files.push(relative(root, path).replaceAll('\\', '/'))
    }
  }
  await visit(root)
  return files.sort()
}

/** Bare module specifiers a bundled ESM file imports. */
function bareImports(contents) {
  const specifiers = new Set()
  for (const match of contents.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"'\n]+)["']/g)) {
    if (!match[1].startsWith('.') && !match[1].startsWith('/')) specifiers.add(match[1])
  }
  return [...specifiers].sort()
}

async function expectedPackedInventory(manifest) {
  const runtimeFiles = (await readdir(join(packageRoot, 'lib'), { withFileTypes: true }))
    .filter(entry => entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.js.map')))
    .map(entry => `lib/${entry.name}`)
  const declarations = await publicDeclarationClosure(packageRoot, manifest)
  return [...new Set([
    'LICENSE',
    'package.json',
    ...runtimeFiles,
    ...declarations,
    ...declarations.map(path => `${path}.map`),
  ])].sort()
}

async function importFrom(path) {
  return import(`${pathToFileURL(path).href}?acceptance=${Date.now().toString()}`)
}

const temporaryParent = resolve(tmpdir())
const smokeRoot = await mkdtemp(join(temporaryParent, 'dsh-visual-package-'))

try {
  assertInside(temporaryParent, smokeRoot)
  const sourceManifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
  assert.equal(sourceManifest.name, '@dsh-portable/visual')
  assertAuditedWebClientRoster(sourceManifest)
  const sourceLib = join(packageRoot, 'lib')
  const sourcePurity = await assertPublishedPathPurity(sourceLib, { checkoutRoot: repositoryRoot })
  const sourceReachability = await assertPublishedChunkReachability(sourceLib, { manifest: sourceManifest, typeFiles: [] })
  await assertNoBuildTimeWorkspaceImports(sourceLib, sourceManifest)
  const sourceOutput = await assertPackageOutput(packageRoot)
  const sourceTypeFiles = (await collectRelativeFiles(join(sourceLib, 'types'))).map(path => `lib/types/${path}`)
  const listed = sourceManifest.files.filter(path => path.startsWith('lib/types/'))
  assert.deepEqual(sourceTypeFiles, [...listed].sort(), 'source lib/types must contain exactly the listed declarations and maps')

  const packRoot = join(smokeRoot, 'pack')
  await mkdir(packRoot, { recursive: true })
  let tarball = suppliedTarball
  if (tarball === undefined) {
    runPnpm(['pack', '--pack-destination', packRoot], packageRoot)
    const packedFiles = (await readdir(packRoot)).filter(name => name.endsWith('.tgz'))
    assert.equal(packedFiles.length, 1, 'pnpm pack must emit exactly one tarball')
    tarball = join(packRoot, packedFiles[0])
  } else {
    await readFile(tarball)
    const staged = join(packRoot, basename(tarball))
    await cp(tarball, staged)
    tarball = staged
  }

  // Address both tar operands relative to the smoke root: a Windows drive
  // path would otherwise read as `host:path` to GNU tar.
  const extractionRoot = join(smokeRoot, 'tar-stage')
  await mkdir(extractionRoot, { recursive: true })
  const localOperand = path => relative(smokeRoot, path).split(sep).join('/')
  run('tar', ['-xf', localOperand(tarball), '-C', localOperand(extractionRoot)], { cwd: smokeRoot })
  const packedPackage = join(extractionRoot, 'package')
  const manifest = JSON.parse(await readFile(join(packedPackage, 'package.json'), 'utf8'))
  assert.equal(manifest.name, '@dsh-portable/visual')
  const tarballPurity = await assertPublishedPathPurity(join(packedPackage, 'lib'), { checkoutRoot: repositoryRoot })
  const packedOutput = await assertPackageOutput(packedPackage)
  const tarballReachability = await assertPublishedChunkReachability(join(packedPackage, 'lib'), { manifest, typeFiles: [] })
  const expectedInventory = await expectedPackedInventory(sourceManifest)
  const actualInventory = await collectRelativeFiles(packedPackage)
  assert.deepEqual(
    actualInventory.filter(path => !expectedInventory.includes(path)),
    [],
    'tarball contains files outside the package inventory allowlist',
  )
  assert.deepEqual(
    expectedInventory.filter(path => !actualInventory.includes(path)),
    [],
    'tarball is missing files required by the package inventory allowlist',
  )
  for (const exportName of ['.', './protocol', './react', './package.json']) {
    assert.ok(manifest.exports[exportName], `missing export ${exportName}`)
  }

  // Install the packed tarball into an isolated consumer, with its optional
  // peers at the versions this package builds against.
  const consumerRoot = join(smokeRoot, 'consumer')
  await mkdir(consumerRoot, { recursive: true })
  const consumerPeers = Object.fromEntries(Object.entries(sourceManifest.peerDependencies ?? {})
    .map(([name, range]) => [name, sourceManifest.devDependencies?.[name] ?? range]))
  await writeFile(join(consumerRoot, 'package.json'), `${JSON.stringify({
    name: 'visual-package-consumer',
    private: true,
    type: 'module',
    dependencies: {
      '@dsh-portable/visual': `file:${tarball.replaceAll('\\', '/')}`,
      ...consumerPeers,
    },
  }, null, 2)}\n`)
  runPnpm([
    'install',
    '--ignore-scripts',
    '--prefer-offline',
    '--prod',
    '--config.package-import-method=clone-or-copy',
  ], consumerRoot)

  // The public type routes resolve from a clean consumer.
  await writeFile(join(consumerRoot, 'types-smoke.ts'), [
    "import type { PlotContent, VisualDocument } from '@dsh-portable/visual/protocol'",
    "import type { VisualLabels, VisualViewProps } from '@dsh-portable/visual/react'",
    "import { VISUAL_PACKAGE_NAME } from '@dsh-portable/visual'",
    'declare const document: VisualDocument',
    'declare const plot: PlotContent',
    'declare const labels: Partial<VisualLabels>',
    'const props: VisualViewProps = { visual: document, labels }',
    'void [plot, props, VISUAL_PACKAGE_NAME]',
  ].join('\n'))
  const packageRequire = createRequire(import.meta.url)
  run(process.execPath, [
    packageRequire.resolve('typescript/bin/tsc'),
    '--noEmit',
    '--target', 'ES2022',
    '--module', 'ESNext',
    '--moduleResolution', 'Bundler',
    '--skipLibCheck',
    'types-smoke.ts',
  ], { cwd: consumerRoot })

  const resolveScript = [
    "import { fileURLToPath } from 'node:url'",
    "console.log(fileURLToPath(new URL(import.meta.resolve('@dsh-portable/visual/package.json'))))",
  ].join(';')
  const installedManifest = run(process.execPath, ['--input-type=module', '--eval', resolveScript], { cwd: consumerRoot })
  const installedPackage = dirname(installedManifest.split(/\r?\n/).at(-1))
  assertInside(consumerRoot, installedPackage)

  // `.` and `./protocol` run under Node with no dependencies.
  const host = await importFrom(join(installedPackage, 'lib', 'index.js'))
  assert.equal(host.VISUAL_PACKAGE_NAME, '@dsh-portable/visual')
  assert.equal(typeof host.apply, 'undefined', 'the host entry mounts nothing yet')
  const protocol = await importFrom(join(installedPackage, 'lib', 'protocol.js'))
  const sample = {
    title: 'Identity',
    content: {
      kind: 'plot',
      xAxis: { label: 'x', min: 0, max: 1 },
      yAxis: { label: 'y', min: 0, max: 1 },
      series: [{ type: 'curve', id: 'identity', label: 'y = x', expression: { op: 'variable', name: 'x' } }],
    },
  }
  assert.equal(protocol.parseVisualDocument(sample), sample)
  assert.throws(() => protocol.parseVisualDocument({ protocol: 'dsh-learning/visual@4', ...sample }), protocol.VisualProtocolError)
  assert.deepEqual([...protocol.VISUAL_CONTENT_KINDS].length, 15)

  // `./react` is an ESM module for bundlers: its runtime imports are exactly
  // its declared peers, and each resolves from the consumer.
  const reactEntry = join(installedPackage, 'lib', 'react.js')
  run(process.execPath, ['--check', reactEntry])
  const reactImports = bareImports(await readFile(reactEntry, 'utf8'))
  const peerNames = Object.keys(sourceManifest.peerDependencies ?? {})
  assert.deepEqual(
    reactImports.filter(specifier => !peerNames.some(name => specifier === name || specifier.startsWith(`${name}/`))),
    [],
    'lib/react.js imports a module that is not a declared peer',
  )
  const consumerRequire = createRequire(join(consumerRoot, 'package.json'))
  for (const specifier of reactImports) {
    const peer = peerNames.find(name => specifier === name || specifier.startsWith(`${name}/`))
    consumerRequire.resolve(`${peer}/package.json`)
  }

  console.log(JSON.stringify({
    tarball,
    installationMode: 'pnpm-pack-isolated-consumer-install',
    package: `${manifest.name}@${manifest.version}`,
    pathPurity: 'source-lib-and-tarball-pass',
    pathPurityFiles: { source: sourcePurity.filesScanned, tarball: tarballPurity.filesScanned },
    chunkReachability: { source: sourceReachability, tarball: tarballReachability },
    inventory: {
      files: actualInventory.length,
      publicJsEntries: publicJsEntriesFromManifest(manifest).length,
      publicDeclarations: packedOutput.publicDeclarations,
      publicDeclarationMaps: packedOutput.publicDeclarationMaps,
      sourceDeclarations: sourceOutput.publicDeclarations,
    },
    reactPeerImports: reactImports,
    protocolParses: true,
  }, null, 2))
} finally {
  assertInside(temporaryParent, smokeRoot)
  await rm(smokeRoot, { recursive: true, force: true })
}
