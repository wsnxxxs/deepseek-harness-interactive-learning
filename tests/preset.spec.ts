import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const packageRoot = resolve(import.meta.dirname, '..')

describe('preset isolation', () => {
  it('mounts the model-facing entry only in the learning preset', () => {
    const learning = readFileSync(join(packageRoot, 'preset/learning/agent.cordis.yml'), 'utf8')
    expect(learning.match(/@dsh-portable\/interactive-learning\/agent/g)).toHaveLength(1)
    expect(learning.match(/@deepseek-ai\/dsh-tool-ask-user/g)).toHaveLength(1)
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
      peerDependencies?: Record<string, string>
      peerDependenciesMeta?: Record<string, { optional?: boolean }>
      dependencies?: Record<string, string>
    }
    expect(manifest.dependencies?.['@deepseek-ai/dsh-tool-ask-user']).toBeUndefined()
    expect(manifest.peerDependencies?.['@deepseek-ai/dsh-tool-ask-user']).toBe('*')
    expect(manifest.peerDependenciesMeta?.['@deepseek-ai/dsh-tool-ask-user']?.optional).toBe(true)
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
