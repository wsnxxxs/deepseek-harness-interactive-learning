# DeepSeek Harness Interactive Learning

[English](README.en.md)

这是从 DeepSeek Harness Desktop 中独立出来的互动学习插件。安装后会新增一个“学习模式”，通过诊断问题、预测、操作和复盘帮助用户理解概念。

当前提供三种原生互动活动：

- 参数探索：先预测，再拖动参数观察曲线变化。
- 过程步进：按步骤预测并揭示过程。
- 结构对比：对齐两个结构，选择关键差异并解释。

插件不会执行活动中携带的任意脚本。参数曲线使用受限数学表达式，活动也带有 Markdown 降级内容。

## 安装

仓库当前为私有仓库，需要先让 Git 能访问它：

```powershell
gh auth setup-git
dsh plugin --profile web add git+https://github.com/wsnxxxs/deepseek-harness-interactive-learning.git
```

安装学习 preset：

```powershell
& "$env:USERPROFILE\.dsh\profiles\web\node_modules\.bin\dsh-learning-preset.cmd" install
```

重启 DeepSeek Harness，在新会话中选择“学习模式”。

如果设置了 `DSH_HOME`，上面的路径应改为 `$env:DSH_HOME\profiles\web\node_modules\.bin\dsh-learning-preset.cmd`。

## 更新和卸载

更新插件后，再运行一次 preset 安装命令即可同步内置内容。安装器会保留用户已经修改的 preset 文件。

卸载前先切换到其他模式，然后执行：

```powershell
& "$env:USERPROFILE\.dsh\profiles\web\node_modules\.bin\dsh-learning-preset.cmd" uninstall
dsh plugin --profile web remove @dsh-portable/interactive-learning
```

完成后重启 DeepSeek Harness。

## 开发

仓库提交了可直接安装的 `lib/` 构建产物。修改源码时使用 Node.js 22+ 和 pnpm：

```powershell
pnpm install
pnpm run build
pnpm test
pnpm run check
```

核心目录：

- `src/`：Host、Agent、协议和 Web 组件源码。
- `preset/learning/`：学习模式及教学 Skill。
- `cordis.patch.yml`：将 Host broker 挂载到 Web profile。
- `lib/`：GitHub 直装使用的构建产物。

## 兼容性

当前版本针对 DeepSeek Harness kernel `0.1.0-rc.5` 和 DeepSeek Harness Desktop `1.3.0` 验证。

## 许可证

MIT
