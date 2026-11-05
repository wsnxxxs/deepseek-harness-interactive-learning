import { type MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives';
/** The shared `common` vocabulary keys the Markdown chrome reads. */
export type MarkdownLabelKey = 'copy' | 'copied' | 'codeBlock.title' | 'codeBlock.wrap' | 'codeBlock.unwrap' | 'markdown.footnotes';
/**
 * Build Markdown chrome labels from the shared `common` vocabulary. A
 * namespace-bound translate consults `common` after the namespace misses.
 * @param t - the owning view's locale seat.
 */
export declare function markdownLabelsOf(t: (key: MarkdownLabelKey) => string): MarkdownLabels;
/** Isolated-render defaults (tests, the browser fixture); live views always provide localized labels. */
export declare const DEFAULT_MARKDOWN_LABELS: MarkdownLabels;
export declare const MarkdownLabelsProvider: import("react").Provider<MarkdownLabels>;
/** `MarkdownText` with the surrounding surface's localized chrome labels. */
export declare function LocalizedMarkdown({ text }: {
    text: string;
}): import("react").JSX.Element;
//# sourceMappingURL=markdown.d.ts.map