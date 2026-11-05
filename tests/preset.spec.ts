import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const packageRoot = resolve(import.meta.dirname, '..')

/** The `preset-learning` declaration row of the bundle patch (harness 0.2 preset format). */
function learningPresetRow(): string {
  const patch = readFileSync(join(packageRoot, 'cordis.patch.yml'), 'utf8')
  const start = patch.indexOf("    - id: preset-learning\n      name: '@deepseek-ai/dsh-agent-preset'\n")
  expect(start).toBeGreaterThan(0)
  return patch.slice(start)
}

describe('preset isolation', () => {
  it('declares the learning preset as a 0.2 agent-preset row in the bundle patch', () => {
    const row = learningPresetRow()
    expect(row).toContain('        id: learning\n')
    expect(row).toContain('        order: 3.5\n')
    expect(row).toContain('        plugins:\n')
    // 0.2 persona schema: `prefix` (not `text`), and the `{{cwd}}` variable no longer exists.
    expect(row).toMatch(/name: '@deepseek-ai\/dsh-persona'\n\s+config:\n\s+prefix: /)
    expect(row).not.toContain('{{cwd}}')
    // Skills resolve from the installed package, not from a preset directory.
    expect(row).toContain("createRequire(baseUrl).resolve('@dsh-portable/interactive-learning/package.json')")
    expect(existsSync(join(packageRoot, 'preset/learning/skills/interactive-teaching/SKILL.md'))).toBe(true)
    // The legacy directory-preset files are gone: nothing in 0.2 reads them.
    expect(existsSync(join(packageRoot, 'preset/learning/agent.cordis.yml'))).toBe(false)
    expect(existsSync(join(packageRoot, 'preset/learning/preset.yml'))).toBe(false)
  })

  it('mounts the model-facing entry only in the learning preset', () => {
    const patch = readFileSync(join(packageRoot, 'cordis.patch.yml'), 'utf8')
    const learning = learningPresetRow()
    expect(patch.match(/@dsh-portable\/interactive-learning\/agent/g)).toHaveLength(1)
    expect(learning.match(/@dsh-portable\/interactive-learning\/agent/g)).toHaveLength(1)
    expect(patch.slice(0, patch.indexOf('preset-learning'))).not.toContain('/agent')
    expect(patch.replace(/^\s*#.*$/gm, '')).not.toContain('@deepseek-ai/dsh-tool-ask-user')
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
      peerDependencies?: Record<string, string>
      peerDependenciesMeta?: Record<string, { optional?: boolean }>
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    expect(manifest.dependencies?.['@deepseek-ai/dsh-tool-ask-user']).toBeUndefined()
    expect(manifest.peerDependencies?.['@deepseek-ai/dsh-tool-ask-user']).toBeUndefined()
    expect(manifest.peerDependenciesMeta?.['@deepseek-ai/dsh-tool-ask-user']).toBeUndefined()
    expect(manifest.devDependencies?.['@deepseek-ai/dsh-tool-ask-user']).toBeUndefined()
  })

  it('keeps the Host entry free of tool and prompt registration', () => {
    const host = readFileSync(join(packageRoot, 'src/index.ts'), 'utf8')
    const broker = readFileSync(join(packageRoot, 'src/broker.ts'), 'utf8')
    expect(host).not.toContain('tools.register')
    expect(host).not.toContain('systemPrompt.section')
    expect(broker).not.toContain('tools.register')
    expect(broker).not.toContain('systemPrompt.section')
  })

  it('keeps standalone composition metadata and bootstrap exports available', () => {
    const patch = readFileSync(join(packageRoot, 'cordis.patch.yml'), 'utf8')
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
      exports?: Record<string, unknown>
      dsh?: { bundle?: { patch?: string } }
    }
    expect(patch).toContain('@dsh-portable/interactive-learning')
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(manifest.exports?.['./bootstrap']).toBeTruthy()
    expect(manifest.exports?.['./cordis.patch.yml']).toBe('./cordis.patch.yml')
  })
})
