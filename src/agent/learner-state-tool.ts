/**
 * Model-facing `learning_state_update` tool: schema, description, and the
 * fan-out from one batched call into the durable learner-state reducer events.
 *
 * The model writes one call per turn with fields grouped by meaning. The Host
 * derives every bookkeeping detail the old single-event schema exposed —
 * observation ids, observation sources, the event type for each field — so the
 * persisted `learning/state` snapshots and the reducer stay exactly as before.
 */
import type { LearningStateUpdateRequest } from '../broker.ts'
import type {
  LearnerAssessmentContext,
  LearnerEvidenceConfidence,
  LearnerEvidenceCorrectness,
  LearnerEvidenceIndependence,
  LearnerEvidenceKind,
  LearnerGap,
  LearnerLevel,
  LearnerMastery,
  LearnerMoveFailureReason,
  LearnerNextMove,
  LearnerProgressSignal,
  LearnerReadiness,
  LearnerRequestKind,
  LearnerState,
  LearnerStateCorrection,
  LearnerStateEvent,
  LearnerTeachingMove,
  LearnerUrgency,
  ObservableLearnerEvent,
} from '../learner-state.ts'

export const LEARNER_STATE_TOOL_NAME = 'learning_state_update'

/**
 * Moves the model can name. The reducer also accepts the legacy `example` and
 * `question` values so older sessions keep folding, but new notes use the
 * explicit move names the teaching references describe.
 */
const MODEL_TEACHING_MOVES = [
  'explanation', 'worked_example', 'guided_discovery', 'reflective_pause', 'resource',
  'repair', 'transfer', 'visual', 'checkpoint',
] as const satisfies readonly LearnerTeachingMove[]

const MODEL_NEXT_MOVES = [
  'calibrate', 'direct', 'explain', 'worked_example', 'guided_discovery', 'reflective_pause',
  'resource', 'repair', 'transfer', 'complete',
] as const satisfies readonly LearnerNextMove[]

const REQUEST_KINDS = [
  'concept', 'procedure', 'topic', 'source-study', 'practice', 'resource', 'direct-task',
] as const satisfies readonly LearnerRequestKind[]

const approach = {
  type: 'string',
  description: 'Short label for the approach, e.g. "analogy:water-pipes" or "worked:2x+3=7", so it is not repeated.',
} as const

const stringList = { type: 'array', items: { type: 'string' } } as const

export const learnerStateToolDescription = [
  'Save session-only notes that steer your later turns; the learner never sees them.',
  'Call at most once per turn, before your reply, and only when something you observed changes what you will do next; put everything from this turn in that one call.',
  'Base every field on what the learner actually said or did, or on the supplied material, never on guessed traits, emotions, or learning styles.',
  'Mastery and the next phase are worked out from the evidence you record, and visuals and checkpoints you use are recorded automatically.',
].join(' ')

