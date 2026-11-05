/**
 * Generative visual frame: the stable contract the `show_visual` tool view builds on.
 *
 * - `VisualFrame` renders one model-written fragment in a sandboxed, themed,
 *   auto-height iframe (streaming while `final` is false; scripts run once when final).
 * - `extractVisualCode` normalizes raw tool input to the fragment.
 * - `visualDocumentFor` builds the full HTML document (tests, `.html` downloads).
 */
export { VisualFrame } from './VisualFrame.tsx'
export { extractVisualCode, hasDocumentWrapper } from './extract.ts'
export { CDN_ALLOWLIST, visualContentSecurityPolicy, visualDocumentFor } from './document.ts'
export type { VisualDocumentInput, VisualFrameProps, VisualMode, VisualTheme } from './types.ts'
