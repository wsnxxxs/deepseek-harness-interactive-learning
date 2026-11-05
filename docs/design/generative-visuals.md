# Generative visuals (design and handoff)

Status: **designed, not yet implemented.** The committed code still ships the earlier declarative
visuals (`learning_visual_select` + `learning_visual`, 15 renderers in `packages/visual`). This
document is the agreed replacement and the handoff for continuing it; the sources under
[`generative-visuals-wip/`](generative-visuals-wip/) are the first, uncompiled pieces.

## Why

The declarative design (a closed JSON protocol per diagram kind, rendered by our own React
renderers) was judged not good-looking and not useful enough: colour decorated instead of encoding
meaning, every figure carried card chrome and pills, layout and edge routing were home-grown, and a
fixed schema could not express an annotation, a reference line or any chart type nobody anticipated.

The replacement follows the approach of Claude's inline visuals in chat and Cowork
([announcement](https://claude.com/blog/claude-builds-visuals),
[help article](https://support.claude.com/en/articles/13979539-custom-visuals-in-chat-and-cowork)):
the model loads drawing guidance on demand and writes the visual itself as an HTML/SVG fragment,
which the client renders inline in a sandbox with a host design system. Public write-ups of that
feature (for example [pi-generative-ui](https://github.com/Michaelliv/pi-generative-ui)) describe a
`read_me(modules)` + `show_widget` tool pair, progressive rendering while the call streams, scripts
run once at the end, CSS variables that follow light/dark, pre-styled controls, a flat restrained
aesthetic and a `sendPrompt` bridge. We reuse the principles only: the guide text, palette and design
system here are our own, harmonized with DeepSeek Harness' UI.

## Decisions

| Decision | Choice |
|---|---|
| Model surface | Two static tools per agent: `read_visual_guide { modules }` and `show_visual { title, code }` |
| Rendering | `<iframe sandbox="allow-scripts">` + `srcdoc` with its own meta CSP (no `allow-same-origin`); upstream precedent: `ui-sidebar-documentpreview` |
| Libraries | Vendored, lazily loaded client-bundle chunks: Chart.js 4.6.1, D3 7.9.2, Mermaid 11.17.2 (3.5 MB min / 0.98 MB gzip, chosen over 12.x at 5.3 MB), KaTeX 0.19.1, morphdom 2.7.8; no CDN by default (offline, mainland China) |
| Legacy | **No replay of old sessions.** Delete the declarative visuals, Learning's V1–V3 activities, visual@3/@4, `learning_checkpoint_select` replay and the flashcard feedback bridge. Old sessions still open; their old calls show as generic tool rows |
| Learning | Uses the same two tools through `installVisualTools` (show_visual = its one rich move per turn); keeps `learning_checkpoint` and learner state |

## Implementation findings (verified against DSH 0.2.2-rc.1)

* **Host theme.** Dark mode is `body[data-ds-dark-theme]`. Light: text `rgb(15,17,21)`, secondary
  `rgb(97,102,107)`, tertiary `rgb(129,133,140)`, borders `rgba(0,0,0,.04–.16)`, accent
  `rgb(65,118,230)`. Dark: background `rgb(35,35,36)`, text `rgb(249,250,251)`, secondary
  `rgb(207,211,214)`, tertiary `rgb(173,178,184)`, accent `rgb(122,170,255)`. Fonts:
  `--dsw-font-family` (system stack incl. PingFang SC) and `--ds-font-family-code`. Message column:
  `--dsh-chat-content-width` = clamp(680px, 64%, 920px) → design SVG viewBoxes ≈ 680 wide.
* **Body text is 14px** in DSH (`--dsh-content-font-size`), so the frame follows the host size (this
  overrides the 15–16px figure below).
* **Iframe background.** The app sets no page CSP, so a `srcdoc` frame gets only its own meta CSP. Set
  the iframe element's `color-scheme` to the frame mode, otherwise Chromium paints an opaque
  background behind a transparent frame.
* **Package assets are image-only** (`/plugins/<pkg>/assets/` serves `.svg/.png/.webp/.jpg`), so
  libraries ship as lazy JS chunks: the client bundle turns `import()` into `client.<name>.js`
  chunks loaded with `require.async`. Library text needs a `?raw` loader in
  `packages/visual/tsdown.config.ts` (map `lib/types/` importers back to `src/`); Vite/Vitest support
  `?raw` natively. The chart.js and d3 export maps hide `dist/`, so resolve those files explicitly.
  Strip `sourcesContent` from vendor-chunk source maps (`lib/` is committed).
* **Purity gate.** `tests/package-purity.mjs`' Windows-path pattern matches any `scheme://host` text in
  published JS (CSP allowlist strings, vendored sources). Build such strings without a literal
  `://` or exempt vendor chunks explicitly.
* **Follow-up prompts.** A client plugin sends a user message with
  `ctx.sessions.scope(sessionId)?.get('conversation')?.send(text)` (pattern used upstream by
  `client-ui-forge`; contract in `ui-conversation/src/client/service.ts`). The visual client roster
  then needs `@deepseek-ai/dsh-client-ui-conversation` and `@deepseek-ai/dsh-api-session-controller`.
  Links: prefer the host's `useMarkdownDelegate().openExternalLink`, else confirm + `window.open`.
* **Guide budget.** The tool-result pruner trims results above 8,192 characters, but only during
  compaction; keep each module under ~6.5k characters and core under ~3.5k.
* **Guide-first rule.** `generative-visuals-wip/src/host/guide-state.ts` scans the session log for a
  successful `read_visual_guide` result, including code-mode sub-calls, ignores results replaced by
  compaction or cut by the pruner, and remembers reads earlier in the same model step.

## Work in progress files

| Preserved file | Target |
|---|---|
| `generative-visuals-wip/src/identity.ts` | `packages/visual/src/identity.ts` — tool names, guide module ids, limits |
| `generative-visuals-wip/src/index.ts` | `packages/visual/src/index.ts` — cordis plugin entry |
| `generative-visuals-wip/src/host/*` | `packages/visual/src/host/` — static two-tool attach, eligibility (client present, no subagents, `presets`/`excludePresets`, preset-switch re-check, skip agents whose scope already has `show_visual`), guide-first rule, `installVisualTools` |
| `generative-visuals-wip/src/client/frame/*` | `packages/visual/src/client/frame/` — `VisualFrame` contract stub, `extractVisualCode`, CSP |
| `generative-visuals-wip/cordis.patch.yml` | `packages/visual/cordis.patch.yml` |

They were written against the design below and have not been compiled; `host/tools.ts` imports
`visualGuide(modules, { includeCore })` from a `src/guide/index.ts` that does not exist yet.

## Next steps

1. Delete the declarative system in `packages/visual` (renderers, protocol, their tests) and restore
   the WIP files; keep `src/client/markdown.tsx` and `src/client/tokens.*` (host-side chrome).
2. Build the frame runtime and design system (§4, §5), the guide modules (§3) and the vendored chunks.
3. Write the client views (§6) and tests; update the package manifest, bundle patch, purity and
   tarball lifecycle tests.
4. In Learning, delete the legacy-replay code (§9), integrate `installVisualTools`, rewrite the
   Skill's visual references, and update policy/route text, eval and tests.
5. Gallery + light/dark screenshots, README update, full `pnpm test`.

## 1. Product principles

1. Seamless: a visual looks like part of the DSH conversation — host fonts, host light/dark, transparent
   background, hairline borders, no chrome around it beyond a quiet hover toolbar.
2. Flat and restrained: no gradients, shadows, blur, glow or emoji; two font weights (regular/medium);
   sentence case; colour encodes meaning (2–3 ramps per visual, gray for structure).
3. Useful: anything HTML/SVG/JS can draw — diagrams, charts, interactive explainers with sliders,
   simulations, UI mockups, math — with first-class, pre-themed libraries so the default output looks good.
4. Text in the reply, visuals in the tool: the visual carries only the picture; explanation stays in prose.
5. Works offline and in mainland China: libraries are vendored into the plugin (lazy chunks), never
   fetched from a CDN by default.
6. Safe by construction: model code runs only inside an opaque-origin sandbox with a strict CSP and no
   network beyond an allowlist; every bridge call is validated and user-gesture-gated.
7. Cache-friendly: two small static tools per agent; the long guidance arrives as append-only tool results.

## 2. Model-facing tools (two, static, attached per agent)

* `read_visual_guide` — params: `modules` (array, required) of enum
  `diagram | chart | interactive | ui | math`, each with a one-line summary in the parameter
  description. Returns the core rules (first call in a session only) plus the requested modules.
  Description intent: load the drawing guide before the first `show_visual` of a conversation, and
  again for a module not yet loaded.
* `show_visual` — params: `title` (required; short, sentence case; used as the accessible name and
  in the UI) and `code` (required; one SVG element or an HTML fragment — no doctype/html/head/body).
  Description intent: draw a diagram, chart, interactive explainer or mockup inline, shown to the
  user while it is written; use when seeing a structure, process, quantity or behaviour explains it
  better than prose; keep explanations in the reply.
* Host behaviour of `show_visual`: reject (actionable error) when no `read_visual_guide` result exists
  in the session yet ("Load the guide first: call read_visual_guide with the modules you need");
  cap `code` at 256 KiB and `title` at 120 chars; strip nothing silently except a leading doctype/html
  wrapper (normalize to the fragment and say so in the result); result text: shown →
  `Shown to the user inline. Continue in prose; don't repeat what the visual shows.`; no visual
  client → `Not shown: this session can't display visuals. Explain it in text instead.`
* Final wording follows agent-experience (behaviour not implementation, each fact once, parameter
  rules on parameters). Measure tokens: both tools together should stay ≈ 250–400 tokens.
* Learning registers the same two tools in its preset scope through `installVisualTools` (§7).

## 3. Guide modules (model-facing, original text)

`packages/visual/src/guide/` — `core` (always included on a session's first call), `diagram`,
`chart`, `interactive`, `ui`, `math`. Budgets (hard, tested): core ≤ 3,500 chars; each module ≤
6,500 chars (the upstream tool-result pruner trims results above 8,192 chars during compaction).
Content: precise, numeric, imperative rules about THIS runtime (variables, classes, `lib:` scripts,
`dsh` API, streaming order, sizing), layout math for diagrams (box sizing from text length, spacing,
arrow clearance, tier packing, when to split), chart conventions (pre-themed Chart.js, legends,
axes, number formatting, annotation), interactive patterns (controls, live update, steppers instead of
hidden tabs, rounding, reduced motion, when to use `dsh.sendPrompt`), UI mockups (cards, metric tiles,
grids, forms), math (KaTeX, plotting, geometry, vectors), routing (which form for which request, e.g.
ER/class/sequence/state/gantt → Mermaid; small structural diagram → hand SVG), restraint (when not to
draw; complexity budget; split overview + detail). Each module ends with one short exemplary snippet.

## 4. Frame runtime   — `packages/visual/src/client/frame/`

* `<iframe sandbox="allow-scripts">` (never `allow-same-origin`, popups, top-navigation, forms,
  modals) with `srcdoc` = our document: `<meta http-equiv="Content-Security-Policy">`
  (`default-src 'none'; script-src 'unsafe-inline' <cdn allowlist>; style-src 'unsafe-inline' <cdn>;
  img-src data: blob: <cdn>; font-src data: <cdn>; media-src data: blob:; connect-src 'none';
  frame-src 'none'; form-action 'none'; base-uri 'none'`), the design-system stylesheet, the
  bootstrap script, an empty root. Upstream precedent: packages/client/ui-sidebar-documentpreview
  (`sandbox="allow-scripts"`, meta CSP). Verify CSP inheritance in a real browser (Playwright).
* Bootstrap protocol (postMessage, both directions validated: parent checks `event.source ===
  iframe.contentWindow`; frame accepts only messages from `parent`): parent→frame `render {html,
  final}`, `theme {vars, mode}`; frame→parent `ready`, `size {height}`, `sendPrompt {text}`,
  `openLink {url}`, `error {message}`.
* Streaming: while the tool call streams, the view sends throttled (~8/s) non-final renders of the
  partial `code`; the frame parses it into a template, strips `<script>` elements, and morphs the live
  DOM (small vendored DOM-diff, keyed by position; fade-in new nodes unless reduced motion). The final
  render applies the complete markup, then executes scripts once, in order (external `lib:` first,
  awaiting load). Replay after reload = one final render.
* Libraries: vendored, MIT/ISC, loaded lazily as client-bundle chunks containing the library source,
  injected into the frame on demand. `<script src="lib:chart">` (Chart.js 4), `lib:d3` (D3 7),
  `lib:mermaid` (Mermaid 11), `lib:katex` (KaTeX + CSS with fonts inlined as data URIs). Also rewrite
  well-known CDN URLs for these libraries (jsdelivr/cdnjs/unpkg/esm.sh/npmmirror patterns) to the
  vendored copies. Unknown external scripts load only from the CSP allowlist (default:
  cdn.jsdelivr.net, cdnjs.cloudflare.com, unpkg.com, esm.sh, registry.npmmirror.com) and fail quietly
  offline. Pre-theme libraries on load: Chart.js defaults (font, colours, grid, tooltip) from the
  resolved theme; Mermaid initialized with a theme built from our tokens and auto-run on `.mermaid`
  blocks; KaTeX auto-render for `$…$`/`\(…\)` in elements marked `data-math` (or documented helper).
  Add THIRD_PARTY_NOTICES for vendored code.
* `window.dsh` API (document in core guide): `dsh.sendPrompt(text)` (alias `sendPrompt`),
  `dsh.openLink(url)`, `dsh.theme` (resolved tokens incl. `mode`), `dsh.onTheme(cb)`,
  `dsh.color(ramp, stop)`. Bridge rules (parent side): sendPrompt requires transient user activation
  in the parent (`navigator.userActivation.isActive` — activation propagates from the child frame),
  text ≤ 2,000 chars, ≥ 1 s between sends; openLink requires activation, http(s) only, confirmation,
  `noopener`.
* Sizing: frame reports content height via ResizeObserver; parent sets iframe height (min 32px,
  max 2,400px); no internal scrolling by default; width = the message column.
* Theme: the parent resolves DSH host theme (mode + font stacks + key colours) from the live host
  (computed styles / theme attribute, see src/client/tokens.module.css host aliases) and pushes it on
  ready and on change (MutationObserver/matchMedia); the frame maps it onto our variables.
* Errors: uncaught errors and library load failures post `error`; the view shows a quiet inline notice
  with "show code" — never a blank box.
* Exported contract: `packages/visual/src/client/frame/index.ts` exports
  `VisualFrame` with props `{ code: string; title: string; final: boolean; onSendPrompt?(text: string):
  void | Promise<void>; onOpenLink?(url: string): void; onError?(message: string): void;
  className?: string }` and `extractVisualCode(raw: string): string` (normalize a fragment: strip a
  doctype/html/head/body wrapper). It also exports `visualDocumentFor(...)` for tests and downloads.

## 5. Design system  — `packages/visual/src/client/frame/design/`

Original palette: ~8 ramps × 7 stops (50…900) tuned to sit next to DSH's own UI, plus semantic
info/success/warning/danger; CSS variables for backgrounds, text, borders (hairline 0.5–1px),
radii, spacing, font stacks (host's), a type scale (≥ 11px; body 15–16px; headings in medium weight),
light and dark values switched by `data-mode`. Element defaults that look right with zero styling:
text, headings, links, buttons, inputs, range sliders, selects, checkboxes, small tables (if any),
code; SVG helper classes for fills/strokes/text per ramp + structural gray, arrow markers available by
id (`#dsh-arrow`), `dominant-baseline`/text classes. `prefers-reduced-motion` respected globally.
Everything is transparent at the root so the host background shows through.

## 6. Plugin plumbing 

* Host: reuse `host/plugin.ts` eligibility (client composed, subagent skip, presets/excludePresets,
  preset-switch re-check, skip agents whose scope already resolves `show_visual`), but attach the two
  STATIC tools per agent (no selector, no dynamic per-kind registration, no restore machinery).
  `installVisualTools(ctx, { onShown?(exec), clientAvailable?() })` for presets (Learning).
  Config: `presets`, `excludePresets`, `subagents` (drop `kinds`).
* Client: keyed tool views for `show_visual` (VisualFrame; preparing → streaming with the partial
  `code`, start/result → final; hover toolbar: copy code, download `.html`/`.svg`; not-shown / invalid
  / not-loaded states) and `read_visual_guide` (quiet one-line chip: "Loaded drawing guide: diagram,
  chart"). `onSendPrompt` → `ctx.conversation.send(text)` in the session scope
  (upstream packages/client/ui-conversation/src/client/service.ts `IConversation.send`); add the
  needed inject. `onOpenLink` → host link handling if one exists, else confirm + `window.open(url,
  '_blank', 'noopener')`. zh/en locale. Keep `dshVisualViews.extend` but simplify to what Learning
  needs (`match`, optional `labels`, optional `onShown`).
* Remove the declarative visual system entirely (see §9).
* Packaging: deps for vendored libs (chart.js, d3, mermaid, katex) as devDependencies (inlined into
  lazy chunks), lifecycle + purity tests updated (lazy chunks present, no runtime CDN use).

## 7. Learning integration

Learning installs the same two tools via `installVisualTools` (onShown → recordVisual; client check
→ broker), counts `show_visual` as its one rich move per turn, rewrites its skill's visual
references to teach WHEN/WHAT to draw pedagogically (the visual guide teaches HOW), registers
fallback views at +10 (they render only when the standalone visual client is absent). There is no legacy replay (§9).

## 8. QA

* A gallery page (packages/visual/tests/browser) of ~12 realistic widgets written exactly as the
  model would following the guides (architecture diagram, flowchart, Mermaid sequence + ER, Chart.js
  bar/line with annotation, dashboard tiles, slider explainer, physics/algorithm simulation, math with
  KaTeX + plot, D3 force graph), Playwright screenshots in light and dark at deviceScaleFactor 2 for
  the README (save under packages/visual/docs/images/), checks for console errors and CSP violations.
* Frame tests: jsdom tests for document building/CSP/bootstrap message validation/streaming morph/script
  execution order; guide budget tests. Plugin tests: host tools (guide-first rule, caps, results,
  eligibility), views (phases, bridges gated, toolbar), lifecycle.

## 9. No legacy replay

The user decided old sessions do not need replay support: delete the declarative visual system and
every Learning legacy-replay path outright. Old sessions still open; their old tool calls render with
the generic tool row.

* packages/visual: delete src/client/visuals/** (all declarative renderers, layouts, state,
  styles, labels, shell), src/protocol/** and the `./protocol` export, tests visual-*.spec*,
  visual-corpus*, fixtures catalog; The gallery shows only generative widgets. KEEP src/client/markdown.tsx and
  src/client/tokens.ts/.module.css (host-side chrome helpers used by the visual views and by Learning's
  checkpoint card) and export them from `./react`.
* Learning (root): delete V1–V3 activities, the visual@3/@4 protocols and their replay views,
  `learning_visual_select`/`learning_visual` tools, `learning_checkpoint_select` replay, the recall
  deck/flashcard feedback bridge (src/recall-feedback.ts, broker /api route, client bridge),
  src/math-expression.ts, the legacy V2 replay eval grader, and their tests. Keep `learning_checkpoint`
  (current), learner state, policy, routing, eval of current behaviour. Then integrate
  `installVisualTools` (§7).
