/** Shared types of the visual frame runtime (parent side). */

export type VisualMode = 'light' | 'dark'

/** The resolved host theme the frame maps onto its design-system variables. */
export interface VisualTheme {
  readonly mode: VisualMode
  /** CSS custom properties (`--name` → value) applied on the frame's root element. */
  readonly vars: Readonly<Record<string, string>>
}

export interface VisualFrameProps {
  /** The model's fragment: one SVG element or HTML (wrappers are stripped). */
  readonly code: string
  /** Accessible name of the frame. */
  readonly title: string
  /** `false` while the tool call streams (partial code, scripts held back); `true` once complete. */
  readonly final: boolean
  /** A click inside the visual asked to send a follow-up message (already validated and gesture-gated). */
  readonly onSendPrompt?: (text: string) => void | Promise<void>
  /** A click inside the visual asked to open an http(s) link (already validated and gesture-gated). */
  readonly onOpenLink?: (url: string) => void
  /** The visual threw, or a library failed to load. */
  readonly onError?: (message: string) => void
  readonly className?: string
}

export interface VisualDocumentInput {
  /** The model's fragment (normalized with `extractVisualCode` first). */
  readonly code: string
  /** Accessible name; becomes the document title. */
  readonly title: string
  /** Theme baked into the document; defaults to the light palette. */
  readonly theme?: VisualTheme | VisualMode
  /**
   * `frame` (default): the sandbox document — empty root; the bootstrap renders
   * what the parent posts. `standalone`: a self-contained file for downloads —
   * the code inline and run on load, `lib:` scripts from pinned CDN URLs.
   */
  readonly target?: 'frame' | 'standalone'
}
