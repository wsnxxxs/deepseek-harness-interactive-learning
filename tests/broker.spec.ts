import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import UserQuestionService, { type AskUserQuestionRequest } from '@deepseek-ai/dsh-user-questions'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import { LearningActivityBroker } from '../src/broker.ts'
import * as learningAgent from '../src/agent.ts'
import {
  CHECKPOINT_PROTOCOL,
  CHECKPOINT_RESULT_PROTOCOL,
  VISUAL_PROTOCOL_V4,
  VISUAL_RESULT_PROTOCOL_V4,
  type LearningCheckpointResultV1,
  type LearningCheckpointV1,
} from '../src/protocol.ts'
import { decodeLearningCheckpointDetail } from '../src/transport.ts'
import {
  LEARNER_STATE_EVENT_PROTOCOL,
  LEARNER_STATE_SESSION_EVENT_TYPE,
  createInitialLearnerState,
  createLearnerStateSnapshotEvent,
  reduceLearnerState,
} from '../src/learner-state.ts'
import { parameterActivity, visualV4Catalog } from './fixtures.ts'
import { admittedToolNames, executeTool, mountAgentRegistry, nativeToolExecutor, registerAnswerer } from './host-harness.ts'

function stubAgent(id: string, events: readonly unknown[] = []): Agent {
  const agentId = id as Agent['id']
  const log = [...events] as Array<{ type: string; seq: number; time: number; data: unknown }>
  const session = {
    id: agentId,
    header: { delegationDepth: 0 },
    get seq() { return log.length },
    snapshotEvents() { return Object.freeze([...log]) },
    append(type: string, data: unknown) {
      const event = Object.freeze({ type, seq: log.length, time: Date.now(), data: structuredClone(data) })
      log.push(event)
      return event
    },
  }
  return {
    id: agentId,
    session,
  } as unknown as Agent
}

function checkpoint(overrides: Partial<LearningCheckpointV1> = {}): LearningCheckpointV1 {
  return {
    protocol: CHECKPOINT_PROTOCOL,
    kind: 'prediction',
    prompt: 'Predict which queue item leaves next and explain why.',
    context: 'The queue currently contains A, B, C in that order.',
    expectedEvidence: 'prediction',
    fallbackMarkdown: 'Reply in the ordinary conversation with the next item and your reason.',
    ...overrides,
  }
}

function checkpointCall(callId: string, step = 1): unknown {
  return {
    type: 'tool/call', seq: step, time: step,
    data: { turn: 1, step, callId, name: 'learning_checkpoint', arguments: '{}' },
  }
}

// `agents.register()` returns an awaitable effect disposer in 0.2; the
// registration and the creation announcement complete asynchronously.
async function registerRoot(ctx: Context, agent: Agent): Promise<() => Promise<void>> {
  const dispose = ctx.agents.register(agent)
  await dispose
  return async () => { await dispose() }
}

/** The learning catalog every Learning step declares, whatever the route. */
const LEARNING_CATALOG = ['learning_visual_select', 'learning_state_update', 'learning_checkpoint']

/**
 * The learning catalog stays stable across turns (changing declarations per
 * request breaks the request-prefix cache). Route-dependent availability is
 * stated in the turn-route context and enforced at dispatch. Assert the stable
 * catalog and return the optional interactive tools the route note allows.
 */
async function routeInteractiveTools(ctx: Context, agent: Agent): Promise<string[]> {
  const catalog = await admittedToolNames(ctx, agent)
  expect(catalog).toEqual(expect.arrayContaining(LEARNING_CATALOG))
  const assembly = await ctx.systemPrompt.assemble({ scope: agent, agent })
  const route = assembly.contexts.find(context => context.name === 'learning:turn-route')?.text ?? ''
  const usable = /Interactive tools this turn: ([a-z ]+)[.(]/.exec(route)?.[1]?.trim()
  if (usable === undefined || usable === 'none') return []
  return usable.split(' or ')
}

async function routeText(ctx: Context, agent: Agent): Promise<string> {
  const assembly = await ctx.systemPrompt.assemble({ scope: agent, agent })
  return assembly.contexts.find(context => context.name === 'learning:turn-route')?.text ?? ''
}

function claim(ctx: Context, agent: Agent, id: string, text: string, turn: number): void {
  ctx.emit('agent/inbox/claimed', {
    agent,
    message: { id, role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text }] },
    turn,
  } as never)
}

async function selectVisual(ctx: Context, kind: string, agent?: Agent, callId = `select-visual-${kind}`): Promise<void> {
  const result = await executeTool(ctx, {
    callId: (callId),
    name: 'learning_visual_select',
    arguments: {
      kind,
      purpose: `Make the ${kind} relationship concrete.`,
      learnerAction: `Inspect the ${kind} relationship and name one change you notice.`,
    },
    ...(agent === undefined ? {} : { agent }),
  })
  expect(result.isError, JSON.stringify(result)).toBe(false)
}

function answerFor(
  request: AskUserQuestionRequest,
  status: LearningCheckpointResultV1['status'],
  options: { response?: { text: string }; receiptId?: string } = {},
): { answers: Array<{ id: string; selected: string[]; custom: string }> } {
  const question = request.questions[0]!
  const envelope = decodeLearningCheckpointDetail(question.detail)
  if (envelope === undefined) throw new Error('missing checkpoint envelope')
  const result = status === 'submitted'
    ? {
        protocol: CHECKPOINT_RESULT_PROTOCOL,
        checkpointId: envelope.checkpointId,
        status,
        response: options.response ?? { text: 'B leaves first because the queue is FIFO.' },
        receiptId: options.receiptId ?? 'receipt-checkpoint',
      }
    : {
        protocol: CHECKPOINT_RESULT_PROTOCOL,
        checkpointId: envelope.checkpointId,
        status,
        reason: status === 'skipped' ? 'learner-skipped' : 'learner-cancelled',
        receiptId: options.receiptId ?? `receipt-${status}`,
      }
  return { answers: [{ id: question.id, selected: [], custom: JSON.stringify(result) }] }
}

async function setupBroker(richClient: boolean) {
  const ctx = new Context()
  await mountAgentRegistry(ctx)
  await ctx.plugin(UserQuestionService)
  if (richClient) {
    ctx.provide('clientModules', {
      graph: () => ({ rev: 'test', entries: [{ id: '@dsh-portable/interactive-learning', url: '/client.js', rev: 'x' }] }),
    } as never)
  }
  await ctx.plugin(LearningActivityBroker)
  return ctx
}

describe('LearningActivityBroker compatibility boundary', () => {
  it('keeps V1 on the static legacy replay path without registering a wait', async () => {
    const ctx = await setupBroker(true)
    await expect(ctx.learningActivities.present({ activity: parameterActivity(), agent: stubAgent('legacy') }))
      .resolves.toMatchObject({ action: 'skip', interactionState: { reason: 'legacy-replay-only' } })
    expect(ctx.learningActivities.pendingCount).toBe(0)
  })

  it('registers no global tool or prompt from the Host entry', async () => {
    const ctx = new Context()
    await mountAgentRegistry(ctx)
    await ctx.plugin(UserQuestionService)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    const toolsBefore = ctx.tools.schemas().map(tool => tool.name)
    const promptBefore = await ctx.systemPrompt.assemble()
    await ctx.plugin(LearningActivityBroker)
    expect(ctx.tools.schemas().map(tool => tool.name)).toEqual(toolsBefore)
    expect(await ctx.systemPrompt.assemble()).toEqual(promptBefore)
  })
})

