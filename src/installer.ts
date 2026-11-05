/**
 * Legacy preset-directory tooling kept for compatibility with harness 0.2.
 *
 * Harness 0.1 discovered user presets from `$DSH_HOME/.agent-presets/<id>/`
 * (`preset.yml` + `agent.cordis.yml`), so this package once copied its preset
 * there. Harness 0.2 reads only declaration rows; the Learning preset now
 * ships as the `preset-learning` row of this package's bundle patch. This
 * module retires copies written by earlier versions without touching edits.
 */
import { createHash } from 'node:crypto'
import { readFile, rmdir, unlink } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { homedir } from 'node:os'

export const LEARNING_PACK_VERSION = '0.1.0'
export const LEARNING_MANIFEST_FILE = '.dsh-managed.json'

interface ManagedFile {
  path: string
  ownedHash: string
}

interface PreservedFile {
  path: string
  observedHash: string
  desiredHash: string
  stagedPath: string
}

export interface LearningInstallManifest {
  schema: 1
  presetSchema: 1
  package: '@dsh-portable/interactive-learning'
  packageVersion: string
  preset: 'learning'
  source: 'package'
  installedAt: string
  userModified: boolean
  files: ManagedFile[]
  preservedFiles: PreservedFile[]
}

/** Outcome of the compatibility `install` command on harness >= 0.2. */
export interface LearningInstallResult {
  /** Bundle package whose `dsh.bundle.patch` declares the preset row. */
  bundle: typeof LEARNING_BUNDLE_PACKAGE
  /** Preset id sessions select (`config.id` of the `preset-learning` row). */
  presetId: typeof LEARNING_PRESET_ID
  /** Plugin-manager command that installs the bundle into a profile. */
  installCommand: string
  /** Retirement of a legacy `$DSH_HOME/.agent-presets/learning` copy. */
  legacy: LearningUninstallResult
}

export interface LearningUninstallResult {
  target: string
  removed: string[]
  preserved: string[]
  manifestFound: boolean
}

export interface LearningInstallerOptions {
  dshHome?: string
}

/** Package that ships the preset declaration in its bundle patch. */
export const LEARNING_BUNDLE_PACKAGE = '@dsh-portable/interactive-learning'
/** Stable preset id recorded by sessions that select Learning. */
export const LEARNING_PRESET_ID = 'learning'

/** Legacy (harness < 0.2) user-preset directory that earlier versions wrote. */
export function legacyLearningPresetTarget(dshHome?: string): string {
  return targetFor(dshHome)
}

function defaultDshHome(): string {
  const configured = process.env.DSH_HOME?.trim()
  return resolve(configured === undefined || configured === '' ? join(homedir(), '.dsh') : configured)
}

function targetFor(dshHome?: string): string {
  return join(resolve(dshHome ?? defaultDshHome()), '.agent-presets', 'learning')
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

async function fileDigest(path: string): Promise<string | undefined> {
  try {
    return digest(await readFile(path))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

function safePath(root: string, candidate: string): string | undefined {
  if (candidate === '' || candidate.startsWith('/') || candidate.startsWith('\\')) return undefined
  const destination = resolve(root, candidate)
  const resolvedRoot = resolve(root)
  if (destination !== resolvedRoot && !destination.startsWith(`${resolvedRoot}${sep}`)) return undefined
  return destination
}

async function readManifest(path: string): Promise<LearningInstallManifest | undefined> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as LearningInstallManifest
    if (parsed.schema !== 1 || parsed.package !== '@dsh-portable/interactive-learning'
      || parsed.preset !== 'learning' || !Array.isArray(parsed.files)) return undefined
    return {
      ...parsed,
      presetSchema: 1,
      userModified: parsed.userModified === true,
      preservedFiles: Array.isArray(parsed.preservedFiles) ? parsed.preservedFiles : [],
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) return undefined
    throw error
  }
}

/**
 * Harness >= 0.2 compatibility entry for the former directory installer.
 *
 * The 0.2 agent-preset registry reads only `@deepseek-ai/dsh-agent-preset`
 * declaration rows and no longer scans `$DSH_HOME/.agent-presets/<id>/`
 * (upstream `packages/preset/agent-preset-registry/README.md`). The Learning
 * preset is therefore declared by this package's own bundle patch
 * (`cordis.patch.yml`), which the plugin manager layers into a profile when
 * the package is installed as a bundle. Copying files into the legacy
 * directory would create a preset nothing reads, so this function only
 * retires a legacy copy written by an earlier version (removing files whose
 * content still matches the package-owned hash and preserving user edits)
 * and reports how to install the bundle.
 */
export async function installLearningPreset(
  options: Pick<LearningInstallerOptions, 'dshHome'> = {},
): Promise<LearningInstallResult> {
  const legacy = await uninstallLearningPreset(options)
  return {
    bundle: LEARNING_BUNDLE_PACKAGE,
    presetId: LEARNING_PRESET_ID,
    installCommand: `dsh plugin --profile <profile> add ${LEARNING_BUNDLE_PACKAGE}`,
    legacy,
  }
}

/** Uninstall only files whose current content still matches the package-owned hash. */
export async function uninstallLearningPreset(options: Pick<LearningInstallerOptions, 'dshHome'> = {}): Promise<LearningUninstallResult> {
  const target = targetFor(options.dshHome)
  const manifestPath = join(target, LEARNING_MANIFEST_FILE)
  const manifest = await readManifest(manifestPath)
  if (manifest === undefined) return { target, removed: [], preserved: [], manifestFound: false }
  const removed: string[] = []
  const preserved = manifest.preservedFiles.map(file => file.path)
  for (const file of manifest.files) {
    const path = safePath(target, file.path)
    if (path === undefined) {
      preserved.push(file.path)
      continue
    }
    const currentHash = await fileDigest(path)
    if (currentHash === undefined) continue
    if (currentHash !== file.ownedHash) {
      preserved.push(file.path)
      continue
    }
    await unlink(path)
    removed.push(file.path)
  }
  await unlink(manifestPath)
  const directories: string[] = []
  for (const file of removed) {
    let directory = dirname(join(target, file))
    while (directory !== target && directory.startsWith(`${target}${sep}`)) {
      directories.push(directory)
      directory = dirname(directory)
    }
  }
  directories.sort((a, b) => b.length - a.length)
  for (const directory of new Set(directories)) {
    if (directory === target) continue
    try { await rmdir(directory) } catch {}
  }
  try { await rmdir(target) } catch {}
  return { target, removed, preserved: [...new Set(preserved)], manifestFound: true }
}
