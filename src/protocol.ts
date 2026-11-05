/**
 * Versioned, declarative protocol shared by the Host, Agent, and Client.
 *
 * The visual@4 content model, its validators and the expression language live
 * in `@dsh-portable/visual/protocol` under neutral names. This module keeps the
 * Learning protocols (activity V1/V2, visual V3 replay, checkpoint, recall
 * feedback), the versioned visual@4 envelope, and every historical type name
 * as an alias of the shared model.
 */
import {
  MAX_VISUAL_MATH_DEPTH,
  VISUAL_DOCUMENT_KEYS,
  VISUAL_STROKES,
  VISUAL_TONES,
  isRecord as record,
  jsonByteLength as jsonBytes,
  validateAxis as validateVisualAxisV3,
  validateFinite as finite,
  validateId as id,
  validateInteger as integer,
  validateMathExpression as validateMath,
  validateOnlyKeys as onlyKeys,
  validateText as text,
  validateUniqueIds as uniqueIds,
  validateVisualDocumentFields,
  type CausalLink,
  type CausalLoop,
  type CausalLoopContent,
  type CausalVariable,
  type CodeTraceContent,
  type CodeTraceLine,
  type CodeTraceStackFrame,
  type CodeTraceStep,
  type CodeTraceVariable,
  type ComparisonRelationContent,
  type DataTableCell,
  type DataTableChart,
  type DataTableColumn,
  type DataTableContent,
  type DataTableFilter,
  type DataTableRow,
  type DataTableSort,
  type Field2DContent,
  type FieldAxis,
  type FormulaStep,
  type FormulaStepsContent,
  type MathExpression,
  type MatrixRelationContent,
  type NodeGroup,
  type NodeLinkContent,
  type NodeLinkEdge,
  type NodeLinkNode,
  type ParameterDefinition,
  type PlotBarSeries,
  type PlotContent,
  type PlotCurveSeries,
  type PlotLineSeries,
  type PlotMetric,
  type PlotPoint,
  type PlotPointSeries,
  type PlotSeries,
  type RecallCard,
  type RecallDeckContent,
  type RecordValue,
  type RelationAxisItem,
  type RelationComparisonRow,
  type RelationContent,
  type RelationMatrixCell,
  type RelationSet,
  type RelationSetItem,
  type RelationSubject,
  type ScalarField,
  type ScalarFieldGrid,
  type Scene2DContent,
  type SceneCircle,
  type SceneElement,
  type SceneLabel,
  type ScenePoint,
  type ScenePolygon,
  type SceneRect,
  type SceneSegment,
  type SequenceBufferContent,
  type SequenceBufferPointer,
  type SequenceBufferPointerSnapshot,
  type SequenceBufferRange,
  type SequenceBufferRangeSnapshot,
  type SequenceBufferSlot,
  type SequenceBufferSlotSnapshot,
  type SequenceBufferStep,
  type SequenceDiagramContent,
  type SequenceMessage,
  type SequenceParticipant,
  type SetsRelationContent,
  type StateTransitionContent,
  type StateTransitionState,
  type StateTransitionStep,
  type StateTransitionTransition,
  type StudyConcept,
  type StudyMapContent,
  type StudySection,
  type TableValue,
  type TimelineContent,
  type TimelineEra,
  type TimelineEvent,
  type VectorField,
  type VectorFieldGrid,
  type VisualAxis,
  type VisualContent,
  type VisualContentKind,
  type VisualDocument,
  type VisualFrame,
  type VisualSequence,
  type VisualStroke,
  type VisualTone,
} from '@dsh-portable/visual/protocol'

export const ACTIVITY_PROTOCOL = 'dsh-learning/activity@1' as const
export const RESPONSE_PROTOCOL = 'dsh-learning/response@1' as const
export const TRANSPORT_PROTOCOL = 'dsh-learning/transport@1' as const
export const ACTIVITY_PROTOCOL_V2 = 'dsh-learning/activity@2' as const
export const RESPONSE_PROTOCOL_V2 = 'dsh-learning/response@2' as const
export const TRANSPORT_PROTOCOL_V2 = 'dsh-learning/wait@2' as const
export const VISUAL_PROTOCOL_V3 = 'dsh-learning/visual@3' as const
export const VISUAL_RESULT_PROTOCOL_V3 = 'dsh-learning/visual-result@3' as const
export const VISUAL_PROTOCOL_V4 = 'dsh-learning/visual@4' as const
export const VISUAL_RESULT_PROTOCOL_V4 = 'dsh-learning/visual-result@4' as const
export const RECALL_FEEDBACK_PROTOCOL_V1 = 'dsh-learning/recall-feedback@1' as const
export const CHECKPOINT_PROTOCOL = 'dsh-learning/checkpoint@1' as const
export const CHECKPOINT_RESULT_PROTOCOL = 'dsh-learning/checkpoint-result@1' as const
export const CHECKPOINT_TRANSPORT_PROTOCOL = 'dsh-learning/checkpoint-wait@1' as const
export const LEARNING_CHECKPOINT_KINDS = [
  'free_text',
  'single_choice',
  'numeric',
  'prediction',
  'code_slot',
] as const
export const LEARNING_CHECKPOINT_EVIDENCE_KINDS = [
  'attempt',
  'prediction',
  'explanation',
  'contrast',
  'transfer',
] as const
export { VISUAL_CONTENT_KINDS as LEARNING_VISUAL_KINDS_V4 } from '@dsh-portable/visual/protocol'
export const LEARNING_ACTIVITY_KINDS = [
  'parameter_explorer',
  'process_stepper',
  'structure_compare',
] as const

export const MAX_ACTIVITY_BYTES = 64 * 1024
export const MAX_RESPONSE_BYTES = 32 * 1024
export {
  MAX_MATH_DEPTH,
  MAX_MATH_NODES,
  MAX_VISUAL_MATH_DEPTH,
  MATH_BINARY_OPERATORS,
  MATH_UNARY_OPERATORS,
} from '@dsh-portable/visual/protocol'

export type LearningActivityKind = typeof LEARNING_ACTIVITY_KINDS[number]
export type LearningAction = 'submit' | 'skip' | 'cancel'
export type LearningJson = null | boolean | number | string | LearningJson[] | { [key: string]: LearningJson }
export type LearningCheckpointKindV1 = typeof LEARNING_CHECKPOINT_KINDS[number]
export type LearningCheckpointEvidenceKindV1 = typeof LEARNING_CHECKPOINT_EVIDENCE_KINDS[number]

export type MathExpressionV1 = MathExpression

export type ParameterDefinitionV1 = ParameterDefinition

export interface ParameterCurveV1 {
  id: string
  label: string
  expression: MathExpressionV1
}

export interface ParameterExplorerPayloadV1 {
  parameters: ParameterDefinitionV1[]
  xAxis: { label?: string; min: number; max: number; samples?: number }
  curves: ParameterCurveV1[]
  question?: string
}

export interface ProcessCheckpointV1 {
  question: string
  options?: string[]
}

export interface ProcessStepV1 {
  id: string
  title: string
  content: string
  checkpoint?: ProcessCheckpointV1
}

export interface ProcessStepperPayloadV1 {
  steps: ProcessStepV1[]
  question?: string
}

export interface StructureItemV1 {
  id: string
  label: string
  detail?: string
}

export interface StructureAlignmentV1 {
  id: string
  leftId?: string
  rightId?: string
  prompt?: string
}

export interface StructureComparePayloadV1 {
  left: { title: string; items: StructureItemV1[] }
  right: { title: string; items: StructureItemV1[] }
  alignments: StructureAlignmentV1[]
  question?: string
}

interface ActivityBaseV1<K extends LearningActivityKind, P> {
  protocol: typeof ACTIVITY_PROTOCOL
  kind: K
  title: string
  objective: string
  prompt: string
  scaffold?: string
  payload: P
  fallbackMarkdown: string
}

export type LearningActivityV1 =
  | ActivityBaseV1<'parameter_explorer', ParameterExplorerPayloadV1>
  | ActivityBaseV1<'process_stepper', ProcessStepperPayloadV1>
  | ActivityBaseV1<'structure_compare', StructureComparePayloadV1>

export interface LearningResponseV1 {
  protocol: typeof RESPONSE_PROTOCOL
  activityId: string
  action: LearningAction
  answer?: LearningJson
  interactionState?: LearningJson
}

export interface LearningActivityEnvelopeV1 {
  transport: typeof TRANSPORT_PROTOCOL
  activityId: string
  activity: LearningActivityV1
}

export type LearningActivityEnvelopeInputV1 = Omit<LearningActivityEnvelopeV1, 'transport'>