export const learnerStateToolParameters = {
  action: {
    type: 'string',
    enum: ['update', 'correct', 'reset'],
    required: true,
    description: 'update records new observations; correct applies the learner\'s explicit correction of a note (for example "I\'m not a beginner" or "stop quizzing me"); reset clears all notes when they start over or switch topic.',
  },
  basis: {
    type: 'string',
    description: 'Required for update and correct: what the learner said or did (a quote or close paraphrase), or the source fact, that this call records.',
  },
  learner: {
    type: 'object',
    additionalProperties: false,
    description: 'Facts about the learner observed this turn.',
    properties: {
      goal: { type: 'string', description: 'What they want to be able to do, in their words.' },
      requestKind: { type: 'string', enum: REQUEST_KINDS },
      level: {
        type: 'string',
        enum: ['novice', 'intermediate', 'advanced'],
        description: 'Only from what they said or showed, never from vocabulary alone.',
      },
      knows: { ...stringList, description: 'Prior knowledge they showed or stated.' },
      gap: {
        type: 'string',
        enum: ['concept', 'procedure', 'notation', 'task-model', 'prerequisite'],
        description: 'task-model means they misread what the question asks.',
      },
      misconceptions: {
        ...stringList,
        description: 'Specific wrong beliefs observed, e.g. "treats the index as the stored value".',
      },
      readiness: { type: 'string', enum: ['can-reason', 'needs-foothold'] },
      progress: { type: 'string', enum: ['progressing', 'impatient', 'stuck', 'shutdown-risk'] },
      urgency: {
        type: 'string',
        enum: ['none', 'initial-blocker', 'later-pressure'],
        description: 'initial-blocker is a deadline stated in the opening request; later-pressure appears mid-lesson.',
      },
      assessed: {
        type: 'string',
        enum: ['self-study', 'graded'],
        description: 'Whether this work will be graded or submitted.',
      },
    },
  },
  evidence: {
    type: 'object',
    additionalProperties: false,
    description: 'Your assessment of the learner\'s latest attempt; omit when there was none.',
    properties: {
      kind: {
        type: 'string',
        enum: ['attempt', 'prediction', 'explanation', 'contrast', 'error', 'transfer'],
        required: true,
      },
      correctness: { type: 'string', enum: ['correct', 'partial', 'incorrect'], required: true },
      independence: {
        type: 'string',
        enum: ['independent', 'guided'],
        required: true,
        description: 'guided when your hint carried part of the reasoning.',
      },
      confidence: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        required: true,
        description: 'How sure you are of this assessment.',
      },
      freshContext: {
        type: 'boolean',
        description: 'For kind=transfer: true when the situation was new rather than a rerun of an example.',
      },
    },
  },
  failedMove: {
    type: 'object',
    additionalProperties: false,
    description: 'Your previous move, when it did not work.',
    properties: {
      move: { type: 'string', enum: MODEL_TEACHING_MOVES, required: true },
      approach: { ...approach, required: true },
      reason: {
        type: 'string',
        enum: ['not-understood', 'repeated-misconception', 'unhelpful-hint', 'wrong-representation', 'no-progress'],
        required: true,
      },
    },
  },
  plan: {
    type: 'object',
    additionalProperties: false,
    description: 'Only for a multi-step goal: a tentative route, replaced whenever you revise it.',
    properties: {
      objective: { type: 'string', required: true },
      steps: {
        type: 'array',
        required: true,
        description: '1 to 6 steps.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', required: true },
            label: { type: 'string', required: true },
          },
        },
      },
    },
  },
  planStepDone: { type: 'string', description: 'Id of a plan step the learner has now demonstrated.' },
  sourceAnchors: {
    ...stringList,
    description: 'Section or page locations seen in the supplied material, e.g. "Ch. 2 §3" or "pp. 18-23".',
  },
  myMove: {
    type: 'object',
    additionalProperties: false,
    description: 'The move you are about to make; record it when you change approach or ask a question you will assess next turn.',
    properties: {
      move: { type: 'string', enum: MODEL_TEACHING_MOVES, required: true },
      approach: { type: 'string', description: 'Short label for this approach, in the same style as failedMove.approach.' },
      question: { type: 'string', description: 'The question you will ask, if any.' },
      nextMove: { type: 'string', enum: MODEL_NEXT_MOVES, description: 'What you plan after their reply.' },
    },
  },
  correction: {
    type: 'object',
    additionalProperties: false,
    description: 'For action=correct: only the notes the learner explicitly corrected.',
    properties: {
      goal: { oneOf: [{ type: 'string' }, { type: 'null' }] },
      level: { type: 'string', enum: ['novice', 'intermediate', 'advanced', 'unknown'] },
      knows: stringList,
      misconceptions: stringList,
      assessed: { type: 'string', enum: ['self-study', 'graded', 'unknown'] },
      mastery: {
        type: 'string',
        enum: ['unseen', 'emerging', 'transfer'],
        description: 'Their own statement of how well they already know it.',
      },
      stopQuestions: {
        type: 'boolean',
        description: 'true when they ask you to stop quizzing them; ends the segment without recording mastery.',
      },
    },
  },
} as const

