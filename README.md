# DeepSeek Harness Interactive Learning

[English](README.en.md)

这是从 DeepSeek Harness Desktop 中独立出来的互动学习插件。安装后会新增一个由用户显式选择的“学习模式”。它把解释和交互解耦：原生视觉是普通回答中的可操作插图，不会接管用户回合或替代正常输入框。

## 非阻塞学习流程

1. 助手先用普通文本讲清真正缺失的概念。
2. 只有在图形或操控确实能改善理解时，才调用一次 `learning_visual`。
3. 封闭协议校验后立即返回 `visual-result@4 { status: "ready" }`，不创建等待中的问题、提交按钮或 Reveal 回合。
4. 图例在工具调用位置渲染，刷新和历史回放后仍可操作。
5. 助手继续解释关键现象；必要时通过普通对话提出一个自然问题。

旧 `learning_activity`、`learning_question` 和 `learning_reveal` 仅保留为 V1/V2 历史会话的只读兼容回放。V3 参数图同样只用于历史回放，Learning preset 不再向模型暴露旧工具。

## Semantic Visual Protocol v4

`dsh-learning/visual@4` 会按概念语义选择八类可信原生渲染器：

- `plot`：函数、数据、概率、折线、散点、柱形和其他定量关系；
- `node_link`：神经网络层、树、流程、因果关系和连接拓扑；
- `scene_2d`：几何、向量、力与带标注的空间示意；
- `relation`：对比、矩阵、分类与集合关系；
- `timeline`：历史事件、发现过程、阶段和年代；
- `formula_steps`：公式推导、代数变换与逐步证明；
- `study_map`：带章节或页码锚点、先修关系和概念角色的材料导览；
- `recall_deck`：带提示、揭示和本地复习状态的主动回忆卡片。

每类视觉都可以添加仅聚焦已声明对象的步骤序列，并提供可见标题、键盘操作、响应式布局、结构化文字替代和局部错误边界。图表交互包含有界滑块、探针、系列开关、节点与连线选择、逐步聚焦以及本地复习状态。

单纯回忆求导公式会直接显示公式，不会机械生成指数滑块；请求全连接神经网络时会显示分层节点和全部真实连线，不会替换成 sigmoid 曲线或 Markdown 字符画。

当用户提供文档、PDF、讲义或多份参考材料时，系统会保留真实章节及页码/标题锚点，按需先用 `study_map` 提供总览，再为每个概念选择更具体的视觉。它不会把整份材料压成一张巨型关系图，也不会未经请求自动转换成卡片。

所有模型可见 payload 都使用闭合 schema。曲线仅接受受限数学 AST；未知字段、未声明变量、非有限数值、无效引用、循环先修关系、过大载荷和非法范围都会被拒绝。模型提供的 HTML、SVG、Markdown 图或 JavaScript 永远不会执行。

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

`pnpm run check` 也会执行无凭证的确定性教学评估。真实桌面/Web 通过 package exports 读取 `lib`，所以源码修改后必须重新构建并完整重启应用。

核心目录：

- `src/`：Host、Agent、协议和 Web 组件源码。
- `preset/learning/`：学习模式及教学 Skill。
- `cordis.patch.yml`：将 Host broker 挂载到 Web profile。
- `lib/`：GitHub 直装使用的构建产物。

## 兼容性

独立包面向当前 DeepSeek Harness kernel `0.1.0-rc.7`，开发依赖与 portable 集成使用同一版本族。仓库自身的 Host 组成、Client 打包器和 `cordis.patch.yml` 仍按独立安装包目录布局维护。

## 许可证

MIT