export interface LearningFocusV2 { title: string; progress?: { current: number; total?: number } }
export type LearningInputV2 =
  | { kind: 'single_choice'; options: Array<{ id: string; label: string }> }
  | { kind: 'short_text'; placeholder?: string; maxLength?: number }
  | { kind: 'number'; min?: number; max?: number; step?: number }
export interface LearningFrameV2 { id: string; title: string; content?: string }
export type LearningQuestionVisualV2 =
  | { kind: 'process'; frame: LearningFrameV2 }
  | { kind: 'parameter'; parameters: ParameterDefinitionV1[]; xAxis: ParameterExplorerPayloadV1['xAxis']; curves: ParameterCurveV1[] }
  | { kind: 'structure'; left: StructureComparePayloadV1['left']; right: StructureComparePayloadV1['right']; alignments: StructureAlignmentV1[] }
export type LearningRevealVisualV2 =
  | { kind: 'process'; before: LearningFrameV2; after: LearningFrameV2 }
  | { kind: 'parameter'; parameters: ParameterDefinitionV1[]; xAxis: ParameterExplorerPayloadV1['xAxis']; curves: ParameterCurveV1[]; emphasis?: string }
  | { kind: 'structure'; left: StructureComparePayloadV1['left']; right: StructureComparePayloadV1['right']; alignments: StructureAlignmentV1[]; emphasisAlignmentIds?: string[] }
export interface LearningQuestionV2 {
  protocol: typeof ACTIVITY_PROTOCOL_V2; phase: 'question'; lessonToken?: string; seq: number
  focus: LearningFocusV2; prompt: string; scaffold?: string; input: LearningInputV2
  visual?: LearningQuestionVisualV2; fallbackMarkdown: string
}
export interface LearningRevealV2 {
  protocol: typeof ACTIVITY_PROTOCOL_V2; phase: 'reveal'; lessonToken: string; roundToken: string; seq: number
  focus: LearningFocusV2
  feedback: { verdict?: 'correct' | 'partial' | 'misconception' | 'neutral'; learnerEcho?: string; explanation: string; answer?: string }
  visual?: LearningRevealVisualV2
  animation: { kind: 'draw' | 'morph' | 'highlight' | 'step_complete'; preferredDurationMs?: number; reducedMotion: 'commit-final-state' }
  advance: { mode: 'user-after-animation'; label?: string }; fallbackMarkdown: string
}
export type LearningActivityV2 = LearningQuestionV2 | LearningRevealV2
interface LearningResponseBaseV2 {
  protocol: typeof RESPONSE_PROTOCOL_V2; activityId: string; lessonToken: string; roundToken: string
  seq: number; receiptId: string; interactionState?: LearningJson
}
export interface LearningQuestionResponseV2 extends LearningResponseBaseV2 {
  phase: 'question'; action: 'submit' | 'skip' | 'cancel'; answer?: LearningJson
}
export interface LearningRevealResponseV2 extends LearningResponseBaseV2 {
  phase: 'reveal'; action: 'continue' | 'skip' | 'cancel'
  animation: { completed: boolean; skipped?: boolean; reducedMotion?: boolean; error?: string }
}
export type LearningResponseV2 = LearningQuestionResponseV2 | LearningRevealResponseV2
export interface LearningWaitEnvelopeV2 {
  transport: typeof TRANSPORT_PROTOCOL_V2; waitId: string; activityId: string; callId?: string
  lessonToken: string; roundToken: string; seq: number; phase: 'question' | 'reveal'; activity: LearningActivityV2
}
export type LearningWaitEnvelopeInputV2 = Omit<LearningWaitEnvelopeV2, 'transport'>

export interface LearningCheckpointOptionV1 {
  id: string
  label: string
}

/** One answer-free, current-step learner contribution request. */
export interface LearningCheckpointV1 {
  protocol: typeof CHECKPOINT_PROTOCOL
  kind: LearningCheckpointKindV1
  prompt: string
  context?: string
  expectedEvidence: LearningCheckpointEvidenceKindV1
  options?: LearningCheckpointOptionV1[]
  fallbackMarkdown: string
}

export type LearningCheckpointResponseV1 =
  | { text: string }
  | { optionId: string }
  | { number: number }

/**
 * Why a non-submitted checkpoint ended.  The field is optional on v1 result
 * records so older persisted receipts remain readable; new Host/Client
 * receipts should always provide it.
 */
export type LearningCheckpointSkippedReasonV1 =
  | 'learner-skipped'
  | 'client-unavailable'
  | 'client-response-timeout'
  | 'host-unavailable'
  | 'provider-failure'

export type LearningCheckpointCancelledReasonV1 =
  | 'learner-cancelled'
  | 'session-aborted'
  | 'plugin-disposed'

export type LearningCheckpointOutcomeReasonV1 =
  | LearningCheckpointSkippedReasonV1
  | LearningCheckpointCancelledReasonV1

interface LearningCheckpointResultBaseV1 {
  protocol: typeof CHECKPOINT_RESULT_PROTOCOL
  checkpointId: string
  receiptId: string
}

export interface LearningCheckpointSubmittedResultV1 extends LearningCheckpointResultBaseV1 {
  status: 'submitted'
  response: LearningCheckpointResponseV1
}

export interface LearningCheckpointSkippedResultV1 extends LearningCheckpointResultBaseV1 {
  status: 'skipped'
  /** Optional only for backwards-compatible replay of pre-reason receipts. */
  reason?: LearningCheckpointSkippedReasonV1
}

export interface LearningCheckpointCancelledResultV1 extends LearningCheckpointResultBaseV1 {
  status: 'cancelled'
  /** Optional only for backwards-compatible replay of pre-reason receipts. */
  reason?: LearningCheckpointCancelledReasonV1
}

export type LearningCheckpointResultV1 =
  | LearningCheckpointSubmittedResultV1
  | LearningCheckpointSkippedResultV1
  | LearningCheckpointCancelledResultV1

/** Durable safe projection used only to recover one pending checkpoint wait. */
export interface LearningCheckpointWaitEnvelopeV1 {
  transport: typeof CHECKPOINT_TRANSPORT_PROTOCOL
  sessionId: string
  callId: string
  waitId: string
  checkpointId: string
  checkpoint: LearningCheckpointV1
}

export type LearningCheckpointWaitEnvelopeInputV1 = Omit<LearningCheckpointWaitEnvelopeV1, 'transport'>

export type LearningVisualToneV3 = VisualTone
export type LearningVisualStrokeV3 = VisualStroke
export type LearningVisualAxisV3 = VisualAxis
export type LearningVisualCurveV3 = PlotCurveSeries
export type LearningVisualPointV3 = PlotPoint
export type LearningVisualPointSeriesV3 = PlotPointSeries
export type LearningVisualSeriesV3 = LearningVisualCurveV3 | LearningVisualPointSeriesV3
export type LearningVisualMetricV3 = PlotMetric

/**
 * A non-blocking, replayable visual embedded in the assistant's normal turn.
 * It never owns learner input: the ordinary conversation composer remains live.
 */
export interface LearningVisualV3 {
  protocol: typeof VISUAL_PROTOCOL_V3
  kind: 'parameter_chart'
  title: string
  description?: string
  parameters: ParameterDefinitionV1[]
  xAxis: LearningVisualAxisV3
  yAxis: LearningVisualAxisV3
  series: LearningVisualSeriesV3[]
  metrics?: LearningVisualMetricV3[]
}

export interface LearningVisualResultV3 {
  protocol: typeof VISUAL_RESULT_PROTOCOL_V3
  status: 'ready'
}

/*
 * The visual@4 content model, under its historical Learning names. Every type
 * is the shared `@dsh-portable/visual` model type of the same shape.
 */
