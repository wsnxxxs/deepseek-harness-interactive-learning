# DeepSeek Harness Interactive Learning

[中文](README.md)

An independently installable DeepSeek Harness plugin that adds a Learning mode with diagnostic questions, prediction, interaction, and reflection.

It includes three native activities:

- Parameter explorer: predict first, then adjust parameters and inspect curves.
- Process stepper: predict and reveal a process one step at a time.
- Structure compare: align two structures, select important differences, and explain them.

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

This version targets DeepSeek Harness kernel `0.1.0-rc.5` and DeepSeek Harness Desktop `1.3.0`.

## License

MIT
