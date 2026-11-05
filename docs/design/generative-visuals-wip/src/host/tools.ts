/**
 * The two model-facing visual tools: `read_visual_guide` loads the drawing
 * guide, `show_visual` draws model-written SVG or HTML inline.
 *
 * Both are static: an agent gets the same two definitions for its whole life,
 * and the long guidance arrives as tool results, so the request prefix stays
 * cacheable. One toolset builds each definition once; every agent it serves
 * registers the same objects, so their projection is byte-identical.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool, type ToolDefinition, type ToolRunContext } from '@deepseek-ai/dsh-tools'
import { extractVisualCode } from '../client/frame/extract.ts'
import { visualGuide } from '../guide/index.ts'
import {
  MAX_VISUAL_CODE_BYTES,
  MAX_VISUAL_TITLE_LENGTH,
  READ_VISUAL_GUIDE_TOOL,
  SHOW_VISUAL_TOOL,
  VISUAL_GUIDE_MODULES,
  type VisualGuideModule,
} from '../identity.ts'
import { guideLoaded, rememberGuideRead } from './guide-state.ts'

/** What `show_visual` reports once its arguments were accepted. */
export type ShowVisualStatus = 'shown' | 'unavailable'

/** The visual a `show_visual` call drew, after normalization. */
export interface ShownVisual {
  readonly title: string
  /** The fragment the frame renders (a wrapper the model added is removed). */
  readonly code: string
}

export interface VisualToolsOptions {
  /** Whether the composition can show visuals to this agent now. */
  readonly clientAvailable: (agent: Agent | undefined) => boolean
  /** Called once per `show_visual` call that was accepted and will be shown; a throw is logged, never surfaced. */
  readonly onShown?: (exec: ToolRunContext, visual: ShownVisual) => void
}

export interface VisualTools {
  readonly readVisualGuide: ToolDefinition
  readonly showVisual: ToolDefinition
  /** Both definitions, in registration order. */
  readonly definitions: readonly ToolDefinition[]
}

export const READ_VISUAL_GUIDE_DESCRIPTION = 'Load the drawing guide for show_visual. Call it before your first show_visual in a conversation, and again before using a module you haven\'t loaded yet.'

export const GUIDE_MODULES_DESCRIPTION = 'Modules to load. diagram: flowcharts, architecture, sequence, state and ER diagrams. chart: bar, line, scatter and other data charts. interactive: sliders, steppers, simulations and clickable follow-up questions. ui: cards, metric tiles, forms and app mockups. math: equations, function plots and geometry.'

export const SHOW_VISUAL_DESCRIPTION = 'Draw a diagram, chart, interactive explainer or mockup inline in the conversation; the user sees it take shape as you write it. Use it when seeing a structure, process, quantity or behaviour explains it better than prose, and keep the explanation in your reply.'

export const VISUAL_TITLE_DESCRIPTION = 'Short name of the visual in sentence case, in the user\'s language.'

export const VISUAL_CODE_DESCRIPTION = 'One <svg> element, or an HTML fragment that may include <style> and <script>, written as the guide describes. No <!DOCTYPE>, <html>, <head> or <body>.'

/** `show_visual` result text when the visual was shown. */
export const SHOWN_TEXT = 'Shown to the user inline. Continue in prose; don\'t repeat what the visual shows.'
/** `show_visual` result text when no visual client can show it. */
export const UNAVAILABLE_TEXT = 'Not shown: this session can\'t display visuals. Explain it in text instead.'
/** Appended when the code arrived inside a document wrapper or a code fence. */
export const NORMALIZED_NOTE = 'The code came wrapped in document tags or a code fence; they were removed. Next time send just the fragment.'
/** The guide-first rejection. */
export const GUIDE_FIRST_ERROR = 'Load the guide first: call read_visual_guide with the modules you need'

/** `show_visual`'s model-facing result text. */
export function showVisualResultText(status: ShowVisualStatus, normalized: boolean): string {
  const base = status === 'shown' ? SHOWN_TEXT : UNAVAILABLE_TEXT
  return normalized ? `${base}\n${NORMALIZED_NOTE}` : base
}

/** Close the projected parameter root: the model sees no room for unknown arguments. */
function closeParameterRoot<T extends ToolDefinition>(tool: T): T {
  return { ...tool, parameters: { ...tool.parameters, additionalProperties: false } } as T
}