export type LearningVisualKindV4 = VisualContentKind
export type LearningVisualToneV4 = LearningVisualToneV3
export type LearningVisualStrokeV4 = LearningVisualStrokeV3
export type LearningVisualLineSeriesV4 = PlotLineSeries
export type LearningVisualBarSeriesV4 = PlotBarSeries
export type LearningPlotSeriesV4 = PlotSeries
export type LearningPlotV4 = PlotContent
export type LearningNodeGroupV4 = NodeGroup
export type LearningNodeV4 = NodeLinkNode
export type LearningEdgeV4 = NodeLinkEdge
export type LearningNodeLinkV4 = NodeLinkContent
export type LearningScenePointV4 = ScenePoint
export type LearningSceneSegmentV4 = SceneSegment
export type LearningSceneCircleV4 = SceneCircle
export type LearningSceneRectV4 = SceneRect
export type LearningScenePolygonV4 = ScenePolygon
export type LearningSceneLabelV4 = SceneLabel
export type LearningSceneElementV4 = SceneElement
export type LearningScene2DV4 = Scene2DContent
export type LearningRelationSubjectV4 = RelationSubject
export type LearningRelationComparisonRowV4 = RelationComparisonRow
export type LearningComparisonRelationV4 = ComparisonRelationContent
export type LearningRelationAxisItemV4 = RelationAxisItem
export type LearningRelationMatrixCellV4 = RelationMatrixCell
export type LearningMatrixRelationV4 = MatrixRelationContent
export type LearningRelationSetV4 = RelationSet
export type LearningRelationSetItemV4 = RelationSetItem
export type LearningSetsRelationV4 = SetsRelationContent
export type LearningRelationV4 = RelationContent
export type LearningTimelineEventV4 = TimelineEvent
export type LearningTimelineEraV4 = TimelineEra
export type LearningTimelineV4 = TimelineContent
export type LearningFormulaStepV4 = FormulaStep
export type LearningFormulaStepsV4 = FormulaStepsContent
export type LearningStudySectionV4 = StudySection
export type LearningStudyConceptV4 = StudyConcept
export type LearningStudyMapV4 = StudyMapContent
export type LearningRecallCardV4 = RecallCard
export type LearningRecallDeckV4 = RecallDeckContent
export type LearningTableValueV4 = TableValue
export type LearningDataTableColumnV4 = DataTableColumn
export type LearningDataTableCellV4 = DataTableCell
export type LearningDataTableRowV4 = DataTableRow
export type LearningDataTableSortV4 = DataTableSort
export type LearningDataTableFilterV4 = DataTableFilter
export type LearningDataTableChartV4 = DataTableChart
export type LearningDataTableV4 = DataTableContent
export type LearningStateTransitionStateV4 = StateTransitionState
export type LearningStateTransitionTransitionV4 = StateTransitionTransition
export type LearningStateTransitionStepV4 = StateTransitionStep
export type LearningStateTransitionV4 = StateTransitionContent
export type LearningSequenceBufferSlotV4 = SequenceBufferSlot
export type LearningSequenceBufferPointerV4 = SequenceBufferPointer
export type LearningSequenceBufferRangeV4 = SequenceBufferRange
export type LearningSequenceBufferSlotSnapshotV4 = SequenceBufferSlotSnapshot
export type LearningSequenceBufferPointerSnapshotV4 = SequenceBufferPointerSnapshot
export type LearningSequenceBufferRangeSnapshotV4 = SequenceBufferRangeSnapshot
export type LearningSequenceBufferStepV4 = SequenceBufferStep
export type LearningSequenceBufferV4 = SequenceBufferContent
export type LearningSequenceParticipantV4 = SequenceParticipant
export type LearningSequenceMessageV4 = SequenceMessage
export type LearningSequenceDiagramV4 = SequenceDiagramContent
export type LearningCodeTraceLineV4 = CodeTraceLine
export type LearningCodeTraceVariableV4 = CodeTraceVariable
export type LearningCodeTraceStackFrameV4 = CodeTraceStackFrame
export type LearningCodeTraceStepV4 = CodeTraceStep
export type LearningCodeTraceV4 = CodeTraceContent
export type LearningFieldAxisV4 = FieldAxis
export type LearningScalarFieldGridV4 = ScalarFieldGrid
export type LearningVectorFieldGridV4 = VectorFieldGrid
export type LearningScalarFieldV4 = ScalarField
export type LearningVectorFieldV4 = VectorField
export type LearningField2DV4 = Field2DContent
export type LearningCausalVariableV4 = CausalVariable
export type LearningCausalLinkV4 = CausalLink
export type LearningCausalLoopV4 = CausalLoop
export type LearningCausalLoopDiagramV4 = CausalLoopContent
export type LearningVisualContentV4 = VisualContent
export type LearningVisualFrameV4 = VisualFrame
export type LearningVisualSequenceV4 = VisualSequence

/**
 * A semantic, non-blocking visual in Learning's versioned envelope: the shared
 * `VisualDocument` plus the `dsh-learning/visual@4` literal that Learning's
 * tool calls and their replay are keyed on.
 */
export interface LearningVisualV4 extends VisualDocument {
  protocol: typeof VISUAL_PROTOCOL_V4
}

/**
 * Terminal outcome of one `learning_visual` call.
 *
 * `unavailable` means the composition has no renderer for this payload, so the
 * learner saw nothing. The model must then carry the explanation in prose
 * instead of referring to a figure that is not on screen.
 */
export interface LearningVisualResultV4 {
  protocol: typeof VISUAL_RESULT_PROTOCOL_V4
  status: LearningVisualStatusV4
}

export const LEARNING_VISUAL_STATUSES = ['ready', 'unavailable'] as const

export type LearningVisualStatusV4 = typeof LEARNING_VISUAL_STATUSES[number]

/** A learner's explicit recall interaction, sent from the visual Client to Host. */
export const LEARNING_RECALL_STATUSES = ['revealed', 'mastered', 'review'] as const
export type LearningRecallStatusV1 = typeof LEARNING_RECALL_STATUSES[number]

export interface LearningRecallFeedbackV1 {
  protocol: typeof RECALL_FEEDBACK_PROTOCOL_V1
  /** Session identity is part of the wire key; Host still checks it is active. */
  sessionId: string
  /** The semantic visual call that owns the card. */
  callId: string
  cardId: string
  status: LearningRecallStatusV1
}

/** A stable, actionable protocol rejection surfaced to the tool call. */
export class LearningProtocolError extends Error {
  readonly code = 'INVALID_LEARNING_ACTIVITY'

  constructor(readonly issues: readonly string[]) {
    super(`Invalid Learning Activity: ${issues.join('; ')}`)
    this.name = 'LearningProtocolError'
  }
}

function boundedIdentity(value: unknown, path: string, issues: string[], max = 512): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > max
    || value.trim() !== value || /[\u0000-\u001F\u007F]/u.test(value)) {
    issues.push(`${path} must be a non-empty bounded identity`)
    return false
  }
  return true
}

function validateJson(value: unknown, path: string, issues: string[]): value is LearningJson {
  const stack: Array<{ value: unknown; path: string; depth: number }> = [{ value, path, depth: 0 }]
  let nodes = 0
  while (stack.length > 0) {
    const current = stack.pop() as { value: unknown; path: string; depth: number }
    nodes += 1
    if (nodes > 512) {
      issues.push(`${path} exceeds 512 JSON nodes`)
      return false
    }
    if (current.depth > 12) {
      issues.push(`${current.path} exceeds JSON depth 12`)
      return false
    }
    const item = current.value
    if (item === null || typeof item === 'string' || typeof item === 'boolean') continue
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) issues.push(`${current.path} must contain finite numbers`)
      continue
    }
    if (Array.isArray(item)) {
      for (let index = item.length - 1; index >= 0; index -= 1) {
        stack.push({ value: item[index], path: `${current.path}[${String(index)}]`, depth: current.depth + 1 })
      }
      continue
    }
    if (record(item)) {
      for (const [key, child] of Object.entries(item)) {
        stack.push({ value: child, path: `${current.path}.${key}`, depth: current.depth + 1 })
      }
      continue
    }
    issues.push(`${current.path} must be lossless JSON`)
  }
  return issues.length === 0
}

