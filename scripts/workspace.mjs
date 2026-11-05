/**
 * Workspace facts shared by the build and package-check scripts.
 *
 * The repository root is itself a package (`@dsh-portable/interactive-learning`)
 * and `packages/*` holds its sibling workspace packages (`pnpm-workspace.yaml`).
 * Every script that acts on "this package" acts on the package it was invoked
 * for: an explicit directory argument, else the package whose `pnpm run`
 * script is running (`npm_package_json`), else the repository root.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Resolve the package a script acts on.
 * @param argument - an explicit package directory, when the caller passed one.
 * @returns the package root directory.
 */
export function invokedPackageRoot(argument = undefined) {
  const root = argument !== undefined
    ? resolve(argument)
    : process.env.npm_package_json !== undefined
      ? dirname(resolve(process.env.npm_package_json))
      : repositoryRoot
  assert.ok(existsSync(join(root, 'package.json')), `not a package directory: ${root}`)
  return root
}

/** Read one package manifest. */
export function readManifest(packageRoot) {
  return JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
}

/** Every workspace package: the repository root plus each `packages/*` directory with a manifest. */
export function workspacePackages() {
  const packagesRoot = join(repositoryRoot, 'packages')
  const roots = [repositoryRoot, ...(existsSync(packagesRoot)
    ? readdirSync(packagesRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && existsSync(join(packagesRoot, entry.name, 'package.json')))
      .map(entry => join(packagesRoot, entry.name))
      .sort()
    : [])]
  return roots.map(root => ({ root, manifest: readManifest(root) }))
}

/** Names this manifest depends on through the `workspace:` protocol, in any dependency section. */
export function workspaceDependencyNames(manifest) {
  const names = new Set()
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const [name, spec] of Object.entries(manifest[section] ?? {})) {
      if (typeof spec === 'string' && spec.startsWith('workspace:')) names.add(name)
    }
  }
  return [...names].sort()
}

/**
 * Workspace packages a package depends on only at build time
 * (`workspace:` devDependencies): the build inlines them, so published runtime
 * code must never import them.
 */
export function buildTimeWorkspaceDependencies(manifest) {
  return Object.entries(manifest.devDependencies ?? {})
    .filter(([, spec]) => typeof spec === 'string' && spec.startsWith('workspace:'))
    .map(([name]) => name)
    .sort()
}

/**
 * The package and the workspace packages it depends on, dependencies first.
 * @param packageRoot - the package to build.
 * @returns package roots in build order, each once.
 */
export function workspaceBuildOrder(packageRoot) {
  const byName = new Map(workspacePackages().map(entry => [entry.manifest.name, entry.root]))
  const order = []
  const visiting = new Set()
  const visit = (root) => {
    if (order.includes(root)) return
    assert.ok(!visiting.has(root), `workspace dependency cycle through ${relative(repositoryRoot, root) || '.'}`)
    visiting.add(root)
    for (const name of workspaceDependencyNames(readManifest(root))) {
      const dependency = byName.get(name)
      assert.ok(dependency !== undefined, `${name} is not a workspace package`)
      visit(dependency)
    }
    visiting.delete(root)
    order.push(root)
  }
  visit(resolve(packageRoot))
  return order
}

/** A package-relative display path (`.` for the repository root). */
export function displayPath(root) {
  return relative(repositoryRoot, root).replaceAll('\\', '/') || '.'
}
