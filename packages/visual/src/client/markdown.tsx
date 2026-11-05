/**
 * Localized Markdown for every visual surface.
 *
 * Harness 0.2 made `MarkdownText` require its chrome labels (code-card copy
 * and wrap actions, footnote heading). Upstream plugins build them from the
 * shared `common` locale vocabulary through their namespace-bound `t`
 * (`packages/client/ui-tool/src/client/tool/models/primitive-labels.ts`). An
 * owning view builds them once from its own `t` and provides them here, so
 * nested renderers do not each thread a `t` they would otherwise not need.
 */
import { createContext, useContext } from 'react'
import { MarkdownText, type MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** The shared `common` vocabulary keys the Markdown chrome reads. */
export type MarkdownLabelKey =
  | 'copy'
  | 'copied'
  | 'codeBlock.title'
  | 'codeBlock.wrap'
  | 'codeBlock.unwrap'
  | 'markdown.footnotes'

/**
 * Build Markdown chrome labels from the shared `common` vocabulary. A
 * namespace-bound translate consults `common` after the namespace misses.
 * @param t - the owning view's locale seat.
 */
export function markdownLabelsOf(t: (key: MarkdownLabelKey) => string): MarkdownLabels {
  return {
    code: {
      copyLabel: t('copy'),
      copiedLabel: t('copied'),
      toolbarLabels: { codeLabel: t('codeBlock.title'), wrapLabel: t('codeBlock.wrap'), unwrapLabel: t('codeBlock.unwrap') },
    },
    footnotes: t('markdown.footnotes'),
  }
}

/** Isolated-render defaults (tests, the browser fixture); live views always provide localized labels. */
export const DEFAULT_MARKDOWN_LABELS: MarkdownLabels = {
  code: {
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
    toolbarLabels: { codeLabel: 'Code block', wrapLabel: 'Wrap lines', unwrapLabel: 'Do not wrap lines' },
  },
  footnotes: 'Footnotes',
}

const MarkdownLabelsContext = createContext<MarkdownLabels>(DEFAULT_MARKDOWN_LABELS)

export const MarkdownLabelsProvider = MarkdownLabelsContext.Provider

/** `MarkdownText` with the surrounding surface's localized chrome labels. */
export function LocalizedMarkdown({ text }: { text: string }) {
  return <MarkdownText text={text} labels={useContext(MarkdownLabelsContext)} />
}