function validateParameterExplorer(payload: unknown, issues: string[]): void {
  if (!record(payload)) {
    issues.push('activity.payload must be an object')
    return
  }
  onlyKeys(payload, ['parameters', 'xAxis', 'curves', 'question'], 'activity.payload', issues)
  if (!Array.isArray(payload.parameters) || payload.parameters.length < 1 || payload.parameters.length > 2) {
    issues.push('activity.payload.parameters must contain 1 or 2 parameters')
    return
  }
  const parameters = payload.parameters.filter(record)
  if (parameters.length !== payload.parameters.length) issues.push('activity.payload.parameters entries must be objects')
  uniqueIds(parameters, 'activity.payload.parameters', issues)
  for (const [index, parameter] of parameters.entries()) {
    const path = `activity.payload.parameters[${String(index)}]`
    onlyKeys(parameter, ['id', 'label', 'min', 'max', 'step', 'initial'], path, issues)
    id(parameter.id, `${path}.id`, issues)
    text(parameter.label, `${path}.label`, issues, 120)
    const min = parameter.min
    const max = parameter.max
    const step = parameter.step
    const initial = parameter.initial
    const minOk = finite(min, `${path}.min`, issues)
    const maxOk = finite(max, `${path}.max`, issues)
    const stepOk = finite(step, `${path}.step`, issues)
    const initialOk = finite(initial, `${path}.initial`, issues)
    if (minOk && maxOk && min >= max) issues.push(`${path}.min must be less than max`)
    if (stepOk && step <= 0) issues.push(`${path}.step must be positive`)
    if (minOk && maxOk && stepOk && step > max - min) {
      issues.push(`${path}.step must not exceed the parameter range`)
    }
    if (minOk && maxOk && initialOk && (initial < min || initial > max)) {
      issues.push(`${path}.initial must be inside the parameter range`)
    }
  }
  if (!record(payload.xAxis)) {
    issues.push('activity.payload.xAxis must be an object')
  } else {
    onlyKeys(payload.xAxis, ['label', 'min', 'max', 'samples'], 'activity.payload.xAxis', issues)
    if (payload.xAxis.label !== undefined) text(payload.xAxis.label, 'activity.payload.xAxis.label', issues, 120)
    const xMin = payload.xAxis.min
    const xMax = payload.xAxis.max
    const samples = payload.xAxis.samples
    const minOk = finite(xMin, 'activity.payload.xAxis.min', issues)
    const maxOk = finite(xMax, 'activity.payload.xAxis.max', issues)
    if (minOk && maxOk && xMin >= xMax) issues.push('activity.payload.xAxis.min must be less than max')
    if (samples !== undefined
      && (typeof samples !== 'number' || !Number.isInteger(samples) || samples < 16 || samples > 256)) {
      issues.push('activity.payload.xAxis.samples must be an integer from 16 to 256')
    }
  }
  if (!Array.isArray(payload.curves) || payload.curves.length < 1 || payload.curves.length > 3) {
    issues.push('activity.payload.curves must contain 1 to 3 curves')
  } else {
    const curves = payload.curves.filter(record)
    if (curves.length !== payload.curves.length) issues.push('activity.payload.curves entries must be objects')
    uniqueIds(curves, 'activity.payload.curves', issues)
    const parameterIds = new Set(parameters.map(item => typeof item.id === 'string' ? item.id : ''))
    for (const [index, curve] of curves.entries()) {
      const path = `activity.payload.curves[${String(index)}]`
      onlyKeys(curve, ['id', 'label', 'expression'], path, issues)
      id(curve.id, `${path}.id`, issues)
      text(curve.label, `${path}.label`, issues, 120)
      validateMath(curve.expression, parameterIds, `${path}.expression`, issues)
    }
  }
  if (payload.question !== undefined) text(payload.question, 'activity.payload.question', issues, 2_000)
}

function validateProcessStepper(payload: unknown, issues: string[]): void {
  if (!record(payload)) {
    issues.push('activity.payload must be an object')
    return
  }
  onlyKeys(payload, ['steps', 'question'], 'activity.payload', issues)
  if (!Array.isArray(payload.steps) || payload.steps.length < 2 || payload.steps.length > 12) {
    issues.push('activity.payload.steps must contain 2 to 12 steps')
    return
  }
  const steps = payload.steps.filter(record)
  if (steps.length !== payload.steps.length) issues.push('activity.payload.steps entries must be objects')
  uniqueIds(steps, 'activity.payload.steps', issues)
  for (const [index, step] of steps.entries()) {
    const path = `activity.payload.steps[${String(index)}]`
    onlyKeys(step, ['id', 'title', 'content', 'checkpoint'], path, issues)
    id(step.id, `${path}.id`, issues)
    text(step.title, `${path}.title`, issues, 200)
    text(step.content, `${path}.content`, issues, 4_000)
    if (step.checkpoint !== undefined) {
      if (!record(step.checkpoint)) {
        issues.push(`${path}.checkpoint must be an object`)
      } else {
        onlyKeys(step.checkpoint, ['question', 'options'], `${path}.checkpoint`, issues)
        text(step.checkpoint.question, `${path}.checkpoint.question`, issues, 2_000)
        if (step.checkpoint.options !== undefined) {
          if (!Array.isArray(step.checkpoint.options)
            || step.checkpoint.options.length < 2 || step.checkpoint.options.length > 6
            || !step.checkpoint.options.every(option => typeof option === 'string' && option.trim() !== '')) {
            issues.push(`${path}.checkpoint.options must contain 2 to 6 non-empty strings`)
          }
        }
      }
    }
  }
  if (payload.question !== undefined) text(payload.question, 'activity.payload.question', issues, 2_000)
}

function validateStructureSide(value: unknown, path: string, issues: string[]): RecordValue[] {
  if (!record(value)) {
    issues.push(`${path} must be an object`)
    return []
  }
  onlyKeys(value, ['title', 'items'], path, issues)
  text(value.title, `${path}.title`, issues, 200)
  if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 20) {
    issues.push(`${path}.items must contain 1 to 20 items`)
    return []
  }
  const items = value.items.filter(record)
  if (items.length !== value.items.length) issues.push(`${path}.items entries must be objects`)
  uniqueIds(items, `${path}.items`, issues)
  for (const [index, item] of items.entries()) {
    const itemPath = `${path}.items[${String(index)}]`
    onlyKeys(item, ['id', 'label', 'detail'], itemPath, issues)
    id(item.id, `${itemPath}.id`, issues)
    text(item.label, `${itemPath}.label`, issues, 500)
    if (item.detail !== undefined) text(item.detail, `${itemPath}.detail`, issues, 2_000)
  }
  return items
}

function validateStructureCompare(payload: unknown, issues: string[]): void {
  if (!record(payload)) {
    issues.push('activity.payload must be an object')
    return
  }
  onlyKeys(payload, ['left', 'right', 'alignments', 'question'], 'activity.payload', issues)
  const left = validateStructureSide(payload.left, 'activity.payload.left', issues)
  const right = validateStructureSide(payload.right, 'activity.payload.right', issues)
  const leftIds = new Set(left.map(item => typeof item.id === 'string' ? item.id : ''))
  const rightIds = new Set(right.map(item => typeof item.id === 'string' ? item.id : ''))
  if (!Array.isArray(payload.alignments) || payload.alignments.length < 1 || payload.alignments.length > 24) {
    issues.push('activity.payload.alignments must contain 1 to 24 rows')
  } else {
    const alignments = payload.alignments.filter(record)
    if (alignments.length !== payload.alignments.length) issues.push('activity.payload.alignments entries must be objects')
    uniqueIds(alignments, 'activity.payload.alignments', issues)
    for (const [index, alignment] of alignments.entries()) {
      const path = `activity.payload.alignments[${String(index)}]`
      onlyKeys(alignment, ['id', 'leftId', 'rightId', 'prompt'], path, issues)
      id(alignment.id, `${path}.id`, issues)
      if (alignment.leftId === undefined && alignment.rightId === undefined) issues.push(`${path} must reference at least one side`)
      if (alignment.leftId !== undefined && (typeof alignment.leftId !== 'string' || !leftIds.has(alignment.leftId))) {
        issues.push(`${path}.leftId must reference a left item`)
      }
      if (alignment.rightId !== undefined && (typeof alignment.rightId !== 'string' || !rightIds.has(alignment.rightId))) {
        issues.push(`${path}.rightId must reference a right item`)
      }
      if (alignment.prompt !== undefined) text(alignment.prompt, `${path}.prompt`, issues, 1_000)
    }
  }
  if (payload.question !== undefined) text(payload.question, 'activity.payload.question', issues, 2_000)
}

/** Validate and narrow an untrusted model-provided activity. */
export function parseLearningActivity(value: unknown): LearningActivityV1 {
  const issues: string[] = []
  const bytes = jsonBytes(value)
  if (bytes === undefined) issues.push('activity must be serializable JSON')
  else if (bytes > MAX_ACTIVITY_BYTES) issues.push(`activity exceeds ${String(MAX_ACTIVITY_BYTES)} bytes`)
  if (!record(value)) throw new LearningProtocolError([...issues, 'activity must be an object'])
  onlyKeys(value, ['protocol', 'kind', 'title', 'objective', 'prompt', 'scaffold', 'payload', 'fallbackMarkdown'], 'activity', issues)
  if (value.protocol !== ACTIVITY_PROTOCOL) issues.push(`activity.protocol must be ${ACTIVITY_PROTOCOL}`)
  if (!(LEARNING_ACTIVITY_KINDS as readonly unknown[]).includes(value.kind)) issues.push('activity.kind is unknown')
  text(value.title, 'activity.title', issues, 200)
  text(value.objective, 'activity.objective', issues, 1_000)
  text(value.prompt, 'activity.prompt', issues, 2_000)
  if (value.scaffold !== undefined) text(value.scaffold, 'activity.scaffold', issues, 4_000)
  text(value.fallbackMarkdown, 'activity.fallbackMarkdown', issues, 16_000)
  if (value.kind === 'parameter_explorer') validateParameterExplorer(value.payload, issues)
  else if (value.kind === 'process_stepper') validateProcessStepper(value.payload, issues)
  else if (value.kind === 'structure_compare') validateStructureCompare(value.payload, issues)
  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningActivityV1
}

