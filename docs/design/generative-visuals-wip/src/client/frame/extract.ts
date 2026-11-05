/**
 * Normalize model-written visual code to the fragment the frame renders.
 *
 * `show_visual` takes one SVG element or an HTML fragment. Models sometimes
 * wrap it in a whole document (doctype, `<html>`, `<head>`, `<body>`) or in a
 * Markdown code fence; both wrappers are removed here, and nothing else is.
 * Head content worth keeping (`<style>`, `<script>`, `<link>`) is moved in front
 * of the body content, so a wrapped document renders the same as a fragment.
 */

const FENCE = /^\s*```[A-Za-z0-9_-]*[^\S\r\n]*\r?\n([\s\S]*?)\r?\n?```\s*$/
const DOCTYPE = /^\s*<!doctype[^>]*>/i
const HTML_OPEN = /<html(?:\s[^>]*)?>/i
const HTML_CLOSE = /<\/html\s*>/i
const HEAD = /<head(?:\s[^>]*)?>([\s\S]*?)(?:<\/head\s*>|$)/i
const BODY_OPEN = /<body(?:\s[^>]*)?>/i
const BODY_CLOSE = /<\/body\s*>/i
/** Head elements that change what the fragment draws; `<meta>`, `<title>` and `<base>` do not. */
const KEPT_HEAD_ELEMENTS = /<(style|script)\b[^>]*>[\s\S]*?<\/\1\s*>|<link\b[^>]*>/gi

/** Whether the code carries a document wrapper `extractVisualCode` would remove. */
export function hasDocumentWrapper(raw: string): boolean {
  return DOCTYPE.test(raw) || HTML_OPEN.test(raw) || BODY_OPEN.test(raw) || /^\s*<head[\s>]/i.test(raw)
}

/**
 * Strip a Markdown fence and a doctype/html/head/body wrapper; return the fragment.
 * Works on partial (still streaming) code: an unclosed wrapper is removed as far as it goes.
 */
export function extractVisualCode(raw: string): string {
  let code = raw
  const fenced = FENCE.exec(code)
  if (fenced !== null) code = fenced[1] ?? ''
  else if (/^\s*```/.test(code)) code = code.replace(/^\s*```[A-Za-z0-9_-]*[^\S\r\n]*\r?\n?/, '')
  if (!hasDocumentWrapper(code)) return code.trim()

  code = code.replace(DOCTYPE, '')
  let kept = ''
  const head = HEAD.exec(code)
  if (head !== null) {
    kept = (head[1] ?? '').match(KEPT_HEAD_ELEMENTS)?.join('\n') ?? ''
    code = code.slice(0, head.index) + code.slice(head.index + head[0].length)
  }
  code = code.replace(HTML_OPEN, '').replace(HTML_CLOSE, '')
  const bodyOpen = BODY_OPEN.exec(code)
  if (bodyOpen !== null) {
    code = code.slice(bodyOpen.index + bodyOpen[0].length)
    const bodyClose = BODY_CLOSE.exec(code)
    if (bodyClose !== null) code = code.slice(0, bodyClose.index)
  }
  return [kept, code.trim()].filter(part => part.length > 0).join('\n')
}