describe('non-blocking Learning Agent v4.1', () => {
  it('applies the deterministic route to the production prompt surface', async () => {
    const ctx = await setupBroker(true)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    const agent = stubAgent('turn-route')
    const disposeAgent = await registerRoot(ctx, agent)
    const catalogs: string[][] = []

    claim(ctx, agent, 'ordinary-route-message', 'Translate this paragraph into Chinese.', 1)
    const ordinary = await ctx.systemPrompt.assemble({ scope: agent, agent })
    catalogs.push(await admittedToolNames(ctx, agent))
    // The policy section stays in the stable prefix; the route context makes the turn ordinary.
    expect(ordinary.sections.some(section => section.name === 'learning:policy')).toBe(true)
    const ordinaryRoute = await routeText(ctx, agent)
    expect(ordinaryRoute).toContain('intent=not-learn; route=direct')
    expect(ordinaryRoute).toContain('The learning policy and the learning tools do not apply this turn')
    expect(ordinaryRoute).not.toContain('Interactive tools this turn')
    for (const [name, args] of [
      ['learning_visual_select', { kind: 'plot', purpose: 'Not on an ordinary turn.', learnerAction: 'Inspect it.' }],
      ['learning_checkpoint', checkpoint()],
      ['learning_state_update', { action: 'update', basis: 'Asked for a translation.', learner: { requestKind: 'direct-task' } }],
    ] as const) {
      const denied = await executeTool(ctx, { callId: `ordinary-${name}`, name, arguments: args, agent })
      expect(denied.isError, name).toBe(true)
      expect(JSON.stringify(denied.content)).toContain('ordinary turn')
    }

    claim(ctx, agent, 'learning-route-message', 'Walk me through monads.', 2)
    const learning = await ctx.systemPrompt.assemble({ scope: agent, agent })
    catalogs.push(await admittedToolNames(ctx, agent))
    expect(learning.sections.some(section => section.name === 'learning:policy')).toBe(true)
    expect(await routeInteractiveTools(ctx, agent)).toEqual([])
    const calibrate = await routeText(ctx, agent)
    expect(calibrate).toContain('intent=learn; route=calibrate; reason=short-learning-request.')
    expect(calibrate).toContain('Give one tiny useful foothold')
    expect(calibrate).toContain('Interactive tools this turn: none.')

    claim(ctx, agent, 'learning-follow-up-answer', 'A.', 3)
    const inherited = await ctx.systemPrompt.assemble({ scope: agent, agent })
    catalogs.push(await admittedToolNames(ctx, agent))
    expect(inherited.sections.some(section => section.name === 'learning:policy')).toBe(true)
    expect(await routeText(ctx, agent)).toMatch(/route=continue; reason=active-segment/)
    expect(await routeText(ctx, agent)).toContain('This continues the current learning segment')
    expect(await routeInteractiveTools(ctx, agent)).toEqual(['visual', 'checkpoint'])

    claim(ctx, agent, 'ordinary-route-switch', 'Implement a queue in TypeScript.', 4)
    const switched = await ctx.systemPrompt.assemble({ scope: agent, agent })
    catalogs.push(await admittedToolNames(ctx, agent))
    expect(switched.sections.some(section => section.name === 'learning:policy')).toBe(true)
    expect(switched.contexts.some(context => context.name === 'learning:learner-state')).toBe(false)
    expect(await routeText(ctx, agent)).toContain('intent=not-learn; route=direct')

    // Byte-stable declarations across ordinary, calibrating, continuing, and
    // switched turns: routing never adds or removes a tool.
    expect(new Set(catalogs.map(names => JSON.stringify(names))).size).toBe(1)
    expect(catalogs[0]).toEqual(expect.arrayContaining(LEARNING_CATALOG))

    await disposeAgent()
  })

  it('names current-topic grounding, resource creation, and urgency in the route note', async () => {
    const ctx = await setupBroker(true)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    const firstTurnRoute = async (id: string, text: string): Promise<string> => {
      const agent = stubAgent(id)
      const disposeAgent = await registerRoot(ctx, agent)
      claim(ctx, agent, `${id}-message`, text, 1)
      const route = await routeText(ctx, agent)
      await disposeAgent()
      return route
    }

    const contested = await firstTurnRoute('route-contested', 'Give me a structured overview of the contested debate around open versus closed models.')
    expect(contested).toContain('route=overview')
    expect(contested).toContain('Give the requested structured explanation directly and completely')
    expect(contested).toContain('Current or contested topic: use web_search before substantive claims')
    expect(contested).toContain('Interactive tools this turn: visual.')

    const resource = await firstTurnRoute('route-resource', 'Make me active-recall flashcards for queues.')
    expect(resource).toContain('route=direct; reason=resource-creation')
    expect(resource).toContain('Create the requested study resource directly')
    expect(resource).not.toContain('web_search')

    const urgent = await firstTurnRoute('route-urgent', 'I have 15 minutes. Explain rollback and give me a checklist.')
    expect(urgent).toContain('reason=initial-urgent-blocker')
    expect(urgent).toContain('They are under time pressure: give the direct answer or fix first')
    expect(urgent).toContain('Interactive tools this turn: none.')

    const minimum = await firstTurnRoute('route-minimum', 'What is a queue?')
    expect(minimum).toContain('route=teach-minimum; reason=definition')
    expect(minimum).toContain('Teach the smallest useful idea now, with one concrete example')
    expect(minimum).not.toContain('This continues the current learning segment')
  })

  it('restores an active learning route from durable learner state', async () => {
    const ctx = await setupBroker(true)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    const agent = stubAgent('restored-turn-route')
    const disposeAgent = await registerRoot(ctx, agent)

    ctx.learningActivities.updateLearnerState({
      action: 'update',
      agent,
      expectedRevision: 0,
      event: {
        type: 'goal_observed',
        goal: 'Understand FIFO queues',
        observation: {
          id: 'restored-route-goal',
          source: 'learner-message',
          summary: 'The learner asked to understand FIFO queues before the session resumed.',
        },
      },
    })

    ctx.emit('agent/inbox/claimed', {
      agent,
      message: {
        id: 'restored-route-answer',
        role: 'user',
        source: { kind: 'user' },
        content: [{ type: 'text', text: 'A.' }],
      },
      turn: 2,
    } as never)
    const resumed = await ctx.systemPrompt.assemble({ scope: agent, agent })
    expect(resumed.sections.some(section => section.name === 'learning:policy')).toBe(true)
    expect(resumed.contexts.find(context => context.name === 'learning:turn-route')?.text)
      .toMatch(/route=continue; reason=active-segment/)

    ctx.emit('agent/inbox/claimed', {
      agent,
      message: {
        id: 'restored-route-task-switch',
        role: 'user',
        source: { kind: 'user' },
        content: [{ type: 'text', text: 'Calculate 2+2.' }],
      },
      turn: 3,
    } as never)
    const switched = await ctx.systemPrompt.assemble({ scope: agent, agent })
    expect(switched.sections.some(section => section.name === 'learning:policy')).toBe(true)
    expect(switched.contexts.some(context => context.name === 'learning:learner-state')).toBe(false)
    expect(switched.contexts.find(context => context.name === 'learning:turn-route')?.text)
      .toContain('intent=not-learn; route=direct')

    await disposeAgent()
  })

  it('allows only one rich teaching move per user turn and resets the choice on the next learner message', async () => {
    const ctx = await setupBroker(true)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    const agent = stubAgent('rich-move-budget', [checkpointCall('checkpoint-on-next-turn')])
    const disposeAgent = await registerRoot(ctx, agent)
    registerAnswerer(ctx, { ask: async request => answerFor(request, 'submitted') })

    claim(ctx, agent, 'rich-move-learning-message', 'Help me understand why gradient descent works.', 1)
    await selectVisual(ctx, 'plot', agent)

    const denied = await executeTool(ctx, {
      callId: 'checkpoint-after-visual',
      name: 'learning_checkpoint',
      arguments: checkpoint(),
      agent,
    })
    expect(denied.isError).toBe(true)
    expect(JSON.stringify(denied.content)).toContain('not both')

    claim(ctx, agent, 'rich-move-next-message', 'Now test my prediction.', 2)
    const allowed = await executeTool(ctx, {
      callId: 'checkpoint-on-next-turn',
      name: 'learning_checkpoint',
      arguments: checkpoint(),
      agent,
    })
    expect(allowed.isError, JSON.stringify(allowed.content)).toBe(false)
    expect(allowed.value).toMatchObject({ status: 'submitted' })

    // The checkpoint is now this turn's rich move.
    const visualAfterCheckpoint = await executeTool(ctx, {
      callId: 'visual-after-checkpoint',
      name: 'learning_visual_select',
      arguments: { kind: 'plot', purpose: 'Too late this turn.', learnerAction: 'Inspect it.' },
      agent,
    })
    expect(visualAfterCheckpoint.isError).toBe(true)
    expect(JSON.stringify(visualAfterCheckpoint.content)).toContain('not both')

    await disposeAgent()
  })

  it('exposes rich tools only when the route and client can use them', async () => {
    const rich = await setupBroker(true)
    await rich.plugin(ToolRuntime)
    await rich.plugin(nativeToolExecutor)
    await rich.plugin(SystemPrompt)
    await rich.plugin(learningAgent)

    const toolsFor = async (id: string, text: string): Promise<string[]> => {
      const agent = stubAgent(id)
      const disposeAgent = await registerRoot(rich, agent)
      claim(rich, agent, `${id}-message`, text, 1)
      const usable = await routeInteractiveTools(rich, agent)
      if (!usable.includes('visual')) {
        const denied = await executeTool(rich, {
          callId: `${id}-visual-denied`,
          name: 'learning_visual_select',
          arguments: { kind: 'plot', purpose: 'Not usable on this route.', learnerAction: 'Inspect it.' },
          agent,
        })
        expect(denied.isError).toBe(true)
        expect(JSON.stringify(denied.content)).toContain('unavailable for the current route or client')
      }
      if (!usable.includes('checkpoint')) {
        const denied = await executeTool(rich, {
          callId: `${id}-checkpoint-denied`,
          name: 'learning_checkpoint',
          arguments: checkpoint(),
          agent,
        })
        expect(denied.isError).toBe(true)
        expect(JSON.stringify(denied.content)).toContain('unavailable for the current route or client')
      }
      await disposeAgent()
      return usable
    }

    await expect(toolsFor('route-teach', 'What is a queue?')).resolves.toEqual(['visual', 'checkpoint'])
    await expect(toolsFor('route-overview', 'Give me a complete overview of the French Revolution.')).resolves.toEqual(['visual'])
    await expect(toolsFor('route-resource', 'Make me active-recall flashcards for queues.')).resolves.toEqual(['visual'])
    await expect(toolsFor('route-urgent', 'I have 15 minutes. Explain rollback and give me a checklist.')).resolves.toEqual([])

    const plain = await setupBroker(false)
    await plain.plugin(ToolRuntime)
    await plain.plugin(nativeToolExecutor)
    await plain.plugin(SystemPrompt)
    await plain.plugin(learningAgent)
    const plainAgent = stubAgent('plain-client-route')
    const disposePlain = await registerRoot(plain, plainAgent)
    claim(plain, plainAgent, 'plain-client-message', 'What is a queue?', 1)
    expect(await routeInteractiveTools(plain, plainAgent)).toEqual([])
    expect(await routeText(plain, plainAgent)).toContain('Interactive tools this turn: none (this client shows text only).')
    const plainState = await executeTool(plain, {
      callId: 'plain-client-state',
      name: 'learning_state_update',
      arguments: { action: 'update', basis: 'Asked what a queue is.', learner: { requestKind: 'concept' } },
      agent: plainAgent,
    })
    expect(plainState.isError, JSON.stringify(plainState.content)).toBe(false)
    await disposePlain()
  })

  it('exposes one visual and one optional answer-free checkpoint through closed model schemas', async () => {
    const ctx = await setupBroker(true)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)

    const schemas = ctx.tools.schemas()
    expect(schemas.map(tool => tool.name)).toEqual(LEARNING_CATALOG)
    expect(JSON.stringify(schemas)).not.toContain('learning_question')
    expect(JSON.stringify(schemas)).not.toContain('learning_reveal')
    expect(JSON.stringify(schemas)).not.toContain('learning_checkpoint_select')
    expect(JSON.stringify(schemas)).not.toContain('"additionalProperties":true')
    const parameters = schemas.find(tool => tool.name === 'learning_visual_select')?.parameters as {
      additionalProperties?: unknown
      properties?: Record<string, unknown>
    }
    expect(parameters.additionalProperties).toBe(false)
    expect(Object.keys(parameters.properties ?? {}).sort()).toEqual([
      'kind', 'learnerAction', 'pairedQuestion', 'purpose',
    ])
    expect(schemas.find(tool => tool.name === 'learning_visual_select')?.description)
      .toContain('only output of the selector step')
    expect(JSON.stringify(parameters.properties?.kind)).toContain('plot=quantitative axes')
    expect(JSON.stringify(parameters.properties?.kind)).toContain('causal_loop=signed feedback')
    expect(JSON.stringify(parameters)).not.toContain('2 to 48 nodes')

    // 0.2 admits conditional tools only through an Agent's resolved step set.
    // A Context-less stub keeps the selected payload tool in the global layer.
    const schemaAgent = stubAgent('selected-visual-schema')
    await registerRoot(ctx, schemaAgent)
    const missingSemanticConstraint = await executeTool(ctx, {
      callId: ('select-visual-missing-constraint'),
      name: 'learning_visual_select',
      arguments: { kind: 'plot', purpose: 'Show the relationship.' },
      agent: schemaAgent,
    })
    expect(missingSemanticConstraint.isError).toBe(true)
    expect(JSON.stringify(missingSemanticConstraint.content)).toContain('learnerAction or pairedQuestion')

    const competingSemanticConstraints = await executeTool(ctx, {
      callId: ('select-visual-competing-constraints'),
      name: 'learning_visual_select',
      arguments: {
        kind: 'plot', purpose: 'Show one relationship.',
        learnerAction: 'Move the slider.', pairedQuestion: 'What changes?',
      },
      agent: schemaAgent,
    })
    expect(competingSemanticConstraints.isError).toBe(true)
    expect(JSON.stringify(competingSemanticConstraints.content)).toContain('exactly one')

    await selectVisual(ctx, 'node_link', schemaAgent)
    const selectedSchemas = ctx.tools.schemas()
    expect(selectedSchemas.map(tool => tool.name)).toEqual([...LEARNING_CATALOG, 'learning_visual'])
    const completeSchema = JSON.stringify(selectedSchemas.find(tool => tool.name === 'learning_visual'))
    expect(completeSchema).toContain('2 to 48 nodes')
    expect(completeSchema).not.toContain('1 to 8 series')
    expect(completeSchema).toContain('Make the node_link relationship concrete.')
    expect(completeSchema).toContain('Inspect the node_link relationship and name one change you notice.')

    // One static checkpoint schema: wire-identical to the persisted
    // `dsh-learning/checkpoint@1` record the Client replays, with no
    // selector step and nothing pinned per call.
    const checkpointSchema = schemas.find(tool => tool.name === 'learning_checkpoint') as {
      description: string
      parameters: { additionalProperties?: unknown; properties?: Record<string, unknown>; required?: string[] }
    }
    expect(checkpointSchema.parameters.additionalProperties).toBe(false)
    expect(Object.keys(checkpointSchema.parameters.properties ?? {}).sort()).toEqual([
      'context', 'expectedEvidence', 'fallbackMarkdown', 'kind', 'options', 'prompt', 'protocol',
    ])
    expect([...checkpointSchema.parameters.required ?? []].sort()).toEqual([
      'expectedEvidence', 'fallbackMarkdown', 'kind', 'prompt', 'protocol',
    ])
    expect(JSON.stringify(checkpointSchema.parameters.properties?.protocol)).toContain(`"const":"${CHECKPOINT_PROTOCOL}"`)
    expect(JSON.stringify(checkpointSchema.parameters.properties?.kind)).toContain('single_choice=one label')
    expect(JSON.stringify(checkpointSchema.parameters.properties?.expectedEvidence)).toContain('fresh transfer')
    expect(JSON.stringify(checkpointSchema.parameters.properties?.options)).toContain('single_choice only')
    expect(checkpointSchema.description).toContain('Never include the answer')
    expect(checkpointSchema.description).toContain('make this the only tool call in that step')
    expect(checkpointSchema.description).toContain('replaces their message box until they submit or skip')
    expect(checkpointSchema.description).not.toContain('wire')
    expect(checkpointSchema.description).not.toContain('Host')

    // A single_choice call without options is rejected by the closed parser
    // with the field to fix; options on another kind are rejected too.
    const checkpointAgent = stubAgent('static-checkpoint-schema', [checkpointCall('choice-without-options'), checkpointCall('text-with-options', 2)])
    await registerRoot(ctx, checkpointAgent)
    const missingOptions = await executeTool(ctx, {
      callId: 'choice-without-options',
      name: 'learning_checkpoint',
      arguments: checkpoint({ kind: 'single_choice' }),
      agent: checkpointAgent,
    })
    expect(missingOptions.isError).toBe(true)
    expect(JSON.stringify(missingOptions.content)).toContain('checkpoint.options must contain 2 to 8 options for single_choice')
    const strayOptions = await executeTool(ctx, {
      callId: 'text-with-options',
      name: 'learning_checkpoint',
      arguments: checkpoint({ options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }),
      agent: checkpointAgent,
    })
    expect(strayOptions.isError).toBe(true)
    expect(JSON.stringify(strayOptions.content)).toContain('checkpoint.options is supported only for single_choice')
    // Calling the checkpoint never changes the declared catalog.
    expect(ctx.tools.schemas(checkpointAgent).map(tool => tool.name)).toEqual([...LEARNING_CATALOG, 'learning_visual'])

    const stateSchema = schemas.find(tool => tool.name === 'learning_state_update') as {
      description: string
      parameters: { additionalProperties?: unknown; properties?: Record<string, unknown>; required?: string[] }
    }
    expect(stateSchema.parameters.additionalProperties).toBe(false)
    expect(Object.keys(stateSchema.parameters.properties ?? {}).sort()).toEqual([
      'action', 'basis', 'correction', 'evidence', 'failedMove', 'learner', 'myMove', 'plan', 'planStepDone', 'sourceAnchors',
    ])
    expect(stateSchema.parameters.required).toEqual(['action'])
    expect(stateSchema.description).toContain('Call at most once per turn, before your reply')
    expect(stateSchema.description).toContain('put everything from this turn in that one call')
    expect(stateSchema.description).toContain('never on guessed traits, emotions, or learning styles')
    // Replay fences, event sources, and compare-and-swap stay Host-internal.
    const stateJson = JSON.stringify(stateSchema)
    for (const internal of ['revision', '"observation"', 'learner-message', 'assistant-output', 'source-material', '_observed', 'Host', 'compare-and-swap']) {
      expect(stateJson).not.toContain(internal)
    }
    expect(ctx.tools.get('learning_state_update')?.presentCall).toBeUndefined()
  })

  it('accepts every catalog fixture, returns ready immediately, and never creates a user-question wait', async () => {
    const ctx = await setupBroker(true)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    expect(ctx.learningActivities.pendingCount).toBe(0)

    const ready = { protocol: VISUAL_RESULT_PROTOCOL_V4, status: 'ready' }
    const catalogAgent = stubAgent('visual-catalog')
    await registerRoot(ctx, catalogAgent)
    for (const [name, visual] of Object.entries(visualV4Catalog)) {
      await selectVisual(ctx, visual.content.kind, catalogAgent, `select-${name}`)
      const result = await executeTool(ctx, {
        callId: (`visual-${name}`),
        name: 'learning_visual',
        arguments: visual,
        agent: catalogAgent,
      })
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(ready) }],
        isError: false,
        value: ready,
      })
    }
    expect(ctx.learningActivities.pendingCount).toBe(0)
    expect(visualV4Catalog.derivativePlot.protocol).toBe(VISUAL_PROTOCOL_V4)
  })

  it('reports whether the learner can actually see the visual and only then claims the move', async () => {
    for (const richClient of [true, false]) {
      const ctx = await setupBroker(richClient)
      await ctx.plugin(ToolRuntime)
      await ctx.plugin(nativeToolExecutor)
      await ctx.plugin(SystemPrompt)
      await ctx.plugin(learningAgent)
      const agent = stubAgent(`visual-availability-${String(richClient)}`)
      const disposeAgent = await registerRoot(ctx, agent)
      await selectVisual(ctx, 'plot', agent, `select-availability-${String(richClient)}`)

      const result = await executeTool(ctx, {
        callId: (`availability-${String(richClient)}`),
        name: 'learning_visual',
        arguments: visualV4Catalog.derivativePlot,
        agent,
      })

      expect(result.isError).toBe(false)
      expect(JSON.parse(result.content.map(item => item.type === 'text' ? item.text : '').join(''))).toEqual({
        protocol: VISUAL_RESULT_PROTOCOL_V4,
        status: richClient ? 'ready' : 'unavailable',
      })
      // An unrendered visual is not a teaching move that happened.
      expect(ctx.learningActivities.learnerState(agent).lastMove).toBe(richClient ? 'visual' : 'none')
      await disposeAgent()
    }
  })

  it('rejects distinct checkpoint calls in one logged model step but permits an idempotent call replay', async () => {
    const ctx = await setupBroker(false)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)

    const duplicateAgent = stubAgent('duplicate-step', [
      checkpointCall('checkpoint-a'),
      checkpointCall('checkpoint-b'),
    ])
    await registerRoot(ctx, duplicateAgent)
    const rejected = await executeTool(ctx, {
      callId: ('checkpoint-a'),
      name: 'learning_checkpoint',
      arguments: checkpoint(),
      agent: duplicateAgent,
    })
    expect(rejected.isError).toBe(true)
    expect(JSON.stringify(rejected.content)).toContain('at most one learning_checkpoint call')

    const mixedAgent = stubAgent('mixed-step', [
      checkpointCall('checkpoint-mixed'),
      {
        type: 'tool/call', seq: 2, time: 2,
        data: { turn: 1, step: 1, callId: 'state-same-step', name: 'learning_state_update', arguments: '{}' },
      },
    ])
    await registerRoot(ctx, mixedAgent)
    const mixed = await executeTool(ctx, {
      callId: ('checkpoint-mixed'),
      name: 'learning_checkpoint',
      arguments: checkpoint(),
      agent: mixedAgent,
    })
    expect(mixed.isError).toBe(true)
    expect(JSON.stringify(mixed.content)).toContain('only tool call')

    const replayAgent = stubAgent('replay-step', [checkpointCall('checkpoint-replay')])
    await registerRoot(ctx, replayAgent)
    const execute = () => executeTool(ctx, {
      callId: ('checkpoint-replay'),
      name: 'learning_checkpoint',
      arguments: checkpoint(),
      agent: replayAgent,
    })
    const first = await execute()
    const replay = await execute()
    expect(first.isError).toBe(false)
    expect(replay.value).toEqual(first.value)
    expect((replay.value as LearningCheckpointResultV1).receiptId)
      .toBe((first.value as LearningCheckpointResultV1).receiptId)
  })
})