/** Validate and narrow a Client response before it returns to the model. */
export function parseLearningResponse(value: unknown, expectedActivityId?: string): LearningResponseV1 {
  const issues: string[] = []
  const bytes = jsonBytes(value)
  if (bytes === undefined) issues.push('response must be serializable JSON')
  else if (bytes > MAX_RESPONSE_BYTES) issues.push(`response exceeds ${String(MAX_RESPONSE_BYTES)} bytes`)
  if (!record(value)) throw new LearningProtocolError([...issues, 'response must be an object'])
  onlyKeys(value, ['protocol', 'activityId', 'action', 'answer', 'interactionState'], 'response', issues)
  if (value.protocol !== RESPONSE_PROTOCOL) issues.push(`response.protocol must be ${RESPONSE_PROTOCOL}`)
  if (typeof value.activityId !== 'string' || value.activityId === '') issues.push('response.activityId must be a non-empty string')
  if (expectedActivityId !== undefined && value.activityId !== expectedActivityId) issues.push('response.activityId does not match the pending activity')
  if (value.action !== 'submit' && value.action !== 'skip' && value.action !== 'cancel') issues.push('response.action is unknown')
  if (value.answer !== undefined) validateJson(value.answer, 'response.answer', issues)
  if (value.interactionState !== undefined) validateJson(value.interactionState, 'response.interactionState', issues)
  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningResponseV1
}

function token(value: unknown, path: string, issues: string[]): value is string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 128 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    issues.push(`${path} must be an opaque token of 1 to 128 URL-safe characters`)
    return false
  }
  return true
}

function validateFocusV2(value: unknown, path: string, issues: string[]): void {
  if (!record(value)) {
    issues.push(`${path} must be an object`)
    return
  }
  onlyKeys(value, ['title', 'progress'], path, issues)
  text(value.title, `${path}.title`, issues, 200)
  if (value.progress !== undefined) {
    if (!record(value.progress)) issues.push(`${path}.progress must be an object`)
    else {
      onlyKeys(value.progress, ['current', 'total'], `${path}.progress`, issues)
      const currentOk = integer(value.progress.current, `${path}.progress.current`, issues, 1)
      const totalOk = value.progress.total === undefined
        ? false
        : integer(value.progress.total, `${path}.progress.total`, issues, 1)
      if (currentOk && totalOk && (value.progress.current as number) > (value.progress.total as number)) {
        issues.push(`${path}.progress.current must not exceed total`)
      }
    }
  }
}

function validateInputV2(value: unknown, issues: string[]): void {
  const path = 'activity.input'
  if (!record(value)) {
    issues.push(`${path} must be an object`)
    return
  }
  if (value.kind === 'single_choice') {
    onlyKeys(value, ['kind', 'options'], path, issues)
    if (!Array.isArray(value.options) || value.options.length < 2 || value.options.length > 8) {
      issues.push(`${path}.options must contain 2 to 8 options`)
      return
    }
    const options = value.options.filter(record)
    if (options.length !== value.options.length) issues.push(`${path}.options entries must be objects`)
    uniqueIds(options, `${path}.options`, issues)
    for (const [index, option] of options.entries()) {
      const optionPath = `${path}.options[${String(index)}]`
      onlyKeys(option, ['id', 'label'], optionPath, issues)
      id(option.id, `${optionPath}.id`, issues)
      text(option.label, `${optionPath}.label`, issues, 500)
    }
  } else if (value.kind === 'short_text') {
    onlyKeys(value, ['kind', 'placeholder', 'maxLength'], path, issues)
    if (value.placeholder !== undefined) text(value.placeholder, `${path}.placeholder`, issues, 500)
    if (value.maxLength !== undefined
      && (!integer(value.maxLength, `${path}.maxLength`, issues, 1) || (value.maxLength as number) > 8_000)) {
      issues.push(`${path}.maxLength must not exceed 8000`)
    }
  } else if (value.kind === 'number') {
    onlyKeys(value, ['kind', 'min', 'max', 'step'], path, issues)
    const minOk = value.min === undefined ? false : finite(value.min, `${path}.min`, issues)
    const maxOk = value.max === undefined ? false : finite(value.max, `${path}.max`, issues)
    const stepOk = value.step === undefined ? false : finite(value.step, `${path}.step`, issues)
    if (minOk && maxOk && (value.min as number) >= (value.max as number)) issues.push(`${path}.min must be less than max`)
    if (stepOk && (value.step as number) <= 0) issues.push(`${path}.step must be positive`)
  } else {
    issues.push(`${path}.kind is unknown`)
  }
}

function validateFrameV2(value: unknown, path: string, issues: string[]): void {
  if (!record(value)) {
    issues.push(`${path} must be an object`)
    return
  }
  onlyKeys(value, ['id', 'title', 'content'], path, issues)
  id(value.id, `${path}.id`, issues)
  text(value.title, `${path}.title`, issues, 200)
  if (value.content !== undefined) text(value.content, `${path}.content`, issues, 4_000)
}

function validateParameterVisualV2(value: RecordValue, path: string, issues: string[], reveal: boolean): void {
  onlyKeys(value, reveal
    ? ['kind', 'parameters', 'xAxis', 'curves', 'emphasis']
    : ['kind', 'parameters', 'xAxis', 'curves'], path, issues)
  validateParameterExplorer({ parameters: value.parameters, xAxis: value.xAxis, curves: value.curves }, issues)
  if (reveal && value.emphasis !== undefined) text(value.emphasis, `${path}.emphasis`, issues, 2_000)
}

function validateStructureVisualV2(value: RecordValue, path: string, issues: string[], reveal: boolean): void {
  onlyKeys(value, reveal
    ? ['kind', 'left', 'right', 'alignments', 'emphasisAlignmentIds']
    : ['kind', 'left', 'right', 'alignments'], path, issues)
  validateStructureCompare({ left: value.left, right: value.right, alignments: value.alignments }, issues)
  if (reveal && value.emphasisAlignmentIds !== undefined) {
    if (!Array.isArray(value.emphasisAlignmentIds)
      || !value.emphasisAlignmentIds.every(item => typeof item === 'string')) {
      issues.push(`${path}.emphasisAlignmentIds must be an array of ids`)
    }
  }
}

function validateVisualV2(value: unknown, phase: 'question' | 'reveal', issues: string[]): void {
  const path = 'activity.visual'
  if (!record(value)) {
    issues.push(`${path} must be an object`)
    return
  }
  if (value.kind === 'process') {
    if (phase === 'question') {
      onlyKeys(value, ['kind', 'frame'], path, issues)
      validateFrameV2(value.frame, `${path}.frame`, issues)
    } else {
      onlyKeys(value, ['kind', 'before', 'after'], path, issues)
      validateFrameV2(value.before, `${path}.before`, issues)
      validateFrameV2(value.after, `${path}.after`, issues)
    }
  } else if (value.kind === 'parameter') {
    validateParameterVisualV2(value, path, issues, phase === 'reveal')
  } else if (value.kind === 'structure') {
    validateStructureVisualV2(value, path, issues, phase === 'reveal')
  } else {
    issues.push(`${path}.kind is unknown`)
  }
}

