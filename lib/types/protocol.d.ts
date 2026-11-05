/**
 * Versioned, declarative protocol shared by the Host, Agent, and Client.
 *
 * The visual@4 content model, its validators and the expression language live
 * in `@dsh-portable/visual/protocol` under neutral names. This module keeps the
 * Learning protocols (activity V1/V2, visual V3 replay, checkpoint, recall
 * feedback), the versioned visual@4 envelope, and every historical type name
 * as an alias of the shared model.
 */
import { type CausalLink, type CausalLoop, type CausalLoopContent, type CausalVariable, type CodeTraceContent, type CodeTraceLine, type CodeTraceStackFrame, type CodeTraceStep, type CodeTraceVariable, type ComparisonRelationContent, type DataTableCell, type DataTableChart, type DataTableColumn, type DataTableContent, type DataTableFilter, type DataTableRow, type DataTableSort, type Field2DContent, type FieldAxis, type FormulaStep, type FormulaStepsContent, type MathExpression, type MatrixRelationContent, type NodeGroup, type NodeLinkContent, type NodeLinkEdge, type NodeLinkNode, type ParameterDefinition, type PlotBarSeries, type PlotContent, type PlotCurveSeries, type PlotLineSeries, type PlotMetric, type PlotPoint, type PlotPointSeries, type PlotSeries, type RecallCard, type RecallDeckContent, type RelationAxisItem, type RelationComparisonRow, type RelationContent, type RelationMatrixCell, type RelationSet, type RelationSetItem, type RelationSubject, type ScalarField, type ScalarFieldGrid, type Scene2DContent, type SceneCircle, type SceneElement, type SceneLabel, type ScenePoint, type ScenePolygon, type SceneRect, type SceneSegment, type SequenceBufferContent, type SequenceBufferPointer, type SequenceBufferPointerSnapshot, type SequenceBufferRange, type SequenceBufferRangeSnapshot, type SequenceBufferSlot, type SequenceBufferSlotSnapshot, type SequenceBufferStep, type SequenceDiagramContent, type SequenceMessage, type SequenceParticipant, type SetsRelationContent, type StateTransitionContent, type StateTransitionState, type StateTransitionStep, type StateTransitionTransition, type StudyConcept, type StudyMapContent, type StudySection, type TableValue, type TimelineContent, type TimelineEra, type TimelineEvent, type VectorField, type VectorFieldGrid, type VisualAxis, type VisualContent, type VisualContentKind, type VisualDocument, type VisualFrame, type VisualSequence, type VisualStroke, type VisualTone } from '@dsh-portable/visual/protocol';
export declare const ACTIVITY_PROTOCOL: "dsh-learning/activity@1";
export declare const RESPONSE_PROTOCOL: "dsh-learning/response@1";
export declare const TRANSPORT_PROTOCOL: "dsh-learning/transport@1";
export declare const ACTIVITY_PROTOCOL_V2: "dsh-learning/activity@2";
export declare const RESPONSE_PROTOCOL_V2: "dsh-learning/response@2";
export declare const TRANSPORT_PROTOCOL_V2: "dsh-learning/wait@2";
export declare const VISUAL_PROTOCOL_V3: "dsh-learning/visual@3";
export declare const VISUAL_RESULT_PROTOCOL_V3: "dsh-learning/visual-result@3";
export declare const VISUAL_PROTOCOL_V4: "dsh-learning/visual@4";
export declare const VISUAL_RESULT_PROTOCOL_V4: "dsh-learning/visual-result@4";
export declare const RECALL_FEEDBACK_PROTOCOL_V1: "dsh-learning/recall-feedback@1";
export declare const CHECKPOINT_PROTOCOL: "dsh-learning/checkpoint@1";
export declare const CHECKPOINT_RESULT_PROTOCOL: "dsh-learning/checkpoint-result@1";
export declare const CHECKPOINT_TRANSPORT_PROTOCOL: "dsh-learning/checkpoint-wait@1";
export declare const LEARNING_CHECKPOINT_KINDS: readonly ["free_text", "single_choice", "numeric", "prediction", "code_slot"];
export declare const LEARNING_CHECKPOINT_EVIDENCE_KINDS: readonly ["attempt", "prediction", "explanation", "contrast", "transfer"];
export { VISUAL_CONTENT_KINDS as LEARNING_VISUAL_KINDS_V4 } from '@dsh-portable/visual/protocol';
export declare const LEARNING_ACTIVITY_KINDS: readonly ["parameter_explorer", "process_stepper", "structure_compare"];
export declare const MAX_ACTIVITY_BYTES: number;
export declare const MAX_RESPONSE_BYTES: number;
export { MAX_MATH_DEPTH, MAX_MATH_NODES, MAX_VISUAL_MATH_DEPTH, MATH_BINARY_OPERATORS, MATH_UNARY_OPERATORS, } from '@dsh-portable/visual/protocol';
export type LearningActivityKind = typeof LEARNING_ACTIVITY_KINDS[number];
export type LearningAction = 'submit' | 'skip' | 'cancel';
export type LearningJson = null | boolean | number | string | LearningJson[] | {
    [key: string]: LearningJson;
};
export type LearningCheckpointKindV1 = typeof LEARNING_CHECKPOINT_KINDS[number];
export type LearningCheckpointEvidenceKindV1 = typeof LEARNING_CHECKPOINT_EVIDENCE_KINDS[number];
export type MathExpressionV1 = MathExpression;
export type ParameterDefinitionV1 = ParameterDefinition;
export interface ParameterCurveV1 {
    id: string;
    label: string;
    expression: MathExpressionV1;
}
export interface ParameterExplorerPayloadV1 {
    parameters: ParameterDefinitionV1[];
    xAxis: {
        label?: string;
        min: number;
        max: number;
        samples?: number;
    };
    curves: ParameterCurveV1[];
    question?: string;
}
export interface ProcessCheckpointV1 {
    question: string;
    options?: string[];
}
export interface ProcessStepV1 {
    id: string;
    title: string;
    content: string;
    checkpoint?: ProcessCheckpointV1;
}
export interface ProcessStepperPayloadV1 {
    steps: ProcessStepV1[];
    question?: string;
}
export interface StructureItemV1 {
    id: string;
    label: string;
    detail?: string;
}
export interface StructureAlignmentV1 {
    id: string;
    leftId?: string;
    rightId?: string;
    prompt?: string;
}
export interface StructureComparePayloadV1 {
    left: {
        title: string;
        items: StructureItemV1[];
    };
    right: {
        title: string;
        items: StructureItemV1[];
    };
    alignments: StructureAlignmentV1[];
    question?: string;
}
interface ActivityBaseV1<K extends LearningActivityKind, P> {
    protocol: typeof ACTIVITY_PROTOCOL;
    kind: K;
    title: string;
    objective: string;
    prompt: string;
    scaffold?: string;
    payload: P;
    fallbackMarkdown: string;
}
export type LearningActivityV1 = ActivityBaseV1<'parameter_explorer', ParameterExplorerPayloadV1> | ActivityBaseV1<'process_stepper', ProcessStepperPayloadV1> | ActivityBaseV1<'structure_compare', StructureComparePayloadV1>;
export interface LearningResponseV1 {
    protocol: typeof RESPONSE_PROTOCOL;
    activityId: string;
    action: LearningAction;
    answer?: LearningJson;
    interactionState?: LearningJson;
}
export interface LearningActivityEnvelopeV1 {
    transport: typeof TRANSPORT_PROTOCOL;
    activityId: string;
    activity: LearningActivityV1;
}
export type LearningActivityEnvelopeInputV1 = Omit<LearningActivityEnvelopeV1, 'transport'>;
export interface LearningFocusV2 {
    title: string;
    progress?: {
        current: number;
        total?: number;
    };
}
export type LearningInputV2 = {
    kind: 'single_choice';
    options: Array<{
        id: string;
        label: string;
    }>;
} | {
    kind: 'short_text';
    placeholder?: string;
    maxLength?: number;
} | {
    kind: 'number';
    min?: number;
    max?: number;
    step?: number;
};
export interface LearningFrameV2 {
    id: string;
    title: string;
    content?: string;
}
export type LearningQuestionVisualV2 = {
    kind: 'process';
    frame: LearningFrameV2;
} | {
    kind: 'parameter';
    parameters: ParameterDefinitionV1[];
    xAxis: ParameterExplorerPayloadV1['xAxis'];
    curves: ParameterCurveV1[];
} | {
    kind: 'structure';
    left: StructureComparePayloadV1['left'];
    right: StructureComparePayloadV1['right'];
    alignments: StructureAlignmentV1[];
};
export type LearningRevealVisualV2 = {
    kind: 'process';
    before: LearningFrameV2;
    after: LearningFrameV2;
} | {
    kind: 'parameter';
    parameters: ParameterDefinitionV1[];
    xAxis: ParameterExplorerPayloadV1['xAxis'];
    curves: ParameterCurveV1[];
    emphasis?: string;
} | {
    kind: 'structure';
    left: StructureComparePayloadV1['left'];
    right: StructureComparePayloadV1['right'];
    alignments: StructureAlignmentV1[];
    emphasisAlignmentIds?: string[];
};
export interface LearningQuestionV2 {
    protocol: typeof ACTIVITY_PROTOCOL_V2;
    phase: 'question';
    lessonToken?: string;
    seq: number;
    focus: LearningFocusV2;
    prompt: string;
    scaffold?: string;
    input: LearningInputV2;
    visual?: LearningQuestionVisualV2;
    fallbackMarkdown: string;
}
export interface LearningRevealV2 {
    protocol: typeof ACTIVITY_PROTOCOL_V2;
    phase: 'reveal';
    lessonToken: string;
    roundToken: string;
    seq: number;
    focus: LearningFocusV2;
    feedback: {
        verdict?: 'correct' | 'partial' | 'misconception' | 'neutral';
        learnerEcho?: string;
        explanation: string;
        answer?: string;
    };
    visual?: LearningRevealVisualV2;
    animation: {
        kind: 'draw' | 'morph' | 'highlight' | 'step_complete';
        preferredDurationMs?: number;
        reducedMotion: 'commit-final-state';
    };
    advance: {
        mode: 'user-after-animation';
        label?: string;
    };
    fallbackMarkdown: string;
}
export type LearningActivityV2 = LearningQuestionV2 | LearningRevealV2;
interface LearningResponseBaseV2 {
    protocol: typeof RESPONSE_PROTOCOL_V2;
    activityId: string;
    lessonToken: string;
    roundToken: string;
    seq: number;
    receiptId: string;
    interactionState?: LearningJson;
}
export interface LearningQuestionResponseV2 extends LearningResponseBaseV2 {
    phase: 'question';
    action: 'submit' | 'skip' | 'cancel';
    answer?: LearningJson;
}
export interface LearningRevealResponseV2 extends LearningResponseBaseV2 {
    phase: 'reveal';
    action: 'continue' | 'skip' | 'cancel';
    animation: {
        completed: boolean;
        skipped?: boolean;
        reducedMotion?: boolean;
        error?: string;
    };
}
export type LearningResponseV2 = LearningQuestionResponseV2 | LearningRevealResponseV2;
export interface LearningWaitEnvelopeV2 {
    transport: typeof TRANSPORT_PROTOCOL_V2;
    waitId: string;
    activityId: string;
    callId?: string;
    lessonToken: string;
    roundToken: string;
    seq: number;
    phase: 'question' | 'reveal';
    activity: LearningActivityV2;
}
export type LearningWaitEnvelopeInputV2 = Omit<LearningWaitEnvelopeV2, 'transport'>;
export interface LearningCheckpointOptionV1 {
    id: string;
    label: string;
}
/** One answer-free, current-step learner contribution request. */
export interface LearningCheckpointV1 {
    protocol: typeof CHECKPOINT_PROTOCOL;
    kind: LearningCheckpointKindV1;
    prompt: string;
    context?: string;
    expectedEvidence: LearningCheckpointEvidenceKindV1;
    options?: LearningCheckpointOptionV1[];
    fallbackMarkdown: string;
}
export type LearningCheckpointResponseV1 = {
    text: string;
} | {
    optionId: string;
} | {
    number: number;
};
/**
 * Why a non-submitted checkpoint ended.  The field is optional on v1 result
 * records so older persisted receipts remain readable; new Host/Client
 * receipts should always provide it.
 */
