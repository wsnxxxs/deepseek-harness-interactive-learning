/**
 * `installVisualTools`: the library entry a preset uses to offer visuals from
 * its own standing scope (Learning does), instead of mounting the host plugin.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import { VISUAL_PACKAGE_NAME } from '../identity.ts'
import { createVisualTools, type ShownVisual } from './tools.ts'

/** Structural face of the host's `clientModules` service (`@deepseek-ai/dsh-client-modules`). */
interface ClientModulesFace {
  graph(): { readonly entries: readonly { readonly id: string }[] }
}

/**
 * Whether the host's live web composition includes the visual Client. A
 * deployment without the web composition (TUI, headless runs, ACP) has no
 * `clientModules` service and answers false.
 */
export function visualClientComposed(ctx: Context): boolean {
  const modules = ctx.get('clientModules') as ClientModulesFace | undefined
  return modules?.graph().entries.some(entry => entry.id === VISUAL_PACKAGE_NAME) === true
}

export interface InstallVisualToolsOptions {
  /** Called once per `show_visual` call that was accepted and will be shown; a throw is logged, never surfaced. */
  readonly onShown?: (exec: ToolRunContext, visual: ShownVisual) => void
  /**
   * Whether the composition can show visuals to this agent now. Defaults to
   * whether the host's web composition includes `@dsh-portable/visual`.
   */
  readonly clientAvailable?: (agent: Agent | undefined) => boolean
}

/**
 * Register `read_visual_guide` and `show_visual` in `ctx`'s scope (a preset's
 * standing scope, or the root). Both take part in a step only while a visual
 * client is available, so a text-only composition never sees them.
 * @returns the disposer; it also runs when `ctx` unloads.
 */
export function installVisualTools(ctx: Context, options: InstallVisualToolsOptions = {}): () => void {
  const clientAvailable = options.clientAvailable ?? (() => visualClientComposed(ctx))
  const tools = createVisualTools(ctx, { clientAvailable, ...(options.onShown === undefined ? {} : { onShown: options.onShown }) })
  return ctx.effect(() => {
    const disposers = tools.definitions.map(definition => ctx.tools.register(definition, { when: ({ agent }) => clientAvailable(agent) }))
    return () => { for (const dispose of disposers) dispose() }
  }, 'visual: tools')
}