/** Strict live protocol. V1 is intentionally parsed separately for legacy replay only. */
export function parseLearningActivityV2(value: unknown): LearningActivityV2 {
  const issues: string[] = []
  const bytes = jsonBytes(value)
  if (bytes === undefined) issues.push('activity must be serializable JSON')
  else if (bytes > MAX_ACTIVITY_BYTES) issues.push(`activity exceeds ${String(MAX_ACTIVITY_BYTES)} bytes`)
  if (!record(value)) throw new LearningProtocolError([...issues, 'activity must be an object'])
  if (value.protocol !== ACTIVITY_PROTOCOL_V2) issues.push(`activity.protocol must be ${ACTIVITY_PROTOCOL_V2}`)
  if (value.phase === 'question') {
    onlyKeys(value, ['protocol', 'phase', 'lessonToken', 'seq', 'focus', 'prompt', 'scaffold', 'input', 'visual', 'fallbackMarkdown'], 'activity', issues)
    if (value.lessonToken !== undefined) token(value.lessonToken, 'activity.lessonToken', issues)
    integer(value.seq, 'activity.seq', issues)
    validateFocusV2(value.focus, 'activity.focus', issues)
    text(value.prompt, 'activity.prompt', issues, 2_000)
    if (value.scaffold !== undefined) text(value.scaffold, 'activity.scaffold', issues, 4_000)
    validateInputV2(value.input, issues)
    if (value.visual !== undefined) validateVisualV2(value.visual, 'question', issues)
    text(value.fallbackMarkdown, 'activity.fallbackMarkdown', issues, 16_000)
  } else if (value.phase === 'reveal') {
    onlyKeys(value, ['protocol', 'phase', 'lessonToken', 'roundToken', 'seq', 'focus', 'feedback', 'visual', 'animation', 'advance', 'fallbackMarkdown'], 'activity', issues)
    token(value.lessonToken, 'activity.lessonToken', issues)
    token(value.roundToken, 'activity.roundToken', issues)
    integer(value.seq, 'activity.seq', issues)
    validateFocusV2(value.focus, 'activity.focus', issues)
    if (!record(value.feedback)) issues.push('activity.feedback must be an object')
    else {
      onlyKeys(value.feedback, ['verdict', 'learnerEcho', 'explanation', 'answer'], 'activity.feedback', issues)
      if (value.feedback.verdict !== undefined
        && !['correct', 'partial', 'misconception', 'neutral'].includes(value.feedback.verdict as string)) {
        issues.push('activity.feedback.verdict is unknown')
      }
      if (value.feedback.learnerEcho !== undefined) text(value.feedback.learnerEcho, 'activity.feedback.learnerEcho', issues, 2_000)
      text(value.feedback.explanation, 'activity.feedback.explanation', issues, 8_000)
      if (value.feedback.answer !== undefined) text(value.feedback.answer, 'activity.feedback.answer', issues, 4_000)
    }
    if (value.visual !== undefined) validateVisualV2(value.visual, 'reveal', issues)
    if (!record(value.animation)) issues.push('activity.animation must be an object')
    else {
      onlyKeys(value.animation, ['kind', 'preferredDurationMs', 'reducedMotion'], 'activity.animation', issues)
      if (!['draw', 'morph', 'highlight', 'step_complete'].includes(value.animation.kind as string)) issues.push('activity.animation.kind is unknown')
      if (value.animation.preferredDurationMs !== undefined
        && (!integer(value.animation.preferredDurationMs, 'activity.animation.preferredDurationMs', issues, 0)
          || (value.animation.preferredDurationMs as number) > 10_000)) {
        issues.push('activity.animation.preferredDurationMs must not exceed 10000')
      }
      if (value.animation.reducedMotion !== 'commit-final-state') issues.push('activity.animation.reducedMotion must be commit-final-state')
    }
    if (!record(value.advance)) issues.push('activity.advance must be an object')
    else {
      onlyKeys(value.advance, ['mode', 'label'], 'activity.advance', issues)
      if (value.advance.mode !== 'user-after-animation') issues.push('activity.advance.mode must be user-after-animation')
      if (value.advance.label !== undefined) text(value.advance.label, 'activity.advance.label', issues, 120)
    }
    text(value.fallbackMarkdown, 'activity.fallbackMarkdown', issues, 16_000)
  } else {
    issues.push('activity.phase must be question or reveal')
  }
  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningActivityV2
}

export type ExpectedLearningResponseV2 = Partial<Pick<LearningResponseV2,
  'activityId' | 'phase' | 'lessonToken' | 'roundToken' | 'seq'>>

/** Validate a phase-bound Client receipt before the Broker changes lesson state. */
export function parseLearningResponseV2(value: unknown, expected: ExpectedLearningResponseV2 = {}): LearningResponseV2 {
  const issues: string[] = []
  const bytes = jsonBytes(value)
  if (bytes === undefined) issues.push('response must be serializable JSON')
  else if (bytes > MAX_RESPONSE_BYTES) issues.push(`response exceeds ${String(MAX_RESPONSE_BYTES)} bytes`)
  if (!record(value)) throw new LearningProtocolError([...issues, 'response must be an object'])
  if (value.phase === 'question') {
    onlyKeys(value, ['protocol', 'phase', 'activityId', 'lessonToken', 'roundToken', 'seq', 'action', 'answer', 'receiptId', 'interactionState'], 'response', issues)
    if (!['submit', 'skip', 'cancel'].includes(value.action as string)) issues.push('response.action is unknown')
    if (value.answer !== undefined) validateJson(value.answer, 'response.answer', issues)
  } else if (value.phase === 'reveal') {
    onlyKeys(value, ['protocol', 'phase', 'activityId', 'lessonToken', 'roundToken', 'seq', 'action', 'animation', 'receiptId', 'interactionState'], 'response', issues)
    if (!['continue', 'skip', 'cancel'].includes(value.action as string)) issues.push('response.action is unknown')
    if (!record(value.animation)) issues.push('response.animation must be an object')
    else {
      onlyKeys(value.animation, ['completed', 'skipped', 'reducedMotion', 'error'], 'response.animation', issues)
      if (typeof value.animation.completed !== 'boolean') issues.push('response.animation.completed must be boolean')
      if (value.animation.skipped !== undefined && typeof value.animation.skipped !== 'boolean') issues.push('response.animation.skipped must be boolean')
      if (value.animation.reducedMotion !== undefined && typeof value.animation.reducedMotion !== 'boolean') issues.push('response.animation.reducedMotion must be boolean')
      if (value.animation.error !== undefined && typeof value.animation.error !== 'string') issues.push('response.animation.error must be a string')
      if (value.action === 'continue' && value.animation.completed !== true) issues.push('response.animation.completed must be true before continue')
    }
  } else {
    issues.push('response.phase must be question or reveal')
  }
  if (value.protocol !== RESPONSE_PROTOCOL_V2) issues.push(`response.protocol must be ${RESPONSE_PROTOCOL_V2}`)
  token(value.activityId, 'response.activityId', issues)
  token(value.lessonToken, 'response.lessonToken', issues)
  token(value.roundToken, 'response.roundToken', issues)
  integer(value.seq, 'response.seq', issues)
  token(value.receiptId, 'response.receiptId', issues)
  if (value.interactionState !== undefined) validateJson(value.interactionState, 'response.interactionState', issues)
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (expectedValue !== undefined && value[key] !== expectedValue) issues.push(`response.${key} does not match the pending activity`)
  }
  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningResponseV2
}

const CHECKPOINT_RAW_HTML = /<(?:!DOCTYPE\b|!--|\/?[A-Za-z][^<>]*>)/i
const CHECKPOINT_LEAKAGE_COPY = /\b(?:correct\s+answer|model\s+answer|answer\s+key|(?:the\s+)?answer\s*(?:is|was|[:：])|solution\s*[:：]|expected\s+(?:answer|response|result)\s*[:：]|grading\s+rubric|scoring\s+rubric|future\s+(?:step|question)|next\s+question\s*:)|(?:正确|标准|参考|模型)(?:答案|解答)|标准解\s*[:：]?|(?:答案|解答)\s*[:：]|答案(?:是|为)|评分(?:标准|细则)|下一(?:步|题|个问题)|后续步骤|未来步骤/iu

/** Canonical fail-closed predicate shared by protocol parsing and Client fallback extraction. */
export function isLearningCheckpointDisplayTextSafe(value: string): boolean {
  return !CHECKPOINT_RAW_HTML.test(value) && !CHECKPOINT_LEAKAGE_COPY.test(value)
}

function checkpointDisplayText(
  value: unknown,
  path: string,
  issues: string[],
  max: number,
): value is string {
  const valid = text(value, path, issues, max)
  if (valid && !isLearningCheckpointDisplayTextSafe(value)) {
    issues.push(`${path} must not contain raw HTML, an answer key, scoring rubric, or future-step copy`)
    return false
  }
  return valid
}