describe('session-scoped learner-state Host wiring', () => {
  it('rebases one stale additive observation but keeps replacement updates strict', async () => {
    const ctx = await setupBroker(false)
    const agent = stubAgent('state-cas-rebase')
    const first = ctx.learningActivities.updateLearnerState({
      action: 'update',
      agent,
      expectedRevision: 0,
      event: {
        type: 'learner_evidence_observed',
        evidence: {
          kind: 'transfer',
          transferContext: 'fresh',
          summary: 'Applied the queue invariant in a fresh scheduling case.',
          correctness: 'correct',
          independence: 'independent',
        },
        observation: {
          id: 'cas-first-evidence',
          source: 'learner-message',
          summary: 'The learner transferred the queue invariant independently.',
        },
      },
    })
    expect(first).toEqual({ status: 'updated', revision: 1 })

    const rebased = ctx.learningActivities.updateLearnerState({
      action: 'update',
      agent,
      expectedRevision: 0,
      event: {
        type: 'source_anchors_observed',
        anchors: ['queue invariant definition'],
        observation: {
          id: 'cas-source-anchor',
          source: 'source-material',
          summary: 'The source defines the queue invariant.',
        },
      },
    })
    expect(rebased).toEqual({ status: 'updated', revision: 2 })
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      mastery: 'transfer',
      phase: 'complete',
      nextMove: 'complete',
    })

    expect(() => ctx.learningActivities.updateLearnerState({
      action: 'update',
      agent,
      expectedRevision: 0,
      event: {
        type: 'failed_move_observed',
        failedMove: {
          move: 'question',
          fingerprint: 'queue-order-question-v1',
          failureReason: 'no-progress',
          summary: 'The previous question did not produce a usable prediction.',
        },
        observation: {
          id: 'cas-failed-move',
          source: 'learner-message',
          summary: 'The learner remained stuck after the question.',
        },
      },
    })).toThrow(/revision changed/)

    expect(() => ctx.learningActivities.updateLearnerState({
      action: 'update',
      agent,
      expectedRevision: 0,
      event: {
        type: 'goal_observed',
        goal: 'A replacement goal',
        observation: {
          id: 'cas-replacement-goal',
          source: 'learner-message',
          summary: 'The learner changed the learning goal.',
        },
      },
    })).toThrow(/revision changed/)
  })

  it('rebases a stale batch only when every observation is purely additive', async () => {
    const ctx = await setupBroker(false)
    const agent = stubAgent('state-cas-batch')
    expect(ctx.learningActivities.updateLearnerState({
      action: 'update',
      agent,
      expectedRevision: 0,
      events: [{
        type: 'goal_observed',
        goal: 'Understand queue invariants',
        observation: { id: 'batch-goal', source: 'learner-message', summary: 'The learner named the goal.' },
      }],
    })).toEqual({ status: 'updated', revision: 1 })

    expect(ctx.learningActivities.updateLearnerState({
      action: 'update',
      agent,
      expectedRevision: 0,
      events: [
        {
          type: 'prior_knowledge_observed',
          items: ['array indexing'],
          observation: { id: 'batch-prior', source: 'learner-message', summary: 'The learner used indexes correctly.' },
        },
        {
          type: 'source_anchors_observed',
          anchors: ['§2.1 Queue invariants'],
          observation: { id: 'batch-anchor', source: 'source-material', summary: 'The source defines the invariant.' },
        },
      ],
    })).toEqual({ status: 'updated', revision: 3 })

    // One replacement-style observation makes the whole stale batch strict, and
    // nothing from it is applied.
    expect(() => ctx.learningActivities.updateLearnerState({
      action: 'update',
      agent,
      expectedRevision: 0,
      events: [
        {
          type: 'prior_knowledge_observed',
          items: ['loop invariants'],
          observation: { id: 'batch-prior-2', source: 'learner-message', summary: 'The learner named loop invariants.' },
        },
        {
          type: 'goal_observed',
          goal: 'A replacement goal',
          observation: { id: 'batch-goal-2', source: 'learner-message', summary: 'The learner changed the goal.' },
        },
      ],
    })).toThrow(/revision changed/)
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      goal: 'Understand queue invariants',
      priorKnowledge: ['array indexing'],
      revision: 3,
    })
    expect(() => ctx.learningActivities.updateLearnerState({
      action: 'update', agent, expectedRevision: 3, events: [],
    })).toThrow(/at least one observation/)
  })

  it('folds ordinary evidence into the next prompt, auto-records tools, resets, and clears cache', async () => {
    const ctx = await setupBroker(false)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    const agent = stubAgent('state-chain')
    const disposeAgent = await registerRoot(ctx, agent)
    const learningStateEvents = (): number => agent.session.snapshotEvents().filter(event => event.type === 'learning/state').length

    const stateContext = async (): Promise<string> => {
      const assembly = await ctx.systemPrompt.assemble({ scope: agent, agent })
      return assembly.contexts.find(item => item.name === 'learning:learner-state')?.text ?? ''
    }
    // Nothing observed yet: no note at all rather than a block of unknowns.
    expect(await stateContext()).toBe('')
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({ revision: 0, mastery: 'unseen' })

    agent.session.append('user/message' as never, {
      id: 'ordinary-message-1',
      role: 'user',
      source: { kind: 'human' },
      content: [{ type: 'text', text: 'I need to understand FIFO queues.' }],
    } as never)
    const goalUpdate = {
      action: 'update',
      basis: 'The learner explicitly asked to understand FIFO queues.',
      learner: { goal: 'Understand FIFO queues' },
    } as const
    const updated = await executeTool(ctx, {
      callId: 'state-goal',
      name: 'learning_state_update',
      arguments: goalUpdate,
      agent,
    })
    expect(updated).toMatchObject({ isError: false, value: { status: 'updated', revision: 1 } })
    expect(agent.session.snapshotEvents().at(-1)).toMatchObject({
      type: LEARNER_STATE_SESSION_EVENT_TYPE,
      data: {
        protocol: LEARNER_STATE_EVENT_PROTOCOL,
        reason: 'update',
        snapshot: { goal: 'Understand FIFO queues', revision: 1 },
      },
    })
    expect(agent.session.snapshotEvents().at(-1)?.data).not.toHaveProperty('snapshot.sessionId')
    expect(await stateContext()).toContain('goal: "Understand FIFO queues"')

    // A runtime replay of the same call is acknowledged without a new snapshot,
    // whatever order its keys arrive in.
    const stateEventsBeforeReplay = learningStateEvents()
    const replay = await executeTool(ctx, {
      callId: 'state-goal',
      name: 'learning_state_update',
      arguments: goalUpdate,
      agent,
    })
    expect(replay).toMatchObject({ isError: false, value: { status: 'updated', revision: 1 } })
    const reorderedReplay = await executeTool(ctx, {
      callId: 'state-goal',
      name: 'learning_state_update',
      arguments: { learner: { goal: 'Understand FIFO queues' }, basis: goalUpdate.basis, action: 'update' },
      agent,
    })
    expect(reorderedReplay).toMatchObject({ isError: false, value: { status: 'updated', revision: 1 } })
    expect(learningStateEvents()).toBe(stateEventsBeforeReplay)

    // The same call id carrying different content is a detectable conflict.
    const conflictingReplay = await executeTool(ctx, {
      callId: 'state-goal',
      name: 'learning_state_update',
      arguments: { ...goalUpdate, learner: { goal: 'A different goal under the same call id' } },
      agent,
    })
    expect(conflictingReplay.isError).toBe(true)
    expect(JSON.stringify(conflictingReplay.content)).toContain('replayed')

    // A call that would change nothing is refused with a reason the model can act on.
    const unchanged = await executeTool(ctx, {
      callId: 'state-goal-again',
      name: 'learning_state_update',
      arguments: goalUpdate,
      agent,
    })
    expect(unchanged.isError).toBe(true)
    expect(JSON.stringify(unchanged.content)).toContain('nothing to record')

    const corrected = await executeTool(ctx, {
      callId: 'state-correct',
      name: 'learning_state_update',
      arguments: {
        action: 'correct',
        basis: 'The learner corrected the goal to queue invariants.',
        correction: { goal: 'Understand queue invariants' },
      },
      agent,
    })
    expect(corrected).toMatchObject({ isError: false, value: { status: 'corrected', revision: 2 } })
    expect(ctx.learningActivities.learnerState(agent).goal).toBe('Understand queue invariants')

    await executeTool(ctx, {
      callId: 'state-stuck',
      name: 'learning_state_update',
      arguments: {
        action: 'update',
        basis: 'The learner repeated the same incorrect queue model twice.',
        learner: { progress: 'stuck' },
      },
      agent,
    })
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      progressSignal: 'stuck',
      supportLevel: 4,
    })
    expect(await stateContext()).toContain('progress: stuck')

    const skipped = await ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint(), agent, callId: 'state-skipped-checkpoint',
    })
    expect(skipped.status).toBe('skipped')
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      progressSignal: 'stuck',
      lastMove: 'checkpoint',
    })
    // The Host's synthetic checkpoint fingerprint identifies a call, not an
    // approach, so it never reaches the model-facing note.
    expect(await stateContext()).not.toContain('state-skipped-checkpoint')

    await selectVisual(ctx, 'plot', agent, 'select-state-visual')
    const visual = await executeTool(ctx, {
      callId: ('state-visual'),
      name: 'learning_visual',
      arguments: visualV4Catalog.derivativePlot,
      agent,
    })
    expect(visual.isError).toBe(false)
    // This composition has no Learning Client, so the checkpoint above degraded
    // to skipped and the visual likewise rendered nothing. Claiming the move
    // would write a false observation into the pedagogical state.
    expect(JSON.parse(visual.content.map(item => item.type === 'text' ? item.text : '').join(''))).toEqual({
      protocol: VISUAL_RESULT_PROTOCOL_V4,
      status: 'unavailable',
    })
    expect(ctx.learningActivities.learnerState(agent).lastMove).toBe('checkpoint')

    const reset = await executeTool(ctx, {
      callId: ('state-reset'),
      name: 'learning_state_update',
      arguments: { action: 'reset' },
      agent,
    })
    expect(reset).toMatchObject({ isError: false, value: { status: 'reset' } })
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      goal: null,
      progressSignal: 'unknown',
      lastMove: 'none',
      mastery: 'unseen',
    })
    expect(agent.session.snapshotEvents().at(-1)).toMatchObject({
      type: 'learning/state',
      data: { reason: 'reset' },
    })
    expect(await stateContext()).toBe('')

    expect(ctx.learningActivities.learnerStateCacheSize).toBe(1)
    await disposeAgent()
    expect(ctx.learningActivities.learnerStateCacheSize).toBe(0)
    const fresh = stubAgent('state-chain')
    const disposeFresh = await registerRoot(ctx, fresh)
    expect(ctx.learningActivities.learnerState(fresh)).toMatchObject({ revision: 0, goal: null })
    await disposeFresh()
  })

  it('applies one batched call atomically as one snapshot of ordinary reducer events', async () => {
    const ctx = await setupBroker(false)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    const agent = stubAgent('state-batch')
    const disposeAgent = await registerRoot(ctx, agent)
    const run = (callId: string, args: Record<string, unknown>) => executeTool(ctx, {
      callId,
      name: 'learning_state_update',
      arguments: args,
      agent,
    })
    const snapshots = (): number => agent.session.snapshotEvents().filter(event => event.type === 'learning/state').length

    const opening = await run('state-batch-opening', {
      action: 'update',
      basis: 'I know arrays but keep removing the newest item; this is for a graded quiz.',
      learner: {
        goal: 'Tell queue removal from stack removal',
        level: 'novice',
        knows: ['array indexing'],
        gap: 'concept',
        misconceptions: ['treats queue removal as LIFO'],
        assessed: 'graded',
      },
      evidence: { kind: 'error', correctness: 'incorrect', independence: 'independent', confidence: 'high' },
      myMove: {
        move: 'repair',
        approach: 'contrast:printer-vs-undo',
        question: 'Which job does the printer print first?',
        nextMove: 'transfer',
      },
    })
    expect(opening.isError, JSON.stringify(opening.content)).toBe(false)
    expect(snapshots()).toBe(1)
    const state = ctx.learningActivities.learnerState(agent)
    expect(state).toMatchObject({
      goal: 'Tell queue removal from stack removal',
      level: 'novice',
      priorKnowledge: ['array indexing'],
      gap: 'concept',
      misconceptions: ['treats queue removal as LIFO'],
      currentMisconception: 'treats queue removal as LIFO',
      assessmentContext: 'graded',
      learnerResponseAssessment: 'incorrect',
      lastMove: 'repair',
      moveFingerprint: 'contrast:printer-vs-undo',
      lastQuestion: 'Which job does the printer print first?',
      // The planned move is applied last, so it wins over the derived repair step.
      nextMove: 'transfer',
      mastery: 'unseen',
    })
    expect(state.evidence).toEqual([expect.objectContaining({
      kind: 'error',
      source: 'learner-message',
      summary: 'I know arrays but keep removing the newest item; this is for a graded quiz.',
    })])
    expect((opening.value as { revision: number }).revision).toBe(state.revision)
    const note = ctx.learningActivities.learnerStateTranscript(agent)
    for (const line of [
      'knows: ["array indexing"]', 'assessed: graded', 'last_approach: "contrast:printer-vs-undo"',
      'last_question: "Which job does the printer print first?"', 'evidence: error/incorrect/independent/high',
    ]) {
      expect(note).toContain(line)
    }

    // An invalid group fails the whole call: no partial write.
    const repeatedApproach = await run('state-batch-repeat', {
      action: 'update',
      basis: 'The learner still removed the newest item.',
      learner: { progress: 'stuck' },
      myMove: { move: 'repair', approach: 'contrast:printer-vs-undo' },
    })
    expect(repeatedApproach.isError).toBe(true)
    expect(JSON.stringify(repeatedApproach.content)).toContain('repeats your last approach')
    expect(ctx.learningActivities.learnerState(agent).progressSignal).toBe('unknown')
    expect(snapshots()).toBe(1)

    const fresh = await run('state-batch-transfer', {
      action: 'update',
      basis: 'Unprompted: a ticket line serves the earliest arrival, so it is a queue.',
      evidence: { kind: 'transfer', correctness: 'correct', independence: 'independent', confidence: 'high', freshContext: true },
      failedMove: { move: 'explanation', approach: 'definition:fifo', reason: 'not-understood' },
    })
    expect(fresh.isError, JSON.stringify(fresh.content)).toBe(false)
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      mastery: 'transfer',
      phase: 'complete',
      nextMove: 'complete',
      evidence: expect.arrayContaining([expect.objectContaining({ kind: 'transfer', transferContext: 'fresh' })]),
      failedMoves: [expect.objectContaining({ move: 'explanation', fingerprint: 'definition:fifo', failureReason: 'not-understood' })],
    })
    expect(ctx.learningActivities.learnerStateTranscript(agent)).toContain('failed_approach: "definition:fifo" (explanation, not-understood)')

    // "Stop quizzing me" ends the segment without claiming mastery the learner did not show.
    const stopAgent = stubAgent('state-batch-stop')
    await registerRoot(ctx, stopAgent)
    await executeTool(ctx, {
      callId: 'stop-goal',
      name: 'learning_state_update',
      arguments: { action: 'update', basis: 'Asked to learn recursion.', learner: { goal: 'Learn recursion' } },
      agent: stopAgent,
    })
    const stop = await executeTool(ctx, {
      callId: 'stop-questions',
      name: 'learning_state_update',
      arguments: { action: 'correct', basis: 'Please stop quizzing me.', correction: { stopQuestions: true } },
      agent: stopAgent,
    })
    expect(stop).toMatchObject({ isError: false, value: { status: 'corrected' } })
    expect(ctx.learningActivities.learnerState(stopAgent)).toMatchObject({ phase: 'complete', nextMove: 'complete', mastery: 'unseen' })

    await disposeAgent()
  })

  it('re-folds full snapshots into a refreshed broker and dynamic prompt', async () => {
    const first = await setupBroker(false)
    await first.plugin(ToolRuntime)
    await first.plugin(nativeToolExecutor)
    await first.plugin(SystemPrompt)
    await first.plugin(learningAgent)
    const original = stubAgent('state-refresh')
    await executeTool(first, {
      callId: ('state-refresh-update'),
      name: 'learning_state_update',
      arguments: {
        action: 'update',
        basis: 'The learner chose queue learning.',
        learner: { goal: 'Resume queue learning' },
      },
      agent: original,
    })

    const refreshed = await setupBroker(false)
    await refreshed.plugin(ToolRuntime)
    await refreshed.plugin(nativeToolExecutor)
    await refreshed.plugin(SystemPrompt)
    await refreshed.plugin(learningAgent)
    const resumed = stubAgent('state-refresh', original.session.snapshotEvents())
    expect(refreshed.learningActivities.learnerState(resumed)).toMatchObject({
      revision: 1,
      goal: 'Resume queue learning',
    })
    const assembly = await refreshed.systemPrompt.assemble({ scope: resumed, agent: resumed })
    expect(assembly.contexts.find(item => item.name === 'learning:learner-state')?.text)
      .toContain('goal: "Resume queue learning"')
  })

  it('keeps folding a snapshot written by the retired single-event tool and builds on it', async () => {
    // A `learning/state` snapshot exactly as the previous tool persisted it:
    // one event per call, model-chosen observation ids, legacy move names, and
    // fields the new tool no longer writes (explanation, current misconception).
    const legacy = [
      {
        type: 'goal_observed',
        goal: 'Understand FIFO queues',
        observation: { id: 'legacy-goal', source: 'learner-message', summary: 'The learner asked about FIFO.' },
      },
      {
        type: 'assistant_move_observed',
        move: 'question',
        explanationSummary: 'Explained FIFO with a ticket line.',
        question: 'Who is served first?',
        currentMisconception: 'Thinks the newest item leaves first.',
        nextMove: 'question',
        moveFingerprint: 'ticket-line:v1',
        observation: { id: 'legacy-move', source: 'assistant-output', summary: 'Asked one question.' },
      },
    ] as const
    let legacyState = createInitialLearnerState('state-legacy')
    for (const event of legacy) legacyState = reduceLearnerState(legacyState, event as never)
    const persisted = {
      type: LEARNER_STATE_SESSION_EVENT_TYPE,
      seq: 0,
      time: 0,
      data: structuredClone(createLearnerStateSnapshotEvent(legacyState, 'update')),
    }

    const ctx = await setupBroker(false)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    const agent = stubAgent('state-legacy', [persisted])
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      revision: 2,
      goal: 'Understand FIFO queues',
      lastMove: 'question',
      nextMove: 'question',
      lastExplanationSummary: 'Explained FIFO with a ticket line.',
    })
    const note = ctx.learningActivities.learnerStateTranscript(agent)
    expect(note).toContain('last_explanation: "Explained FIFO with a ticket line."')
    expect(note).toContain('last_approach: "ticket-line:v1"')
    expect(note).toContain('next_move: question')

    const next = await executeTool(ctx, {
      callId: 'state-legacy-next',
      name: 'learning_state_update',
      arguments: {
        action: 'update',
        basis: 'The learner said the first person in line is served first.',
        evidence: { kind: 'prediction', correctness: 'correct', independence: 'independent', confidence: 'medium' },
      },
      agent,
    })
    expect(next).toMatchObject({ isError: false, value: { status: 'updated', revision: 3 } })
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      goal: 'Understand FIFO queues',
      lastExplanationSummary: 'Explained FIFO with a ticket line.',
      mastery: 'emerging',
    })
  })

  it('reaches every retained pedagogical field through the grouped tool fields', async () => {
    const ctx = await setupBroker(false)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    const agent = stubAgent('state-field-coverage')
    const update = async (callId: string, args: Record<string, unknown>): Promise<void> => {
      const result = await executeTool(ctx, {
        callId,
        name: 'learning_state_update',
        arguments: { action: 'update', ...args },
        agent,
      })
      expect(result.isError, JSON.stringify(result.content)).toBe(false)
    }

    await update('field-learner', {
      basis: 'Study §2.1 of my notes; I can index arrays but keep removing the newest item, and this exact answer is graded.',
      learner: {
        requestKind: 'source-study',
        level: 'intermediate',
        knows: ['array indexing'],
        gap: 'task-model',
        misconceptions: ['treats queue removal as LIFO'],
        readiness: 'needs-foothold',
        urgency: 'initial-blocker',
        assessed: 'graded',
      },
      sourceAnchors: ['§2.1 Queue invariants'],
    })
    await update('field-transfer', {
      basis: 'The learner independently solved a fresh printer-job queue case.',
      evidence: { kind: 'transfer', correctness: 'correct', independence: 'independent', confidence: 'high', freshContext: true },
    })
    await update('field-progress', {
      basis: 'The learner explicitly said they are shutting down.',
      learner: { progress: 'shutdown-risk' },
    })

    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      requestKind: 'source-study',
      level: 'intermediate',
      priorKnowledge: ['array indexing'],
      gap: 'task-model',
      misconceptions: ['treats queue removal as LIFO'],
      readiness: 'needs-foothold',
      progressSignal: 'shutdown-risk',
      urgency: 'initial-blocker',
      supportLevel: 5,
      assessmentContext: 'graded',
      mastery: 'transfer',
      sourceAnchors: ['§2.1 Queue invariants'],
    })
    // Each group lands as its own durable reducer event under a call-derived id.
    expect(ctx.learningActivities.learnerState(agent).appliedEventIds.map(item => item.id)).toEqual([
      'field-learner#request-kind', 'field-learner#prior-knowledge', 'field-learner#gap', 'field-learner#readiness',
      'field-learner#urgency', 'field-learner#assessed', 'field-learner#source-anchors',
      'field-transfer#evidence', 'field-progress#progress',
    ])
  })

  it('rejects malformed calls at the tool boundary with a field to fix and writes nothing', async () => {
    const ctx = await setupBroker(false)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(nativeToolExecutor)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(learningAgent)
    const agent = stubAgent('state-boundary')
    const run = (callId: string, args: unknown) => executeTool(ctx, {
      callId,
      name: 'learning_state_update',
      arguments: args,
      agent,
    })
    const rejected = async (callId: string, args: unknown, message: string): Promise<void> => {
      const result = await run(callId, args)
      expect(result.isError, callId).toBe(true)
      if (message !== '') expect(JSON.stringify(result.content), callId).toContain(message)
    }

    await rejected('no-basis', { action: 'update', learner: { goal: 'Learn queues' } }, 'action=update needs basis')
    await rejected('nothing', { action: 'update', basis: 'Said hello.' }, 'action=update needs at least one of learner')
    await rejected('empty-learner', { action: 'update', basis: 'Said hello.', learner: { knows: [] } }, 'needs at least one non-empty field')
    await rejected('stray-correction', {
      action: 'update', basis: 'I am not a beginner.', learner: { level: 'advanced' }, correction: { level: 'advanced' },
    }, 'correction is only for action=correct')
    await rejected('empty-correction', { action: 'correct', basis: 'Fix that.', correction: {} }, 'needs at least one correction field')
    await rejected('update-on-correct', {
      action: 'correct', basis: 'I am not a beginner.', learner: { level: 'advanced' }, correction: { level: 'advanced' },
    }, 'not used with action=correct')
    await rejected('fresh-on-attempt', {
      action: 'update', basis: 'Tried it.', evidence: { kind: 'attempt', correctness: 'partial', independence: 'guided', confidence: 'low', freshContext: true },
    }, 'evidence.freshContext is only for kind=transfer')
    await rejected('step-without-plan', { action: 'update', basis: 'Did step one.', planStepDone: 'one' }, 'planStepDone needs a plan')
    await rejected('legacy-event-shape', {
      action: 'update',
      event: { type: 'goal_observed', goal: 'Learn queues', observation: { id: 'x', source: 'learner-message', summary: 'x' } },
    }, 'event')
    // Schema-level violations: unknown values never reach the reducer.
    await rejected('unknown-level', { action: 'update', basis: 'Said so.', learner: { level: 'expert' } }, '')
    await rejected('incomplete-evidence', { action: 'update', basis: 'Tried it.', evidence: { kind: 'attempt' } }, '')
    expect(agent.session.snapshotEvents().filter(event => event.type === 'learning/state')).toHaveLength(0)
  })
})

