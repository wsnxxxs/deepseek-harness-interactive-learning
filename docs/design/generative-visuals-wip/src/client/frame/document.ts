/**
 * The sandbox document: CSP, design system, bootstrap, empty root.
 * (Contract stub — the full runtime lands behind the same signature.)
 */
import type { VisualDocumentInput, VisualMode } from './types.ts'

/** Script/style hosts a visual may load from when it names one directly (offline: fails quietly). */
export const CDN_ALLOWLIST: readonly string[] = [
  'https://cdn.jsdelivr.net',
  'https://cdnjs.cloudflare.com',
  'https://unpkg.com',
  'https://esm.sh',
  'https://registry.npmmirror.com',
]

/** The frame's Content-Security-Policy: inline code and the CDN allowlist only, no network for data. */
export function visualContentSecurityPolicy(allowlist: readonly string[] = CDN_ALLOWLIST): string {
  const hosts = allowlist.join(' ')
  return [
    "default-src 'none'",
    `script-src 'unsafe-inline' ${hosts}`,
    `style-src 'unsafe-inline' ${hosts}`,
    `img-src data: blob: ${hosts}`,
    `font-src data: ${hosts}`,
    'media-src data: blob:',
    "connect-src 'none'",
    "frame-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
  ].join('; ')
}

const escapeHtml = (text: string): string => text
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

/** Build the HTML document a visual renders in (sandbox `srcdoc`, or a download). */
export function visualDocumentFor(input: VisualDocumentInput): string {
  const mode: VisualMode = typeof input.theme === 'string' ? input.theme : input.theme?.mode ?? 'light'
  const body = input.target === 'standalone' ? input.code : ''
  return `<!doctype html><html lang="en" data-mode="${mode}"><head><meta charset="utf-8">`
    + `<meta http-equiv="Content-Security-Policy" content="${escapeHtml(visualContentSecurityPolicy())}">`
    + `<meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(input.title)}</title>`
    + `</head><body><div id="dsh-root">${body}</div></body></html>`
}
