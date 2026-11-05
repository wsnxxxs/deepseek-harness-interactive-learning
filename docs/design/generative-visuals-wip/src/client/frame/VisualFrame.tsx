/**
 * `VisualFrame`: renders one model-written visual in a sandboxed iframe.
 * Renders ONLY the iframe; the owning tool view draws chrome and states around it.
 * (Contract stub — the streaming/themed runtime lands behind the same props.)
 */
import { useMemo } from 'react'
import { extractVisualCode } from './extract.ts'
import { visualDocumentFor } from './document.ts'
import type { VisualFrameProps } from './types.ts'

export function VisualFrame({ code, title, final, className }: VisualFrameProps) {
  const srcDoc = useMemo(
    () => visualDocumentFor({ code: final ? extractVisualCode(code) : '', title, target: 'standalone' }),
    [code, final, title],
  )
  return <iframe className={className} title={title} sandbox="allow-scripts" srcDoc={srcDoc} style={{ display: 'block', width: '100%', border: 0 }} />
}