export type LearningCheckpointSkippedReasonV1 = 'learner-skipped' | 'client-unavailable' | 'client-response-timeout' | 'host-unavailable' | 'provider-failure';
export type LearningCheckpointCancelledReasonV1 = 'learner-cancelled' | 'session-aborted' | 'plugin-disposed';
export type LearningCheckpointOutcomeReasonV1 = LearningCheckpointSkippedReasonV1 | LearningCheckpointCancelledReasonV1;
interface LearningCheckpointResultBaseV1 {
    protocol: typeof CHECKPOINT_RESULT_PROTOCOL;
    checkpointId: string;
    receiptId: string;
}
export interface LearningCheckpointSubmittedResultV1 extends LearningCheckpointResultBaseV1 {
    status: 'submitted';
    response: LearningCheckpointResponseV1;
}
export interface LearningCheckpointSkippedResultV1 extends LearningCheckpointResultBaseV1 {
    status: 'skipped';
    /** Optional only for backwards-compatible replay of pre-reason receipts. */
    reason?: LearningCheckpointSkippedReasonV1;
}
export interface LearningCheckpointCancelledResultV1 extends LearningCheckpointResultBaseV1 {
    status: 'cancelled';
    /** Optional only for backwards-compatible replay of pre-reason receipts. */
    reason?: LearningCheckpointCancelledReasonV1;
}
export type LearningCheckpointResultV1 = LearningCheckpointSubmittedResultV1 | LearningCheckpointSkippedResultV1 | LearningCheckpointCancelledResultV1;
/** Durable safe projection used only to recover one pending checkpoint wait. */
export interface LearningCheckpointWaitEnvelopeV1 {
    transport: typeof CHECKPOINT_TRANSPORT_PROTOCOL;
    sessionId: string;
    callId: string;
    waitId: string;
    checkpointId: string;
    checkpoint: LearningCheckpointV1;
}
export type LearningCheckpointWaitEnvelopeInputV1 = Omit<LearningCheckpointWaitEnvelopeV1, 'transport'>;
export type LearningVisualToneV3 = VisualTone;
export type LearningVisualStrokeV3 = VisualStroke;
export type LearningVisualAxisV3 = VisualAxis;
export type LearningVisualCurveV3 = PlotCurveSeries;
export type LearningVisualPointV3 = PlotPoint;
export type LearningVisualPointSeriesV3 = PlotPointSeries;
export type LearningVisualSeriesV3 = LearningVisualCurveV3 | LearningVisualPointSeriesV3;
export type LearningVisualMetricV3 = PlotMetric;
/**
 * A non-blocking, replayable visual embedded in the assistant's normal turn.
 * It never owns learner input: the ordinary conversation composer remains live.
 */
