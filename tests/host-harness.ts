/**
 * Host-side test composition helpers for the 0.2 harness APIs.
 *
 * - `dsh-agent` injects `sessionProjections`, so the registry must be mounted
 *   before `AgentRegistry`.
 * - `dsh-tools` no longer executes tools itself; a native or PTC executor
 *   plugin selects the execution mode. `nativeToolExecutor` mirrors the 35-line
 *   `@deepseek-ai/dsh-tool-executor-native` plugin over the public
 *   `@deepseek-ai/dsh-tools/pipeline` entry, so the tests need no extra
 *   dependency.
 * - `ctx.tools.execute()` takes a raw call batch, and conditional (`when`)
 *   registrations are callable only through a step-resolved tool set.
 */
import type { Context } from '@deepseek-ai/cordis'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import AgentRegistry, { type Agent } from '@deepseek-ai/dsh-agent'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import {
  projectToolSchema,
  type ToolDefinition,
  type ToolExecutionResult,
  type ToolExecutor,
  type ToolBatchInput,
  type ToolBatchResult,
  type ToolModelInput,
} from '@deepseek-ai/dsh-tools'
import { ToolExecutionPipeline, executeToolBatch } from '@deepseek-ai/dsh-tools/pipeline'
import type { AskUserQuestionAnswer, AskUserQuestionRequest } from '@deepseek-ai/dsh-user-questions'

class NativeToolExecutor implements ToolExecutor {
  private readonly pipeline: ToolExecutionPipeline

  constructor(ctx: Context) {
    this.pipeline = new ToolExecutionPipeline(ctx)
  }

  describe(tools: readonly ToolDefinition[]): ToolModelInput {
    return { schemas: tools.map(definition => projectToolSchema(definition, false)) }
  }

  execute(input: ToolBatchInput): Promise<ToolBatchResult> {
    return executeToolBatch(input, this.pipeline, () => 10)
  }
}

/** Native tool executor plugin for the mounting scope. */
export const nativeToolExecutor = {
  name: 'test-native-tool-executor',
  inject: ['tools'],
  apply(ctx: Context): void {
    ctx.tools.setExecutor(new NativeToolExecutor(ctx))
  },
}

/** Mount the agent registry with its required session-projection dependency. */
export async function mountAgentRegistry(ctx: Context): Promise<void> {
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(AgentRegistry)
}

/** Fixed step selection used when a test resolves a tool set. */
export const TEST_MODEL_SELECTION = Object.freeze({ provider: 'test', model: 'test' })

export interface TestToolCall {
  readonly callId: string
  readonly name: string
  readonly arguments: unknown
  readonly agent?: Agent
  readonly signal?: AbortSignal
  /** Committed model step that logs root `tool/call` / `tool/result` events. */
  readonly log?: { readonly turn: number; readonly step: number }
}

/**
 * Execute one model-shaped call the way one AgentLoop step does: resolve the
 * Agent's step admission, run a one-call batch, and dispose the set after it
 * settles. Without an Agent only unconditional registrations are callable.
 * @returns the single call's settled result.
 */
export async function executeTool(ctx: Context, call: TestToolCall): Promise<ToolExecutionResult> {
  const signal = call.signal ?? new AbortController().signal
  const toolSet = call.agent === undefined
    ? undefined
    : await ctx.tools.resolve({ agent: call.agent, modelSelection: TEST_MODEL_SELECTION, signal })
  try {
    const batch = await ctx.tools.execute({
      calls: [{
        type: 'tool-call',
        id: ToolCallId(call.callId),
        name: call.name,
        arguments: JSON.stringify(call.arguments),
      }],
      signal,
      ...(call.agent === undefined ? {} : { agent: call.agent }),
      ...(toolSet === undefined ? {} : { toolSet }),
      ...(call.log === undefined ? {} : { log: call.log }),
    })
    const settled = batch.results[0]
    if (settled === undefined) throw new Error(`tool call ${call.callId} produced no result`)
    return settled.result
  } finally {
    toolSet?.dispose()
  }
}

/** Names the model would see for this Agent's next step. */
export async function admittedToolNames(ctx: Context, agent: Agent): Promise<string[]> {
  const signal = new AbortController().signal
  const toolSet = await ctx.tools.resolve({ agent, modelSelection: TEST_MODEL_SELECTION, signal })
  try {
    return (await ctx.systemPrompt.assemble({ scope: agent, agent, toolSet, modelSelection: TEST_MODEL_SELECTION }))
      .tools.map(tool => tool.name)
  } finally {
    toolSet.dispose()
  }
}

/** A test answerer shaped like the retired `userQuestions.registerProvider()` argument. */
export interface TestQuestionAnswerer {
  ask(request: AskUserQuestionRequest): Promise<AskUserQuestionAnswer> | AskUserQuestionAnswer
}

/**
 * Compose an answerer through the 0.2 `user-questions/request` waterfall, the
 * seam that replaced `userQuestions.registerProvider()`.
 * @returns the listener disposer.
 */
export function registerAnswerer(ctx: Context, answerer: TestQuestionAnswerer): () => void {
  return ctx.on('user-questions/request', async request => await answerer.ask(request as AskUserQuestionRequest))
}