/** Strict, answer-free protocol for one optional learner checkpoint. */
export function parseLearningCheckpointV1(value: unknown): LearningCheckpointV1 {
  const issues: string[] = []
  const bytes = jsonBytes(value)
  if (bytes === undefined) issues.push('checkpoint must be serializable JSON')
  else if (bytes > MAX_ACTIVITY_BYTES) issues.push(`checkpoint exceeds ${String(MAX_ACTIVITY_BYTES)} bytes`)
  if (!record(value)) throw new LearningProtocolError([...issues, 'checkpoint must be an object'])

  onlyKeys(
    value,
    ['protocol', 'kind', 'prompt', 'context', 'expectedEvidence', 'options', 'fallbackMarkdown'],
    'checkpoint',
    issues,
  )
  if (value.protocol !== CHECKPOINT_PROTOCOL) {
    issues.push(`checkpoint.protocol must be ${CHECKPOINT_PROTOCOL}`)
  }
  if (!LEARNING_CHECKPOINT_KINDS.includes(value.kind as LearningCheckpointKindV1)) {
    issues.push(`checkpoint.kind must be one of ${LEARNING_CHECKPOINT_KINDS.join(', ')}`)
  }
  checkpointDisplayText(value.prompt, 'checkpoint.prompt', issues, 2_000)
  if (value.context !== undefined) checkpointDisplayText(value.context, 'checkpoint.context', issues, 4_000)
  if (!LEARNING_CHECKPOINT_EVIDENCE_KINDS.includes(value.expectedEvidence as LearningCheckpointEvidenceKindV1)) {
    issues.push(`checkpoint.expectedEvidence must be one of ${LEARNING_CHECKPOINT_EVIDENCE_KINDS.join(', ')}`)
  }
  checkpointDisplayText(value.fallbackMarkdown, 'checkpoint.fallbackMarkdown', issues, 8_000)

  if (value.kind === 'single_choice') {
    if (!Array.isArray(value.options) || value.options.length < 2 || value.options.length > 8) {
      issues.push('checkpoint.options must contain 2 to 8 options for single_choice')
    } else {
      const options = value.options.filter(record)
      if (options.length !== value.options.length) issues.push('checkpoint.options entries must be objects')
      uniqueIds(options, 'checkpoint.options', issues)
      for (const [index, option] of options.entries()) {
        const path = `checkpoint.options[${String(index)}]`
        onlyKeys(option, ['id', 'label'], path, issues)
        id(option.id, `${path}.id`, issues)
        checkpointDisplayText(option.label, `${path}.label`, issues, 500)
      }
    }
  } else if (value.options !== undefined) {
    issues.push('checkpoint.options is supported only for single_choice')
  }

  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningCheckpointV1
}

export interface ExpectedLearningCheckpointResultV1 {
  checkpointId?: string
  checkpoint?: LearningCheckpointV1
}

/** Validate one phase-bound checkpoint receipt before the Host accepts it. */
export function parseLearningCheckpointResultV1(
  value: unknown,
  expected: ExpectedLearningCheckpointResultV1 = {},
): LearningCheckpointResultV1 {
  const issues: string[] = []
  const bytes = jsonBytes(value)
  if (bytes === undefined) issues.push('checkpoint result must be serializable JSON')
  else if (bytes > MAX_RESPONSE_BYTES) {
    issues.push(`checkpoint result exceeds ${String(MAX_RESPONSE_BYTES)} bytes`)
  }
  if (!record(value)) throw new LearningProtocolError([...issues, 'checkpoint result must be an object'])

  const submitted = value.status === 'submitted'
  onlyKeys(
    value,
    submitted
      ? ['protocol', 'checkpointId', 'status', 'response', 'receiptId']
      : ['protocol', 'checkpointId', 'status', 'reason', 'receiptId'],
    'checkpointResult',
    issues,
  )
  if (value.protocol !== CHECKPOINT_RESULT_PROTOCOL) {
    issues.push(`checkpointResult.protocol must be ${CHECKPOINT_RESULT_PROTOCOL}`)
  }
  token(value.checkpointId, 'checkpointResult.checkpointId', issues)
  token(value.receiptId, 'checkpointResult.receiptId', issues)
  if (!['submitted', 'skipped', 'cancelled'].includes(value.status as string)) {
    issues.push('checkpointResult.status must be submitted, skipped, or cancelled')
  }
  if (value.reason !== undefined && typeof value.reason !== 'string') {
    issues.push('checkpointResult.reason must be a string')
  } else if (value.status === 'skipped' && value.reason !== undefined
    && ![
      'learner-skipped',
      'client-unavailable',
      'client-response-timeout',
      'host-unavailable',
      'provider-failure',
    ].includes(value.reason as LearningCheckpointSkippedReasonV1)) {
    issues.push('checkpointResult.reason is not valid for skipped status')
  } else if (value.status === 'cancelled' && value.reason !== undefined
    && ![
      'learner-cancelled',
      'session-aborted',
      'plugin-disposed',
    ].includes(value.reason as LearningCheckpointCancelledReasonV1)) {
    issues.push('checkpointResult.reason is not valid for cancelled status')
  } else if (value.status === 'submitted' && value.reason !== undefined) {
    // `onlyKeys` reports this too, but keeping the semantic message makes the
    // contract clear when callers inspect protocol errors programmatically.
    issues.push('checkpointResult.reason is allowed only for skipped or cancelled status')
  }
  if (expected.checkpointId !== undefined && value.checkpointId !== expected.checkpointId) {
    issues.push('checkpointResult.checkpointId does not match the pending checkpoint')
  }

  let checkpoint: LearningCheckpointV1 | undefined
  if (expected.checkpoint !== undefined) {
    try {
      checkpoint = parseLearningCheckpointV1(expected.checkpoint)
    } catch (cause) {
      if (cause instanceof LearningProtocolError) {
        issues.push(...cause.issues.map(issue => `expected ${issue}`))
      } else throw cause
    }
  }

  if (submitted) {
    if (!record(value.response)) {
      issues.push('checkpointResult.response must be an object when submitted')
    } else {
      const response = value.response
      const responsePath = 'checkpointResult.response'
      const expectedKind = checkpoint?.kind
      const shape = expectedKind === 'single_choice'
        ? 'optionId'
        : expectedKind === 'numeric'
          ? 'number'
          : expectedKind === undefined
            ? undefined
            : 'text'

      if (shape === 'optionId' || (shape === undefined && Object.hasOwn(response, 'optionId'))) {
        onlyKeys(response, ['optionId'], responsePath, issues)
        const optionIdOk = id(response.optionId, `${responsePath}.optionId`, issues)
        if (optionIdOk && checkpoint?.options !== undefined
          && !checkpoint.options.some(option => option.id === response.optionId)) {
          issues.push(`${responsePath}.optionId must reference a declared checkpoint option`)
        }
      } else if (shape === 'number' || (shape === undefined && Object.hasOwn(response, 'number'))) {
        onlyKeys(response, ['number'], responsePath, issues)
        finite(response.number, `${responsePath}.number`, issues)
      } else if (shape === 'text' || (shape === undefined && Object.hasOwn(response, 'text'))) {
        onlyKeys(response, ['text'], responsePath, issues)
        text(response.text, `${responsePath}.text`, issues, expectedKind === 'code_slot' ? 16_000 : 8_000)
      } else {
        issues.push(`${responsePath} must contain exactly one of text, optionId, or number`)
        onlyKeys(response, [], responsePath, issues)
      }
    }
  } else if (value.response !== undefined) {
    // `onlyKeys` reports the unsupported field; retain an explicit semantic issue too.
    issues.push('checkpointResult.response is allowed only when status is submitted')
  }

  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningCheckpointResultV1
}

const VISUAL_TONES_V3 = new Set<LearningVisualToneV3>(VISUAL_TONES)
const VISUAL_STROKES_V3 = new Set<LearningVisualStrokeV3>(VISUAL_STROKES)

function validateVisualParametersV3(value: unknown, issues: string[]): RecordValue[] {
  const path = 'visual.parameters'
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) {
    issues.push(`${path} must contain 1 to 3 parameters`)
    return []
  }
  const parameters = value.filter(record)
  if (parameters.length !== value.length) issues.push(`${path} entries must be objects`)
  uniqueIds(parameters, path, issues)
  for (const [index, parameter] of parameters.entries()) {
    const itemPath = `${path}[${String(index)}]`
    onlyKeys(parameter, ['id', 'label', 'min', 'max', 'step', 'initial'], itemPath, issues)
    id(parameter.id, `${itemPath}.id`, issues)
    if (parameter.id === 'x') issues.push(`${itemPath}.id must not use the reserved x-axis variable`)
    text(parameter.label, `${itemPath}.label`, issues, 120)
    const minOk = finite(parameter.min, `${itemPath}.min`, issues)
    const maxOk = finite(parameter.max, `${itemPath}.max`, issues)
    const stepOk = finite(parameter.step, `${itemPath}.step`, issues)
    const initialOk = finite(parameter.initial, `${itemPath}.initial`, issues)
    if (minOk && maxOk && (parameter.min as number) >= (parameter.max as number)) {
      issues.push(`${itemPath}.min must be less than max`)
    }
    if (stepOk && (parameter.step as number) <= 0) issues.push(`${itemPath}.step must be positive`)
    if (minOk && maxOk && stepOk && (parameter.step as number) > (parameter.max as number) - (parameter.min as number)) {
      issues.push(`${itemPath}.step must not exceed the parameter range`)
    }
    if (minOk && maxOk && initialOk
      && ((parameter.initial as number) < (parameter.min as number)
        || (parameter.initial as number) > (parameter.max as number))) {
      issues.push(`${itemPath}.initial must be inside the parameter range`)
    }
  }
  return parameters
}