export interface LearningVisualV3 {
    protocol: typeof VISUAL_PROTOCOL_V3;
    kind: 'parameter_chart';
    title: string;
    description?: string;
    parameters: ParameterDefinitionV1[];
    xAxis: LearningVisualAxisV3;
    yAxis: LearningVisualAxisV3;
    series: LearningVisualSeriesV3[];
    metrics?: LearningVisualMetricV3[];
}
export interface LearningVisualResultV3 {
    protocol: typeof VISUAL_RESULT_PROTOCOL_V3;
    status: 'ready';
}
export type LearningVisualKindV4 = VisualContentKind;
export type LearningVisualToneV4 = LearningVisualToneV3;
export type LearningVisualStrokeV4 = LearningVisualStrokeV3;
export type LearningVisualLineSeriesV4 = PlotLineSeries;
export type LearningVisualBarSeriesV4 = PlotBarSeries;
export type LearningPlotSeriesV4 = PlotSeries;
export type LearningPlotV4 = PlotContent;
export type LearningNodeGroupV4 = NodeGroup;
export type LearningNodeV4 = NodeLinkNode;
export type LearningEdgeV4 = NodeLinkEdge;
export type LearningNodeLinkV4 = NodeLinkContent;
export type LearningScenePointV4 = ScenePoint;
export type LearningSceneSegmentV4 = SceneSegment;
export type LearningSceneCircleV4 = SceneCircle;
export type LearningSceneRectV4 = SceneRect;
export type LearningScenePolygonV4 = ScenePolygon;
export type LearningSceneLabelV4 = SceneLabel;
export type LearningSceneElementV4 = SceneElement;
export type LearningScene2DV4 = Scene2DContent;
export type LearningRelationSubjectV4 = RelationSubject;
export type LearningRelationComparisonRowV4 = RelationComparisonRow;
export type LearningComparisonRelationV4 = ComparisonRelationContent;
export type LearningRelationAxisItemV4 = RelationAxisItem;
export type LearningRelationMatrixCellV4 = RelationMatrixCell;
export type LearningMatrixRelationV4 = MatrixRelationContent;
export type LearningRelationSetV4 = RelationSet;
export type LearningRelationSetItemV4 = RelationSetItem;
export type LearningSetsRelationV4 = SetsRelationContent;
export type LearningRelationV4 = RelationContent;
export type LearningTimelineEventV4 = TimelineEvent;
export type LearningTimelineEraV4 = TimelineEra;
export type LearningTimelineV4 = TimelineContent;
export type LearningFormulaStepV4 = FormulaStep;
export type LearningFormulaStepsV4 = FormulaStepsContent;
export type LearningStudySectionV4 = StudySection;
export type LearningStudyConceptV4 = StudyConcept;
export type LearningStudyMapV4 = StudyMapContent;
export type LearningRecallCardV4 = RecallCard;
export type LearningRecallDeckV4 = RecallDeckContent;
export type LearningTableValueV4 = TableValue;
export type LearningDataTableColumnV4 = DataTableColumn;
export type LearningDataTableCellV4 = DataTableCell;
export type LearningDataTableRowV4 = DataTableRow;
export type LearningDataTableSortV4 = DataTableSort;
export type LearningDataTableFilterV4 = DataTableFilter;
export type LearningDataTableChartV4 = DataTableChart;
export type LearningDataTableV4 = DataTableContent;
export type LearningStateTransitionStateV4 = StateTransitionState;
export type LearningStateTransitionTransitionV4 = StateTransitionTransition;
export type LearningStateTransitionStepV4 = StateTransitionStep;
export type LearningStateTransitionV4 = StateTransitionContent;
export type LearningSequenceBufferSlotV4 = SequenceBufferSlot;
export type LearningSequenceBufferPointerV4 = SequenceBufferPointer;
export type LearningSequenceBufferRangeV4 = SequenceBufferRange;
export type LearningSequenceBufferSlotSnapshotV4 = SequenceBufferSlotSnapshot;
export type LearningSequenceBufferPointerSnapshotV4 = SequenceBufferPointerSnapshot;
export type LearningSequenceBufferRangeSnapshotV4 = SequenceBufferRangeSnapshot;
export type LearningSequenceBufferStepV4 = SequenceBufferStep;
export type LearningSequenceBufferV4 = SequenceBufferContent;
export type LearningSequenceParticipantV4 = SequenceParticipant;
export type LearningSequenceMessageV4 = SequenceMessage;
export type LearningSequenceDiagramV4 = SequenceDiagramContent;
export type LearningCodeTraceLineV4 = CodeTraceLine;
export type LearningCodeTraceVariableV4 = CodeTraceVariable;
export type LearningCodeTraceStackFrameV4 = CodeTraceStackFrame;
export type LearningCodeTraceStepV4 = CodeTraceStep;
export type LearningCodeTraceV4 = CodeTraceContent;
export type LearningFieldAxisV4 = FieldAxis;
export type LearningScalarFieldGridV4 = ScalarFieldGrid;
export type LearningVectorFieldGridV4 = VectorFieldGrid;
export type LearningScalarFieldV4 = ScalarField;
export type LearningVectorFieldV4 = VectorField;
export type LearningField2DV4 = Field2DContent;
export type LearningCausalVariableV4 = CausalVariable;
export type LearningCausalLinkV4 = CausalLink;
export type LearningCausalLoopV4 = CausalLoop;
export type LearningCausalLoopDiagramV4 = CausalLoopContent;
export type LearningVisualContentV4 = VisualContent;
export type LearningVisualFrameV4 = VisualFrame;
export type LearningVisualSequenceV4 = VisualSequence;
/**
 * A semantic, non-blocking visual in Learning's versioned envelope: the shared
 * `VisualDocument` plus the `dsh-learning/visual@4` literal that Learning's
 * tool calls and their replay are keyed on.
 */
