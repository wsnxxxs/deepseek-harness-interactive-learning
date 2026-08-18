# DeepSeek Harness Interactive Learning

[English](README.en.md)

这是从 DeepSeek Harness Desktop 中独立出来的互动学习插件。安装后会新增一个“学习模式”，通过诊断问题、预测、操作和复盘帮助用户理解概念。

实时教学采用 `activity@2` 的双门控协议：

- `learning_question` 每次只发送当前焦点和一个问题，并等待学习者回答。
- `learning_reveal` 在模型看到回答后发送本轮反馈；动画完成且用户点击继续后才返回。
- 下一轮问题只能在 Reveal 返回之后生成，因此不会把未来标题、问题或答案预装到客户端。

当前视觉支持参数关系、单个过程状态和结构对比。所有模型可见 payload 都使用闭合 schema；插件不会执行任意脚本，参数曲线只接受受限数学表达式。Question 与 Reveal 的 Markdown 降级内容也分别受同一阶段边界约束。`activity@1` 仅保留用于旧会话的兼容回放，不用于新的实时教学。

## 交互顺序

```text
Question → 用户回答 → 模型评价 → Reveal → 动画完成 → 用户继续 → 下一 Question
```

一个模型 step 最多包含一个 Learning gate。普通解释不必强行提问；只有交互本身能改善理解时才使用原生活动。

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

独立包的开发依赖针对 DeepSeek Harness kernel `0.1.0-rc.5`。portable 集成使用其固定的 `0.1.0-rc.7` workspace API；同步时必须逐文件合并并保留 portable 的 callId、客户端模块和发布生命周期适配，不能用独立仓库整目录覆盖。

## 许可证

MIT
