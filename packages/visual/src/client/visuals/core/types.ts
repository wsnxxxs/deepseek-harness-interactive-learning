/**
 * Shared types for the visual renderers.
 *
 * Extracted from the former single-file renderer so that layout, state and
 * each renderer can be read, tested and changed independently.
 */
import type { VisualContent, VisualTone } from '../../../protocol/model.ts'
import type { VisualFocus } from '../state/visual-state.ts'

export type {
  CausalLoopContent,
  CodeTraceContent,
  DataTableContent,
  Field2DContent,
  FormulaStepsContent,
  NodeLinkContent,
  PlotContent,
  RecallDeckContent,
  RelationContent,
  Scene2DContent,
  SequenceBufferContent,
  SequenceDiagramContent,
  StateTransitionContent,
  StudyMapContent,
  TimelineContent,
  VisualContent,
  VisualTone,
} from '../../../protocol/model.ts'

export const DEFAULT_TONES: readonly VisualTone[] = ['blue', 'red', 'green', 'orange', 'purple', 'gray']

export interface RendererProps<T extends VisualContent = VisualContent> {
  content: T
  focus: VisualFocus
  storageKey?: string
  /** Optional Host-backed feedback sink for learner-owned recall ratings. */
  onRecallStatusChange?: (cardId: string, status: 'revealed' | 'mastered' | 'review') => void
}

export interface Point {
  x: number
  y: number
}

export interface SelectedItem {
  id: string
  label: string
  detail?: string
  kind: 'node' | 'edge' | 'element'
  tone?: VisualTone
}

export interface ChartGeometry {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
  plotWidth: number
  plotHeight: number
}
