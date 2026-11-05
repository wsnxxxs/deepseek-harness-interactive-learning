/**
 * Localized Markdown for every Learning surface.
 *
 * Harness 0.2 made `MarkdownText` require its chrome labels (code-card copy
 * and wrap actions, footnote heading). Upstream plugins build them from the
 * shared `common` locale vocabulary through their namespace-bound `t`
 * (`packages/client/ui-tool/src/client/tool/models/primitive-labels.ts`). The
 * Learning tool view builds them once from its own `t` and provides them here,
 * so nested activity and visual renderers do not each thread a `t` they would
 * otherwise not need.
 */
import { createContext, useContext } from 'react'
import { MarkdownText, type MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'

/**
 * Build Markdown chrome labels from the shared `common` vocabulary. The
 * namespace-bound translate consults `common` after the namespace misses.
 * @param t - Learning locale seat.
 */
export function markdownLabelsOf(t: TranslateNS<'interactive-learning'>): MarkdownLabels {
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

/** `MarkdownText` with the surrounding Learning surface's localized chrome labels. */
export function LearningMarkdown({ text }: { text: string }) {
  return <MarkdownText text={text} labels={useContext(MarkdownLabelsContext)} />
}