describe('Learning checkpoint broker', () => {
  it('falls back immediately without a rich Client and replays the stable terminal receipt', async () => {
    const ctx = await setupBroker(false)
    const agent = stubAgent('no-client')
    const request = { checkpoint: checkpoint(), agent, callId: 'no-client-call' }

    const first = await ctx.learningActivities.presentCheckpoint(request)
    const replay = await ctx.learningActivities.presentCheckpoint(request)

    expect(first).toMatchObject({
      protocol: CHECKPOINT_RESULT_PROTOCOL,
      status: 'skipped',
      reason: 'client-unavailable',
    })
    expect(replay).toEqual(first)
    expect(ctx.learningActivities.pendingCount).toBe(0)
  })

  it('maps a terminal single-choice label back to its stable option id', async () => {
    const ctx = await setupBroker(true)
    const agent = stubAgent('terminal-choice-label')
    await registerRoot(ctx, agent)
    registerAnswerer(ctx, {
      ask: async request => ({
        answers: [{
          id: request.questions[0]!.id,
          selected: [],
          // A non-rich provider may return the visible text instead of the
          // JSON result envelope used by the Learning client.
          custom: '  second   answer  ',
        }],
      }),
    })

    const result = await ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint({
        kind: 'single_choice',
        options: [
          { id: 'first', label: 'First answer' },
          { id: 'second', label: 'Second answer' },
        ],
      }),
      agent,
      callId: 'terminal-choice-label-call',
    })

    expect(result).toMatchObject({
      status: 'submitted',
      response: { optionId: 'second' },
    })
  })

  it.each(['submitted', 'skipped', 'cancelled'] as const)(
    'accepts the terminal %s result through exactly one user-result wait',
    async status => {
      const ctx = await setupBroker(true)
      const agent = stubAgent(`terminal-${status}`)
      await registerRoot(ctx, agent)
      const ask = vi.fn(async (request: AskUserQuestionRequest) => answerFor(request, status))
      registerAnswerer(ctx, { ask })

      const result = await ctx.learningActivities.presentCheckpoint({
        checkpoint: checkpoint(), agent, callId: `call-${status}`,
      })

      expect(result.status).toBe(status)
      expect(result.reason).toBe(status === 'skipped' ? 'learner-skipped' : status === 'cancelled' ? 'learner-cancelled' : undefined)
      expect(ask).toHaveBeenCalledTimes(1)
      expect(ask.mock.calls[0]?.[0].questions).toHaveLength(1)
      expect(ctx.learningActivities.pendingCount).toBe(0)
      const state = ctx.learningActivities.learnerState(agent)
      expect(state.lastMove).toBe('checkpoint')
      expect(state.progressSignal).toBe('unknown')
      if (status === 'submitted') {
        expect(state.evidence.at(-1)).toMatchObject({
          kind: 'prediction',
          correctness: 'unknown',
          independence: 'unknown',
        })
        expect(state.mastery).toBe('unseen')
      } else expect(state.evidence).toEqual([])
    },
  )

  it('records submitted transfer evidence as unevaluated/unknown and never upgrades mastery', async () => {
    const ctx = await setupBroker(true)
    const agent = stubAgent('checkpoint-transfer-unknown')
    await registerRoot(ctx, agent)
    registerAnswerer(ctx, {
      ask: async request => answerFor(request, 'submitted', { receiptId: 'transfer-unknown-receipt' }),
    })

    await ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint({
        kind: 'free_text',
        prompt: 'Apply FIFO to this fresh printer-job case and explain the result.',
        expectedEvidence: 'transfer',
      }),
      agent,
      callId: 'checkpoint-transfer-unknown-call',
    })
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      mastery: 'unseen',
      progressSignal: 'unknown',
      lastMove: 'checkpoint',
      evidence: [{
        kind: 'transfer',
        transferContext: 'unknown',
        correctness: 'unknown',
        independence: 'unknown',
      }],
    })
  })

  it('deduplicates one pending call and rejects altered replay content or a second pending call in the session', async () => {
    const ctx = await setupBroker(true)
    const agent = stubAgent('pending-session')
    await registerRoot(ctx, agent)
    let resolveAnswer: ((answer: ReturnType<typeof answerFor>) => void) | undefined
    let seenRequest: AskUserQuestionRequest | undefined
    const ask = vi.fn((request: AskUserQuestionRequest) => {
      seenRequest = request
      return new Promise<ReturnType<typeof answerFor>>(resolve => { resolveAnswer = resolve })
    })
    registerAnswerer(ctx, { ask })
    const request = { checkpoint: checkpoint(), agent, callId: 'stable-call' }

    const first = ctx.learningActivities.presentCheckpoint(request)
    const replay = ctx.learningActivities.presentCheckpoint(request)
    await expect(ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint({ prompt: 'A changed prompt.' }),
      agent,
      callId: 'stable-call',
    })).rejects.toThrow(/different content/)
    await expect(ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint(),
      agent,
      callId: 'second-call',
    })).rejects.toThrow(/at most one pending learning checkpoint/)

    expect(ask).toHaveBeenCalledTimes(1)
    resolveAnswer?.(answerFor(seenRequest!, 'submitted'))
    const [result, replayed] = await Promise.all([first, replay])
    expect(replayed).toBe(result)
    expect(result.status).toBe('submitted')
  })

  it('allows one pending checkpoint in each of two sessions without crossing terminal results', async () => {
    const ctx = await setupBroker(true)
    const agentA = stubAgent('pending-a')
    const agentB = stubAgent('pending-b')
    await registerRoot(ctx, agentA)
    await registerRoot(ctx, agentB)
    const pending = new Map<string, {
      request: AskUserQuestionRequest
      resolve(answer: ReturnType<typeof answerFor>): void
    }>()
    const ask = vi.fn((request: AskUserQuestionRequest) => new Promise<ReturnType<typeof answerFor>>(resolve => {
      const envelope = decodeLearningCheckpointDetail(request.questions[0]!.detail)
      if (envelope === undefined) throw new Error('missing checkpoint detail')
      pending.set(envelope.sessionId, { request, resolve })
    }))
    registerAnswerer(ctx, { ask })

    const resultA = ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint(), agent: agentA, callId: 'pending-a-call',
    })
    const resultB = ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint(), agent: agentB, callId: 'pending-b-call',
    })
    expect(ctx.learningActivities.pendingCount).toBe(2)
    expect(ask).toHaveBeenCalledTimes(2)

    const waitB = pending.get('pending-b')!
    waitB.resolve(answerFor(waitB.request, 'cancelled', { receiptId: 'receipt-pending-b' }))
    const waitA = pending.get('pending-a')!
    waitA.resolve(answerFor(waitA.request, 'submitted', { receiptId: 'receipt-pending-a' }))
    await expect(resultB).resolves.toMatchObject({ status: 'cancelled', receiptId: 'receipt-pending-b' })
    await expect(resultA).resolves.toMatchObject({ status: 'submitted', receiptId: 'receipt-pending-a' })
    expect(ctx.learningActivities.pendingCount).toBe(0)
    expect(ctx.learningActivities.learnerState(agentA).evidence).toHaveLength(1)
    expect(ctx.learningActivities.learnerState(agentB).evidence).toHaveLength(0)
  })

  it('aborts on learner-state reset and rejects a late submission without restoring checkpoint state', async () => {
    const ctx = await setupBroker(true)
    const agent = stubAgent('checkpoint-reset')
    await registerRoot(ctx, agent)
    let resolveAnswer: ((answer: ReturnType<typeof answerFor>) => void) | undefined
    let seenRequest: AskUserQuestionRequest | undefined
    registerAnswerer(ctx, {
      ask(request) {
        seenRequest = request
        return new Promise(resolve => { resolveAnswer = resolve })
      },
    })

    const pending = ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint({ expectedEvidence: 'transfer' }),
      agent,
      callId: 'checkpoint-before-reset',
    })
    expect(ctx.learningActivities.pendingCount).toBe(1)
    const current = ctx.learningActivities.learnerState(agent)
    expect(ctx.learningActivities.updateLearnerState({
      action: 'reset',
      agent,
      expectedRevision: current.revision,
    })).toMatchObject({ status: 'reset' })
    expect(ctx.learningActivities.pendingCount).toBe(0)
    await expect(pending).resolves.toMatchObject({ status: 'cancelled' })

    resolveAnswer?.(answerFor(seenRequest!, 'submitted', { receiptId: 'late-after-reset' }))
    await Promise.resolve()
    expect(ctx.learningActivities.learnerState(agent)).toMatchObject({
      evidence: [],
      lastMove: 'none',
      mastery: 'unseen',
    })
    expect(agent.session.snapshotEvents().filter(event => event.type === 'learning/state')).toHaveLength(1)
    expect(agent.session.snapshotEvents().at(-1)).toMatchObject({ data: { reason: 'reset' } })
  })

  it('fences a disposed checkpoint from a replacement session object reusing the same id', async () => {
    const ctx = await setupBroker(true)
    const original = stubAgent('reused-session-id')
    const disposeOriginal = await registerRoot(ctx, original)
    let resolveAnswer: ((answer: ReturnType<typeof answerFor>) => void) | undefined
    let seenRequest: AskUserQuestionRequest | undefined
    registerAnswerer(ctx, {
      ask(request) {
        seenRequest = request
        return new Promise(resolve => { resolveAnswer = resolve })
      },
    })

    const pending = ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint(),
      agent: original,
      callId: 'checkpoint-old-session-object',
    })
    expect(ctx.learningActivities.pendingCount).toBe(1)
    expect(ctx.learningActivities.checkpointCacheSize).toBe(3)
    await disposeOriginal()
    expect(ctx.learningActivities.pendingCount).toBe(0)
    expect(ctx.learningActivities.checkpointCacheSize).toBe(0)

    const replacement = stubAgent('reused-session-id')
    const disposeReplacement = await registerRoot(ctx, replacement)
    await expect(pending).resolves.toMatchObject({ status: 'cancelled' })
    resolveAnswer?.(answerFor(seenRequest!, 'submitted', { receiptId: 'late-old-session-receipt' }))
    await Promise.resolve()

    expect(ctx.learningActivities.learnerState(replacement)).toMatchObject({
      revision: 0,
      evidence: [],
      lastMove: 'none',
    })
    expect(original.session.snapshotEvents().filter(event => event.type === 'learning/state')).toHaveLength(0)
    expect(replacement.session.snapshotEvents().filter(event => event.type === 'learning/state')).toHaveLength(0)

    const replacementPending = ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint(),
      agent: replacement,
      callId: 'checkpoint-old-session-object',
    })
    expect(ctx.learningActivities.pendingCount).toBe(1)
    expect(ctx.learningActivities.checkpointCacheSize).toBe(3)
    ctx.emit('session/disposed', original.session as never)
    expect(ctx.learningActivities.pendingCount).toBe(1)
    expect(ctx.learningActivities.checkpointCacheSize).toBe(3)
    const replacementRequest = seenRequest!
    resolveAnswer?.(answerFor(replacementRequest, 'submitted', { receiptId: 'replacement-session-receipt' }))
    await expect(replacementPending).resolves.toMatchObject({
      status: 'submitted',
      receiptId: 'replacement-session-receipt',
    })
    expect(ctx.learningActivities.learnerState(replacement).evidence).toHaveLength(1)
    expect(ctx.learningActivities.checkpointCacheSize).toBe(2)
    await disposeReplacement()
    expect(ctx.learningActivities.checkpointCacheSize).toBe(0)
  })

  it('settles abort and timeout once, then ignores a late submitted response', async () => {
    for (const mode of ['abort', 'timeout'] as const) {
      const ctx = await setupBroker(true)
      const agent = stubAgent(`late-${mode}`)
      await registerRoot(ctx, agent)
      let resolveAnswer: ((answer: ReturnType<typeof answerFor>) => void) | undefined
      let seenRequest: AskUserQuestionRequest | undefined
      registerAnswerer(ctx, {
        ask(request) {
          seenRequest = request
          return new Promise(resolve => { resolveAnswer = resolve })
        },
      })
      const controller = new AbortController()
      const request = {
        checkpoint: checkpoint(),
        agent,
        callId: `late-${mode}`,
        signal: controller.signal,
        timeoutMs: mode === 'timeout' ? 5 : 5_000,
      }
      const pending = ctx.learningActivities.presentCheckpoint(request)
      if (mode === 'abort') controller.abort()
      const terminal = await pending
      expect(terminal).toMatchObject(mode === 'abort'
        ? { status: 'cancelled', reason: 'session-aborted' }
        : { status: 'skipped', reason: 'client-response-timeout' })
      expect(ctx.learningActivities.pendingCount).toBe(0)

      resolveAnswer?.(answerFor(seenRequest!, 'submitted', { receiptId: `late-receipt-${mode}` }))
      await Promise.resolve()
      const replay = await ctx.learningActivities.presentCheckpoint(request)
      expect(replay).toEqual(terminal)
    }
  })

  it('settles plugin disposal once and ignores a late response', async () => {
    const ctx = await setupBroker(true)
    const agent = stubAgent('dispose-pending')
    await registerRoot(ctx, agent)
    let resolveAnswer: ((answer: ReturnType<typeof answerFor>) => void) | undefined
    let seenRequest: AskUserQuestionRequest | undefined
    let askCount = 0
    registerAnswerer(ctx, {
      ask(request) {
        askCount += 1
        if (askCount === 1) {
          return Promise.resolve(answerFor(request, 'submitted', {
            receiptId: 'answer-before-plugin-dispose',
          }))
        }
        seenRequest = request
        return new Promise(resolve => { resolveAnswer = resolve })
      },
    })
    const broker = ctx.learningActivities
    await expect(broker.presentCheckpoint({
      checkpoint: checkpoint(), agent, callId: 'completed-before-dispose',
    })).resolves.toMatchObject({ status: 'submitted' })
    expect(broker.checkpointCacheSize).toBe(2)

    const request = { checkpoint: checkpoint(), agent, callId: 'dispose-call' }
    const pending = broker.presentCheckpoint(request)
    expect(broker.pendingCount).toBe(1)
    expect(broker.checkpointCacheSize).toBe(5)
    const observed = vi.fn()
    broker.observe(observed)

    await ctx.fiber.dispose()
    const terminal = await pending
    expect(terminal).toMatchObject({ status: 'cancelled', reason: 'session-aborted' })
    expect(broker.pendingCount).toBe(0)
    expect(broker.checkpointCacheSize).toBe(0)

    resolveAnswer?.(answerFor(seenRequest!, 'submitted', { receiptId: 'late-after-dispose' }))
    await Promise.resolve()
    expect(terminal.status).toBe('cancelled')
    expect(broker.checkpointCacheSize).toBe(0)
    broker.reportLifecycle({
      name: 'learning.call.stream_started', phase: 'question', activityId: 'after-dispose',
      lessonToken: 'lesson', roundToken: 'round', seq: 1,
    })
    expect(observed).not.toHaveBeenCalled()
  })

  it('degrades an unexpected provider failure to a skipped terminal result', async () => {
    const ctx = await setupBroker(true)
    const agent = stubAgent('provider-failure')
    await registerRoot(ctx, agent)
    registerAnswerer(ctx, { ask: async () => { throw new Error('renderer crashed') } })

    await expect(ctx.learningActivities.presentCheckpoint({
      checkpoint: checkpoint(), agent, callId: 'provider-failure-call',
    })).resolves.toMatchObject({ status: 'skipped', reason: 'provider-failure' })
    expect(ctx.learningActivities.pendingCount).toBe(0)
  })

  it('deduplicates an identical receipt and rejects the same receipt with different content', async () => {
    const ctx = await setupBroker(false)
    const agent = stubAgent('receipt-deduplication')
    const accept = (ctx.learningActivities as unknown as {
      acceptCheckpointReceipt(
        session: Agent['session'], result: LearningCheckpointResultV1,
      ): LearningCheckpointResultV1
    }).acceptCheckpointReceipt.bind(ctx.learningActivities)
    const original: LearningCheckpointResultV1 = {
      protocol: CHECKPOINT_RESULT_PROTOCOL,
      checkpointId: 'checkpoint-id',
      status: 'submitted',
      response: { text: 'observable answer' },
      receiptId: 'stable-receipt',
    }

    expect(accept(agent.session, original)).toBe(original)
    expect(accept(agent.session, { ...original, response: { text: 'observable answer' } })).toBe(original)
    expect(() => accept(agent.session, { ...original, response: { text: 'changed answer' } }))
      .toThrow(/receiptId was reused for different content/)
  })
})
