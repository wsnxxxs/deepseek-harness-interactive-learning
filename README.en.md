# DeepSeek Harness Interactive Learning

[中文](README.md)

An independently installable DeepSeek Harness plugin that adds an explicitly selected Learning mode. It separates explanation from interaction: a native visual is an exploratory illustration inside an ordinary response, not a form that owns the learner's turn or replaces the normal composer.

## Architecture

- The package root provides the `learningActivities` Host broker and registers the required
  `learning/state` session event; it registers no model-visible tools.
- `./agent` is mounted only by `preset/learning` and exposes immediate `learning_visual`,
  internal `learning_state_update`, and optional `learning_checkpoint` tools.
- `./client` renders visuals and checkpoints inline; state updates have an explicitly empty view.
- `./bootstrap` exports `registerInteractiveLearningSessionCompatibility` so the event type is
  registered before persisted sessions are resumed.
- V1/V2 activities and V3 visuals remain available only for read-only historical replay and are no
  longer exposed by the current Learning preset.

## Non-blocking learning flow

1. The assistant first explains the genuinely missing idea in ordinary prose.
2. When a visual or manipulation materially improves understanding, it calls `learning_visual` once.
3. The closed protocol validates and immediately returns `visual-result@4 { status: "ready" }`; it creates no pending question, submit button, or Reveal turn.
4. The visual renders at the tool call and remains interactive on refresh and historical replay.
5. The assistant continues with the interpretation and can ask one natural question through ordinary conversation.

The old `learning_activity`, `learning_question`, and `learning_reveal` tools remain only as read-only V1/V2 replay support. V3 parameter charts are likewise replay-only and are no longer exposed by the Learning preset.

## Session-scoped LearnerState

Learning stores only a small, tentative teaching state for the current session: the current goal,
shown prerequisites, misconceptions or gaps, scaffolding needs, evaluation context, and evidence of
independent completion or transfer. It is not a cross-session profile, personality model, or long-term mastery record.

Updates must come from concrete observable evidence and are not mechanical per-turn bookkeeping. Each
accepted update appends an identity-free full `learning/state` snapshot; later model steps fold the
durable events and render a bounded 100–300-token dynamic context. Refresh/resume folds the same event
log, fork diverges under a new identity, and reset advances the revision so stale asynchronous results
cannot resurrect old state.

The public root export includes LearnerState types, folding, reset, serialization, and session-event registration APIs:

```ts
import {
  createInitialLearnerState,
  foldLearnerStateSession,
  serializeLearnerStateSnapshot,
} from '@dsh-portable/interactive-learning'
```

## Optional checkpoint protocol v1

`dsh-learning/checkpoint@1` is reserved for a prediction, explanation, contrast, design choice,
debugging diagnosis, boundary case, or transfer application that will materially change the next
teaching move. It is not a per-turn Continue ceremony.

- At most one checkpoint may be pending in a session and at most one distinct checkpoint may be emitted in a model step.
- The five closed kinds are `free_text`, `single_choice`, `numeric`, `prediction`, and `code_slot`; single-choice results use stable option ids.
- Payloads contain only the current prompt, context, expected evidence, answer-free options, and a self-sufficient fallback.
- Terminal statuses are `submitted`, `skipped`, and `cancelled`; call and receipt replays are idempotent, while conflicting reuse fails closed.
- Skip, cancel, timeout, renderer failure, or an unavailable rich Client restores ordinary conversation without Reveal, animation, Continue, or a second wait.

## Semantic Visual Protocol v4

`dsh-learning/visual@4` routes concepts to eight trusted native renderer families:

- `plot` for functions, data, probability, points, lines, bars, and quantitative relationships;
- `node_link` for neural-network layers, trees, processes, causality, and topology;
- `scene_2d` for geometry, vectors, forces, and annotated spatial schematics;
- `relation` for comparisons, matrices, classification, and set membership;
- `timeline` for historical events, discoveries, phases, and eras;
- `formula_steps` for derivations, algebraic transformations, and proof chains;
- `study_map` for anchored sections, prerequisites, and concept roles in reference material;
- `recall_deck` for hinted active-recall cards with local review state.

Every family can include a sequence that focuses only declared objects. Renderers provide a visible title, keyboard operation, responsive layouts, structured text alternatives, and a local error boundary. Interactions include bounded sliders, plot probes, series toggles, node and edge selection, progressive focus, and local review state.

A request to recall a derivative formula is answered with the formula instead of an arbitrary exponent slider. A requested fully connected neural network is rendered with layers, nodes, and every real edge instead of a sigmoid plot or Markdown art.

When a learner supplies a document, PDF, handout, or several sources, the system preserves observed section and page/title anchors, uses `study_map` for an overview when useful, then routes each concept to a more specific visual. It does not flatten a source into one mega-graph or mechanically turn every attachment into flashcards.

All model-visible payloads use closed schemas. Curves accept only a bounded mathematical AST. Unknown fields, undeclared variables, non-finite values, invalid references, cyclic prerequisites, excessive payloads, and invalid ranges are rejected. Model-provided HTML, SVG, Markdown diagrams, and JavaScript never execute.

## Install

The repository is private, so configure GitHub credentials first:

```powershell
gh auth setup-git
dsh plugin --profile web add git+https://github.com/wsnxxxs/deepseek-harness-interactive-learning.git
```

Install the Learning preset:

```powershell
& "$env:USERPROFILE\.dsh\profiles\web\node_modules\.bin\dsh-learning-preset.cmd" install
```

Before constructing the Loader, agent loop, or restoring any configured session, import the bootstrap:

```ts
import '@dsh-portable/interactive-learning/bootstrap'
```

Restart DeepSeek Harness and select Learning mode in a new session. If `DSH_HOME` is set, use its `profiles\web\node_modules\.bin` directory instead.

## Update and uninstall

After updating the plugin, run the preset installer again. It preserves preset files that you changed yourself.

To uninstall, switch active sessions to another mode, then run:

```powershell
& "$env:USERPROFILE\.dsh\profiles\web\node_modules\.bin\dsh-learning-preset.cmd" uninstall
dsh plugin --profile web remove @dsh-portable/interactive-learning
```

Restart DeepSeek Harness afterward.

## Development

The installable `lib/` artifacts are committed. For source changes, use Node.js 22+ and pnpm:

```powershell
pnpm install
pnpm run build
pnpm test
pnpm run check
pnpm run test:package:purity
pnpm run test:package
pnpm run pack:check
git diff --check
```

`pnpm run check` also runs the credential-free deterministic teaching evaluation. The real desktop/web runtime reads package exports from `lib`, so rebuild and fully restart after source changes.

The browser component fixture can be started from the repository root with:

```powershell
pnpm exec vite --config tests/browser/vite.config.mjs
```

Run the offline evaluation alone with:

```powershell
pnpm run eval
```

Package tests check declaration closure, absolute-path purity, tarball installation, public exports, and preset install/upgrade/uninstall lifecycle.

The standalone package targets the current DeepSeek Harness kernel `0.1.0-rc.7`, using the same release family as the portable integration. Its Host composition, Client bundler, and `cordis.patch.yml` remain adapted to the standalone package layout.

## License

MIT