export interface LearningVisualV4 extends VisualDocument {
    protocol: typeof VISUAL_PROTOCOL_V4;
}
/**
 * Terminal outcome of one `learning_visual` call.
 *
 * `unavailable` means the composition has no renderer for this payload, so the
 * learner saw nothing. The model must then carry the explanation in prose
 * instead of referring to a figure that is not on screen.
 */
export interface LearningVisualResultV4 {
    protocol: typeof VISUAL_RESULT_PROTOCOL_V4;
    status: LearningVisualStatusV4;
}
export declare const LEARNING_VISUAL_STATUSES: readonly ["ready", "unavailable"];
export type LearningVisualStatusV4 = typeof LEARNING_VISUAL_STATUSES[number];
/** A learner's explicit recall interaction, sent from the visual Client to Host. */
export declare const LEARNING_RECALL_STATUSES: readonly ["revealed", "mastered", "review"];
export type LearningRecallStatusV1 = typeof LEARNING_RECALL_STATUSES[number];
export interface LearningRecallFeedbackV1 {
    protocol: typeof RECALL_FEEDBACK_PROTOCOL_V1;
    /** Session identity is part of the wire key; Host still checks it is active. */
    sessionId: string;
    /** The semantic visual call that owns the card. */
    callId: string;
    cardId: string;
    status: LearningRecallStatusV1;
}
/** A stable, actionable protocol rejection surfaced to the tool call. */
export declare class LearningProtocolError extends Error {
    readonly issues: readonly string[];
    readonly code = "INVALID_LEARNING_ACTIVITY";
    constructor(issues: readonly string[]);
}
/** Validate and narrow an untrusted model-provided activity. */
export declare function parseLearningActivity(value: unknown): LearningActivityV1;
/** Validate and narrow a Client response before it returns to the model. */
export declare function parseLearningResponse(value: unknown, expectedActivityId?: string): LearningResponseV1;
/** Strict live protocol. V1 is intentionally parsed separately for legacy replay only. */
export declare function parseLearningActivityV2(value: unknown): LearningActivityV2;
export type ExpectedLearningResponseV2 = Partial<Pick<LearningResponseV2, 'activityId' | 'phase' | 'lessonToken' | 'roundToken' | 'seq'>>;
/** Validate a phase-bound Client receipt before the Broker changes lesson state. */
export declare function parseLearningResponseV2(value: unknown, expected?: ExpectedLearningResponseV2): LearningResponseV2;
/** Canonical fail-closed predicate shared by protocol parsing and Client fallback extraction. */
export declare function isLearningCheckpointDisplayTextSafe(value: string): boolean;
/** Strict, answer-free protocol for one optional learner checkpoint. */
export declare function parseLearningCheckpointV1(value: unknown): LearningCheckpointV1;
export interface ExpectedLearningCheckpointResultV1 {
    checkpointId?: string;
    checkpoint?: LearningCheckpointV1;
}
/** Validate one phase-bound checkpoint receipt before the Host accepts it. */
export declare function parseLearningCheckpointResultV1(value: unknown, expected?: ExpectedLearningCheckpointResultV1): LearningCheckpointResultV1;
/** Validate the preferred, non-blocking visual protocol. */
export declare function parseLearningVisualV3(value: unknown): LearningVisualV3;
/**
 * Validate Learning's visual@4 envelope (its protocol literal); the document
 * fields and content are validated by `@dsh-portable/visual`.
 */
export declare function parseLearningVisualV4(value: unknown): LearningVisualV4;
export declare function parseLearningVisualResultV4(value: unknown): LearningVisualResultV4;
/** Parse the small Client → Host recall bridge payload. */
export declare function parseLearningRecallFeedbackV1(value: unknown): LearningRecallFeedbackV1;
export declare function parseLearningVisualResultV3(value: unknown): LearningVisualResultV3;
//# sourceMappingURL=protocol.d.ts.map