/** Validate the preferred, non-blocking visual protocol. */
export function parseLearningVisualV3(value: unknown): LearningVisualV3 {
  const issues: string[] = []
  const bytes = jsonBytes(value)
  if (bytes === undefined) issues.push('visual must be serializable JSON')
  else if (bytes > MAX_ACTIVITY_BYTES) issues.push(`visual exceeds ${String(MAX_ACTIVITY_BYTES)} bytes`)
  if (!record(value)) throw new LearningProtocolError([...issues, 'visual must be an object'])
  onlyKeys(value, ['protocol', 'kind', 'title', 'description', 'parameters', 'xAxis', 'yAxis', 'series', 'metrics'], 'visual', issues)
  if (value.protocol !== VISUAL_PROTOCOL_V3) issues.push(`visual.protocol must be ${VISUAL_PROTOCOL_V3}`)
  if (value.kind !== 'parameter_chart') issues.push('visual.kind must be parameter_chart')
  text(value.title, 'visual.title', issues, 200)
  if (value.description !== undefined) text(value.description, 'visual.description', issues, 1_000)
  const parameters = validateVisualParametersV3(value.parameters, issues)
  const parameterIds = new Set(parameters.flatMap(parameter => typeof parameter.id === 'string' ? [parameter.id] : []))
  validateVisualAxisV3(value.xAxis, 'visual.xAxis', issues, true)
  validateVisualAxisV3(value.yAxis, 'visual.yAxis', issues, false)

  if (!Array.isArray(value.series) || value.series.length < 1 || value.series.length > 8) {
    issues.push('visual.series must contain 1 to 8 series')
  } else {
    const series = value.series.filter(record)
    if (series.length !== value.series.length) issues.push('visual.series entries must be objects')
    uniqueIds(series, 'visual.series', issues)
    let curveCount = 0
    for (const [index, item] of series.entries()) {
      const path = `visual.series[${String(index)}]`
      id(item.id, `${path}.id`, issues)
      text(item.label, `${path}.label`, issues, 160)
      if (item.tone !== undefined && !VISUAL_TONES_V3.has(item.tone as LearningVisualToneV3)) {
        issues.push(`${path}.tone is unknown`)
      }
      if (item.type === 'curve') {
        curveCount += 1
        onlyKeys(item, ['type', 'id', 'label', 'expression', 'tone', 'stroke'], path, issues)
        if (item.stroke !== undefined && !VISUAL_STROKES_V3.has(item.stroke as LearningVisualStrokeV3)) {
          issues.push(`${path}.stroke is unknown`)
        }
        validateMath(item.expression, parameterIds, `${path}.expression`, issues, true, MAX_VISUAL_MATH_DEPTH)
      } else if (item.type === 'points') {
        onlyKeys(item, ['type', 'id', 'label', 'points', 'tone'], path, issues)
        if (!Array.isArray(item.points) || item.points.length < 1 || item.points.length > 128) {
          issues.push(`${path}.points must contain 1 to 128 points`)
          continue
        }
        for (const [pointIndex, point] of item.points.entries()) {
          const pointPath = `${path}.points[${String(pointIndex)}]`
          if (!record(point)) {
            issues.push(`${pointPath} must be an object`)
            continue
          }
          onlyKeys(point, ['x', 'y', 'label'], pointPath, issues)
          finite(point.x, `${pointPath}.x`, issues)
          finite(point.y, `${pointPath}.y`, issues)
          if (point.label !== undefined) text(point.label, `${pointPath}.label`, issues, 160)
        }
      } else {
        issues.push(`${path}.type must be curve or points`)
      }
    }
    if (curveCount === 0) issues.push('visual.series must contain at least one curve')
  }

  if (value.metrics !== undefined) {
    if (!Array.isArray(value.metrics) || value.metrics.length > 4) {
      issues.push('visual.metrics must contain at most 4 metrics')
    } else {
      const metrics = value.metrics.filter(record)
      if (metrics.length !== value.metrics.length) issues.push('visual.metrics entries must be objects')
      uniqueIds(metrics, 'visual.metrics', issues)
      for (const [index, metric] of metrics.entries()) {
        const path = `visual.metrics[${String(index)}]`
        onlyKeys(metric, ['id', 'label', 'expression', 'digits', 'suffix'], path, issues)
        id(metric.id, `${path}.id`, issues)
        text(metric.label, `${path}.label`, issues, 160)
        validateMath(metric.expression, parameterIds, `${path}.expression`, issues, false, MAX_VISUAL_MATH_DEPTH)
        if (metric.digits !== undefined
          && (!integer(metric.digits, `${path}.digits`, issues) || (metric.digits as number) > 6)) {
          issues.push(`${path}.digits must be an integer from 0 to 6`)
        }
        if (metric.suffix !== undefined) text(metric.suffix, `${path}.suffix`, issues, 80)
      }
    }
  }

  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningVisualV3
}

/**
 * Validate Learning's visual@4 envelope (its protocol literal); the document
 * fields and content are validated by `@dsh-portable/visual`.
 */
export function parseLearningVisualV4(value: unknown): LearningVisualV4 {
  const issues: string[] = []
  const bytes = jsonBytes(value)
  if (bytes === undefined) issues.push('visual must be serializable JSON')
  else if (bytes > MAX_ACTIVITY_BYTES) issues.push(`visual exceeds ${String(MAX_ACTIVITY_BYTES)} bytes`)
  if (!record(value)) throw new LearningProtocolError([...issues, 'visual must be an object'])
  onlyKeys(value, ['protocol', ...VISUAL_DOCUMENT_KEYS], 'visual', issues)
  if (value.protocol !== VISUAL_PROTOCOL_V4) issues.push(`visual.protocol must be ${VISUAL_PROTOCOL_V4}`)
  validateVisualDocumentFields(value, issues)
  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningVisualV4
}

export function parseLearningVisualResultV4(value: unknown): LearningVisualResultV4 {
  const issues: string[] = []
  if (!record(value)) throw new LearningProtocolError(['visual result must be an object'])
  onlyKeys(value, ['protocol', 'status'], 'visualResult', issues)
  if (value.protocol !== VISUAL_RESULT_PROTOCOL_V4) {
    issues.push(`visualResult.protocol must be ${VISUAL_RESULT_PROTOCOL_V4}`)
  }
  if (!LEARNING_VISUAL_STATUSES.includes(value.status as LearningVisualStatusV4)) {
    issues.push(`visualResult.status must be one of ${LEARNING_VISUAL_STATUSES.join(', ')}`)
  }
  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningVisualResultV4
}

/** Parse the small Client → Host recall bridge payload. */
export function parseLearningRecallFeedbackV1(value: unknown): LearningRecallFeedbackV1 {
  const issues: string[] = []
  if (!record(value)) throw new LearningProtocolError(['recall feedback must be an object'])
  onlyKeys(value, ['protocol', 'sessionId', 'callId', 'cardId', 'status'], 'recallFeedback', issues)
  if (value.protocol !== RECALL_FEEDBACK_PROTOCOL_V1) {
    issues.push(`recallFeedback.protocol must be ${RECALL_FEEDBACK_PROTOCOL_V1}`)
  }
  boundedIdentity(value.sessionId, 'recallFeedback.sessionId', issues)
  boundedIdentity(value.callId, 'recallFeedback.callId', issues)
  boundedIdentity(value.cardId, 'recallFeedback.cardId', issues, 128)
  if (!LEARNING_RECALL_STATUSES.includes(value.status as LearningRecallStatusV1)) {
    issues.push(`recallFeedback.status must be one of ${LEARNING_RECALL_STATUSES.join(', ')}`)
  }
  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningRecallFeedbackV1
}

export function parseLearningVisualResultV3(value: unknown): LearningVisualResultV3 {
  const issues: string[] = []
  if (!record(value)) throw new LearningProtocolError(['visual result must be an object'])
  onlyKeys(value, ['protocol', 'status'], 'visualResult', issues)
  if (value.protocol !== VISUAL_RESULT_PROTOCOL_V3) {
    issues.push(`visualResult.protocol must be ${VISUAL_RESULT_PROTOCOL_V3}`)
  }
  if (value.status !== 'ready') issues.push('visualResult.status must be ready')
  if (issues.length > 0) throw new LearningProtocolError(issues)
  return value as unknown as LearningVisualResultV3
}