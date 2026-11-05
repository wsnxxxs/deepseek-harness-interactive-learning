/** Client entry: one composer takeover and one replayable keyed tool renderer. */
import type { Context } from '@deepseek-ai/cordis'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale) and the
// shared `common` vocabulary the Markdown chrome labels read.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the SlotMap merges of `conversation.composer` and `tool.call.toolview`.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-tool/client'
import type { SlotCore, SlotMap } from '@deepseek-ai/dsh-client-ui-slots'
import { LearningComposer, selectLearningActivity } from './LearningComposer.tsx'
import { LearningToolView } from './LearningToolView.tsx'
import { createLearningWaitStore } from './learning-waits.ts'
import { subscribeLearningUiLifecycle } from './lifecycle.ts'
import { en, zh } from './locales.ts'
import { RECALL_FEEDBACK_PROTOCOL_V1 } from '../protocol.ts'
import { RECALL_FEEDBACK_RPC_CHANNEL, RECALL_FEEDBACK_RPC_ENDPOINT } from '../recall-feedback.ts'

export { ActivityRendererRegistry, activityRendererRegistry } from './ActivityRenderer.tsx'
export { subscribeLearningUiLifecycle, type LearningUiLifecycleEvent } from './lifecycle.ts'

const NS = 'interactive-learning'
export const LEARNING_TOOL_VIEW_KEYS = [
  'learning_visual',
  'learning_checkpoint',
  'learning_state_update',
  // Replay support for conversations created by the retired blocking protocol.
  'learning_activity',
  'learning_question',
  'learning_reveal',
] as const

/** Learner-state writes are internal bookkeeping and never produce a card. */
export function LearningStateUpdateToolView(): null {
  return null
}

/** One synchronous effect installed while an injected slot declaration is live. */
type SlotInjectionEffect = (() => void) | Iterable<() => void, void, void>

/**
 * The slot-registry face this plugin uses: the renderer-owned `ctx.slots`
 * service (`packages/client/ui-renderer/src/client/registry.ts`), whose
 * `register` is exactly {@link SlotCore.register}. Named structurally so the
 * Client compiles without a type edge to the renderer implementation package.
 */
interface LearningSlots {
  register: SlotCore['register']
  inject(key: keyof SlotMap & string, callback: () => SlotInjectionEffect): () => void
}

/** Root Client Context with the services this plugin injects. */
type LearningClientContext = Context & { slots: LearningSlots }

export const name = 'interactive-learning-client'
export const inject = ['slots', 'locale']

export function apply(ctx: LearningClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'interactive-learning: dictionaries')

  // Reuse the existing Client lifecycle stream as the UI-to-transport seam;
  // the payload itself goes through Connection RPC and is handled by the Host
  // broker, so a renderer never owns a second message bus.
  ctx.inject(['connection'], (connectionCtx) => {
    const connection = connectionCtx.get('connection') as ConnectionHandle | undefined
    if (connection === undefined) return
    connectionCtx.effect(() => subscribeLearningUiLifecycle(event => {
      if (event.name !== 'learning.recall.rated'
        || event.sessionId === undefined
        || event.callId === undefined
        || event.cardId === undefined
        || event.status === undefined) return
      // Best-effort: a rejected call or an explicit Host error never blocks
      // the learner's click, and the rating stays in the local replay state.
      void connection.rpc.call(RECALL_FEEDBACK_RPC_CHANNEL, RECALL_FEEDBACK_RPC_ENDPOINT, {
        protocol: RECALL_FEEDBACK_PROTOCOL_V1,
        sessionId: event.sessionId,
        callId: event.callId,
        cardId: event.cardId,
        status: event.status,
      }).catch(() => {})
    }), 'interactive-learning: recall feedback bridge')
  })

  // The composer seat claims a Learning-owned question; while it holds the
  // claim it publishes the carrier here, and the tool call's own view reads
  // it back to render the interaction inline.
  const waits = createLearningWaitStore()

  ctx.slots.inject('conversation.composer', () => ctx.slots.register({
    name: 'conversation.composer',
    select: selectLearningActivity,
    // Lower tries first: claim before the generic question composer (0).
    priority: -100,
    locale: NS,
    inject: () => ({ publishLearningWait: waits.publish }),
  }, LearningComposer))

  for (const key of LEARNING_TOOL_VIEW_KEYS) {
    if (key === 'learning_state_update') {
      ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
        name: 'tool.call.toolview',
        key,
        locale: NS,
      }, LearningStateUpdateToolView))
      continue
    }
    ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
      name: 'tool.call.toolview',
      key,
      locale: NS,
      inject: (sessionId) => ({ learningSessionId: String(sessionId), hooks: { learningWaits: waits } }),
    }, LearningToolView))
  }
}
