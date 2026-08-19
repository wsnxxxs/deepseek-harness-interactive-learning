# DeepSeek Harness Interactive Learning

[English](README.en.md)

这是从 DeepSeek Harness Desktop 中独立出来的互动学习插件。安装后会新增一个由用户显式选择的“学习模式”。它把解释和交互解耦：原生视觉是普通回答中的可操作插图，不会接管用户回合或替代正常输入框。

## 架构

- 包根提供 `learningActivities` Host broker，并注册 `learning/state` session event；它不注册模型可见工具。
- `./agent` 只由 `preset/learning` 挂载，提供即时的 `learning_visual`、内部的
  `learning_state_update` 和可选的 `learning_checkpoint`。
- `./client` 在工具调用位置渲染 visual 与 checkpoint；state update 明确为空视图。
- `./bootstrap` 提供 `registerInteractiveLearningSessionCompatibility`，用于在恢复持久化 session 之前注册事件类型。
- V1/V2 activity 和 V3 visual 仅保留只读历史回放兼容，不再暴露给当前 Learning preset。

## 非阻塞学习流程

1. 助手先用普通文本讲清真正缺失的概念。
2. 只有在图形或操控确实能改善理解时，才调用一次 `learning_visual`。
3. 参数流式传输期间，工具调用位置显示正在准备的视觉标题，而不是一句笼统的等待提示。
4. 封闭协议校验后立即返回 `visual-result@4`，不创建等待中的问题、提交按钮或 Reveal 回合。
   结果区分 `ready` 与 `unavailable`：当前组合若没有 Learning Client，视觉不会渲染，助手改用普通文字讲清同一件事，并且不会提到学习者看不到的图。未渲染的视觉也不会被记成一次已发生的教学动作。
5. 图例在工具调用位置渲染，刷新和历史回放后仍可操作。
6. 助手继续解释关键现象；必要时通过普通对话提出一个自然问题。

旧 `learning_activity`、`learning_question` 和 `learning_reveal` 仅保留为 V1/V2 历史会话的只读兼容回放。V3 参数图同样只用于历史回放，Learning preset 不再向模型暴露旧工具。

## Session-scoped LearnerState

Learning 只为当前 session 保存小型、暂定的教学状态：当前目标、已展示的先验、误解或缺口、支架需求、
评估语境以及独立完成或迁移的证据。状态不是跨 session 用户画像、人格或长期掌握度。

状态更新必须来自具体可观察证据，不能机械地每轮调用。有效更新会追加去除 session identity 的完整
`learning/state` 快照；后续 model step 会重新 fold 持久事件并生成有界的 100–300 token 动态上下文。
refresh/resume 使用同一事件日志，fork 会独立分叉，reset 会推进 revision，避免旧异步结果复活旧状态。

公共入口同时导出 LearnerState 类型、折叠、重置、序列化和 session-event 注册 API：

```ts
import {
  createInitialLearnerState,
  foldLearnerStateSession,
  serializeLearnerStateSnapshot,
} from '@dsh-portable/interactive-learning'
```

教学动作按学习者真正暴露的失败类型路由，而不是按最有趣的解释路由：概念缺口讲想法本身而不是步骤配方；程序缺口给一个真正不同的平行例题而不是概念综述；记号缺口把符号、术语和约定拆开讲而不是重新推导；任务模型缺口先把题目要交付的东西讲清楚再谈方法；先修缺口先补上缺的规则。答一个学习者并不存在的缺口，无论内容多正确都像是没在听。

## Session 内学习路线

多数学习片段不需要路线：一个概念、一次直接回答或一处纠正本身就是完整的。只有当目标确实跨越几个互相依赖的步骤时（多章节材料、有真实先修的过程、学习者自己提出的多部分目标），才会记录一条路线。

路线随 LearnerState 存活于当前 session，同样是可修订的假设而不是契约：

- 最多 6 个步骤，状态只有 `pending`、`active`、`evidenced`，任何时刻至多一个 `active`。
- 步骤只能由学习者产生的证据推进，不能因为"讲过了"就标记完成。
- 修订路线会保留同一步骤 id 上已经取得的 `evidenced`，不会抹掉已证明的进展。
- 注入模型的上下文只包含目标和当前这一步，不列出整张清单——路线因此无法被当成待办事项逐条推进。
- 已展示迁移即结束该学习片段，无论路线还剩几步；未走完的路线永远不是继续的理由。
- reset 会连同路线一起清空。

## 可选 Checkpoint Protocol v1