function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).byteLength
}

/** Validate and normalize `show_visual` arguments; throws the model-facing problem. */
export function acceptVisual(args: { readonly title: string; readonly code: string }): ShownVisual & { readonly normalized: boolean } {
  const title = args.title.trim()
  if (title === '') throw new Error('title is empty')
  if (title.length > MAX_VISUAL_TITLE_LENGTH) {
    throw new Error(`title is ${String(title.length)} characters; at most ${String(MAX_VISUAL_TITLE_LENGTH)}`)
  }
  const bytes = utf8Bytes(args.code)
  if (bytes > MAX_VISUAL_CODE_BYTES) {
    throw new Error(`code is ${String(Math.ceil(bytes / 1024))} KB; at most ${String(MAX_VISUAL_CODE_BYTES / 1024)} KB. Simplify it or split it into several visuals.`)
  }
  const code = extractVisualCode(args.code)
  if (code === '') throw new Error('code is empty')
  return { title, code, normalized: code !== args.code.trim() }
}

/** Build the two tool definitions for one owner context. */
export function createVisualTools(owner: Context, options: VisualToolsOptions): VisualTools {
  const readVisualGuide = closeParameterRoot(defineTool({
    name: READ_VISUAL_GUIDE_TOOL,
    description: READ_VISUAL_GUIDE_DESCRIPTION,
    parameters: {
      modules: {
        type: 'array',
        required: true,
        description: GUIDE_MODULES_DESCRIPTION,
        items: { type: 'string', enum: VISUAL_GUIDE_MODULES as unknown as readonly [string, ...string[]] },
      },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: {
        modules: { type: 'array', required: true, items: { type: 'string' } },
        core: { type: 'boolean', required: true },
        text: { type: 'string', required: true },
      } },
      render: (_args, value) => [{ type: 'text', text: value.text }],
      // The client chip names what was loaded; the guide text stays model-only.
      presentationMeta: (_args, value) => ({ modules: value.modules, core: value.core }),
    },
    // Exclusive: a show_visual later in the same step runs after the guide is recorded.
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const modules = [...new Set(args.modules as readonly VisualGuideModule[])]
      if (modules.length === 0) throw new Error(`modules is empty; name at least one of ${VISUAL_GUIDE_MODULES.join(', ')}`)
      const core = exec.agent === undefined || !guideLoaded(exec.agent)
      const text = visualGuide(modules, { includeCore: core })
      if (exec.agent !== undefined) rememberGuideRead(exec.agent)
      return { modules, core, text }
    },
    presentCall: () => ({ card: 'generic', title: 'Drawing guide', kind: 'other' }),
  }))

  const showVisual = closeParameterRoot(defineTool({
    name: SHOW_VISUAL_TOOL,
    description: SHOW_VISUAL_DESCRIPTION,
    parameters: {
      title: { type: 'string', required: true, description: VISUAL_TITLE_DESCRIPTION },
      code: { type: 'string', required: true, description: VISUAL_CODE_DESCRIPTION },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: {
        status: { type: 'string', enum: ['shown', 'unavailable'], required: true },
        normalized: { type: 'boolean', required: true },
      } },
      render: (_args, value) => [{ type: 'text', text: showVisualResultText(value.status, value.normalized) }],
      // Persisted with the session log; the client reads it from the result block.
      presentationMeta: (_args, value) => ({ status: value.status, normalized: value.normalized }),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      if (exec.agent !== undefined && !guideLoaded(exec.agent)) throw new Error(GUIDE_FIRST_ERROR)
      const visual = acceptVisual(args)
      if (!options.clientAvailable(exec.agent)) return { status: 'unavailable' as const, normalized: visual.normalized }
      try {
        options.onShown?.(exec, { title: visual.title, code: visual.code })
      } catch (cause) {
        owner.logger.warn(`${SHOW_VISUAL_TOOL}: onShown failed: ${cause instanceof Error ? cause.message : String(cause)}`)
      }
      return { status: 'shown' as const, normalized: visual.normalized }
    },
    presentCall: args => ({
      card: 'generic',
      title: typeof (args as { title?: unknown }).title === 'string' ? (args as { title: string }).title : 'Visual',
      kind: 'other',
    }),
  }))

  return { readVisualGuide, showVisual, definitions: [readVisualGuide, showVisual] }
}