/** Arguments after schema validation; every group is optional. */
export interface LearnerStateToolArgs {
  action: 'update' | 'correct' | 'reset'
  basis?: string
  learner?: {
    goal?: string
    requestKind?: Exclude<LearnerRequestKind, 'unknown'>
    level?: Exclude<LearnerLevel, 'unknown'>
    knows?: readonly string[]
    gap?: Exclude<LearnerGap, 'unknown'>
    misconceptions?: readonly string[]
    readiness?: Exclude<LearnerReadiness, 'unknown'>
    progress?: Exclude<LearnerProgressSignal, 'unknown'>
    urgency?: Exclude<LearnerUrgency, 'unknown'>
    assessed?: Exclude<LearnerAssessmentContext, 'unknown'>
  }
  evidence?: {
    kind: LearnerEvidenceKind
    correctness: Exclude<LearnerEvidenceCorrectness, 'unknown'>
    independence: Exclude<LearnerEvidenceIndependence, 'unknown'>
    confidence: LearnerEvidenceConfidence
    freshContext?: boolean
  }
  failedMove?: {
    move: LearnerTeachingMove
    approach: string
    reason: Exclude<LearnerMoveFailureReason, 'unavailable' | 'unknown'>
  }
  plan?: {
    objective: string
    steps: ReadonlyArray<{ id: string; label: string }>
  }
  planStepDone?: string
  sourceAnchors?: readonly string[]
  myMove?: {
    move: LearnerTeachingMove
    approach?: string
    question?: string
    nextMove?: LearnerNextMove
  }
  correction?: {
    goal?: string | null
    level?: LearnerLevel
    knows?: readonly string[]
    misconceptions?: readonly string[]
    assessed?: LearnerAssessmentContext
    mastery?: LearnerMastery
    stopQuestions?: boolean
  }
}

/** The broker request this call resolves to, before the Host adds agent and revision. */
export type LearnerStateToolPlan =
  | { action: 'update'; events: readonly Exclude<LearnerStateEvent, { type: 'state_corrected' }>[] }
  | {
      action: 'correct'
      correction: LearnerStateCorrection
      observation: ObservableLearnerEvent & { source: 'user-correction' }
    }
  | { action: 'reset' }

const ROOT_KEYS: ReadonlySet<string> = new Set(Object.keys(learnerStateToolParameters))
const UPDATE_GROUPS = ['learner', 'evidence', 'failedMove', 'plan', 'planStepDone', 'sourceAnchors', 'myMove'] as const

function present(value: unknown): boolean {
  if (value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(item => item !== undefined)
  }
  return true
}

function requireBasis(args: LearnerStateToolArgs): string {
  const basis = typeof args.basis === 'string' ? args.basis.trim() : ''
  if (basis === '') throw new TypeError(`action=${args.action} needs basis: what the learner said or did that this call records`)
  return basis
}

function rejectGroups(args: LearnerStateToolArgs, groups: readonly (keyof LearnerStateToolArgs)[], reason: string): void {
  const extra = groups.filter(group => present(args[group]))
  if (extra.length > 0) throw new TypeError(`${extra.join(', ')} ${extra.length === 1 ? 'is' : 'are'} not used with ${reason}`)
}

function nonEmptyText(value: string, field: string): string {
  const text = value.trim()
  if (text === '') throw new TypeError(`${field} must not be empty`)
  return text
}

/**
 * Resolve one validated call into broker input.
 *
 * Observation ids derive from the model call id plus the field group, so a
 * runtime replay of the same call is an exact, idempotent replay, while the
 * same call id carrying different content is still a detectable conflict.
 *
 * @param args - schema-validated tool arguments.
 * @param context - the call id and the current state (for actionable checks).
 * @returns the reducer events, correction, or reset this call applies.
 * @throws TypeError with a message naming the field to fix.
 */
