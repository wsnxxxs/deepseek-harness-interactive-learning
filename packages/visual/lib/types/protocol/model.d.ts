/**
 * The closed, declarative content model of a semantic visual.
 *
 * A document names one content kind; each kind selects a trusted native
 * renderer. Nothing in the model is markup or executable: mathematical curves
 * are a bounded expression AST (`expression.ts`), every reference is a
 * declared id, and every collection is bounded by the validators in
 * `content.ts`.
 */
import type { MathExpression } from './expression.ts';
/** Every content kind, in renderer-registry order. */
export declare const VISUAL_CONTENT_KINDS: readonly ["plot", "node_link", "scene_2d", "relation", "timeline", "formula_steps", "study_map", "recall_deck", "data_table", "state_transition", "sequence_buffer", "sequence_diagram", "code_trace", "field_2d", "causal_loop"];
/** Semantic tones a mark may carry; renderers resolve them through the design tokens. */
export declare const VISUAL_TONES: readonly ["blue", "green", "red", "orange", "purple", "gray"];
/** Line styles a stroked mark may carry. */
export declare const VISUAL_STROKES: readonly ["solid", "dashed", "dotted"];
export type VisualContentKind = typeof VISUAL_CONTENT_KINDS[number];
export type VisualTone = typeof VISUAL_TONES[number];
export type VisualStroke = typeof VISUAL_STROKES[number];
/** One learner-adjustable parameter of an interactive plot. */
export interface ParameterDefinition {
    id: string;
    label: string;
    min: number;
    max: number;
    step: number;
    initial: number;
}
export interface VisualAxis {
    label?: string;
    min: number;
    max: number;
    samples?: number;
}
export interface PlotCurveSeries {
    type: 'curve';
    id: string;
    label: string;
    expression: MathExpression;
    tone?: VisualTone;
    stroke?: VisualStroke;
}
export interface PlotPoint {
    x: number;
    y: number;
    label?: string;
}
export interface PlotPointSeries {
    type: 'points';
    id: string;
    label: string;
    points: PlotPoint[];
    tone?: VisualTone;
}
export interface PlotLineSeries {
    type: 'line';
    id: string;
    label: string;
    points: PlotPoint[];
    tone?: VisualTone;
    stroke?: VisualStroke;
}
export interface PlotBarSeries {
    type: 'bars';
    id: string;
    label: string;
    points: PlotPoint[];
    tone?: VisualTone;
}
export type PlotSeries = PlotCurveSeries | PlotPointSeries | PlotLineSeries | PlotBarSeries;
export interface PlotMetric {
    id: string;
    label: string;
    expression: MathExpression;
    digits?: number;
    suffix?: string;
}
export interface PlotContent {
    kind: 'plot';
    parameters?: ParameterDefinition[];
    xAxis: VisualAxis;
    yAxis: VisualAxis;
    series: PlotSeries[];
    metrics?: PlotMetric[];
}
export interface NodeGroup {
    id: string;
    label: string;
}
export interface NodeLinkNode {
    id: string;
    label: string;
    detail?: string;
    group?: string;
    tone?: VisualTone;
}
export interface NodeLinkEdge {
    id: string;
    from: string;
    to: string;
    label?: string;
    detail?: string;
    tone?: VisualTone;
    stroke?: VisualStroke;
    directed?: boolean;
}
export interface NodeLinkContent {
    kind: 'node_link';
    layout: 'layered' | 'hierarchy' | 'radial';
    groups?: NodeGroup[];
    nodes: NodeLinkNode[];
    edges: NodeLinkEdge[];
}
interface SceneElementBase {
    id: string;
    label?: string;
    detail?: string;
    tone?: VisualTone;
}
export interface ScenePoint extends SceneElementBase {
    type: 'point';
    x: number;
    y: number;
    size?: number;
}
export interface SceneSegment extends SceneElementBase {
    type: 'segment' | 'arrow';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke?: VisualStroke;
}
export interface SceneCircle extends SceneElementBase {
    type: 'circle';
    cx: number;
    cy: number;
    r: number;
}
export interface SceneRect extends SceneElementBase {
    type: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface ScenePolygon extends SceneElementBase {
    type: 'polygon';
    points: Array<{
        x: number;
        y: number;
    }>;
}
export interface SceneLabel extends SceneElementBase {
    type: 'label';
    x: number;
    y: number;
    text: string;
}
export type SceneElement = ScenePoint | SceneSegment | SceneCircle | SceneRect | ScenePolygon | SceneLabel;
export interface Scene2DContent {
    kind: 'scene_2d';
    xAxis: VisualAxis;
    yAxis: VisualAxis;
    grid?: boolean;
    elements: SceneElement[];
}
export interface RelationSubject {
    id: string;
    label: string;
    detail?: string;
    tone?: VisualTone;
}
export interface RelationComparisonRow {
    id: string;
    label: string;
    cells: Array<{
        subjectId: string;
        value: string;
        tone?: VisualTone;
    }>;
    detail?: string;
}
export interface ComparisonRelationContent {
    kind: 'relation';
    variant: 'comparison';
    subjects: RelationSubject[];
    rows: RelationComparisonRow[];
}
export interface RelationAxisItem {
    id: string;
    label: string;
}
export interface RelationMatrixCell {
    id: string;
    rowId: string;
    columnId: string;
    label: string;
    detail?: string;
    tone?: VisualTone;
}
export interface MatrixRelationContent {
    kind: 'relation';
    variant: 'matrix';
    rows: RelationAxisItem[];
    columns: RelationAxisItem[];
    cells: RelationMatrixCell[];
}
export interface RelationSet {
    id: string;
    label: string;
    detail?: string;
    tone?: VisualTone;
}
export interface RelationSetItem {
    id: string;
    label: string;
    setIds: string[];
    detail?: string;
}
export interface SetsRelationContent {
    kind: 'relation';
    variant: 'sets';
    sets: RelationSet[];
    items: RelationSetItem[];
}
export type RelationContent = ComparisonRelationContent | MatrixRelationContent | SetsRelationContent;
export interface TimelineEvent {
    id: string;
    time: string;
    label: string;
    detail?: string;
    /** Optional normalized position from 0 to 1; omit for equal spacing. */
    position?: number;
    tone?: VisualTone;
}
export interface TimelineEra {
    id: string;
    label: string;
    startEventId: string;
    endEventId: string;
    detail?: string;
    tone?: VisualTone;
}
export interface TimelineContent {
    kind: 'timeline';
    orientation?: 'horizontal' | 'vertical';
    events: TimelineEvent[];
    eras?: TimelineEra[];
}
export interface FormulaStep {
    id: string;
    /** A single trusted Markdown-math expression, preferably LaTeX without delimiters. */
    expression: string;
    label?: string;
    /** The named rule that transforms the preceding expression into this one. */
    rule?: string;
    detail?: string;
    tone?: VisualTone;
}
export interface FormulaStepsContent {
    kind: 'formula_steps';
    notation?: string;
    steps: FormulaStep[];
    conclusion?: string;
}
export interface StudySection {
    id: string;
    label: string;
    /** Human-readable source location such as “Chapter 2” or “pp. 18–23”. */
    anchor?: string;
    summary?: string;
}
export interface StudyConcept {
    id: string;
    label: string;
    sectionId: string;
    detail?: string;
    prerequisiteIds?: string[];
    role?: 'foundation' | 'core' | 'extension' | 'practice';
    tone?: VisualTone;
}
export interface StudyMapContent {
    kind: 'study_map';
    sourceLabel: string;
    goal?: string;
    sections: StudySection[];
    concepts: StudyConcept[];
}
export interface RecallCard {
    id: string;
    prompt: string;
    answer: string;
    hint?: string;
    tags?: string[];
}
export interface RecallDeckContent {
    kind: 'recall_deck';
    instructions?: string;
    cards: RecallCard[];
}
export type TableValue = string | number | boolean | null;
export interface DataTableColumn {
    id: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    unit?: string;
}
export interface DataTableCell {
    columnId: string;
    value: TableValue;
}
export interface DataTableRow {
    id: string;
    cells: DataTableCell[];
    detail?: string;
}
export interface DataTableSort {
    columnId: string;
    direction: 'asc' | 'desc';
}
export interface DataTableFilter {
    columnId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte';
    value: TableValue;
}
export interface DataTableChart {
    type: 'line' | 'bar' | 'scatter';
    xColumnId: string;
    yColumnId: string;
    seriesColumnId?: string;
}
export interface DataTableContent {
    kind: 'data_table';
    columns: DataTableColumn[];
    rows: DataTableRow[];
    outlierIds?: string[];
    initialSort?: DataTableSort;
    initialFilter?: DataTableFilter;
    chart?: DataTableChart;
}
export interface StateTransitionState {
    id: string;
    label: string;
    detail?: string;
    tone?: VisualTone;
    initial?: boolean;
    final?: boolean;
}
export interface StateTransitionTransition {
    id: string;
    from: string;
    to: string;
    trigger: string;
    guard?: string;
    action?: string;
    detail?: string;
    tone?: VisualTone;
}
export interface StateTransitionStep {
    id: string;
    label: string;
    currentStateId: string;
    transitionId?: string;
    description?: string;
}
export interface StateTransitionContent {
    kind: 'state_transition';
    states: StateTransitionState[];
    transitions: StateTransitionTransition[];
    steps?: StateTransitionStep[];
}
export interface SequenceBufferSlot {
    id: string;
    index: number;
    value: TableValue;
    label?: string;
    tone?: VisualTone;
}
export interface SequenceBufferPointer {
    id: string;
    label: string;
    index: number;
    tone?: VisualTone;
}
export interface SequenceBufferRange {
    id: string;
    label: string;
    start: number;
    end: number;
    tone?: VisualTone;
}
export interface SequenceBufferSlotSnapshot {
    slotId: string;
    value?: TableValue;
}
export interface SequenceBufferPointerSnapshot {
    pointerId: string;
    index: number;
}
export interface SequenceBufferRangeSnapshot {
    rangeId: string;
    start: number;
    end: number;
}
export interface SequenceBufferStep {
    id: string;
    label: string;
    description?: string;
    slots?: SequenceBufferSlotSnapshot[];
    pointers?: SequenceBufferPointerSnapshot[];
    ranges?: SequenceBufferRangeSnapshot[];
}
export interface SequenceBufferContent {
    kind: 'sequence_buffer';
    slots: SequenceBufferSlot[];
    pointers?: SequenceBufferPointer[];
    ranges?: SequenceBufferRange[];
    steps?: SequenceBufferStep[];
}
export interface SequenceParticipant {
    id: string;
    label: string;
    detail?: string;
    tone?: VisualTone;
}
export interface SequenceMessage {
    id: string;
    from: string;
    to: string;
    label: string;
    type: 'sync' | 'async' | 'return' | 'self';
    detail?: string;
    tone?: VisualTone;
}
export interface SequenceDiagramContent {
    kind: 'sequence_diagram';
    participants: SequenceParticipant[];
    messages: SequenceMessage[];
}
export interface CodeTraceLine {
    number: number;
    text: string;
}
export interface CodeTraceVariable {
    name: string;
    value: TableValue;
    type?: string;
}
export interface CodeTraceStackFrame {
    id: string;
    function: string;
    line?: number;
}
export interface CodeTraceStep {
    id: string;
    label: string;
    currentLine: number;
    variables: CodeTraceVariable[];
    stack: CodeTraceStackFrame[];
    output?: string;
    description?: string;
}
export interface CodeTraceContent {
    kind: 'code_trace';
    language: string;
    code: string;
    lines: CodeTraceLine[];
    steps: CodeTraceStep[];
}
export interface FieldAxis {
    label?: string;
    min: number;
    max: number;
    samples?: number;
}
export interface ScalarFieldGrid {
    columns: number;
    rows: number;
    values: number[];
}
export interface VectorFieldGrid {
    columns: number;
    rows: number;
    u: number[];
    v: number[];
}
export interface ScalarField {
    samples?: ScalarFieldGrid;
    expression?: MathExpression;
    min?: number;
    max?: number;
}
export interface VectorField {
    samples?: VectorFieldGrid;
    expression?: {
        u: MathExpression;
        v: MathExpression;
    };
}
export interface Field2DContent {
    kind: 'field_2d';
    xAxis: FieldAxis;
    yAxis: FieldAxis;
    scalar?: ScalarField;
    vector?: VectorField;
}
export interface CausalVariable {
    id: string;
    label: string;
    detail?: string;
    tone?: VisualTone;
}
export interface CausalLink {
    id: string;
    from: string;
    to: string;
    polarity: 'positive' | 'negative';
    delay?: number;
    label?: string;
    detail?: string;
    tone?: VisualTone;
}
export interface CausalLoop {
    id: string;
    label: string;
    type: 'reinforcing' | 'balancing';
    linkIds: string[];
    detail?: string;
    tone?: VisualTone;
}
export interface CausalLoopContent {
    kind: 'causal_loop';
    variables: CausalVariable[];
    links: CausalLink[];
    loops?: CausalLoop[];
}
export type VisualContent = PlotContent | NodeLinkContent | Scene2DContent | RelationContent | TimelineContent | FormulaStepsContent | StudyMapContent | RecallDeckContent | DataTableContent | StateTransitionContent | SequenceBufferContent | SequenceDiagramContent | CodeTraceContent | Field2DContent | CausalLoopContent;
export interface VisualFrame {
    id: string;
    label: string;
    description?: string;
    focusIds: string[];
}
export interface VisualSequence {
    initialFrameId?: string;
    frames: VisualFrame[];
}
/**
 * A semantic, non-blocking visual. The content discriminator selects a trusted
 * native renderer; arbitrary markup and executable payloads are never accepted.
 */
export interface VisualDocument {
    title: string;
    description?: string;
    content: VisualContent;
    sequence?: VisualSequence;
    fallbackMarkdown?: string;
}
export {};
//# sourceMappingURL=model.d.ts.map