`dsh-learning/checkpoint@1` 只用于会实质改变下一教学动作的预测、解释、对比、设计选择、调试诊断、边界情况或迁移应用，不是每轮 Continue 仪式。

- 每个 session 最多一个 pending checkpoint，每个 model step 最多一个不同 checkpoint。
- 类型为 `free_text`、`single_choice`、`numeric`、`prediction` 和 `code_slot`；单选结果使用稳定 option id。
- 卡片标题显示这次要求的认知动作（预测、解释、对比、迁移或尝试），而不是“检查点”这类内部机制标签。
- payload 只能包含当前 prompt、context、expected evidence、无答案 options 和自洽 fallback。
- 终态只有 `submitted`、`skipped`、`cancelled`；call 和 receipt 重放幂等，冲突复用 fail closed。
- skip、cancel、timeout、renderer failure 或无 rich Client 都恢复普通对话，不产生 Reveal、animation、Continue 或第二次等待。

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

通过 schema 校验的载荷一定会渲染成对应图形，不会退化成 Markdown、描述文字或错误框。如果某条曲线在声明的坐标范围内没有任何取值（例如负数域上的 `log`、`sqrt`，或整条曲线落在 y 轴范围之外），图表仍然照常绘制，并在空白处直接说明"当前坐标范围内没有可显示的数值"，同时在图例中标出该系列，而不是留给学习者一个看起来坏掉的空框。

所有模型可见 payload 都使用闭合 schema。曲线仅接受受限数学 AST；未知字段、未声明变量、非有限数值、无效引用、循环先修关系、过大载荷和非法范围都会被拒绝。模型提供的 HTML、SVG、Markdown 图或 JavaScript 永远不会执行。

## 设计系统与可访问性

所有学习界面共用一套设计令牌，声明在 `src/client/tokens.module.css` 的 `[data-learning-scope]` 上。两个 CSS Module 会被编译成各自独立的 `<style>` 标签，无法通过 class 共享样式，因此共享值以自定义属性的形式继承下去；每个根组件通过 `learningScope` 加上该属性即可加入同一套标准。

令牌覆盖字号阶、间距阶、圆角、层级阴影、控件尺寸、动效时长，以及唯一的主色、语义色板与焦点环。两份样式表因此不再出现裸字号、裸圆角或直接引用的主机别名。每个主机别名在令牌层内都带降级值，主题若缺少某个别名，界面会退化为可用颜色而不是失效声明。

视觉渲染器面向键盘与辅助技术：

- 一张图形只占一个 Tab 停靠点。`node_link` 最多可声明 48 个节点与 160 条连线，`scene_2d` 最多 64 个图元；进入图形后用 ← → 在图元间移动，Home / End 跳到首尾，Enter 或 Space 选中。
- 图表探针的读数写入 `aria-live` 区域，键盘探查因此会被朗读；按 Escape 清除。
- 图形的可访问名称只是一句摘要，完整的结构化文字替代作为可读内容存在，便于逐条浏览而不是被当成一长串名称念出。
- 焦点环、动效时长与减弱动效偏好都由令牌层统一提供。

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

在构造 Loader、agent loop 或恢复任何 configured session 之前，先导入 bootstrap：

```ts
import '@dsh-portable/interactive-learning/bootstrap'
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
pnpm run test:package:purity
pnpm run test:package
pnpm run pack:check
git diff --check
```

`pnpm run check` 也会执行无凭证的确定性教学评估。真实桌面/Web 通过 package exports 读取 `lib`，所以源码修改后必须重新构建并完整重启应用。

浏览器组件 fixture 可用仓库根目录命令启动：

```powershell
pnpm exec vite --config tests/browser/vite.config.mjs
```

无凭证评估可单独运行：

```powershell
pnpm run eval
```

包级测试会检查声明闭包、绝对路径纯度、tarball 安装、公共导出以及 preset 安装/升级/卸载生命周期。

核心目录：

- `src/`：Host、Agent、协议和 Web 组件源码。
- `src/client/tokens.module.css`：全部学习界面共用的设计令牌。
- `preset/learning/`：学习模式及教学 Skill。
- `cordis.patch.yml`：将 Host broker 挂载到 Web profile。
- `lib/`：GitHub 直装使用的构建产物。

## 兼容性

独立包面向当前 DeepSeek Harness kernel `0.1.0-rc.7`，开发依赖与 portable 集成使用同一版本族。仓库自身的 Host 组成、Client 打包器和 `cordis.patch.yml` 仍按独立安装包目录布局维护。

## 许可证

MIT