export function planLearnerStateToolCall(
  args: LearnerStateToolArgs,
  context: { callId: string; state: LearnerState },
): LearnerStateToolPlan {
  const unknown = Object.keys(args).filter(key => !ROOT_KEYS.has(key))
  if (unknown.length > 0) throw new TypeError(`unknown field ${unknown.join(', ')}`)
  const id = (group: string): string => `${context.callId}#${group}`

  if (args.action === 'reset') {
    rejectGroups(args, [...UPDATE_GROUPS, 'correction'], 'action=reset')
    return { action: 'reset' }
  }

  const basis = requireBasis(args)

  if (args.action === 'correct') {
    rejectGroups(args, UPDATE_GROUPS, 'action=correct; use action=update for new observations')
    const input = args.correction ?? {}
    const correction: LearnerStateCorrection = {
      ...(Object.hasOwn(input, 'goal') ? { goal: input.goal ?? null } : {}),
      ...(input.level === undefined ? {} : { level: input.level }),
      ...(input.knows === undefined ? {} : { priorKnowledge: input.knows }),
      ...(input.misconceptions === undefined ? {} : { misconceptions: input.misconceptions }),
      ...(input.assessed === undefined ? {} : { assessmentContext: input.assessed }),
      ...(input.mastery === undefined ? {} : { mastery: input.mastery }),
      ...(input.stopQuestions === true ? { phase: 'complete', nextMove: 'complete' } as const : {}),
    }
    if (Object.keys(correction).length === 0) {
      throw new TypeError('action=correct needs at least one correction field the learner explicitly corrected')
    }
    return {
      action: 'correct',
      correction,
      observation: { id: id('correction'), source: 'user-correction', summary: basis },
    }
  }

  rejectGroups(args, ['correction'], 'action=update; correction is only for action=correct')
  if (!UPDATE_GROUPS.some(group => present(args[group]))) {
    throw new TypeError(`action=update needs at least one of ${UPDATE_GROUPS.join(', ')}`)
  }

  const learnerObservation = (group: string): ObservableLearnerEvent => ({
    id: id(group),
    source: 'learner-message',
    summary: basis,
  })
  const events: Array<Exclude<LearnerStateEvent, { type: 'state_corrected' }>> = []
  const learner = args.learner ?? {}

  if (learner.goal !== undefined) {
    events.push({ type: 'goal_observed', goal: nonEmptyText(learner.goal, 'learner.goal'), observation: learnerObservation('goal') })
  }
  if (learner.requestKind !== undefined) {
    events.push({ type: 'request_kind_observed', requestKind: learner.requestKind, observation: learnerObservation('request-kind') })
  }
  if (learner.level !== undefined || (learner.knows?.length ?? 0) > 0) {
    events.push({
      type: 'prior_knowledge_observed',
      ...(learner.level === undefined ? {} : { level: learner.level }),
      ...((learner.knows?.length ?? 0) === 0 ? {} : { items: learner.knows }),
      observation: learnerObservation('prior-knowledge'),
    })
  }
  if (learner.gap !== undefined || (learner.misconceptions?.length ?? 0) > 0) {
    events.push({
      type: 'gap_observed',
      // A misconception without a new gap diagnosis keeps the current gap.
      gap: learner.gap ?? context.state.gap,
      ...((learner.misconceptions?.length ?? 0) === 0 ? {} : { misconceptions: learner.misconceptions }),
      observation: learnerObservation('gap'),
    })
  }
  if (learner.readiness !== undefined) {
    events.push({ type: 'readiness_observed', readiness: learner.readiness, observation: learnerObservation('readiness') })
  }
  if (learner.progress !== undefined) {
    events.push({ type: 'progress_observed', progressSignal: learner.progress, observation: learnerObservation('progress') })
  }
  if (learner.urgency !== undefined) {
    events.push({ type: 'urgency_observed', urgency: learner.urgency, observation: learnerObservation('urgency') })
  }
  if (learner.assessed !== undefined) {
    events.push({
      type: 'assessment_context_observed',
      assessmentContext: learner.assessed,
      observation: learnerObservation('assessed'),
    })
  }

  // The previous move failed before the learner's latest attempt, so it is
  // applied first; the evidence then sets the current assessment and phase.
  if (args.failedMove !== undefined) {
    events.push({
      type: 'failed_move_observed',
      failedMove: {
        move: args.failedMove.move,
        fingerprint: nonEmptyText(args.failedMove.approach, 'failedMove.approach'),
        failureReason: args.failedMove.reason,
        summary: basis,
      },
      observation: learnerObservation('failed-move'),
    })
  }

  if (args.evidence !== undefined) {
    const { kind, correctness, independence, confidence, freshContext } = args.evidence
    if (kind !== 'transfer' && freshContext !== undefined) {
      throw new TypeError('evidence.freshContext is only for kind=transfer')
    }
    events.push({
      type: 'learner_evidence_observed',
      evidence: kind === 'transfer'
        ? {
            kind,
            transferContext: freshContext === undefined ? 'unknown' : freshContext ? 'fresh' : 'same',
            summary: basis,
            correctness,
            independence,
            confidence,
          }
        : { kind, summary: basis, correctness, independence, confidence },
      observation: learnerObservation('evidence'),
    })
  }

  if (args.plan !== undefined) {
    events.push({
      type: 'plan_observed',
      objective: args.plan.objective,
      steps: args.plan.steps,
      observation: learnerObservation('plan'),
    })
  }

  if (args.planStepDone !== undefined) {
    const stepId = args.planStepDone.trim()
    const steps = args.plan?.steps ?? context.state.plan?.steps ?? []
    if (!steps.some(step => step.id.trim() === stepId)) {
      throw new TypeError(steps.length === 0
        ? 'planStepDone needs a plan; record one with plan first'
        : `planStepDone must be one of the plan step ids: ${steps.map(step => step.id).join(', ')}`)
    }
    events.push({ type: 'plan_step_evidenced', stepId, observation: learnerObservation('plan-step') })
  }

  if ((args.sourceAnchors?.length ?? 0) > 0) {
    events.push({
      type: 'source_anchors_observed',
      anchors: args.sourceAnchors as readonly string[],
      observation: { id: id('source-anchors'), source: 'source-material', summary: basis },
    })
  }

  if (args.myMove !== undefined) {
    const { move, question, nextMove } = args.myMove
    const moveApproach = args.myMove.approach?.trim()
    if (moveApproach !== undefined && moveApproach !== '' && moveApproach === context.state.moveFingerprint) {
      throw new TypeError(`myMove.approach repeats your last approach "${moveApproach}"; choose a different approach or omit it`)
    }
    const questionText = question?.trim()
    events.push({
      type: 'assistant_move_observed',
      move,
      ...(moveApproach === undefined || moveApproach === '' ? {} : { moveFingerprint: moveApproach }),
      // The note's last_question is the question awaiting an answer, so a move
      // without one clears it.
      question: questionText === undefined || questionText === '' ? null : questionText,
      ...(nextMove === undefined ? {} : { nextMove }),
      observation: {
        id: id('my-move'),
        source: 'assistant-output',
        summary: questionText === undefined || questionText === ''
          ? `Planned ${move}.`
          : `Planned ${move}: ${questionText}`,
      },
    })
  }

  if (events.length === 0) {
    throw new TypeError(`action=update needs at least one non-empty field among ${UPDATE_GROUPS.join(', ')}`)
  }
  return { action: 'update', events }
}

/** Attach the live agent and the revision the plan was computed against. */
export function learnerStateUpdateRequest(
  plan: LearnerStateToolPlan,
  agent: LearningStateUpdateRequest['agent'],
  expectedRevision: number,
): LearningStateUpdateRequest {
  switch (plan.action) {
    case 'update':
      return { action: 'update', agent, expectedRevision, events: plan.events }
    case 'correct':
      return { action: 'correct', agent, expectedRevision, correction: plan.correction, observation: plan.observation }
    case 'reset':
      return { action: 'reset', agent, expectedRevision }
  }
}
