import { afterEach, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  LEARNING_BUNDLE_PACKAGE,
  LEARNING_MANIFEST_FILE,
  LEARNING_PRESET_ID,
  installLearningPreset,
  legacyLearningPresetTarget,
  uninstallLearningPreset,
} from '../src/installer.ts'

const roots: string[] = []

const sha = (value: string): string => createHash('sha256').update(value).digest('hex')

/**
 * A legacy `$DSH_HOME/.agent-presets/learning` copy exactly as the harness-0.1
 * directory installer left it: package files plus an ownership manifest that
 * records each file's package-owned hash (and a staged sidecar for a file the
 * user had edited before an upgrade).
 */
async function legacyInstall() {
  const root = await mkdtemp(join(tmpdir(), 'dsh-learning-installer-'))
  roots.push(root)
  const home = join(root, 'home')
  const target = join(home, '.agent-presets', 'learning')
  const owned: Record<string, string> = {
    'preset.yml': 'name: Learning\n',
    'skills/teaching/SKILL.md': '# Teach\n',
    'skills/teaching/references/visual-routing.md': '# Visual routing\n',
    'agent.cordis.yml.dsh-new-0.1.0': 'version: two\n',
  }
  const files: Record<string, string> = { ...owned, 'agent.cordis.yml': 'user: customized\n' }
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(target, path)), { recursive: true })
    await writeFile(join(target, path), content)
  }
  await writeFile(join(target, LEARNING_MANIFEST_FILE), JSON.stringify({
    schema: 1,
    presetSchema: 1,
    package: '@dsh-portable/interactive-learning',
    packageVersion: '0.1.0',
    preset: 'learning',
    source: 'package',
    installedAt: new Date(0).toISOString(),
    userModified: true,
    files: Object.entries(owned).map(([path, content]) => ({ path, ownedHash: sha(content) })),
    preservedFiles: [{
      path: 'agent.cordis.yml',
      observedHash: sha('user: customized\n'),
      desiredHash: sha('version: two\n'),
      stagedPath: 'agent.cordis.yml.dsh-new-0.1.0',
    }],
  }))
  return { root, home, target }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('legacy preset directory lifecycle (harness 0.2)', () => {
  it('addresses the former $DSH_HOME/.agent-presets/learning directory', async () => {
    const fx = await legacyInstall()
    expect(legacyLearningPresetTarget(fx.home)).toBe(fx.target)
  })

  it('install copies nothing, points at the bundle, and retires an owned legacy copy', async () => {
    const fx = await legacyInstall()
    const result = await installLearningPreset({ dshHome: fx.home })
    expect(result).toMatchObject({
      bundle: LEARNING_BUNDLE_PACKAGE,
      presetId: LEARNING_PRESET_ID,
      installCommand: `dsh plugin --profile <profile> add ${LEARNING_BUNDLE_PACKAGE}`,
      legacy: { target: fx.target, manifestFound: true },
    })
    expect(result.legacy.removed).toEqual(expect.arrayContaining([
      'preset.yml',
      'skills/teaching/SKILL.md',
      'skills/teaching/references/visual-routing.md',
      'agent.cordis.yml.dsh-new-0.1.0',
    ]))
    // A user edit survives and nothing else remains.
    expect(result.legacy.preserved).toContain('agent.cordis.yml')
    expect(await readdir(fx.target)).toEqual(['agent.cordis.yml'])
    expect(await readFile(join(fx.target, 'agent.cordis.yml'), 'utf8')).toBe('user: customized\n')
  })

  it('removes only owned hashes and preserves a file the user edited after install', async () => {
    const fx = await legacyInstall()
    await writeFile(join(fx.target, 'preset.yml'), 'name: My Learning\n')
    const removed = await uninstallLearningPreset({ dshHome: fx.home })
    expect(removed.manifestFound).toBe(true)
    expect(removed.removed).toContain('skills/teaching/SKILL.md')
    expect(removed.preserved).toEqual(expect.arrayContaining(['preset.yml', 'agent.cordis.yml']))
    expect(await readFile(join(fx.target, 'preset.yml'), 'utf8')).toBe('name: My Learning\n')
    await expect(readFile(join(fx.target, LEARNING_MANIFEST_FILE), 'utf8')).rejects.toThrow()
  })

  it('does nothing without an ownership manifest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-learning-installer-'))
    roots.push(root)
    const home = join(root, 'home')
    const target = legacyLearningPresetTarget(home)
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'mine.yml'), 'user-owned\n')
    const result = await uninstallLearningPreset({ dshHome: home })
    expect(result).toMatchObject({ manifestFound: false, removed: [] })
    expect(await readFile(join(target, 'mine.yml'), 'utf8')).toBe('user-owned\n')
    const install = await installLearningPreset({ dshHome: home })
    expect(install.legacy).toMatchObject({ manifestFound: false, removed: [] })
    expect(await readFile(join(target, 'mine.yml'), 'utf8')).toBe('user-owned\n')
  })
})
