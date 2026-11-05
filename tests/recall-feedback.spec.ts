import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import UserQuestionService from '@deepseek-ai/dsh-user-questions'
import * as ClientConnectionHost from '@deepseek-ai/dsh-client-connection'
import { installConnection, type ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import WebServer from '@deepseek-ai/dsh-host-webserver'
import {
  LearningActivityBroker,
  RECALL_FEEDBACK_ROUTE_PATH,
  RECALL_FEEDBACK_RPC_ENDPOINT,
} from '../src/broker.ts'
import {
  RECALL_FEEDBACK_PROTOCOL_V1,
  parseLearningRecallFeedbackV1,
} from '../src/protocol.ts'
import { mountAgentRegistry } from './host-harness.ts'

function stubAgent(id: string): Agent {
  const log: Array<{ type: string; seq: number; time: number; data: unknown }> = []
  const session = {
    id,
    header: { delegationDepth: 0 },
    get seq() { return log.length },
    snapshotEvents() { return Object.freeze([...log]) },
    append(type: string, data: unknown) {
      const event = Object.freeze({ type, seq: log.length, time: Date.now(), data: structuredClone(data) })
      log.push(event)
      return event
    },
  }
  return { id, session } as unknown as Agent
}

async function setup(): Promise<Context> {
  const ctx = new Context()
  await mountAgentRegistry(ctx)
  await ctx.plugin(UserQuestionService)
  ctx.provide('clientModules', {
    graph: () => ({ rev: 'test', entries: [{ id: '@dsh-portable/interactive-learning', url: '/client.js', rev: 'x' }] }),
  } as never)
  await ctx.plugin(LearningActivityBroker)
  return ctx
}

describe('RecallDeck Host feedback', () => {
  it('serves the browser rating call through the real 0.2 Connection Host and client', async () => {
    const ctx = new Context()
    await mountAgentRegistry(ctx)
    await ctx.plugin(UserQuestionService)
    ctx.provide('clientModules', {
      graph: () => ({ rev: 'test', entries: [{ id: '@dsh-portable/interactive-learning', url: '/client.js', rev: 'x' }] }),
    } as never)
    // Only the persistent credential store is in memory; the Web carrier,
    // Connection plugin, browser trust fence, and token exchange are real.
    const records = new Map<string, unknown>()
    ctx.provide('credentials', {
      async modifyRecord(key: string, update: (current: unknown) => Promise<unknown>) {
        const next = await update(records.get(key))
        if (next !== undefined) records.set(key, next)
        return records.get(key)
      },
    } as never)
    await ctx.plugin(WebServer, { host: '127.0.0.1', port: 0 })
    await ctx.plugin(ClientConnectionHost as never, {} as never)
    await ctx.plugin(LearningActivityBroker)
    const origin = `http://127.0.0.1:${String(ctx.webServer.port)}`

    // An unauthenticated caller never reaches the route.
    const anonymous = await fetch(`${origin}${RECALL_FEEDBACK_ROUTE_PATH}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    })
    expect(anonymous.status).toBe(401)

    // Sign in exactly as an API client does: launch token → signed cookie.
    const connectUrl = new URL(ctx.connection.authenticatedUrl(`${origin}/connect`))
    connectUrl.searchParams.set('interactions', 'none')
    const connected = await fetch(connectUrl, { redirect: 'manual' })
    expect(connected.status).toBe(302)
    const cookie = connected.headers.get('set-cookie')?.split(';', 1)[0] ?? ''
    expect(cookie).not.toBe('')

    // The Learning client's own call, through the real Connection client caller.
    const client = new Context()
    installConnection(client, {
      transport: {
        fetch: (route, init) => fetch(new URL(String(route), `${origin}/`), {
          ...init,
          headers: { ...(init.headers as Record<string, string>), cookie },
        }),
      },
    })
    const connection = (client as Context & { connection: ConnectionHandle }).connection

    const agent = stubAgent('rpc-e2e-session')
    expect(ctx.learningActivities.recordVisual(agent, 'visual-call')).toBe('ready')
    const payload = {
      protocol: RECALL_FEEDBACK_PROTOCOL_V1,
      sessionId: 'rpc-e2e-session',
      callId: 'visual-call',
      cardId: 'card_e2e',
      status: 'mastered',
    }
    const recorded = await connection.rpc.call('/api', RECALL_FEEDBACK_RPC_ENDPOINT, payload)
    expect(recorded).toMatchObject({ ok: true, value: { status: 'recorded' } })
    expect(ctx.learningActivities.learnerState(agent).evidence.at(-1)?.summary).toContain('card_e2e')

    const malformed = await connection.rpc.call('/api', RECALL_FEEDBACK_RPC_ENDPOINT, { ...payload, status: 'perfect' })
    expect(malformed).toMatchObject({ ok: false, error: { code: 'bad-request' } })

    await client.fiber.dispose()
    await ctx.fiber.dispose()
  })

  it('registers one owner-only exact route and answers with the Connection response envelope', async () => {
    const ctx = new Context()
    await mountAgentRegistry(ctx)
    await ctx.plugin(UserQuestionService)
    ctx.provide('clientModules', {
      graph: () => ({ rev: 'test', entries: [{ id: '@dsh-portable/interactive-learning', url: '/client.js', rev: 'x' }] }),
    } as never)
    let route: { path: string; methods: readonly string[]; fetch(request: Request): Promise<Response> } | undefined
    ctx.provide('connection', {
      fetch: {
        register: (next: typeof route) => {
          route = next
          return async () => {}
        },
      },
    } as never)
    await ctx.plugin(LearningActivityBroker)
    expect(route?.path).toBe('/api/interactive-learning/recall-feedback')
    expect(route?.methods).toEqual(['POST'])

    const agent = stubAgent('rpc-session')
    ctx.learningActivities.recordVisual(agent, 'visual-call')
    const call = (body: unknown, contentType = 'application/json') => route!.fetch(new Request(`http://host${route!.path}`, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: JSON.stringify(body),
    }))
    const payload = parseLearningRecallFeedbackV1({
      protocol: RECALL_FEEDBACK_PROTOCOL_V1,
      sessionId: 'rpc-session',
      callId: 'visual-call',
      cardId: 'card_rpc',
      status: 'mastered',
    })
    const response = await call({ type: 'client-request', rpcId: 'rpc-1', method: RECALL_FEEDBACK_RPC_ENDPOINT, payload })
    const body = await response.json() as {
      type: string
      rpcId: string
      result: { ok: boolean; value?: { status?: string; observationId?: string } }
    }
    expect(body).toMatchObject({ type: 'server-response', rpcId: 'rpc-1', result: { ok: true, value: { status: 'recorded' } } })
    expect(body.result.value?.observationId).toContain('recall:')
    expect(ctx.learningActivities.learnerState(agent).evidence.at(-1)?.summary).toContain('card_rpc')

    expect(await (await call({ type: 'client-request', rpcId: 'rpc-2', method: 'recall/other', payload })).json())
      .toMatchObject({ rpcId: 'rpc-2', result: { ok: false, error: { code: 'bad-request' } } })
    expect(await (await call({ rpcId: 'rpc-3', method: RECALL_FEEDBACK_RPC_ENDPOINT, payload })).json())
      .toMatchObject({ rpcId: 'rpc-3', result: { ok: false, error: { message: 'invalid client-request message' } } })
    expect((await call({}, 'text/plain')).status).toBe(415)
  })

  it('records self-ratings as unverified evidence and makes retries idempotent', async () => {
    const ctx = await setup()
    const agent = stubAgent('recall-session')
    expect(ctx.learningActivities.recordVisual(agent, 'visual-call')).toBe('ready')
    const feedback = parseLearningRecallFeedbackV1({
      protocol: RECALL_FEEDBACK_PROTOCOL_V1,
      sessionId: 'recall-session',
      callId: 'visual-call',
      cardId: 'gradient_card',
      status: 'review',
    })

    const first = ctx.learningActivities.recordRecallFeedback(feedback)
    expect(first.status).toBe('recorded')
    const state = ctx.learningActivities.learnerState(agent)
    expect(state.mastery).toBe('unseen')
    expect(state.evidence.at(-1)).toMatchObject({
      kind: 'attempt',
      correctness: 'unknown',
      independence: 'unknown',
      confidence: 'low',
    })
    expect(state.evidence.at(-1)?.summary).toContain('gradient_card')
    expect(ctx.learningActivities.learnerStateTranscript(agent)).toContain('gradient_card')
    const revision = state.revision

    const replay = ctx.learningActivities.recordRecallFeedback(feedback)
    expect(replay.status).toBe('recorded')
    expect(ctx.learningActivities.learnerState(agent).revision).toBe(revision)
  })

  it('does not accept feedback for a different or inactive session', async () => {
    const ctx = await setup()
    const agent = stubAgent('known-session')
    ctx.learningActivities.recordVisual(agent, 'visual-call')
    const feedback = parseLearningRecallFeedbackV1({
      protocol: RECALL_FEEDBACK_PROTOCOL_V1,
      sessionId: 'unknown-session',
      callId: 'visual-call',
      cardId: 'card_a',
      status: 'mastered',
    })
    expect(ctx.learningActivities.recordRecallFeedback(feedback)).toEqual({
      status: 'ignored',
      reason: 'session-unavailable',
    })
    expect(ctx.learningActivities.learnerState(agent).evidence).toHaveLength(0)
  })

  it('ignores an in-flight feedback call after the broker is disposed', async () => {
    const ctx = await setup()
    const broker = ctx.learningActivities
    const agent = stubAgent('disposed-session')
    broker.recordVisual(agent, 'visual-call')
    const feedback = parseLearningRecallFeedbackV1({
      protocol: RECALL_FEEDBACK_PROTOCOL_V1,
      sessionId: 'disposed-session',
      callId: 'visual-call',
      cardId: 'card_a',
      status: 'review',
    })

    await ctx.fiber.dispose()
    expect(broker.recordRecallFeedback(feedback)).toEqual({
      status: 'ignored',
      reason: 'session-unavailable',
    })
  })
})
