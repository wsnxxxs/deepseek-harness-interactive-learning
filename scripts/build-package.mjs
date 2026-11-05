import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, readdir, rm } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { assertPackageOutput } from './assert-package-output.mjs'
import {
  assertManifestDeclarationFiles,
  declarationMapClosure,
  publicDeclarationClosure,
} from './declaration-closure.mjs'
import { displayPath, invokedPackageRoot, readManifest, workspaceBuildOrder } from './workspace.mjs'

function assertExactPackageLib(packageRoot, target) {
  const offset = relative(packageRoot, resolve(target))
  assert.equal(offset, 'lib', `refusing to clean anything except this package's lib: ${target}`)
  assert.ok(!isAbsolute(offset) && offset !== '..' && !offset.startsWith(`..${sep}`))
}

function runPnpm(args, cwd) {
  const pnpmEntrypoint = process.env.npm_execpath
  const result = pnpmEntrypoint?.toLowerCase().includes('pnpm')
    ? spawnSync(
        pnpmEntrypoint.toLowerCase().endsWith('.exe') ? pnpmEntrypoint : process.execPath,
        pnpmEntrypoint.toLowerCase().endsWith('.exe') ? args : [pnpmEntrypoint, ...args],
        { cwd, encoding: 'utf8' },
      )
    : spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
        cwd,
        encoding: 'utf8',
        shell: process.platform === 'win32',
      })
  assert.equal(
    result.status,
    0,
    `pnpm ${args.join(' ')} failed in ${displayPath(cwd)}:\n${result.error?.stack || `${result.stderr}\n${result.stdout}`}`,
  )
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
}

async function collectFiles(root) {
  const files = []
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) files.push(path)
    }
  }
  await visit(root)
  return files
}

// Build the invoked package after the workspace packages it is built from
// (`workspace:` dependencies), each from an empty lib.
const packageRoots = workspaceBuildOrder(invokedPackageRoot(process.argv[2]))
for (const packageRoot of packageRoots) {
  const libRoot = resolve(packageRoot, 'lib')
  assertExactPackageLib(packageRoot, libRoot)
  await rm(libRoot, { recursive: true, force: true })
  await mkdir(libRoot, { recursive: true })
}

// Emit every package's lib/types before pruning any of them: a later `tsc -b`
// would otherwise rebuild a referenced project whose pruned outputs it finds
// missing, and re-add them.
for (const packageRoot of packageRoots) runPnpm(['exec', 'tsc', '-b'], packageRoot)

for (const packageRoot of packageRoots) {
  const libRoot = resolve(packageRoot, 'lib')
  const typesRoot = resolve(libRoot, 'types')
  const manifest = readManifest(packageRoot)
  const declarationClosure = await publicDeclarationClosure(packageRoot, manifest)
  assertManifestDeclarationFiles(manifest, declarationClosure)
  const keepTypeArtifacts = new Set([
    ...declarationClosure,
    ...declarationMapClosure(declarationClosure),
  ].map(path => resolve(packageRoot, ...path.split('/'))))

  runPnpm(['exec', 'tsdown'], packageRoot)
  for (const path of await collectFiles(typesRoot)) {
    if (!keepTypeArtifacts.has(path)) await rm(path)
  }
  await rm(join(libRoot, 'tsconfig.tsbuildinfo'), { force: true })
}

const outputs = []
for (const packageRoot of packageRoots) {
  outputs.push({
    package: readManifest(packageRoot).name,
    output: relative(packageRoot, resolve(packageRoot, 'lib')).replaceAll('\\', '/'),
    ...await assertPackageOutput(packageRoot),
  })
}
console.log(JSON.stringify(outputs.length === 1 ? outputs[0] : outputs, null, 2))
