/**
 * The host plugin: mounted once at the profile root, it attaches the two
 * visual tools to each eligible agent as the agent is created. It registers
 * nothing globally, so an agent it skips (a headless run, a subagent, an
 * excluded preset, a preset that brings its own visual tools) pays nothing.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import z from '@deepseek-ai/schemastery'
import { SHOW_VISUAL_TOOL } from '../identity.ts'
import { visualClientComposed } from './install.ts'
import { createVisualTools } from './tools.ts'

export const name = 'dsh-portable-visual'
export const inject = ['tools', 'agents']

export interface Config {
  /** Preset ids to attach to; empty attaches to every preset. */
  presets?: string[]
  /** Preset ids never attached to. */
  excludePresets?: string[]
  /** Also attach to subagent sessions. Defaults to false. */
  subagents?: boolean
}

export const Config: z<Config> = z.object({
  presets: z.array(z.string()).default([])
    .description('Preset ids to attach to; empty attaches to every preset.'),
  excludePresets: z.array(z.string()).default([])
    .description('Preset ids never attached to.'),
  subagents: z.boolean().default(false)
    .description('Also attach to subagent sessions.'),
})

/** Structural face of `@deepseek-ai/dsh-agent-preset-registry`'s `agentPresets` service. */
interface AgentPresetsFace {
  composedPreset(ctx: Context): string | undefined
}

/** The preset an agent runs: the live composition, else the creation-time header value. */
function presetOf(ctx: Context, agent: Agent): string | undefined {
  const presets = ctx.get('agentPresets') as AgentPresetsFace | undefined
  return presets?.composedPreset(agent.ctx) ?? agent.session.header.agentPreset
}

/**
 * Subscribe to `agent-preset/selected (sessionId, presetId)`, which the preset
 * registry emits after a blank session switched preset. Typed locally: this
 * package does not depend on the registry, and a deployment without one never
 * emits it.
 */
function onPresetSelected(ctx: Context, listener: (sessionId: string) => void): () => void {
  const on = ctx.on as unknown as (event: string, callback: (sessionId: unknown) => void) => () => void
  return on.call(ctx, 'agent-preset/selected', sessionId => listener(String(sessionId)))
}

export function apply(ctx: Context, config: Config = {}): void {
  const presets = config.presets ?? []
  const excludePresets = config.excludePresets ?? []
  const subagents = config.subagents ?? false
  const clientAvailable = (): boolean => visualClientComposed(ctx)
  const tools = createVisualTools(ctx, { clientAvailable })
  const attached = new Map<Agent, () => void>()

  const eligible = (agent: Agent): boolean => {
    // Headless runs and compositions without the visual client pay nothing.
    if (!clientAvailable()) return false
    if (!subagents && agent.session.header.origin === 'subagent') return false
    const preset = presetOf(ctx, agent)
    if (presets.length > 0 && (preset === undefined || !presets.includes(preset))) return false
    if (preset !== undefined && excludePresets.includes(preset)) return false
    // A preset that installs its own visual tools (Learning) keeps them.
    return ctx.tools.get(SHOW_VISUAL_TOOL, agent) === undefined
  }

  const evaluate = (agent: Agent): void => {
    if (attached.has(agent) || !eligible(agent)) return
    const disposers = tools.definitions.map(definition => agent.ctx.tools.register(definition))
    attached.set(agent, () => { for (const dispose of disposers) dispose() })
  }

  const detach = (agent: Agent): void => {
    attached.get(agent)?.()
    attached.delete(agent)
  }

  ctx.on('agent/created', ({ agent }) => {
    evaluate(agent)
    return undefined
  })
  // The agent's registrations unwind with its own context.
  ctx.on('agent/disposed', ({ agent }) => { attached.delete(agent) })
  // A blank session may switch preset: agent-scoped tools would shadow the new
  // preset's own, and the new preset may be excluded. Re-evaluate.
  onPresetSelected(ctx, (sessionId) => {
    const agent = ctx.agents.get(sessionId as Parameters<typeof ctx.agents.get>[0])
    if (agent === undefined) return
    detach(agent)
    evaluate(agent)
  })
  ctx.effect(() => {
    // Agents that are already live (the plugin was added or reloaded mid-session) get the tools too.
    for (const agent of ctx.agents.list()) evaluate(agent)
    return () => {
      for (const dispose of attached.values()) dispose()
      attached.clear()
    }
  }, 'visual: agents')
}
