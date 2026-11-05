import { useEffect, useMemo, useRef, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ComposerChainProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import {
  CHECKPOINT_RESULT_PROTOCOL,
  RESPONSE_PROTOCOL,
  RESPONSE_PROTOCOL_V2,
  type LearningActivityEnvelopeV1,
  type LearningCheckpointResponseV1,
  type LearningCheckpointResultV1,
  type LearningCheckpointWaitEnvelopeV1,
  type LearningWaitEnvelopeV2,
  type LearningResponseV2,
  type LearningResponseV1,
} from '../protocol.ts'
import {
  decodeLearningCheckpointDetail,
  decodeLearningCheckpointQuestionId,
  decodeLearningDetail,
  decodeLearningQuestionId,
  decodeLearningWaitDetail,
  decodeLearningWaitQuestionId,
} from '../transport.ts'
import { ActivityFrame } from './ActivityFrame.tsx'
import { ActivityRenderer } from './ActivityRenderer.tsx'
import type { ActivitySubmission } from './types.ts'
import { RoundActivity } from './RoundActivity.tsx'
import { LearningCheckpoint } from './LearningCheckpoint.tsx'
import { asQuestionWait, type LearningQuestionWait } from './learning-waits.ts'

export type { LearningQuestionWait } from './learning-waits.ts'

export function envelopeOf(wait: LearningQuestionWait): LearningActivityEnvelopeV1 | LearningWaitEnvelopeV2 | LearningCheckpointWaitEnvelopeV1 | undefined {
  if (wait.questions.length !== 1) return undefined
  const question = wait.questions[0]
  if (question === undefined) return undefined
  const checkpoint = decodeLearningCheckpointDetail(question.detail)
  if (checkpoint !== undefined && decodeLearningCheckpointQuestionId(question.id) === checkpoint.waitId) {
    return checkpoint
  }
  const v2 = decodeLearningWaitDetail(question.detail)
  if (v2 !== undefined && decodeLearningWaitQuestionId(question.id) === v2.waitId) return v2
  return decodeLearningQuestionId(question.id) ?? decodeLearningDetail(question.detail)
}

/**
 * Pure composer-chain selector: only package-owned question envelopes are
 * claimed. The Session's effective pending interaction is the question
 * plugin's carrier; anything else (another domain, a foreign question)
 * declines so the next chain entry can take it.
 */
export function selectLearningActivity({ pendingInteraction, sessionId }: ComposerChainProps): LearningQuestionWait | null {
  const wait = asQuestionWait(pendingInteraction)
  if (wait === undefined) return null
  // A pending wait belongs to one live session. This explicit lineage guard
  // prevents a fork from claiming an ancestor's unresolved interaction.
  if (sessionId === undefined || String(wait.sessionId) !== String(sessionId)) return null
  const envelope = envelopeOf(wait)
  if (envelope === undefined) return null
  if ('checkpoint' in envelope && envelope.sessionId !== String(sessionId)) return null
  return wait
}

type LearningInteractionProps =
  { matched: LearningQuestionWait }
  & PropsLocale<'interactive-learning'>

type LearningComposerProps =
  LearningInteractionProps
  & { publishLearningWait(wait: LearningQuestionWait): () => void }

export function LearningComposer({ matched, publishLearningWait }: LearningComposerProps) {
  // Claim the package-owned question so the generic question composer does
  // not duplicate it. The actual interaction lives in the tool call's place
  // in the assistant turn; a pending activity intentionally has no bottom UI.
  // While this seat holds the claim it hands the carrier to the tool view.
  useEffect(() => publishLearningWait(matched), [matched, publishLearningWait])
  return null
}

export function LearningInteraction({ matched, t }: LearningInteractionProps) {
  const envelope = useMemo(() => envelopeOf(matched), [matched])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const responseInFlight = useRef<Promise<void> | null>(null)
  if (envelope === undefined) return null

  const send = (response: LearningResponseV1 | LearningResponseV2 | LearningCheckpointResultV1): Promise<void> => {
    // React state does not become visible until after the current event batch.
    // Share the exact promise so a double click, repeated keyboard event, or
    // StrictMode replay cannot submit two terminal receipts for one wait.
    if (responseInFlight.current !== null) return responseInFlight.current
    const question = matched.questions[0]
    if (question === undefined) return Promise.resolve()
    const pending = Promise.resolve().then(async (): Promise<void> => {
      setBusy(true)
      setError(null)
      // The carrier resolves the Host waterfall with the whole answer batch;
      // it rejects when no channel accepts the answer any more.
      await matched.answer({ answers: [{ id: question.id, selected: [], custom: JSON.stringify(response) }] })
    }).catch((cause: unknown) => {
        responseInFlight.current = null
        setBusy(false)
        setError(t('error', { message: cause instanceof Error ? cause.message : String(cause) }))
        throw cause
      })
    responseInFlight.current = pending
    return pending
  }

  if ('checkpoint' in envelope) {
    if (envelope.sessionId !== String(matched.sessionId)) return null
    const common = {
      protocol: CHECKPOINT_RESULT_PROTOCOL,
      checkpointId: envelope.checkpointId,
      receiptId: `receipt_${envelope.waitId}`,
    } as const
    const submit = async (response: LearningCheckpointResponseV1): Promise<void> => {
      await send({ ...common, status: 'submitted', response })
    }
    const skip = async (): Promise<void> => {
      await send({ ...common, status: 'skipped', reason: 'learner-skipped' })
    }
    const cancel = async (): Promise<void> => {
      await send({ ...common, status: 'cancelled', reason: 'learner-cancelled' })
    }
    return (
      <LearningCheckpoint
        checkpoint={envelope.checkpoint}
        storageKey={envelope.waitId}
        busy={busy}
        error={error}
        onSubmit={submit}
        onSkip={skip}
        onCancel={cancel}
        t={t}
      />
    )
  }

  if ('waitId' in envelope) {
    // One durable wait owns one durable receipt. A refresh or transport retry
    // therefore replays the same idempotency key instead of minting a new ACK.
    const stableReceiptId = `receipt_${envelope.waitId}`
    const common = {
      protocol: RESPONSE_PROTOCOL_V2,
      activityId: envelope.activityId,
      lessonToken: envelope.lessonToken,
      roundToken: envelope.roundToken,
      seq: envelope.seq,
    } as const
    const storageKey = `${envelope.waitId}:${envelope.activityId}:${envelope.phase}:${envelope.seq}`
    const submitAnswer = async (answer: import('../protocol.ts').LearningJson, interactionState: import('../protocol.ts').LearningJson) => {
      await send({ ...common, phase: 'question', action: 'submit', answer, interactionState, receiptId: stableReceiptId })
    }
    const continueReveal = async (animation: { completed: true; reducedMotion?: boolean }) => {
      await send({ ...common, phase: 'reveal', action: 'continue', animation, receiptId: stableReceiptId })
    }
    const cancelRound = async () => {
      await send(envelope.phase === 'question'
        ? { ...common, phase: 'question', action: 'cancel', receiptId: stableReceiptId }
        : { ...common, phase: 'reveal', action: 'cancel', animation: { completed: false }, receiptId: stableReceiptId })
    }
    return (
      <RoundActivity
        activity={envelope.activity}
        storageKey={storageKey}
        onSubmitAnswer={envelope.phase === 'question' ? submitAnswer : undefined}
        onContinue={envelope.phase === 'reveal' ? continueReveal : undefined}
        onCancel={cancelRound}
        t={t}
      />
    )
  }

  const respond = (response: LearningResponseV1): void => {
    const question = matched.questions[0]
    if (question === undefined) return
    setBusy(true)
    setError(null)
    void send(response).catch(() => {})
  }

  const submit = ({ answer, interactionState }: ActivitySubmission): void => respond({
    protocol: RESPONSE_PROTOCOL,
    activityId: envelope.activityId,
    action: 'submit',
    answer,
    interactionState,
  })

  const skip = (): void => respond({
    protocol: RESPONSE_PROTOCOL,
    activityId: envelope.activityId,
    action: 'skip',
  })

  const cancel = (): void => {
    setBusy(true)
    setError(null)
    // Dismissing an unnamed (blocking) question rejects its waterfall with
    // ASK_CANCELLED, which the Host maps to a learner cancellation.
    void matched.dismiss().catch((cause: unknown) => {
      setBusy(false)
      setError(t('error', { message: cause instanceof Error ? cause.message : String(cause) }))
    })
  }

  return (
    <ActivityFrame
      key={matched.key}
      activityId={envelope.activityId}
      activity={envelope.activity}
      busy={busy}
      error={error}
      onSkip={skip}
      onCancel={cancel}
      t={t}
    >
      <ActivityRenderer activity={envelope.activity} busy={busy} onSubmit={submit} t={t} />
    </ActivityFrame>
  )
}
