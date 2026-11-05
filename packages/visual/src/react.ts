/**
 * `@dsh-portable/visual/react`: the React surface for embedding a visual — the
 * `VisualView` shell, its localizable labels, the Markdown chrome helper and
 * the design-token scope. A view that renders a validated `VisualDocument`
 * (see `@dsh-portable/visual/protocol`) needs nothing else.
 */
export { VisualView, type VisualViewProps } from './client/visuals/index.tsx'
export {
  DEFAULT_VISUAL_LABELS,
  labelTemplate,
  type VisualLabels,
} from './client/visuals/core/labels.ts'
export {
  DEFAULT_MARKDOWN_LABELS,
  LocalizedMarkdown,
  MarkdownLabelsProvider,
  markdownLabelsOf,
  type MarkdownLabelKey,
} from './client/markdown.tsx'
export { visualScope } from './client/tokens.ts'
export type {
  VisualContent,
  VisualContentKind,
  VisualDocument,
  VisualFrame,
  VisualSequence,
  VisualTone,
} from './protocol/model.ts'
