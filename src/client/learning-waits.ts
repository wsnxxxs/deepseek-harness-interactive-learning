/**
 * Package-owned pending question waits, bridged from the composer seat to the
 * inline tool view.
 *
 * In harness 0.2 a Host `userQuestions.ask()` reaches the browser as the
 * `user-questions/request` Remote waterfall. The question plugin
 * (`@deepseek-ai/dsh-client-ui-user-questions`) answers it with one
 * `PendingQuestion` carrier, publishes that carrier through
 * `uiSession.registerPendingInteraction()`, and the conversation composer chain
 * receives it as `ComposerChainProps.pendingInteraction`. A pure selector
 * claims the Learning-owned carrier before the generic question composer can;
 * the elected (invisible) composer entry then publishes the carrier into this
 * store while it is mounted, and the tool call's own view reads it back so the
 * activity renders in its place in the assistant turn.
 */

/** One answer of a user-question batch (`AskUserQuestionAnswerItem`). */
export interface LearningQuestionAnswerItem {
  id: string
  selected: string[]
  custom?: string
}

/** One question of a user-question batch, narrowed to what Learning reads. */
export interface LearningQuestionItem {
  readonly id: string
  readonly question: string
  readonly detail?: string
}

/**
 * Structural face of the question plugin's `PendingQuestion` carrier
 * (`packages/client/ui-user-questions/src/client/contract/slots.ts`). Only the
 * members Learning reads or calls are named, so this package needs no runtime
 * or type edge to the question plugin.
 */
export interface LearningQuestionWait {
  /** Render identity of the request; unique per pending request. */
  readonly key: string
  /** Presentation discriminator; Learning carriers are plain `question`s. */
  readonly kind: string
  /** Session that owns the request. */
  readonly sessionId: string
  /** The request's whole question batch. */
  readonly questions: readonly LearningQuestionItem[]
  /** Resolve the Host waterfall with one answer batch; rejects when no channel accepts it. */
  answer(answer: { answers: LearningQuestionAnswerItem[] }): Promise<void>
  /** Close the request: an unnamed (blocking) request is cancelled with `ASK_CANCELLED`. */
  dismiss(): Promise<void>
}

/** Narrow an opaque Session pending interaction to the question carrier shape. */
export function asQuestionWait(value: unknown): LearningQuestionWait | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const candidate = value as Partial<Record<keyof LearningQuestionWait, unknown>>
  if (typeof candidate.key !== 'string'
    || candidate.kind !== 'question'
    || (typeof candidate.sessionId !== 'string' && typeof candidate.sessionId !== 'number')
    || !Array.isArray(candidate.questions)
    || typeof candidate.answer !== 'function'
    || typeof candidate.dismiss !== 'function') return undefined
  return value as LearningQuestionWait
}

/** Observable snapshot source compatible with the slot `hooks` compartment. */
export interface LearningWaitSource {
  getSnapshot(): readonly LearningQuestionWait[]
  subscribe(listener: () => void): () => void
}

/** Per-plugin registry of the Learning waits currently claimed by the composer seat. */
export interface LearningWaitStore extends LearningWaitSource {
  /**
   * Publish one claimed wait while its composer entry is mounted.
   * @returns idempotent withdrawal.
   */
  publish(wait: LearningQuestionWait): () => void
}

const EMPTY: readonly LearningQuestionWait[] = Object.freeze([])

/** Create one empty wait registry. */
export function createLearningWaitStore(): LearningWaitStore {
  let snapshot = EMPTY
  const listeners = new Set<() => void>()
  const notify = (): void => {
    for (const listener of [...listeners]) listener()
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    publish(wait) {
      if (!snapshot.includes(wait)) {
        snapshot = Object.freeze([...snapshot.filter(item => item.key !== wait.key), wait])
        notify()
      }
      let active = true
      return () => {
        if (!active) return
        active = false
        if (!snapshot.includes(wait)) return
        snapshot = snapshot.length === 1 ? EMPTY : Object.freeze(snapshot.filter(item => item !== wait))
        notify()
      }
    },
  }
}
