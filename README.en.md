# DeepSeek Harness Interactive Learning

[中文](README.md)

An independently installable DeepSeek Harness plugin that adds a Learning mode with diagnostic questions, prediction, interaction, and reflection.

Live teaching uses the two-gate `activity@2` protocol:

- `learning_question` sends one current focus and one question, then waits for the learner.
- `learning_reveal` is constructed after the model sees that answer and remains pending until the animation finishes and the learner continues.
- Only then can the model generate the next Question, so future titles, questions, and answers are never preloaded into the Client.

Current-round visuals support parameter relationships, one process state, and structural comparisons. Model-visible payloads use closed schemas; no arbitrary scripts execute, and curves use a restricted mathematical expression format. Question and Reveal Markdown fallbacks obey the same phase boundary. `activity@1` remains only for legacy replay, not new live teaching.

## Interaction order

```text
Question -> learner answer -> model evaluation -> Reveal -> animation complete -> learner continue -> next Question
```

A model step may contain at most one Learning gate. Ordinary explanations do not require a forced question; use native interaction only when the interaction itself improves understanding.

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
```

The standalone package develops against DeepSeek Harness kernel `0.1.0-rc.5`. The portable integration uses its pinned `0.1.0-rc.7` workspace APIs; sync changes file by file while preserving portable callId, Client-module, and release-lifecycle adaptations. Do not overwrite the portable app directory from this repository.

## License

MIT
