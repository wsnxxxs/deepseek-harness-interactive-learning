import { Component, createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { MarkdownText } from "@deepseek-ai/dsh-client-ui-primitives";
//#region \0dsh-css:src/client/tokens.module.css.mjs
const css$13 = "[data-visual-scope]{--lx-text-micro:11px;--lx-leading-micro:16px;--lx-text-2xs:12px;--lx-leading-2xs:17px;--lx-text-xs:13px;--lx-leading-xs:20px;--lx-text-sm:14px;--lx-leading-sm:21px;--lx-text-base:15px;--lx-leading-base:23px;--lx-text-md:16px;--lx-leading-md:25px;--lx-text-lg:18px;--lx-leading-lg:27px;--lx-text-xl:clamp(18px, 4cqi, 22px);--lx-leading-xl:1.5;--lx-text-formula:clamp(16px, 3cqi, 20px);--lx-leading-formula:27px;--lx-weight-regular:400;--lx-weight-medium:550;--lx-weight-strong:650;--lx-tracking-eyebrow:.08em;--lx-font-mono:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Consolas, monospace);--lx-space-3xs:2px;--lx-space-2xs:4px;--lx-space-xs:6px;--lx-space-sm:8px;--lx-space-md:10px;--lx-space-lg:12px;--lx-space-xl:16px;--lx-space-2xl:20px;--lx-space-3xl:24px;--lx-radius-xs:6px;--lx-radius-sm:8px;--lx-radius-md:10px;--lx-radius-lg:12px;--lx-radius-xl:16px;--lx-radius-pill:999px;--lx-radius-circle:50%;--lx-host-bg:var(--dsw-alias-bg-layer-1,Canvas);--lx-host-label:var(--dsw-alias-label-primary,CanvasText);--lx-host-accent:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary,#2f73ea));--lx-host-accent-soft:var(--dsw-alias-state-business-tertiary,color-mix(in srgb, var(--lx-host-accent) 14%, transparent));--lx-surface-base:var(--lx-host-bg);--lx-surface-card:color-mix(in srgb, var(--lx-host-bg) 96%, transparent);--lx-surface-raised:color-mix(in srgb, var(--lx-host-bg) 88%, var(--lx-host-label) 3%);--lx-surface-sunken:color-mix(in srgb, var(--lx-host-label) 3.5%, var(--lx-host-bg));--lx-surface-accent:color-mix(in srgb, var(--lx-host-accent-soft) 30%, transparent);--lx-border-subtle:var(--dsw-alias-border-l1,color-mix(in srgb, var(--lx-host-label) 12%, transparent));--lx-border-default:var(--dsw-alias-border-l2,color-mix(in srgb, var(--lx-host-label) 18%, transparent));--lx-border-strong:var(--dsw-alias-border-l3,color-mix(in srgb, var(--lx-host-label) 28%, transparent));--lx-border-strongest:var(--dsw-alias-border-l4,color-mix(in srgb, var(--lx-host-label) 38%, transparent));--lx-label-primary:var(--lx-host-label);--lx-label-secondary:var(--dsw-alias-label-secondary,color-mix(in srgb, var(--lx-host-label) 76%, transparent));--lx-label-tertiary:var(--dsw-alias-label-tertiary,color-mix(in srgb, var(--lx-host-label) 58%, transparent));--lx-label-on-accent:var(--dsw-alias-label-on-primary,white);--lx-accent:var(--lx-host-accent);--lx-accent-soft:var(--lx-host-accent-soft);--lx-success:var(--dsw-alias-state-success-primary,#2f9e5f);--lx-warn:var(--dsw-alias-state-warn-primary,#d1741f);--lx-danger:var(--dsw-alias-state-error-primary,#df4f4f);--lx-label-error:var(--dsw-alias-label-error,var(--lx-danger));--lx-label-inverted:var(--dsw-alias-label-primary-inverted,var(--lx-surface-base));--lx-card-border:1px solid var(--lx-border-default);--lx-card-radius:var(--lx-radius-xl);--lx-card-padding:clamp(16px, 2.8cqi, 22px);--lx-card-background:var(--lx-surface-card);--lx-shadow-sm:0 1px 3px color-mix(in srgb, var(--lx-host-label) 6%, transparent), 0 1px 2px color-mix(in srgb, var(--lx-host-label) 4%, transparent);--lx-shadow-md:0 4px 12px -2px color-mix(in srgb, var(--lx-host-label) 8%, transparent), 0 2px 6px -1px color-mix(in srgb, var(--lx-host-label) 4%, transparent);--lx-shadow-lg:0 10px 24px -4px color-mix(in srgb, var(--lx-host-label) 10%, transparent), 0 4px 10px -2px color-mix(in srgb, var(--lx-host-label) 5%, transparent);--lx-focus-color:var(--lx-accent);--lx-focus-width:2px;--lx-focus-offset:3px;--lx-control-height-sm:30px;--lx-control-height-md:34px;--lx-control-padding-sm:var(--lx-space-2xs) var(--lx-space-md);--lx-control-padding-md:var(--lx-space-xs) var(--lx-space-lg);--lx-control-disabled-opacity:.42;--lx-motion-fast:.14s;--lx-motion-base:.2s;--lx-easing:cubic-bezier(.16, 1, .3, 1);--lx-spring-easing:cubic-bezier(.16, 1, .3, 1);--lx-tone-blue:var(--lx-accent);--lx-tone-green:var(--lx-success);--lx-tone-red:var(--lx-danger);--lx-tone-orange:var(--lx-warn);--lx-tone-purple:color-mix(in srgb, var(--lx-accent) 58%, var(--lx-danger));--lx-tone-gray:var(--dsw-alias-label-tertiary,color-mix(in srgb, var(--lx-host-label) 58%, transparent));--visual-tone:var(--lx-tone-blue);--visual-tone-glow:color-mix(in srgb, var(--visual-tone) 24%, transparent);--lx-vs-alpha:1;--lx-vs-ring:0;--lx-vs-lift:0}[data-visual-scope] [data-visual-state]{--lx-vs-alpha:1;--lx-vs-ring:0;--lx-vs-lift:0}[data-visual-scope] [data-visual-state=current]{--lx-vs-alpha:1;--lx-vs-ring:1;--lx-vs-lift:1}[data-visual-scope] [data-visual-state=selected]{--lx-vs-alpha:1;--lx-vs-ring:1}[data-visual-scope] [data-visual-state=related]{--lx-vs-alpha:.92}[data-visual-scope] [data-visual-state=visited]{--lx-vs-alpha:.78}[data-visual-scope] [data-visual-state=context]{--lx-vs-alpha:.62}[data-visual-scope] [data-visual-state=inactive]{--lx-vs-alpha:.55}[data-visual-scope] [data-visual-state=disabled]{--lx-vs-alpha:.38;pointer-events:none}[data-visual-scope] [data-tone=blue]{--visual-tone:var(--lx-tone-blue)}[data-visual-scope] [data-tone=green]{--visual-tone:var(--lx-tone-green)}[data-visual-scope] [data-tone=red]{--visual-tone:var(--lx-tone-red)}[data-visual-scope] [data-tone=orange]{--visual-tone:var(--lx-tone-orange)}[data-visual-scope] [data-tone=purple]{--visual-tone:var(--lx-tone-purple)}[data-visual-scope] [data-tone=gray]{--visual-tone:var(--lx-tone-gray)}[data-visual-scope] :focus-visible{outline:var(--lx-focus-width) solid var(--lx-focus-color);outline-offset:var(--lx-focus-offset)}@media (prefers-reduced-motion:reduce){[data-visual-scope]{--lx-motion-fast:0s;--lx-motion-base:0s}}@media (forced-colors:active){[data-visual-scope] [data-visual-state],[data-visual-scope] [data-visual-state=disabled]{--lx-vs-alpha:1}}";
const tagId$13 = "@dsh-portable/visual/tokens.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$13) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$13;
	tag.textContent = css$13;
	document.head.appendChild(tag);
}
//#endregion
//#region src/client/tokens.ts
const visualScope = { "data-visual-scope": "" };
//#endregion
//#region src/client/visuals/core/labels.ts
/**
* Every model-independent string the visual renderers show.
*
* The Host supplies these through the plugin locale; the defaults here keep the
* renderers usable in isolation (tests, the browser fixture) without forking the
* wording.
*/
const DEFAULT_VISUAL_LABELS = {
	eyebrow: "交互可视化",
	errorTitle: "视觉组件暂时无法显示",
	errorContinue: "你仍可继续阅读上下文。",
	sequenceLabel: "视觉讲解步骤",
	previousStep: "上一步",
	nextStep: "下一步",
	reset: "重置",
	chartProbeHint: "图表，按左右方向键开始探查数值",
	metricsLabel: "当前指标",
	legendLabel: "图例与系列显示",
	plotInteractionHint: "鼠标移入图表可探查数值；键盘聚焦图表后可用 ← → 移动。",
	noValuesInRange: "当前坐标范围内没有可显示的数值。",
	seriesOutOfRange: "不在范围内",
	nodeLinkSummary: "{nodes} 个节点，{edges} 条连线。",
	connection: "{from} 到 {to}",
	layerLabel: "第 {index} 层",
	edgeLabel: "连线",
	nodeLinkInteractionHint: "选择节点或连线查看解释；键盘按 Tab 进入图形，再用 ← → 移动、Enter 选择。",
	nodeKind: "节点",
	edgeKind: "连线",
	noDetail: "暂无补充说明。",
	closeDetail: "关闭详细说明",
	elementFallback: "图元 {id}",
	sceneSummary: "二维场景，{elements} 个图元。{labels}",
	sceneInteractionHint: "选择图中的点、线或形状查看说明；键盘按 Tab 进入图形，再用 ← → 移动、Enter 选择。",
	elementKind: "图元",
	comparisonCaption: "特征对比表",
	comparisonDimension: "对比维度",
	comparisonSubject: "对比对象",
	comparisonInteractionHint: "按行阅读可对比同一维度；选择表头可查看补充说明。",
	matrixCaption: "关系矩阵",
	matrixAxes: "行 ↓ / 列 →",
	noRelation: "无关系",
	matrixInteractionHint: "从行与列的交点读取关系；选择单元格可查看细节。",
	setsLabel: "集合关系图",
	noExclusiveItems: "无独有项",
	intersections: "交集 / 共有",
	uncategorized: "未归类",
	setsInteractionHint: "单一归属项在各集合内，多重归属项在交集区。",
	timelineLabel: "时间线",
	timelineEventKind: "事件",
	timelineEraKind: "时期",
	timelineInteractionHint: "选择事件或时期可查看补充说明。",
	formulaLabel: "公式推导",
	formulaProgress: "第 {current} / {total} 步",
	formulaRule: "规则",
	formulaConclusion: "结论",
	revealNextFormulaStep: "显示下一步",
	formulaComplete: "推导已完成",
	formulaInteractionHint: "先预测下一步，再逐步揭示变形规则。",
	studySource: "学习来源",
	studyGoal: "学习目标",
	studySections: "来源章节",
	studyConcepts: "本节概念",
	studyAnchor: "位置",
	studySummary: "摘要",
	prerequisite: "前置概念",
	noPrerequisite: "无",
	roleFoundation: "基础",
	roleCore: "核心",
	roleExtension: "拓展",
	rolePractice: "练习",
	studyInteractionHint: "按来源章节导览，选择概念查看作用、前置关系与详细说明。",
	recallDeckLabel: "回忆卡组",
	recallProgress: "第 {current} / {total} 张",
	recallPrompt: "问题",
	recallHint: "提示",
	recallAnswer: "答案",
	showHint: "查看提示",
	showAnswer: "显示答案",
	previousCard: "上一张",
	nextCard: "下一张",
	resetDeck: "重置卡组",
	mastered: "已掌握",
	reviewAgain: "待复习",
	unrated: "未标记",
	recallStatus: "掌握 {mastered} · 待复习 {review}",
	recallInteractionHint: "先在心中回答，再查看提示和答案，最后标记掌握状态。",
	stepOfTotal: "第 {current} / {total} 步",
	emptyVisual: "这张图目前没有可显示的内容。",
	graphLegendLabel: "图形状态说明",
	stateCurrent: "当前重点",
	stateRelated: "相关路径",
	stateContext: "其余结构",
	stateVisited: "已讲过"
};
const VisualLabelsContext = createContext(DEFAULT_VISUAL_LABELS);
const VisualLabelsProvider = VisualLabelsContext.Provider;
function useVisualLabels() {
	return useContext(VisualLabelsContext);
}
/** Fill `{name}` placeholders, leaving unknown ones untouched. */
function labelTemplate(template, values) {
	return template.replace(/\{([a-z]+)\}/gi, (match, key) => values[key] === void 0 ? match : String(values[key]));
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/shell.module.css.mjs
const css$12 = ".iuNrZa_visualShell{--visual-tone:var(--lx-accent);gap:var(--lx-space-lg);min-width:0;margin:var(--lx-space-sm) 0 var(--lx-space-xl);border:var(--lx-card-border);border-radius:var(--lx-card-radius);padding:var(--lx-card-padding);background:var(--lx-card-background);color:var(--lx-label-primary);box-shadow:var(--lx-shadow-md);transition:box-shadow var(--lx-motion-base) var(--lx-easing);flex-direction:column;display:flex;container:iuNrZa_visual-view/inline-size}.iuNrZa_visualHeader{gap:var(--lx-space-2xs) var(--lx-space-md);flex-wrap:wrap;align-items:baseline;min-width:0;display:flex}.iuNrZa_visualEyebrow{border:1px solid color-mix(in srgb, var(--lx-accent) 24%, transparent);border-radius:var(--lx-radius-pill);padding:var(--lx-space-3xs) var(--lx-space-sm);background:color-mix(in srgb, var(--lx-accent-soft) 55%, transparent);color:var(--lx-accent);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);letter-spacing:var(--lx-tracking-eyebrow);line-height:var(--lx-leading-micro);box-shadow:0 1px 2px color-mix(in srgb, var(--lx-accent) 12%, transparent);flex:none}.iuNrZa_visualHeader h3{min-width:0;font-size:var(--lx-text-lg);font-weight:var(--lx-weight-strong);letter-spacing:-.01em;line-height:var(--lx-leading-lg);flex:12ch;margin:0}.iuNrZa_visualHeader p{margin:var(--lx-space-2xs) 0 0;color:var(--lx-label-secondary);font-size:var(--lx-text-sm);line-height:var(--lx-leading-base);flex:100%}.iuNrZa_srOnly{clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.iuNrZa_errorFallback{gap:var(--lx-space-2xs);border-left:3px solid var(--lx-danger);padding:var(--lx-space-md) var(--lx-space-lg);background:color-mix(in srgb, var(--lx-danger) 8%, transparent);color:var(--lx-label-secondary);font-size:var(--lx-text-sm);line-height:var(--lx-leading-base);display:grid}.iuNrZa_errorFallback strong{color:var(--lx-label-error)}.iuNrZa_errorFallback pre{max-height:240px;margin:var(--lx-space-xs) 0 0;white-space:pre-wrap;font:inherit;overflow:auto}.iuNrZa_emptyState{gap:var(--lx-space-2xs);border:1px dashed var(--lx-border-strong);border-radius:var(--lx-radius-lg);padding:var(--lx-space-2xl) var(--lx-space-lg);color:var(--lx-label-secondary);font-size:var(--lx-text-sm);line-height:var(--lx-leading-base);text-align:center;display:grid}.iuNrZa_control{min-height:var(--lx-control-height-sm);justify-content:center;align-items:center;gap:var(--lx-space-xs);appearance:none;border:1px solid var(--lx-border-default);border-radius:var(--lx-radius-sm);padding:var(--lx-control-padding-sm);background:var(--lx-surface-base);color:var(--lx-label-primary);font:inherit;font-size:var(--lx-text-2xs);line-height:var(--lx-leading-2xs);cursor:pointer;transition:background-color var(--lx-motion-fast) var(--lx-easing), border-color var(--lx-motion-fast) var(--lx-easing), color var(--lx-motion-fast) var(--lx-easing);display:inline-flex}.iuNrZa_control:hover:not(:disabled){border-color:var(--lx-border-strong);background:color-mix(in srgb, var(--lx-accent) 8%, var(--lx-surface-base));color:var(--lx-label-primary)}.iuNrZa_control:active:not(:disabled){border-color:var(--lx-accent);background:color-mix(in srgb, var(--lx-accent) 14%, var(--lx-surface-base))}.iuNrZa_control:disabled{border-color:var(--lx-border-subtle);color:var(--lx-label-tertiary);opacity:var(--lx-control-disabled-opacity);cursor:not-allowed}.iuNrZa_controlPrimary{min-height:var(--lx-control-height-md);border-color:var(--lx-accent);background:var(--lx-accent);color:var(--lx-label-on-accent);font-weight:var(--lx-weight-medium)}.iuNrZa_controlPrimary:hover:not(:disabled){border-color:color-mix(in srgb, var(--lx-accent) 84%, var(--lx-label-primary));background:color-mix(in srgb, var(--lx-accent) 84%, var(--lx-label-primary));color:var(--lx-label-on-accent)}.iuNrZa_controlPrimary:active:not(:disabled){background:color-mix(in srgb, var(--lx-accent) 72%, var(--lx-label-primary))}.iuNrZa_controlQuiet{color:var(--lx-label-secondary);background:0 0;border-color:#0000}.iuNrZa_controlQuiet:hover:not(:disabled){border-color:var(--lx-border-default);background:color-mix(in srgb, var(--lx-accent) 7%, transparent)}.iuNrZa_controlToned{border-color:color-mix(in srgb, var(--visual-tone) 32%, var(--lx-border-subtle));background:color-mix(in srgb, var(--visual-tone) 9%, var(--lx-surface-base));color:var(--lx-label-primary)}.iuNrZa_controlToned:hover:not(:disabled){border-color:var(--visual-tone);background:color-mix(in srgb, var(--visual-tone) 16%, var(--lx-surface-base))}.iuNrZa_controlRow{gap:var(--lx-space-sm);flex-wrap:wrap;display:flex}.iuNrZa_closeButton{border-radius:var(--lx-radius-xs);width:28px;height:28px;min-height:28px;font-size:var(--lx-text-md);padding:0;line-height:1}.iuNrZa_sequence{gap:var(--lx-space-sm) var(--lx-space-lg);border:1px solid color-mix(in srgb, var(--lx-accent) 22%, var(--lx-border-default));border-radius:var(--lx-radius-lg);min-width:0;padding:var(--lx-space-md) var(--lx-space-lg);background:linear-gradient(135deg, color-mix(in srgb, var(--lx-accent-soft) 48%, transparent), color-mix(in srgb, var(--lx-surface-base) 80%, transparent));box-shadow:0 2px 8px -2px color-mix(in srgb, var(--lx-accent) 8%, transparent);grid-template-columns:minmax(0,1fr) auto;align-items:center;display:grid}.iuNrZa_sequenceText{gap:var(--lx-space-3xs) var(--lx-space-md);grid-template-columns:auto minmax(0,1fr);align-items:baseline;min-width:0;display:grid}.iuNrZa_sequenceText>span{color:var(--lx-accent);font-size:var(--lx-text-micro);font-variant-numeric:tabular-nums;font-weight:var(--lx-weight-strong);letter-spacing:.04em}.iuNrZa_sequenceText strong{min-width:0;color:var(--lx-label-primary);font-size:var(--lx-text-sm);font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-sm);overflow-wrap:anywhere}.iuNrZa_sequenceText p{margin:var(--lx-space-3xs) 0 0;color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs);grid-column:1/-1}.iuNrZa_sequenceActions{gap:var(--lx-space-xs);flex:none;display:flex}.iuNrZa_sequenceActions .iuNrZa_control{padding:var(--lx-control-padding-md)}.iuNrZa_sequenceRail{gap:var(--lx-space-2xs);flex-wrap:wrap;grid-column:1/-1;margin:0;padding:0;list-style:none;display:flex}.iuNrZa_sequenceRail button{appearance:none;border-radius:var(--lx-radius-pill);background:color-mix(in srgb, var(--lx-accent) 20%, var(--lx-border-default));cursor:pointer;width:100%;min-width:18px;height:6px;transition:background-color var(--lx-motion-fast) var(--lx-easing), transform var(--lx-motion-fast) var(--lx-easing);border:0;padding:0;display:block}.iuNrZa_sequenceRail li{flex:1 1 0;min-width:18px}.iuNrZa_sequenceRail button:hover{background:color-mix(in srgb, var(--lx-accent) 50%, transparent);transform:scaleY(1.2)}.iuNrZa_sequenceRail button[data-visual-state=visited]{background:color-mix(in srgb, var(--lx-accent) 64%, transparent)}.iuNrZa_sequenceRail button[data-visual-state=current]{background:var(--lx-accent);box-shadow:0 0 8px var(--lx-accent)}.iuNrZa_selectionSlot{min-height:var(--lx-control-height-md);align-content:center;display:grid}.iuNrZa_interactionHint{color:var(--lx-label-tertiary);font-size:var(--lx-text-2xs);line-height:var(--lx-leading-2xs);margin:0}.iuNrZa_detailPanel{gap:var(--lx-space-3xs) var(--lx-space-sm);border:1px solid color-mix(in srgb, var(--visual-tone) 32%, var(--lx-border-subtle));border-left:3.5px solid var(--visual-tone);border-radius:var(--lx-radius-md);padding:var(--lx-space-sm) var(--lx-space-md);background:color-mix(in srgb, var(--visual-tone) 7%, var(--lx-surface-base));box-shadow:var(--lx-shadow-sm), 0 0 12px color-mix(in srgb, var(--visual-tone) 10%, transparent);transition:border-color var(--lx-motion-fast) var(--lx-easing);grid-template-columns:auto minmax(0,1fr) 28px;align-items:baseline;display:grid}.iuNrZa_detailPanel>span{color:var(--visual-tone);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-xs);letter-spacing:.03em}.iuNrZa_detailPanel>strong{min-width:0;color:var(--lx-label-primary);font-size:var(--lx-text-sm);line-height:var(--lx-leading-sm);overflow-wrap:anywhere}.iuNrZa_detailPanel>p{margin:var(--lx-space-3xs) 0 0;color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs);grid-column:1/3}.iuNrZa_detailPanel>button{grid-area:1/3/3;align-self:start}.iuNrZa_rendererStack{gap:var(--lx-space-lg);flex-direction:column;min-width:0;display:flex}.iuNrZa_viewport{overscroll-behavior-inline:contain;border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-lg);background:var(--lx-surface-sunken);min-width:0;box-shadow:inset 0 1px 3px color-mix(in srgb, var(--lx-host-label) 3%, transparent);scrollbar-width:thin;position:relative;overflow-x:auto}.iuNrZa_viewport>svg{touch-action:pan-y;max-width:none;margin:0 auto;display:block;overflow:visible}.iuNrZa_stateLegend{gap:var(--lx-space-xs) var(--lx-space-lg);color:var(--lx-label-secondary);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro);flex-wrap:wrap;margin:0;display:flex}.iuNrZa_stateLegend>span{align-items:center;gap:var(--lx-space-xs);display:inline-flex}.iuNrZa_stateLegend i{border-radius:var(--lx-radius-pill);background:var(--lx-label-tertiary);width:16px;height:3px;opacity:var(--lx-vs-alpha);transition:background-color var(--lx-motion-fast) var(--lx-easing)}.iuNrZa_stateLegend>span[data-visual-state=current] i{background:var(--lx-accent);height:5px;box-shadow:0 0 6px var(--lx-accent)}@container iuNrZa_visual-view (width<=560px){.iuNrZa_visualShell{gap:var(--lx-space-md);border-radius:var(--lx-radius-lg);padding:var(--lx-space-lg)}.iuNrZa_visualHeader h3{font-size:var(--lx-text-md);flex-basis:100%}.iuNrZa_sequence{grid-template-columns:minmax(0,1fr)}.iuNrZa_sequenceActions{justify-content:stretch}.iuNrZa_sequenceActions .iuNrZa_control{flex:1}.iuNrZa_sequenceActions .iuNrZa_control:last-child{flex:none}}@container iuNrZa_visual-view (width<=360px){.iuNrZa_sequenceActions .iuNrZa_control>span:not([aria-hidden]){display:none}.iuNrZa_detailPanel{grid-template-columns:minmax(0,1fr) 28px}.iuNrZa_detailPanel>span,.iuNrZa_detailPanel>strong,.iuNrZa_detailPanel>p{grid-column:1}.iuNrZa_detailPanel>button{grid-column:2}}";
const tagId$12 = "@dsh-portable/visual/shell.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$12) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$12;
	tag.textContent = css$12;
	document.head.appendChild(tag);
}
var shell_module_css_default = {
	"closeButton": "iuNrZa_closeButton",
	"control": "iuNrZa_control",
	"controlPrimary": "iuNrZa_controlPrimary",
	"controlQuiet": "iuNrZa_controlQuiet",
	"controlRow": "iuNrZa_controlRow",
	"controlToned": "iuNrZa_controlToned",
	"detailPanel": "iuNrZa_detailPanel",
	"emptyState": "iuNrZa_emptyState",
	"errorFallback": "iuNrZa_errorFallback",
	"interactionHint": "iuNrZa_interactionHint",
	"rendererStack": "iuNrZa_rendererStack",
	"selectionSlot": "iuNrZa_selectionSlot",
	"sequence": "iuNrZa_sequence",
	"sequenceActions": "iuNrZa_sequenceActions",
	"sequenceRail": "iuNrZa_sequenceRail",
	"sequenceText": "iuNrZa_sequenceText",
	"srOnly": "iuNrZa_srOnly",
	"stateLegend": "iuNrZa_stateLegend",
	"viewport": "iuNrZa_viewport",
	"visual-view": "iuNrZa_visual-view",
	"visualEyebrow": "iuNrZa_visualEyebrow",
	"visualHeader": "iuNrZa_visualHeader",
	"visualShell": "iuNrZa_visualShell"
};
//#endregion
//#region src/client/visuals/core/shell-parts.tsx
/**
* The chrome shared by all eight renderers: the error boundary, the sequence
* controller, the selection surface, the figure viewport and the state legend.
*
* Every renderer composes these rather than restating them, so the heading
* hierarchy, control shapes, empty and error surfaces, keyboard behaviour and
* responsive rules are the same wherever a learner meets them.
*/
var VisualErrorBoundary = class extends Component {
	state = {};
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidCatch(error, info) {
		console.error("Visual renderer failed", error, info);
	}
	render() {
		if (this.state.error === void 0) return this.props.children;
		return /* @__PURE__ */ jsxs("div", {
			className: shell_module_css_default.errorFallback,
			role: "alert",
			children: [/* @__PURE__ */ jsx("strong", { children: this.props.labels.errorTitle }), this.props.fallbackMarkdown === void 0 ? /* @__PURE__ */ jsx("span", { children: this.props.labels.errorContinue }) : /* @__PURE__ */ jsx("pre", { children: this.props.fallbackMarkdown })]
		});
	}
};
function SequenceController({ sequence, frameIndex, onFrameChange }) {
	const labels = useVisualLabels();
	const frame = sequence.frames[frameIndex];
	const initialIndex = Math.max(0, sequence.frames.findIndex((item) => item.id === sequence.initialFrameId));
	const move = (delta) => {
		onFrameChange(Math.max(0, Math.min(sequence.frames.length - 1, frameIndex + delta)));
	};
	const onKeyDown = (event) => {
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			move(-1);
		} else if (event.key === "ArrowRight") {
			event.preventDefault();
			move(1);
		} else if (event.key === "Home") {
			event.preventDefault();
			onFrameChange(0);
		} else if (event.key === "End") {
			event.preventDefault();
			onFrameChange(sequence.frames.length - 1);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.sequence,
		role: "group",
		onKeyDown,
		"aria-label": labels.sequenceLabel,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: shell_module_css_default.sequenceText,
				"aria-live": "polite",
				"aria-atomic": "true",
				children: [
					/* @__PURE__ */ jsxs("span", { children: [
						frameIndex + 1,
						" / ",
						sequence.frames.length
					] }),
					/* @__PURE__ */ jsx("strong", { children: frame?.label }),
					frame?.description === void 0 ? null : /* @__PURE__ */ jsx("p", { children: frame.description })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: shell_module_css_default.sequenceActions,
				children: [
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: shell_module_css_default.control,
						onClick: () => move(-1),
						disabled: frameIndex === 0,
						"aria-label": labels.previousStep,
						children: [/* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							children: "←"
						}), /* @__PURE__ */ jsx("span", { children: labels.previousStep })]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: shell_module_css_default.control,
						onClick: () => move(1),
						disabled: frameIndex >= sequence.frames.length - 1,
						"aria-label": labels.nextStep,
						children: [/* @__PURE__ */ jsx("span", { children: labels.nextStep }), /* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							children: "→"
						})]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: shell_module_css_default.control,
						onClick: () => onFrameChange(initialIndex),
						disabled: frameIndex === initialIndex,
						children: labels.reset
					})
				]
			}),
			/* @__PURE__ */ jsx("ol", {
				className: shell_module_css_default.sequenceRail,
				children: sequence.frames.map((item, index) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("button", {
					type: "button",
					"data-visual-state": index === frameIndex ? "current" : index < frameIndex ? "visited" : "context",
					"aria-current": index === frameIndex ? "step" : void 0,
					"aria-label": `${labelTemplate(labels.stepOfTotal, {
						current: index + 1,
						total: sequence.frames.length
					})}: ${item.label}`,
					onClick: () => onFrameChange(index)
				}) }, item.id))
			})
		]
	});
}
/**
* The hint and the selection detail share one slot.
*
* Selecting a mark used to swap a one-line hint for a three-line panel, which
* moved the figure under the learner's pointer. The slot reserves the taller of
* the two instead.
*/
function SelectionSurface({ hint, selected, kindLabel, onClose }) {
	const labels = useVisualLabels();
	if (selected === void 0) return /* @__PURE__ */ jsx("div", {
		className: shell_module_css_default.selectionSlot,
		children: /* @__PURE__ */ jsx("p", {
			className: shell_module_css_default.interactionHint,
			children: hint
		})
	});
	return /* @__PURE__ */ jsx("div", {
		className: shell_module_css_default.selectionSlot,
		children: /* @__PURE__ */ jsxs("aside", {
			className: shell_module_css_default.detailPanel,
			"data-tone": selected.tone,
			"aria-live": "polite",
			children: [
				/* @__PURE__ */ jsx("span", { children: kindLabel ?? selected.kind }),
				/* @__PURE__ */ jsx("strong", { children: selected.label }),
				/* @__PURE__ */ jsx("p", { children: selected.detail ?? labels.noDetail }),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: `${shell_module_css_default.control} ${shell_module_css_default.closeButton}`,
					onClick: onClose,
					"aria-label": labels.closeDetail,
					children: "×"
				})
			]
		})
	});
}
/** The scrollable frame a measured SVG figure is drawn into. */
function FigureViewport({ viewportRef, children }) {
	return /* @__PURE__ */ jsx("div", {
		className: shell_module_css_default.viewport,
		ref: viewportRef,
		children
	});
}
/** Names the emphasis states a figure is currently using, in words. */
function StateLegend({ states }) {
	const labels = useVisualLabels();
	const naming = {
		current: labels.stateCurrent,
		related: labels.stateRelated,
		visited: labels.stateVisited,
		context: labels.stateContext,
		inactive: labels.stateContext
	};
	const shown = [...new Set(states)].filter((state) => naming[state] !== void 0);
	if (shown.length < 2) return null;
	return /* @__PURE__ */ jsx("p", {
		className: shell_module_css_default.stateLegend,
		"aria-label": labels.graphLegendLabel,
		children: shown.map((state) => /* @__PURE__ */ jsxs("span", {
			"data-visual-state": state,
			children: [/* @__PURE__ */ jsx("i", { "aria-hidden": "true" }), naming[state]]
		}, state))
	});
}
function EmptyFigure({ message }) {
	const labels = useVisualLabels();
	return /* @__PURE__ */ jsx("p", {
		className: shell_module_css_default.emptyState,
		role: "note",
		children: message ?? labels.emptyVisual
	});
}
//#endregion
//#region src/client/visuals/state/visual-state.ts
function visualFocus(currentIds, visitedIds = []) {
	const current = new Set(currentIds);
	return {
		currentIds: current,
		visitedIds: new Set([...visitedIds].filter((id) => !current.has(id))),
		active: current.size > 0
	};
}
/**
* Resolve one element's state.
*
* `relatedIds` are the ids that make this element part of the current story
* without being its subject: the group a node belongs to, the endpoints of a
* focused edge, the section a concept sits in.
*/
function elementState(id, focus, relatedIds = []) {
	if (!focus.active) return "overview";
	if (focus.currentIds.has(id)) return "current";
	if (relatedIds.some((related) => related !== void 0 && focus.currentIds.has(related))) return "related";
	if (focus.visitedIds.has(id)) return "visited";
	return "context";
}
//#endregion
//#region src/protocol/expression.ts
/**
* Compile a closed AST into a small closure tree once, so sampling a curve
* does not repeatedly dispatch through every AST node. This intentionally
* uses ordinary closures instead of `new Function`: the model payload remains
* data-only while the hot render path still gets one function call per sample.
*/
function compileMathExpression(expression) {
	switch (expression.op) {
		case "constant": return () => expression.value;
		case "variable": return (bindings) => bindings[expression.name] ?? NaN;
		case "add": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) + right(bindings);
		}
		case "sub": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) - right(bindings);
		}
		case "mul": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) * right(bindings);
		}
		case "div": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) / right(bindings);
		}
		case "pow": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) ** right(bindings);
		}
		case "min": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => Math.min(left(bindings), right(bindings));
		}
		case "max": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => Math.max(left(bindings), right(bindings));
		}
		case "neg": {
			const value = compileMathExpression(expression.value);
			return (bindings) => -value(bindings);
		}
		case "abs": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.abs(value(bindings));
		}
		case "sqrt": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.sqrt(value(bindings));
		}
		case "sin": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.sin(value(bindings));
		}
		case "cos": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.cos(value(bindings));
		}
		case "tan": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.tan(value(bindings));
		}
		case "atan": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.atan(value(bindings));
		}
		case "exp": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.exp(value(bindings));
		}
		case "log": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.log(value(bindings));
		}
		case "sigmoid": {
			const value = compileMathExpression(expression.value);
			return (bindings) => {
				const result = value(bindings);
				if (result >= 0) return 1 / (1 + Math.exp(-result));
				const exponential = Math.exp(result);
				return exponential / (1 + exponential);
			};
		}
		case "relu": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.max(0, value(bindings));
		}
		case "leaky_relu": {
			const value = compileMathExpression(expression.value);
			return (bindings) => {
				const result = value(bindings);
				return result >= 0 ? result : result * .01;
			};
		}
		case "step": {
			const value = compileMathExpression(expression.value);
			return (bindings) => value(bindings) >= 0 ? 1 : 0;
		}
		case "normpdf": {
			const value = compileMathExpression(expression.value);
			return (bindings) => {
				const result = value(bindings);
				return Math.exp(-.5 * result * result) / Math.sqrt(2 * Math.PI);
			};
		}
		case "floor": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.floor(value(bindings));
		}
		case "ceil": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.ceil(value(bindings));
		}
	}
}
/**
* Evaluate the protocol's closed mathematical AST. The protocol validator
* bounds its depth and node count; this evaluator never executes source text.
*/
function evaluateMathExpression(expression, bindings) {
	switch (expression.op) {
		case "constant": return expression.value;
		case "variable": return bindings[expression.name] ?? NaN;
		case "add": return evaluateMathExpression(expression.left, bindings) + evaluateMathExpression(expression.right, bindings);
		case "sub": return evaluateMathExpression(expression.left, bindings) - evaluateMathExpression(expression.right, bindings);
		case "mul": return evaluateMathExpression(expression.left, bindings) * evaluateMathExpression(expression.right, bindings);
		case "div": return evaluateMathExpression(expression.left, bindings) / evaluateMathExpression(expression.right, bindings);
		case "pow": return evaluateMathExpression(expression.left, bindings) ** evaluateMathExpression(expression.right, bindings);
		case "min": return Math.min(evaluateMathExpression(expression.left, bindings), evaluateMathExpression(expression.right, bindings));
		case "max": return Math.max(evaluateMathExpression(expression.left, bindings), evaluateMathExpression(expression.right, bindings));
		case "neg": return -evaluateMathExpression(expression.value, bindings);
		case "abs": return Math.abs(evaluateMathExpression(expression.value, bindings));
		case "sqrt": return Math.sqrt(evaluateMathExpression(expression.value, bindings));
		case "sin": return Math.sin(evaluateMathExpression(expression.value, bindings));
		case "cos": return Math.cos(evaluateMathExpression(expression.value, bindings));
		case "tan": return Math.tan(evaluateMathExpression(expression.value, bindings));
		case "atan": return Math.atan(evaluateMathExpression(expression.value, bindings));
		case "exp": return Math.exp(evaluateMathExpression(expression.value, bindings));
		case "log": return Math.log(evaluateMathExpression(expression.value, bindings));
		case "sigmoid": {
			const value = evaluateMathExpression(expression.value, bindings);
			if (value >= 0) return 1 / (1 + Math.exp(-value));
			const exponential = Math.exp(value);
			return exponential / (1 + exponential);
		}
		case "relu": return Math.max(0, evaluateMathExpression(expression.value, bindings));
		case "leaky_relu": {
			const value = evaluateMathExpression(expression.value, bindings);
			return value >= 0 ? value : value * .01;
		}
		case "step": return evaluateMathExpression(expression.value, bindings) >= 0 ? 1 : 0;
		case "normpdf": {
			const value = evaluateMathExpression(expression.value, bindings);
			return Math.exp(-.5 * value * value) / Math.sqrt(2 * Math.PI);
		}
		case "floor": return Math.floor(evaluateMathExpression(expression.value, bindings));
		case "ceil": return Math.ceil(evaluateMathExpression(expression.value, bindings));
	}
}
//#endregion
//#region src/client/visuals/core/types.ts
const DEFAULT_TONES = [
	"blue",
	"red",
	"green",
	"orange",
	"purple",
	"gray"
];
//#endregion
//#region src/client/visuals/core/format.ts
function formatNumber(value, digits) {
	if (!Number.isFinite(value)) return "—";
	if (digits !== void 0) return value.toFixed(digits);
	if (Number.isInteger(value)) return String(value);
	return String(Number(value.toPrecision(6)));
}
function normalizedPosition(value, min, max) {
	if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0;
	return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
function interpolate(min, max, ratio) {
	return min + (max - min) * Math.max(0, Math.min(1, ratio));
}
function niceStep(rawStep) {
	if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
	const power = 10 ** Math.floor(Math.log10(rawStep));
	const normalized = rawStep / power;
	return (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * power;
}
function ticks(min, max, target = 6) {
	const step = niceStep((max - min) / target);
	const first = Math.ceil(min / step) * step;
	const values = [];
	for (let value = first, index = 0; value <= max && index < target * 4; value += step, index += 1) values.push(Number(value.toPrecision(12)));
	return values.length > 0 ? values : [min, max];
}
function toneAt(tone, index = 0) {
	if (tone === "blue" || tone === "green" || tone === "red" || tone === "orange" || tone === "purple" || tone === "gray") return tone;
	return DEFAULT_TONES[index % DEFAULT_TONES.length] ?? "blue";
}
function activateWithKeyboard(event, action) {
	if (event.key !== "Enter" && event.key !== " ") return;
	event.preventDefault();
	action();
}
/**
* Normalise a model-written expression into display math.
*
* The payload carries LaTeX without delimiters, but models routinely emit the
* Unicode form of the same symbols; rewriting them keeps a valid derivation
* from rendering as literal text.
*/
function displayMath(expression) {
	const value = expression.trim().replaceAll("′", "'").replaceAll("−", "-").replaceAll("²", "^{2}").replaceAll("³", "^{3}").replaceAll("→", "\\to ").replaceAll("≤", "\\le ").replaceAll("≥", "\\ge ").replaceAll("≠", "\\ne ").replaceAll("×", "\\times ").replaceAll("÷", "\\div ").replaceAll("∞", "\\infty ").replace(/\blim\s*\[([^\]]+)\]/g, "\\lim_{$1}");
	if (value.startsWith("$$") && value.endsWith("$$") || value.startsWith("\\[") && value.endsWith("\\]")) return value;
	return `$$\n${value}\n$$`;
}
//#endregion
//#region src/client/visuals/state/hooks.ts
/** Interaction hooks shared by the figure renderers. */
/**
* Roving tabindex over the interactive items of one figure.
*
* A node_link visual may declare 48 nodes and 160 edges, and a scene_2d up to
* 64 elements. Leaving every item in the tab order turns one inline diagram
* into a 200-stop detour that a keyboard user has to walk through to reach the
* rest of the conversation. The figure is a single tab stop instead: arrow
* keys, Home and End move between its items, Enter and Space select one.
*/
function useRovingFocus(ids) {
	const containerRef = useRef(null);
	const [focusedId, setFocusedId] = useState();
	const active = focusedId !== void 0 && ids.includes(focusedId) ? focusedId : ids[0];
	const focusAt = (index) => {
		const next = ids[Math.max(0, Math.min(ids.length - 1, index))];
		if (next === void 0) return;
		setFocusedId(next);
		for (const item of containerRef.current?.querySelectorAll("[data-roving-id]") ?? []) if (item.dataset.rovingId === next) {
			item.focus();
			return;
		}
	};
	const itemProps = (id, activate) => ({
		tabIndex: id === active ? 0 : -1,
		"data-roving-id": id,
		onFocus: () => setFocusedId(id),
		onKeyDown: (event) => {
			const index = ids.indexOf(id);
			if (event.key === "ArrowRight" || event.key === "ArrowDown") {
				event.preventDefault();
				focusAt(index + 1);
			} else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
				event.preventDefault();
				focusAt(index - 1);
			} else if (event.key === "Home") {
				event.preventDefault();
				focusAt(0);
			} else if (event.key === "End") {
				event.preventDefault();
				focusAt(ids.length - 1);
			} else activateWithKeyboard(event, activate);
		}
	});
	return {
		containerRef,
		itemProps
	};
}
/**
* Track the usable inline size of a figure's viewport.
*
* Layout is derived from the measured width, so the default has to be a
* plausible conversation column rather than zero: a zero reading means "not
* laid out yet" and must not collapse the figure before the observer fires.
*/
function useContainerWidth(minimum = 260) {
	const ref = useRef(null);
	const [width, setWidth] = useState(680);
	useEffect(() => {
		const element = ref.current;
		if (element === null) return;
		const update = (measured) => {
			if (measured <= 0) return;
			const next = Math.max(minimum, measured);
			setWidth((current) => Math.abs(current - next) < 1 ? current : next);
		};
		update(element.getBoundingClientRect().width);
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry !== void 0) update(entry.contentRect.width);
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [minimum]);
	return [ref, width];
}
function chartGeometry(containerWidth, minWidth = 320) {
	const width = Math.max(minWidth, Math.round(containerWidth));
	const height = Math.round(Math.max(260, Math.min(400, width * .56)));
	const left = width < 420 ? 46 : 56;
	const right = 18;
	const top = 20;
	const bottom = width < 420 ? 46 : 52;
	return {
		width,
		height,
		left,
		right,
		top,
		bottom,
		plotWidth: width - left - right,
		plotHeight: height - top - bottom
	};
}
function scaleX(value, axis, geometry) {
	return geometry.left + normalizedPosition(value, axis.min, axis.max) * geometry.plotWidth;
}
function scaleY(value, axis, geometry) {
	return geometry.top + (1 - normalizedPosition(value, axis.min, axis.max)) * geometry.plotHeight;
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/plot.module.css.mjs
const css$11 = ".x3BDba_plotSvg,.x3BDba_sceneSvg{touch-action:pan-y;max-width:none;display:block;overflow:visible}.x3BDba_parameterGrid{gap:var(--lx-space-lg) var(--lx-space-3xl);grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));display:grid}.x3BDba_parameter{grid-template-rows:auto 20px var(--lx-leading-micro);gap:var(--lx-space-3xs);cursor:pointer;min-width:0;opacity:var(--lx-vs-alpha);display:grid}.x3BDba_parameterHeader{justify-content:space-between;align-items:baseline;gap:var(--lx-space-lg);min-width:0;color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-sm);display:flex}.x3BDba_parameterHeader output{color:var(--lx-accent);font-size:var(--lx-text-sm);font-variant-numeric:tabular-nums;font-weight:var(--lx-weight-strong)}.x3BDba_parameter input{appearance:none;border-radius:var(--lx-radius-pill);background:linear-gradient(to right, var(--lx-accent) 0 var(--range-progress), var(--lx-border-default) var(--range-progress) 100%);cursor:pointer;align-self:center;width:100%;height:4px}.x3BDba_parameter input::-webkit-slider-runnable-track{background:0 0;height:4px}.x3BDba_parameter input::-moz-range-track{background:0 0;height:4px}.x3BDba_parameter input::-webkit-slider-thumb{appearance:none;border:3px solid var(--lx-surface-base);border-radius:var(--lx-radius-circle);background:var(--lx-accent);width:17px;height:17px;box-shadow:0 0 0 1px var(--lx-accent);margin-top:-6.5px}.x3BDba_parameter input::-moz-range-thumb{border:3px solid var(--lx-surface-base);border-radius:var(--lx-radius-circle);background:var(--lx-accent);width:11px;height:11px;box-shadow:0 0 0 1px var(--lx-accent)}.x3BDba_parameterEnds{color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);font-variant-numeric:tabular-nums;line-height:var(--lx-leading-micro);justify-content:space-between;display:flex}.x3BDba_metrics{gap:var(--lx-space-sm);grid-template-columns:repeat(auto-fit,minmax(128px,1fr));margin:0;display:grid}.x3BDba_metrics>div{gap:var(--lx-space-3xs);border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-sm);min-width:0;padding:var(--lx-space-sm) var(--lx-space-md);background:var(--lx-surface-sunken);opacity:var(--lx-vs-alpha);display:grid}.x3BDba_metrics dt{color:var(--lx-label-secondary);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.x3BDba_metrics dd{color:var(--lx-accent);font-size:var(--lx-text-md);font-variant-numeric:tabular-nums;font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-base);margin:0}.x3BDba_plotFrame{fill:var(--lx-surface-base);stroke:var(--lx-border-default);stroke-width:1px;vector-effect:non-scaling-stroke}.x3BDba_gridLine{stroke:var(--lx-border-subtle);stroke-width:1px;vector-effect:non-scaling-stroke}.x3BDba_minorGridLine{stroke:color-mix(in srgb, var(--lx-border-subtle) 60%, transparent);stroke-width:.7px;stroke-dasharray:2 4;vector-effect:non-scaling-stroke}.x3BDba_zeroAxis{stroke:var(--lx-border-strongest);stroke-width:1.4px;vector-effect:non-scaling-stroke}.x3BDba_originMarker circle{fill:var(--lx-label-primary);stroke:var(--lx-surface-base);stroke-width:1.5px}.x3BDba_originMarker text{fill:var(--lx-label-secondary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong)}.x3BDba_tickLabel{fill:var(--lx-label-secondary);font-size:var(--lx-text-micro);font-variant-numeric:tabular-nums}.x3BDba_axisLabel{fill:var(--lx-label-secondary);font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-medium)}.x3BDba_seriesArea{opacity:var(--lx-vs-alpha);pointer-events:none;transition:opacity var(--lx-motion-base) var(--lx-easing)}.x3BDba_seriesLine{fill:none;stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:calc(2.5px + var(--lx-vs-ring) * .9px);stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;filter:drop-shadow(0 1px 2px color-mix(in srgb, var(--visual-tone) 25%, transparent));transition:stroke-opacity var(--lx-motion-base) var(--lx-easing), stroke-width var(--lx-motion-base) var(--lx-easing)}.x3BDba_seriesPoint,.x3BDba_probePoint{fill:var(--visual-tone);fill-opacity:var(--lx-vs-alpha);stroke:var(--lx-surface-base);stroke-width:2px;vector-effect:non-scaling-stroke;transition:r var(--lx-motion-fast) var(--lx-easing)}.x3BDba_probePoint{filter:drop-shadow(0 0 4px var(--visual-tone))}.x3BDba_seriesBar{fill:color-mix(in srgb, var(--visual-tone) 65%, transparent);fill-opacity:var(--lx-vs-alpha);stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:1px;vector-effect:non-scaling-stroke;transition:fill-opacity var(--lx-motion-fast) var(--lx-easing)}.x3BDba_probeLine{stroke:color-mix(in srgb, var(--lx-label-primary) 60%, transparent);stroke-width:1.2px;stroke-dasharray:4 4;pointer-events:none;vector-effect:non-scaling-stroke}.x3BDba_probeCard{top:var(--lx-space-sm);right:var(--lx-space-sm);z-index:3;gap:var(--lx-space-3xs);border:1px solid color-mix(in srgb, var(--lx-accent) 26%, var(--lx-border-strong));border-radius:var(--lx-radius-sm);width:max-content;max-width:220px;padding:var(--lx-space-xs) var(--lx-space-sm);background:var(--lx-surface-base);box-shadow:var(--lx-shadow-md), 0 0 10px color-mix(in srgb, var(--lx-accent) 12%, transparent);color:var(--lx-label-secondary);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro);pointer-events:none;backdrop-filter:blur(8px);display:grid;position:absolute}.x3BDba_probeCard strong{color:var(--lx-label-primary);font-size:var(--lx-text-2xs)}.x3BDba_probeCard span:before{border-radius:var(--lx-radius-circle);background:var(--visual-tone);width:6px;height:6px;box-shadow:0 0 4px var(--visual-tone);content:\"\";margin-right:5px;display:inline-block}.x3BDba_emptyPlotNotice{border:1px dashed var(--lx-border-strong);border-radius:var(--lx-radius-md);width:max-content;max-width:min(92%,320px);padding:var(--lx-space-sm) var(--lx-space-lg);background:var(--lx-surface-base);color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs);text-align:center;pointer-events:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.x3BDba_seriesToggles{gap:var(--lx-space-sm);flex-wrap:wrap;display:flex}.x3BDba_seriesToggle{border-radius:var(--lx-radius-pill);padding:var(--lx-space-2xs) var(--lx-space-md)}.x3BDba_seriesToggle>span{border-top:2.5px solid var(--visual-tone);width:18px;height:0;display:inline-block}.x3BDba_seriesToggle[data-series-type=points]>span{border-radius:var(--lx-radius-circle);background:var(--visual-tone);border:0;width:8px;height:8px}.x3BDba_seriesToggle[data-series-type=bars]>span{background:color-mix(in srgb, var(--visual-tone) 72%, transparent);border:0;border-radius:1px;width:9px;height:10px}.x3BDba_seriesToggle[data-stroke=dashed]>span{border-top-style:dashed}.x3BDba_seriesToggle[data-stroke=dotted]>span{border-top-style:dotted}.x3BDba_seriesToggle[aria-pressed=false]{color:var(--lx-label-tertiary);text-decoration:line-through}.x3BDba_seriesToggle[aria-pressed=false]>span{opacity:.55}.x3BDba_seriesToggle[data-empty]{border-style:dashed}.x3BDba_seriesToggle[data-empty]>small{color:var(--lx-label-tertiary);font-size:var(--lx-text-micro)}.x3BDba_sceneElement{cursor:pointer}.x3BDba_sceneLine{stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:calc(2.2px + var(--lx-vs-ring) * .8px);stroke-linecap:round;vector-effect:non-scaling-stroke;transition:stroke-width var(--lx-motion-fast) var(--lx-easing), stroke-opacity var(--lx-motion-fast) var(--lx-easing)}.x3BDba_sceneHit{fill:none;stroke:#0000;stroke-width:14px;pointer-events:stroke;vector-effect:non-scaling-stroke}.x3BDba_scenePoint{fill:var(--visual-tone);fill-opacity:var(--lx-vs-alpha);stroke:var(--lx-surface-base);stroke-width:2px;filter:drop-shadow(0 0 3px color-mix(in srgb, var(--visual-tone) 45%, transparent));vector-effect:non-scaling-stroke;transition:transform var(--lx-motion-fast) var(--lx-easing)}.x3BDba_sceneShape{fill:color-mix(in srgb, var(--visual-tone) 13%, transparent);fill-opacity:var(--lx-vs-alpha);stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:2px;vector-effect:non-scaling-stroke;transition:fill var(--lx-motion-fast) var(--lx-easing), stroke-width var(--lx-motion-fast) var(--lx-easing)}.x3BDba_sceneElement:hover .x3BDba_sceneShape,.x3BDba_sceneElement:focus-visible .x3BDba_sceneShape,.x3BDba_sceneElement[data-selected] .x3BDba_sceneShape{fill:color-mix(in srgb, var(--visual-tone) 24%, transparent);fill-opacity:1;stroke-opacity:1;stroke-width:2.8px;filter:drop-shadow(0 0 6px color-mix(in srgb, var(--visual-tone) 30%, transparent))}.x3BDba_sceneElement:hover .x3BDba_sceneLine,.x3BDba_sceneElement:focus-visible .x3BDba_sceneLine,.x3BDba_sceneElement[data-selected] .x3BDba_sceneLine{stroke-opacity:1;stroke-width:3.2px;filter:drop-shadow(0 0 4px var(--visual-tone))}.x3BDba_sceneText,.x3BDba_shapeLabel{fill:var(--lx-label-primary);stroke:var(--lx-surface-base);stroke-width:3px;paint-order:stroke;font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-medium);opacity:var(--lx-vs-alpha);pointer-events:none}.x3BDba_shapeLabel{fill:var(--visual-tone);font-weight:var(--lx-weight-strong)}.x3BDba_arrowMarker path{fill:var(--visual-tone);fill-opacity:var(--lx-vs-alpha)}@media (prefers-reduced-motion:reduce){.x3BDba_seriesArea,.x3BDba_seriesLine,.x3BDba_probeCard{transition:none}}";
const tagId$11 = "@dsh-portable/visual/plot.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$11) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$11;
	tag.textContent = css$11;
	document.head.appendChild(tag);
}
var plot_module_css_default = {
	"arrowMarker": "x3BDba_arrowMarker",
	"axisLabel": "x3BDba_axisLabel",
	"emptyPlotNotice": "x3BDba_emptyPlotNotice",
	"gridLine": "x3BDba_gridLine",
	"metrics": "x3BDba_metrics",
	"minorGridLine": "x3BDba_minorGridLine",
	"originMarker": "x3BDba_originMarker",
	"parameter": "x3BDba_parameter",
	"parameterEnds": "x3BDba_parameterEnds",
	"parameterGrid": "x3BDba_parameterGrid",
	"parameterHeader": "x3BDba_parameterHeader",
	"plotFrame": "x3BDba_plotFrame",
	"plotSvg": "x3BDba_plotSvg",
	"probeCard": "x3BDba_probeCard",
	"probeLine": "x3BDba_probeLine",
	"probePoint": "x3BDba_probePoint",
	"sceneElement": "x3BDba_sceneElement",
	"sceneHit": "x3BDba_sceneHit",
	"sceneLine": "x3BDba_sceneLine",
	"scenePoint": "x3BDba_scenePoint",
	"sceneShape": "x3BDba_sceneShape",
	"sceneSvg": "x3BDba_sceneSvg",
	"sceneText": "x3BDba_sceneText",
	"seriesArea": "x3BDba_seriesArea",
	"seriesBar": "x3BDba_seriesBar",
	"seriesLine": "x3BDba_seriesLine",
	"seriesPoint": "x3BDba_seriesPoint",
	"seriesToggle": "x3BDba_seriesToggle",
	"seriesToggles": "x3BDba_seriesToggles",
	"shapeLabel": "x3BDba_shapeLabel",
	"tickLabel": "x3BDba_tickLabel",
	"zeroAxis": "x3BDba_zeroAxis"
};
//#endregion
//#region src/client/visuals/renderers/PlotRenderer.tsx
/** `plot`: quantitative relationships on axes, with optional live parameters. */
function initialParameterValues(content, storageKey) {
	const parameters = content.parameters ?? [];
	const values = Object.fromEntries(parameters.map((parameter) => [parameter.id, parameter.initial]));
	if (storageKey === void 0 || typeof sessionStorage === "undefined") return values;
	try {
		const stored = JSON.parse(sessionStorage.getItem(`dsh-learning/visual@4:${storageKey}`) ?? "{}");
		for (const parameter of parameters) {
			const candidate = stored[parameter.id];
			if (typeof candidate === "number" && Number.isFinite(candidate) && candidate >= parameter.min && candidate <= parameter.max) values[parameter.id] = candidate;
		}
	} catch {}
	return values;
}
/**
* Sample one curve into a path, and report whether any sample is actually
* visible inside the declared axes.
*
* A schema-valid curve can still produce nothing to look at: `log` or `sqrt`
* over a negative domain yields no finite value, and a curve whose outputs sit
* far outside the declared y range is drawn entirely outside the clip. Both
* would otherwise leave the learner staring at an empty frame.
*/
function plotCurveRender(series, content, values, geometry, yAxis, evaluate) {
	const samples = content.xAxis.samples ?? 160;
	const commands = [];
	const segments = [];
	let currentSegment = [];
	let drawing = false;
	let previousY;
	let visible = false;
	for (let index = 0; index < samples; index += 1) {
		const x = interpolate(content.xAxis.min, content.xAxis.max, index / Math.max(1, samples - 1));
		const y = evaluate({
			...values,
			x
		});
		if (!Number.isFinite(y) || Math.abs(y) > 0xe8d4a51000) {
			if (currentSegment.length > 0) segments.push(currentSegment);
			currentSegment = [];
			drawing = false;
			previousY = void 0;
			continue;
		}
		if (y >= yAxis.min && y <= yAxis.max) visible = true;
		const px = scaleX(x, content.xAxis, geometry);
		const py = scaleY(y, yAxis, geometry);
		if (previousY !== void 0 && Math.abs(previousY - py) > geometry.plotHeight * 2) {
			if (currentSegment.length > 0) segments.push(currentSegment);
			currentSegment = [];
			drawing = false;
		}
		commands.push(`${drawing ? "L" : "M"}${px.toFixed(2)},${py.toFixed(2)}`);
		currentSegment.push({
			px,
			py
		});
		drawing = true;
		previousY = py;
	}
	if (currentSegment.length > 0) segments.push(currentSegment);
	const zeroY = scaleY(Math.max(yAxis.min, Math.min(yAxis.max, 0)), yAxis, geometry);
	const areaPath = segments.filter((segment) => segment.length > 1).map((segment) => {
		const segmentCommands = segment.map((point, index) => `${index === 0 ? "M" : "L"}${point.px.toFixed(2)},${point.py.toFixed(2)}`);
		const first = segment[0];
		const last = segment[segment.length - 1];
		return `${segmentCommands.join(" ")} L ${last.px.toFixed(2)},${zeroY.toFixed(2)} L ${first.px.toFixed(2)},${zeroY.toFixed(2)} Z`;
	}).join(" ") || void 0;
	return {
		path: commands.join(" "),
		areaPath,
		visible
	};
}
/** Whether any declared point of a plotted series falls inside both axes. */
function pointsVisible(points, content, yAxis) {
	return points.some((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= content.xAxis.min && point.x <= content.xAxis.max && point.y >= yAxis.min && point.y <= yAxis.max);
}
function pointsPath(points, content, geometry, yAxis) {
	return points.map((point, index) => `${index === 0 ? "M" : "L"}${scaleX(point.x, content.xAxis, geometry).toFixed(2)},${scaleY(point.y, yAxis, geometry).toFixed(2)}`).join(" ");
}
function nearestPoint(points, x) {
	let nearest;
	for (const point of points) if (nearest === void 0 || Math.abs(point.x - x) < Math.abs(nearest.x - x)) nearest = point;
	return nearest;
}
/** Keep the declared y range as the default, but reveal values that move
* outside it while a live parameter changes. A cap avoids a single
* asymptote flattening the entire chart. */
const AUTO_FIT_VALUE_LIMIT = 1e9;
function autoFitYAxis(content, values, compiledCurves) {
	const samples = [];
	for (const series of content.series) if (series.type === "curve" && (content.parameters?.length ?? 0) > 0) {
		const evaluate = compiledCurves.get(series.id);
		if (evaluate === void 0) continue;
		const count = content.xAxis.samples ?? 160;
		for (let index = 0; index < count; index += 1) {
			const x = interpolate(content.xAxis.min, content.xAxis.max, index / Math.max(1, count - 1));
			const y = evaluate({
				...values,
				x
			});
			if (Number.isFinite(y) && Math.abs(y) <= AUTO_FIT_VALUE_LIMIT) samples.push(y);
		}
	}
	if (samples.length === 0) return content.yAxis;
	const minimum = Math.min(content.yAxis.min, ...samples);
	const maximum = Math.max(content.yAxis.max, ...samples);
	if (minimum >= content.yAxis.min && maximum <= content.yAxis.max) return content.yAxis;
	const span = Math.max(Number.EPSILON, maximum - minimum);
	const padding = Math.max(Number.EPSILON, span * .08);
	return {
		...content.yAxis,
		min: minimum - padding,
		max: maximum + padding
	};
}
function interpolatedLineValue(points, x) {
	const sorted = [...points].sort((left, right) => left.x - right.x);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	if (first === void 0 || last === void 0) return void 0;
	if (x <= first.x) return first.y;
	if (x >= last.x) return last.y;
	for (let index = 1; index < sorted.length; index += 1) {
		const previous = sorted[index - 1];
		const current = sorted[index];
		if (previous === void 0 || current === void 0) continue;
		if (x <= current.x) {
			const span = current.x - previous.x;
			return span === 0 ? current.y : previous.y + (current.y - previous.y) * ((x - previous.x) / span);
		}
	}
	return last.y;
}
function PlotRenderer({ content, focus, storageKey }) {
	const labels = useVisualLabels();
	const id = useId();
	const [viewportRef, containerWidth] = useContainerWidth();
	const geometry = useMemo(() => chartGeometry(containerWidth), [containerWidth]);
	const [values, setValues] = useState(() => initialParameterValues(content, storageKey));
	const [hiddenSeries, setHiddenSeries] = useState(() => /* @__PURE__ */ new Set());
	const [probeX, setProbeX] = useState();
	const compiledCurves = useMemo(() => new Map(content.series.flatMap((series) => series.type === "curve" ? [[series.id, compileMathExpression(series.expression)]] : [])), [content.series]);
	const compiledMetrics = useMemo(() => new Map((content.metrics ?? []).map((metric) => [metric.id, compileMathExpression(metric.expression)])), [content.metrics]);
	const viewYAxis = useMemo(() => autoFitYAxis(content, values, compiledCurves), [
		compiledCurves,
		content,
		values
	]);
	const xTicks = useMemo(() => ticks(content.xAxis.min, content.xAxis.max), [content.xAxis.max, content.xAxis.min]);
	const yTicks = useMemo(() => ticks(viewYAxis.min, viewYAxis.max), [viewYAxis.max, viewYAxis.min]);
	const parameters = content.parameters ?? [];
	useEffect(() => {
		if (storageKey === void 0 || typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.setItem(`dsh-learning/visual@4:${storageKey}`, JSON.stringify(values));
		} catch {}
	}, [storageKey, values]);
	const renders = useMemo(() => new Map(content.series.map((series) => [series.id, series.type === "curve" ? plotCurveRender(series, content, values, geometry, viewYAxis, compiledCurves.get(series.id) ?? ((bindings) => evaluateMathExpression(series.expression, bindings))) : {
		path: void 0,
		areaPath: void 0,
		visible: pointsVisible(series.points, content, viewYAxis)
	}])), [
		compiledCurves,
		content,
		geometry,
		values,
		viewYAxis
	]);
	const visibleSeries = content.series.filter((series) => !hiddenSeries.has(series.id));
	const emptySeriesIds = new Set(content.series.filter((series) => renders.get(series.id)?.visible !== true).map((series) => series.id));
	const nothingToSee = visibleSeries.length > 0 && visibleSeries.every((series) => emptySeriesIds.has(series.id));
	const probeValues = probeX === void 0 ? [] : visibleSeries.flatMap((series) => {
		if (series.type === "curve") {
			const y = compiledCurves.get(series.id)?.({
				...values,
				x: probeX
			});
			return y === void 0 || !Number.isFinite(y) ? [] : [{
				id: series.id,
				label: series.label,
				x: probeX,
				y,
				tone: series.tone
			}];
		}
		if (series.type === "line") {
			const y = interpolatedLineValue(series.points, probeX);
			return y === void 0 || !Number.isFinite(y) ? [] : [{
				id: series.id,
				label: series.label,
				x: probeX,
				y,
				tone: series.tone
			}];
		}
		const nearest = nearestPoint(series.points, probeX);
		return nearest === void 0 || !Number.isFinite(nearest.y) ? [] : [{
			id: series.id,
			label: series.label,
			x: nearest.x,
			y: nearest.y,
			tone: series.tone,
			discrete: true
		}];
	});
	const chartDescription = `${content.xAxis.label ?? "x"} ${formatNumber(content.xAxis.min)}–${formatNumber(content.xAxis.max)}; ${viewYAxis.label ?? "y"} ${formatNumber(viewYAxis.min)}–${formatNumber(viewYAxis.max)}; ${content.series.map((series) => series.label).join(", ")}${nothingToSee ? `. ${labels.noValuesInRange}` : ""}`;
	const probeDescription = probeX === void 0 ? `${labels.chartProbeHint}. ${chartDescription}` : `x ${formatNumber(probeX)}。${probeValues.map((item) => `${item.label}${item.discrete ? `（最近点 x ${formatNumber(item.x)}）` : ""} ${formatNumber(item.y)}`).join("，")}`;
	const updateProbeFromPointer = (event) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const viewX = (event.clientX - rect.left) / rect.width * geometry.width;
		const viewY = (event.clientY - rect.top) / rect.height * geometry.height;
		if (viewX < geometry.left - 4 || viewX > geometry.left + geometry.plotWidth + 4 || viewY < geometry.top - 4 || viewY > geometry.top + geometry.plotHeight + 4) {
			setProbeX(void 0);
			return;
		}
		const ratio = Math.max(0, Math.min(1, (viewX - geometry.left) / geometry.plotWidth));
		setProbeX(interpolate(content.xAxis.min, content.xAxis.max, ratio));
	};
	const moveProbe = (event) => {
		const step = (content.xAxis.max - content.xAxis.min) / 50;
		if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
			event.preventDefault();
			const current = probeX ?? (content.xAxis.min + content.xAxis.max) / 2;
			setProbeX(Math.max(content.xAxis.min, Math.min(content.xAxis.max, current + (event.key === "ArrowLeft" ? -step : step))));
		} else if (event.key === "Home") {
			event.preventDefault();
			setProbeX(content.xAxis.min);
		} else if (event.key === "End") {
			event.preventDefault();
			setProbeX(content.xAxis.max);
		} else if (event.key === "Escape") setProbeX(void 0);
	};
	const toggleSeries = (seriesId) => {
		setHiddenSeries((current) => {
			const next = new Set(current);
			if (next.has(seriesId)) next.delete(seriesId);
			else next.add(seriesId);
			return next;
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [
			parameters.length === 0 ? null : /* @__PURE__ */ jsx("div", {
				className: plot_module_css_default.parameterGrid,
				children: parameters.map((parameter) => {
					const value = values[parameter.id] ?? parameter.initial;
					const inputId = `${id}-${parameter.id}`;
					const progress = normalizedPosition(value, parameter.min, parameter.max) * 100;
					return /* @__PURE__ */ jsxs("label", {
						className: plot_module_css_default.parameter,
						htmlFor: inputId,
						"data-visual-id": parameter.id,
						"data-visual-state": elementState(parameter.id, focus),
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: plot_module_css_default.parameterHeader,
								children: [/* @__PURE__ */ jsx("span", { children: parameter.label }), /* @__PURE__ */ jsx("output", {
									htmlFor: inputId,
									children: formatNumber(value)
								})]
							}),
							/* @__PURE__ */ jsx("input", {
								id: inputId,
								type: "range",
								min: parameter.min,
								max: parameter.max,
								step: parameter.step,
								value,
								style: { "--range-progress": `${progress}%` },
								onChange: (event) => setValues((current) => ({
									...current,
									[parameter.id]: Number(event.target.value)
								}))
							}),
							/* @__PURE__ */ jsxs("span", {
								className: plot_module_css_default.parameterEnds,
								"aria-hidden": "true",
								children: [/* @__PURE__ */ jsx("span", { children: formatNumber(parameter.min) }), /* @__PURE__ */ jsx("span", { children: formatNumber(parameter.max) })]
							})
						]
					}, parameter.id);
				})
			}),
			content.metrics === void 0 || content.metrics.length === 0 ? null : /* @__PURE__ */ jsx("dl", {
				className: plot_module_css_default.metrics,
				"aria-label": labels.metricsLabel,
				children: content.metrics.map((metric) => /* @__PURE__ */ jsxs("div", {
					"data-visual-id": metric.id,
					"data-visual-state": elementState(metric.id, focus),
					children: [/* @__PURE__ */ jsx("dt", { children: metric.label }), /* @__PURE__ */ jsxs("dd", { children: [formatNumber(compiledMetrics.get(metric.id)?.(values) ?? evaluateMathExpression(metric.expression, values), metric.digits), metric.suffix ?? ""] })]
				}, metric.id))
			}),
			/* @__PURE__ */ jsxs(FigureViewport, {
				viewportRef,
				children: [
					/* @__PURE__ */ jsxs("svg", {
						className: plot_module_css_default.plotSvg,
						width: geometry.width,
						height: geometry.height,
						viewBox: `0 0 ${geometry.width} ${geometry.height}`,
						role: "img",
						tabIndex: 0,
						"aria-label": probeDescription,
						onPointerMove: updateProbeFromPointer,
						onPointerLeave: () => setProbeX(void 0),
						onKeyDown: moveProbe,
						children: [
							/* @__PURE__ */ jsxs("defs", { children: [/* @__PURE__ */ jsx("clipPath", {
								id: `${id}-plot-clip`,
								children: /* @__PURE__ */ jsx("rect", {
									x: geometry.left,
									y: geometry.top,
									width: geometry.plotWidth,
									height: geometry.plotHeight
								})
							}), DEFAULT_TONES.map((tone) => /* @__PURE__ */ jsxs("linearGradient", {
								id: `${id}-area-${tone}`,
								x1: "0",
								y1: "0",
								x2: "0",
								y2: "1",
								children: [
									/* @__PURE__ */ jsx("stop", {
										offset: "0%",
										stopColor: `var(--lx-tone-${tone})`,
										stopOpacity: "0.2"
									}),
									/* @__PURE__ */ jsx("stop", {
										offset: "85%",
										stopColor: `var(--lx-tone-${tone})`,
										stopOpacity: "0.03"
									}),
									/* @__PURE__ */ jsx("stop", {
										offset: "100%",
										stopColor: `var(--lx-tone-${tone})`,
										stopOpacity: "0"
									})
								]
							}, tone))] }),
							/* @__PURE__ */ jsx("rect", {
								className: plot_module_css_default.plotFrame,
								x: geometry.left,
								y: geometry.top,
								width: geometry.plotWidth,
								height: geometry.plotHeight,
								rx: "6"
							}),
							yTicks.map((value) => {
								const y = scaleY(value, viewYAxis, geometry);
								return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
									className: plot_module_css_default.gridLine,
									x1: geometry.left,
									x2: geometry.left + geometry.plotWidth,
									y1: y,
									y2: y
								}), /* @__PURE__ */ jsx("text", {
									className: plot_module_css_default.tickLabel,
									x: geometry.left - 9,
									y,
									textAnchor: "end",
									dominantBaseline: "middle",
									children: formatNumber(value)
								})] }, `y-${String(value)}`);
							}),
							xTicks.map((value) => {
								const x = scaleX(value, content.xAxis, geometry);
								return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
									className: plot_module_css_default.gridLine,
									x1: x,
									x2: x,
									y1: geometry.top,
									y2: geometry.top + geometry.plotHeight
								}), /* @__PURE__ */ jsx("text", {
									className: plot_module_css_default.tickLabel,
									x,
									y: geometry.top + geometry.plotHeight + 19,
									textAnchor: "middle",
									children: formatNumber(value)
								})] }, `x-${String(value)}`);
							}),
							/* @__PURE__ */ jsxs("g", {
								clipPath: `url(#${id}-plot-clip)`,
								children: [
									content.series.map((series, seriesIndex) => {
										if (hiddenSeries.has(series.id) || series.type !== "curve") return null;
										const tone = toneAt(series.tone, seriesIndex);
										const state = elementState(series.id, focus);
										const render = renders.get(series.id);
										if (!render?.areaPath) return null;
										return /* @__PURE__ */ jsx("path", {
											className: plot_module_css_default.seriesArea,
											"data-tone": tone,
											"data-visual-state": state,
											"data-visual-id": series.id,
											fill: `url(#${id}-area-${tone})`,
											d: render.areaPath
										}, `area-${series.id}`);
									}),
									content.series.map((series, seriesIndex) => {
										if (hiddenSeries.has(series.id)) return null;
										const tone = toneAt(series.tone, seriesIndex);
										const state = elementState(series.id, focus);
										if (series.type === "curve") return /* @__PURE__ */ jsx("path", {
											className: plot_module_css_default.seriesLine,
											"data-tone": tone,
											"data-visual-state": state,
											"data-visual-id": series.id,
											"data-stroke": series.stroke ?? "solid",
											d: renders.get(series.id)?.path
										}, series.id);
										if (series.type === "line") return /* @__PURE__ */ jsx("path", {
											className: plot_module_css_default.seriesLine,
											"data-tone": tone,
											"data-visual-state": state,
											"data-visual-id": series.id,
											"data-stroke": series.stroke ?? "solid",
											d: pointsPath(series.points, content, geometry, viewYAxis)
										}, series.id);
										if (series.type === "bars") {
											const sortedXs = series.points.map((point) => scaleX(point.x, content.xAxis, geometry)).sort((a, b) => a - b);
											const smallestGap = sortedXs.slice(1).reduce((gap, x, index) => Math.min(gap, x - (sortedXs[index] ?? x)), geometry.plotWidth / Math.max(1, sortedXs.length));
											const barWidth = Math.max(6, Math.min(44, smallestGap * .68));
											const zeroY = scaleY(Math.max(viewYAxis.min, Math.min(viewYAxis.max, 0)), viewYAxis, geometry);
											return /* @__PURE__ */ jsx("g", {
												"data-visual-id": series.id,
												"data-visual-state": state,
												children: series.points.map((point, pointIndex) => {
													const x = scaleX(point.x, content.xAxis, geometry);
													const y = scaleY(point.y, viewYAxis, geometry);
													return /* @__PURE__ */ jsx("rect", {
														className: plot_module_css_default.seriesBar,
														"data-tone": tone,
														x: x - barWidth / 2,
														y: Math.min(y, zeroY),
														width: barWidth,
														height: Math.max(1, Math.abs(zeroY - y)),
														rx: "2",
														children: /* @__PURE__ */ jsx("title", { children: point.label ?? `${series.label}: ${formatNumber(point.y)}` })
													}, `${series.id}-${String(pointIndex)}`);
												})
											}, series.id);
										}
										return /* @__PURE__ */ jsx("g", {
											"data-visual-id": series.id,
											"data-visual-state": state,
											children: series.points.map((point, pointIndex) => /* @__PURE__ */ jsx("circle", {
												className: plot_module_css_default.seriesPoint,
												"data-tone": tone,
												cx: scaleX(point.x, content.xAxis, geometry),
												cy: scaleY(point.y, viewYAxis, geometry),
												r: "5",
												children: /* @__PURE__ */ jsx("title", { children: point.label ?? `${series.label}: (${formatNumber(point.x)}, ${formatNumber(point.y)})` })
											}, `${series.id}-${String(pointIndex)}`))
										}, series.id);
									}),
									probeX === void 0 ? null : /* @__PURE__ */ jsx("line", {
										className: plot_module_css_default.probeLine,
										x1: scaleX(probeX, content.xAxis, geometry),
										x2: scaleX(probeX, content.xAxis, geometry),
										y1: geometry.top,
										y2: geometry.top + geometry.plotHeight
									}),
									probeX === void 0 ? null : probeValues.map((item, index) => /* @__PURE__ */ jsx("circle", {
										className: plot_module_css_default.probePoint,
										"data-tone": toneAt(item.tone, index),
										cx: scaleX(item.x, content.xAxis, geometry),
										cy: scaleY(item.y, viewYAxis, geometry),
										r: "5.5"
									}, item.id))
								]
							}),
							/* @__PURE__ */ jsx("text", {
								className: plot_module_css_default.axisLabel,
								x: geometry.left + geometry.plotWidth / 2,
								y: geometry.height - 6,
								textAnchor: "middle",
								children: content.xAxis.label ?? "x"
							}),
							/* @__PURE__ */ jsx("text", {
								className: plot_module_css_default.axisLabel,
								x: "14",
								y: geometry.top + geometry.plotHeight / 2,
								textAnchor: "middle",
								transform: `rotate(-90 14 ${geometry.top + geometry.plotHeight / 2})`,
								children: viewYAxis.label ?? "y"
							})
						]
					}),
					!nothingToSee ? null : /* @__PURE__ */ jsx("p", {
						className: plot_module_css_default.emptyPlotNotice,
						role: "note",
						children: labels.noValuesInRange
					}),
					probeX === void 0 ? null : /* @__PURE__ */ jsxs("div", {
						className: plot_module_css_default.probeCard,
						"aria-hidden": "true",
						children: [/* @__PURE__ */ jsxs("strong", { children: ["x = ", formatNumber(probeX)] }), probeValues.map((item, index) => /* @__PURE__ */ jsxs("span", {
							"data-tone": toneAt(item.tone, index),
							children: [
								item.label,
								item.discrete ? ` · x=${formatNumber(item.x)}` : "",
								": ",
								formatNumber(item.y)
							]
						}, item.id))]
					})
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: shell_module_css_default.srOnly,
				role: "status",
				"aria-live": "polite",
				children: probeX === void 0 ? "" : probeDescription
			}),
			/* @__PURE__ */ jsx("div", {
				className: plot_module_css_default.seriesToggles,
				role: "group",
				"aria-label": labels.legendLabel,
				children: content.series.map((series, index) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: `${shell_module_css_default.control} ${plot_module_css_default.seriesToggle}`,
					"aria-pressed": !hiddenSeries.has(series.id),
					"data-tone": toneAt(series.tone, index),
					"data-series-type": series.type,
					"data-stroke": "stroke" in series ? series.stroke ?? "solid" : void 0,
					"data-empty": emptySeriesIds.has(series.id) || void 0,
					title: emptySeriesIds.has(series.id) ? labels.seriesOutOfRange : void 0,
					onClick: () => toggleSeries(series.id),
					children: [
						/* @__PURE__ */ jsx("span", { "aria-hidden": "true" }),
						series.label,
						!emptySeriesIds.has(series.id) ? null : /* @__PURE__ */ jsx("small", { children: labels.seriesOutOfRange })
					]
				}, series.id))
			}),
			/* @__PURE__ */ jsx("div", {
				className: shell_module_css_default.selectionSlot,
				children: /* @__PURE__ */ jsx("p", {
					className: shell_module_css_default.interactionHint,
					children: labels.plotInteractionHint
				})
			})
		]
	});
}
//#endregion
//#region src/client/visuals/state/graph-state.ts
/** Above this node count a figure is dense enough for a fourth, quieter tier. */
const DENSE_GRAPH_NODES = 26;
function graphEmphasis(content, focus) {
	if (!focus.active) return {
		state: () => "overview",
		active: false
	};
	const nodeIds = new Set(content.nodes.map((node) => node.id));
	const incoming = /* @__PURE__ */ new Map();
	const outgoing = /* @__PURE__ */ new Map();
	for (const edge of content.edges) {
		incoming.set(edge.to, [...incoming.get(edge.to) ?? [], {
			edgeId: edge.id,
			from: edge.from
		}]);
		outgoing.set(edge.from, [...outgoing.get(edge.from) ?? [], {
			edgeId: edge.id,
			to: edge.to
		}]);
	}
	const related = /* @__PURE__ */ new Set();
	const seedNodes = [];
	for (const id of focus.currentIds) if (nodeIds.has(id)) seedNodes.push(id);
	for (const edge of content.edges) {
		if (!focus.currentIds.has(edge.id)) continue;
		related.add(edge.from);
		related.add(edge.to);
		seedNodes.push(edge.from);
	}
	for (const node of content.nodes) {
		if (node.group !== void 0 && focus.currentIds.has(node.group)) {
			related.add(node.id);
			seedNodes.push(node.id);
		}
		if (focus.currentIds.has(node.id) && node.group !== void 0) related.add(node.group);
	}
	const visitedAncestors = /* @__PURE__ */ new Set();
	const queue = [...seedNodes];
	while (queue.length > 0) {
		const current = queue.shift();
		if (current === void 0 || visitedAncestors.has(current)) continue;
		visitedAncestors.add(current);
		for (const step of incoming.get(current) ?? []) {
			related.add(step.edgeId);
			related.add(step.from);
			queue.push(step.from);
		}
	}
	for (const id of focus.currentIds) for (const step of outgoing.get(id) ?? []) {
		related.add(step.edgeId);
		related.add(step.to);
	}
	const dense = content.nodes.length > DENSE_GRAPH_NODES;
	return {
		active: true,
		state: (id) => {
			if (focus.currentIds.has(id)) return "current";
			if (related.has(id)) return "related";
			if (focus.visitedIds.has(id)) return "visited";
			return dense ? "inactive" : "context";
		}
	};
}
//#endregion
//#region src/client/visuals/layout/text-metrics.ts
/**
* Label measurement for SVG figures.
*
* Node boxes used to be fixed 29px-radius circles holding 10px text, which
* meant a four-character Chinese label filled the circle edge to edge and a
* longer one simply overflowed it. Sizing a node needs the label's real extent,
* and `measureText` is not available during the first layout pass (or in the
* test environment), so widths are estimated per script instead: CJK, fullwidth
* punctuation and emoji occupy roughly one em, Latin roughly 0.55em, and digits
* and spaces slightly less.
*/
const WIDE_CHARACTER = /[\u1100-\u115F\u2E80-\uA4CF\uA960-\uA97F\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/;
const THIN_CHARACTER = /[\s.,:;!|'`()[\]{}\-ilj]/;
/** Estimated advance width of one character at the given font size. */
function characterWidth(character, fontSize) {
	if (WIDE_CHARACTER.test(character)) return fontSize;
	if (THIN_CHARACTER.test(character)) return fontSize * .32;
	if (/[0-9]/.test(character)) return fontSize * .56;
	if (/[A-Z]/.test(character)) return fontSize * .66;
	return fontSize * .55;
}
/** Estimated rendered width of a whole string. */
function measureText(text, fontSize) {
	let width = 0;
	for (const character of text) width += characterWidth(character, fontSize);
	return width;
}
function greedyWrap(text, { fontSize, maxWidth, maxLines = 3 }) {
	const source = text.trim();
	if (source === "") return {
		lines: [""],
		width: 0,
		truncated: false
	};
	if (measureText(source, fontSize) <= maxWidth) return {
		lines: [source],
		width: measureText(source, fontSize),
		truncated: false
	};
	const lines = [];
	let line = "";
	let lineWidth = 0;
	let lastBreak = -1;
	const flush = () => {
		lines.push(line);
		line = "";
		lineWidth = 0;
		lastBreak = -1;
	};
	for (const character of source) {
		const width = characterWidth(character, fontSize);
		if (lineWidth + width > maxWidth && line !== "") {
			if (lastBreak > 0 && !WIDE_CHARACTER.test(character)) {
				const carry = line.slice(lastBreak).trimStart();
				line = line.slice(0, lastBreak).trimEnd();
				flush();
				line = carry;
				lineWidth = measureText(carry, fontSize);
			} else flush();
			if (lines.length >= maxLines) break;
		}
		if (/[\s-]/.test(character)) lastBreak = line.length;
		line += character;
		lineWidth += width;
	}
	if (line !== "" && lines.length < maxLines) lines.push(line);
	const truncated = lines.join("").length < source.length;
	if (truncated) {
		const last = lines[lines.length - 1] ?? "";
		lines[lines.length - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
	}
	return {
		lines,
		width: Math.max(...lines.map((entry) => measureText(entry, fontSize))),
		truncated
	};
}
/**
* Wrap a label to at most `maxLines`, breaking between CJK characters and at
* spaces or hyphens for Latin text. The final line is ellipsised rather than
* clipped, and the untruncated text always remains the accessible name.
*
* Filling each line to the limit before starting the next one produces
* “算出每个候选词的概” over “率”: a box as wide as the limit for a label that
* would read better as two half lines, and — on an edge label — a column gap
* opened to hold a width the text does not need. The greedy pass decides how
* many lines the label takes; the same pass is then re-run against the average
* line width to distribute the text evenly over them.
*/
function wrapLabel(text, options) {
	const greedy = greedyWrap(text, options);
	if (greedy.lines.length < 2 || greedy.truncated) return greedy;
	const average = measureText(text.trim(), options.fontSize) / greedy.lines.length;
	for (const slack of [
		1,
		1.08,
		1.16,
		1.24
	]) {
		const width = Math.min(options.maxWidth, average * slack + options.fontSize * .5);
		const balanced = greedyWrap(text, {
			...options,
			maxWidth: width
		});
		if (!balanced.truncated && balanced.lines.length === greedy.lines.length) return balanced;
	}
	return greedy;
}
/** Two lines of this width read faster than one long line across a diagram. */
const EDGE_LABEL_MAX_WIDTH = 118;
const EDGE_LABEL_MAX_LINES = 2;
function edgeLabelBox(label) {
	const wrapped = wrapLabel(label, {
		fontSize: 12,
		maxWidth: EDGE_LABEL_MAX_WIDTH,
		maxLines: EDGE_LABEL_MAX_LINES
	});
	return {
		lines: wrapped.lines,
		width: Math.round(wrapped.width + 14),
		height: wrapped.lines.length * 15 + 6,
		truncated: wrapped.truncated
	};
}
/** Corner radius that reads as a capsule for one line and a chip for two. */
function edgeLabelRadius(box) {
	return box.lines.length === 1 ? box.height / 2 : 8;
}
const NODE_MAX_TEXT_WIDTH = 124;
const NODE_MIN_WIDTH = 66;
const NODE_MIN_HEIGHT = 36;
const NODE_LINE_HEIGHT$1 = 17;
const CANVAS_PADDING = 14;
const HEADER_HEIGHT = 28;
const SIBLING_GAP = 22;
const MAIN_GAP_MIN = 58;
const MAIN_GAP_BASE = 78;
const MAIN_GAP_MAX = 196;
/** Distance from the content to the first return lane, and between lanes. */
const LANE_GAP = 34;
const LANE_STEP = 30;
/** Text below this scale stops being comfortably readable, so we scroll instead. */
const MINIMUM_FIT_SCALE = .82;
/** Group nodes into the bands the layout draws: declared groups, else levels. */
function graphLayers(content) {
	if (content.groups !== void 0 && content.groups.length > 0) {
		const grouped = content.groups.map((group) => ({
			id: group.id,
			label: group.label,
			nodes: content.nodes.filter((node) => node.group === group.id)
		})).filter((layer) => layer.nodes.length > 0);
		const knownGroups = new Set(content.groups.map((group) => group.id));
		const ungrouped = content.nodes.filter((node) => node.group === void 0 || !knownGroups.has(node.group));
		if (ungrouped.length > 0) grouped.push({
			id: "ungrouped",
			label: void 0,
			nodes: ungrouped
		});
		return grouped;
	}
	const incoming = new Map(content.nodes.map((node) => [node.id, 0]));
	const outgoing = new Map(content.nodes.map((node) => [node.id, []]));
	const parents = new Map(content.nodes.map((node) => [node.id, []]));
	for (const edge of content.edges) {
		incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
		outgoing.get(edge.from)?.push(edge.to);
		parents.get(edge.to)?.push(edge.from);
	}
	const levels = new Map(content.nodes.map((node) => [node.id, 0]));
	const queue = content.nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0).map((node) => node.id);
	const visited = /* @__PURE__ */ new Set();
	while (queue.length > 0) {
		const current = queue.shift();
		if (current === void 0) break;
		visited.add(current);
		for (const target of outgoing.get(current) ?? []) {
			levels.set(target, Math.max(levels.get(target) ?? 0, (levels.get(current) ?? 0) + 1));
			incoming.set(target, (incoming.get(target) ?? 1) - 1);
			if (incoming.get(target) === 0) queue.push(target);
		}
	}
	for (const node of content.nodes) {
		if (visited.has(node.id)) continue;
		const settled = (parents.get(node.id) ?? []).filter((parent) => visited.has(parent));
		visited.add(node.id);
		levels.set(node.id, Math.max(0, ...settled.map((parent) => (levels.get(parent) ?? 0) + 1)));
		const walk = [node.id];
		while (walk.length > 0) {
			const current = walk.shift();
			if (current === void 0) break;
			for (const target of outgoing.get(current) ?? []) {
				if (visited.has(target)) continue;
				visited.add(target);
				levels.set(target, (levels.get(current) ?? 0) + 1);
				walk.push(target);
			}
		}
	}
	const levelCount = Math.max(0, ...levels.values()) + 1;
	return Array.from({ length: levelCount }, (_, index) => ({
		id: `layer-${String(index)}`,
		label: void 0,
		nodes: content.nodes.filter((node) => levels.get(node.id) === index)
	})).filter((layer) => layer.nodes.length > 0);
}
/** Size one node box around its wrapped label. */
function nodeBox(node) {
	const wrapped = wrapLabel(node.label, {
		fontSize: 13,
		maxWidth: NODE_MAX_TEXT_WIDTH
	});
	const width = Math.max(NODE_MIN_WIDTH, Math.round(wrapped.width + 30));
	const height = Math.max(NODE_MIN_HEIGHT, wrapped.lines.length * NODE_LINE_HEIGHT$1 + 20);
	return {
		id: node.id,
		width,
		height,
		cornerRadius: wrapped.lines.length === 1 ? height / 2 : 12,
		lines: wrapped.lines,
		truncated: wrapped.truncated
	};
}
function fitScale(width, containerWidth) {
	if (containerWidth <= 0 || width <= containerWidth) return 1;
	return Math.max(MINIMUM_FIT_SCALE, containerWidth / width);
}
function finish(layout, containerWidth) {
	const scale = fitScale(layout.width, containerWidth);
	return {
		...layout,
		scale,
		renderWidth: Math.round(layout.width * scale),
		renderHeight: Math.round(layout.height * scale)
	};
}
function radialLayout(content, containerWidth, boxes) {
	const sizes = [...boxes.values()];
	const widest = Math.max(...sizes.map((box) => box.width));
	const tallest = Math.max(...sizes.map((box) => box.height));
	const count = Math.max(1, content.nodes.length);
	const radius = Math.max(96, count * (widest + SIBLING_GAP) / (2 * Math.PI));
	const width = Math.round(radius * 2 + widest + 28);
	const height = Math.round(radius * 2 + tallest + 28);
	const centerX = width / 2;
	const centerY = height / 2;
	const positioned = /* @__PURE__ */ new Map();
	content.nodes.forEach((node, index) => {
		const angle = -Math.PI / 2 + index / count * Math.PI * 2;
		const box = boxes.get(node.id);
		if (box === void 0) return;
		positioned.set(node.id, {
			...box,
			x: centerX + Math.cos(angle) * radius,
			y: centerY + Math.sin(angle) * radius
		});
	});
	return finish({
		width,
		height,
		nodes: positioned,
		layers: [],
		orientation: "radial",
		showHeaders: false,
		layerIndex: /* @__PURE__ */ new Map(),
		feedbackLanes: /* @__PURE__ */ new Map()
	}, containerWidth);
}
/**
* Reserve the space the edges need before the nodes are placed.
*
* Without this pass the gaps are constants and the labels are laid on top of
* whatever those constants happened to leave over — which is how a five-edge
* diagram ended up with every chip across a node box or another chip.
*/
function planGaps(content, layerIndex, layerCount, vertical) {
	const mainGaps = Array.from({ length: Math.max(0, layerCount - 1) }, () => 0);
	const siblingGaps = Array.from({ length: layerCount }, () => SIBLING_GAP);
	const feedback = [];
	let laneLabel = 0;
	for (const edge of content.edges) {
		const from = layerIndex.get(edge.from);
		const to = layerIndex.get(edge.to);
		if (from === void 0 || to === void 0) continue;
		const box = edge.label === void 0 ? void 0 : edgeLabelBox(edge.label);
		if (to < from) {
			feedback.push(edge.id);
			if (box !== void 0) laneLabel = Math.max(laneLabel, vertical ? box.width : box.height);
			continue;
		}
		if (box === void 0) continue;
		if (to === from) {
			siblingGaps[from] = Math.max(siblingGaps[from] ?? SIBLING_GAP, (vertical ? box.width : box.height) + 22);
			continue;
		}
		const gap = Math.min(from, mainGaps.length - 1);
		if (gap >= 0) mainGaps[gap] = Math.max(mainGaps[gap] ?? 0, (vertical ? box.height : box.width) + 22);
	}
	return {
		mainGaps,
		siblingGaps,
		feedback,
		laneSpace: feedback.length === 0 ? 0 : LANE_GAP + (Math.min(feedback.length, 3) - 1) * LANE_STEP + laneLabel / 2 + 10
	};
}
function graphLayout(content, containerWidth) {
	const boxes = new Map(content.nodes.map((node) => [node.id, nodeBox(node)]));
	if (content.layout === "radial") return radialLayout(content, containerWidth, boxes);
	const layers = graphLayers(content);
	const showHeaders = layers.length > 1 && content.groups !== void 0 && content.groups.length > 0;
	const headerSpace = showHeaders ? HEADER_HEIGHT : 0;
	const vertical = content.layout === "hierarchy";
	const positioned = /* @__PURE__ */ new Map();
	const layerIndex = /* @__PURE__ */ new Map();
	layers.forEach((layer, index) => {
		for (const node of layer.nodes) layerIndex.set(node.id, index);
	});
	const plan = planGaps(content, layerIndex, layers.length, vertical);
	const mainExtent = layers.map((layer) => Math.max(...layer.nodes.map((node) => (vertical ? boxes.get(node.id)?.height : boxes.get(node.id)?.width) ?? 0)));
	const crossExtent = layers.map((layer, index) => layer.nodes.reduce((total, node, position) => {
		const box = boxes.get(node.id);
		return total + ((vertical ? box?.width : box?.height) ?? 0) + (position === 0 ? 0 : plan.siblingGaps[index] ?? SIBLING_GAP);
	}, 0));
	const crossContent = Math.max(...crossExtent);
	const mainContent = mainExtent.reduce((total, size) => total + size, 0);
	const gapCount = Math.max(0, layers.length - 1);
	let mainGap = Math.min(MAIN_GAP_MAX, Math.max(vertical ? Math.max(MAIN_GAP_MIN, Math.round(MAIN_GAP_BASE * .72)) : MAIN_GAP_BASE, ...plan.mainGaps));
	const mainSpan = (gap) => 28 + mainContent + gapCount * gap;
	let width = vertical ? 28 + crossContent + plan.laneSpace : mainSpan(mainGap);
	if (!vertical && gapCount > 0 && width < containerWidth) {
		mainGap = Math.min(MAIN_GAP_MAX, mainGap + (containerWidth - width) / gapCount);
		width = mainSpan(mainGap);
	}
	if (vertical && width < containerWidth) width = Math.min(containerWidth, width + 28);
	const height = vertical ? 28 + headerSpace + mainContent + gapCount * mainGap : 28 + headerSpace + crossContent + plan.laneSpace;
	const mainStart = CANVAS_PADDING + (vertical ? headerSpace : 0);
	const crossStart = CANVAS_PADDING + (vertical ? 0 : headerSpace);
	const crossTrack = (vertical ? width : height) - crossStart - CANVAS_PADDING - plan.laneSpace;
	const bands = [];
	let mainCursor = mainStart;
	layers.forEach((layer, index) => {
		const mainSize = mainExtent[index] ?? 0;
		const crossSize = crossExtent[index] ?? 0;
		const siblingGap = plan.siblingGaps[index] ?? SIBLING_GAP;
		let crossCursor = crossStart + Math.max(0, (crossTrack - crossSize) / 2);
		for (const node of layer.nodes) {
			const box = boxes.get(node.id);
			if (box === void 0) continue;
			const crossOwn = vertical ? box.width : box.height;
			positioned.set(node.id, {
				...box,
				x: vertical ? crossCursor + crossOwn / 2 : mainCursor + mainSize / 2,
				y: vertical ? mainCursor + mainSize / 2 : crossCursor + crossOwn / 2
			});
			crossCursor += crossOwn + siblingGap;
		}
		bands.push({
			id: layer.id,
			label: layer.label,
			nodes: layer.nodes,
			headerX: vertical ? CANVAS_PADDING : mainCursor + mainSize / 2,
			headerY: vertical ? mainCursor - 12 : 27,
			headerAnchor: vertical ? "start" : "middle",
			band: vertical ? {
				x: CANVAS_PADDING / 2,
				y: mainCursor - 9,
				width: Math.max(0, width - CANVAS_PADDING),
				height: mainSize + 18
			} : {
				x: mainCursor - 11,
				y: crossStart - 9,
				width: mainSize + 22,
				height: Math.max(0, crossTrack + 18)
			}
		});
		mainCursor += mainSize + mainGap;
	});
	const contentEnd = crossStart + crossTrack;
	const feedbackLanes = new Map(plan.feedback.map((edgeId, index) => [edgeId, contentEnd + LANE_GAP + Math.min(index, 2) * LANE_STEP]));
	return finish({
		width: Math.round(width),
		height: Math.round(height),
		nodes: positioned,
		layers: bands,
		orientation: vertical ? "vertical" : "horizontal",
		showHeaders,
		layerIndex,
		feedbackLanes
	}, containerWidth);
}
/** Where a straight line towards `towards` leaves the border of `box`. */
function boxAnchor(box, towards, inset = 0) {
	const dx = towards.x - box.x;
	const dy = towards.y - box.y;
	if (dx === 0 && dy === 0) return {
		x: box.x,
		y: box.y
	};
	const halfWidth = box.width / 2 + inset;
	const halfHeight = box.height / 2 + inset;
	const scale = Math.min(dx === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(dx), dy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(dy));
	return {
		x: box.x + dx * scale,
		y: box.y + dy * scale
	};
}
//#endregion
//#region src/client/visuals/layout/graph-edges.ts
/** Positions along the curve to try, nearest the middle first. */
const SLIDE = [
	.5,
	.42,
	.58,
	.34,
	.66
];
/** Then the same positions lifted off the curve, alternating sides. */
const LIFT = [
	0,
	-16,
	16,
	-30,
	30
];
const NODE_CLEARANCE = 5;
const LABEL_CLEARANCE = 4;
/** Distance the arrowhead needs between the curve's end and the target box. */
const ARROW_INSET = 6;
const fixed = (value) => value.toFixed(1);
function pointOnCurve({ p0, p1, p2, p3 }, t) {
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const c = 3 * u * t * t;
	const d = t * t * t;
	return {
		x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
		y: a * p0.y + b * p1.y + c * p2.y + d * p3.y
	};
}
/** Unit normal of the curve at `t`, used to lift a label clear of its own line. */
function normalOnCurve({ p0, p1, p2, p3 }, t) {
	const u = 1 - t;
	const x = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
	const y = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
	const length = Math.hypot(x, y);
	if (length === 0) return {
		x: 0,
		y: -1
	};
	return {
		x: -y / length,
		y: x / length
	};
}
function curvePath(curve) {
	const { p0, p1, p2, p3 } = curve;
	return `M${fixed(p0.x)},${fixed(p0.y)} C${fixed(p1.x)},${fixed(p1.y)} ${fixed(p2.x)},${fixed(p2.y)} ${fixed(p3.x)},${fixed(p3.y)}`;
}
/**
* Control coordinate whose curve reaches `lane` at its midpoint.
*
* A cubic with both controls at L passes through `(a + b) / 8 + 0.75 · L`, so
* putting the controls on the lane would leave the arc well short of it.
*/
function laneControl(a, b, lane) {
	return (lane - (a + b) / 8) / .75;
}
function feedbackCurve(from, to, lane, vertical) {
	if (vertical) {
		const p0 = {
			x: from.x + from.width / 2,
			y: from.y
		};
		const p3 = {
			x: to.x + to.width / 2 + ARROW_INSET,
			y: to.y
		};
		const control = laneControl(p0.x, p3.x, lane);
		return {
			p0,
			p1: {
				x: control,
				y: p0.y
			},
			p2: {
				x: control,
				y: p3.y
			},
			p3
		};
	}
	const p0 = {
		x: from.x,
		y: from.y + from.height / 2
	};
	const p3 = {
		x: to.x,
		y: to.y + to.height / 2 + ARROW_INSET
	};
	const control = laneControl(p0.y, p3.y, lane);
	return {
		p0,
		p1: {
			x: p0.x,
			y: control
		},
		p2: {
			x: p3.x,
			y: control
		},
		p3
	};
}
function flowCurve(from, to, orientation) {
	const p0 = boxAnchor(from, {
		x: to.x,
		y: to.y
	}, 1);
	const p3 = boxAnchor(to, {
		x: from.x,
		y: from.y
	}, ARROW_INSET);
	if (orientation === "horizontal") {
		const middle = (p0.x + p3.x) / 2;
		return {
			p0,
			p1: {
				x: middle,
				y: p0.y
			},
			p2: {
				x: middle,
				y: p3.y
			},
			p3
		};
	}
	if (orientation === "vertical") {
		const middle = (p0.y + p3.y) / 2;
		return {
			p0,
			p1: {
				x: p0.x,
				y: middle
			},
			p2: {
				x: p3.x,
				y: middle
			},
			p3
		};
	}
	return {
		p0,
		p1: {
			x: p0.x + (p3.x - p0.x) / 3,
			y: p0.y + (p3.y - p0.y) / 3
		},
		p2: {
			x: p0.x + (p3.x - p0.x) * 2 / 3,
			y: p0.y + (p3.y - p0.y) * 2 / 3
		},
		p3
	};
}
const boxRect = (box) => ({
	x1: box.x - box.width / 2,
	y1: box.y - box.height / 2,
	x2: box.x + box.width / 2,
	y2: box.y + box.height / 2
});
const chipRect = (center, box) => ({
	x1: center.x - box.width / 2,
	y1: center.y - box.height / 2,
	x2: center.x + box.width / 2,
	y2: center.y + box.height / 2
});
function overlapArea$1(a, b, margin) {
	const x = Math.min(a.x2 + margin, b.x2) - Math.max(a.x1 - margin, b.x1);
	const y = Math.min(a.y2 + margin, b.y2) - Math.max(a.y1 - margin, b.y1);
	return x <= 0 || y <= 0 ? 0 : x * y;
}
/** How far a chip at this position sticks out of the canvas. */
function outsideCanvas(rect, layout) {
	return Math.max(0, -rect.x1) + Math.max(0, rect.x2 - layout.width) + Math.max(0, -rect.y1) + Math.max(0, rect.y2 - layout.height);
}
function placeLabel(curve, box, layout, nodes, placed) {
	let fallback;
	for (const lift of LIFT) for (const slide of SLIDE) {
		const base = pointOnCurve(curve, slide);
		const normal = lift === 0 ? {
			x: 0,
			y: 0
		} : normalOnCurve(curve, slide);
		const point = {
			x: base.x + normal.x * lift,
			y: base.y + normal.y * lift
		};
		const rect = chipRect(point, box);
		let cost = outsideCanvas(rect, layout) * 4;
		for (const node of nodes) cost += overlapArea$1(rect, node, NODE_CLEARANCE);
		for (const other of placed) cost += overlapArea$1(rect, other, LABEL_CLEARANCE);
		if (cost === 0) return {
			...box,
			x: point.x,
			y: point.y,
			crowded: false
		};
		if (fallback === void 0 || cost < fallback.cost) fallback = {
			point,
			cost
		};
	}
	const point = fallback?.point ?? pointOnCurve(curve, .5);
	return {
		...box,
		x: point.x,
		y: point.y,
		crowded: true
	};
}
/**
* Route every edge and place every label, in one pass so that each label knows
* about the ones already placed.
*/
function edgeRoutes(content, layout) {
	const routes = /* @__PURE__ */ new Map();
	const nodes = [...layout.nodes.values()].map(boxRect);
	const placed = [];
	const vertical = layout.orientation === "vertical";
	for (const edge of content.edges) {
		const from = layout.nodes.get(edge.from);
		const to = layout.nodes.get(edge.to);
		if (from === void 0 || to === void 0) continue;
		const lane = layout.feedbackLanes.get(edge.id);
		const curve = lane === void 0 ? flowCurve(from, to, layout.orientation) : feedbackCurve(from, to, lane, vertical);
		const route = {
			path: curvePath(curve),
			end: curve.p3
		};
		if (edge.label !== void 0) {
			const label = placeLabel(curve, edgeLabelBox(edge.label), layout, nodes, placed);
			route.label = label;
			if (!label.crowded) placed.push(chipRect({
				x: label.x,
				y: label.y
			}, label));
		}
		routes.set(edge.id, route);
	}
	return routes;
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/graph.module.css.mjs
const css$10 = "._9UThgG_graphSvg{touch-action:pan-y;max-width:none;display:block;overflow:visible}._9UThgG_layerBand rect{fill:color-mix(in srgb, var(--lx-label-primary) 6%, var(--lx-surface-base));stroke:color-mix(in srgb, var(--lx-border-default) 82%, transparent);stroke-width:1px;vector-effect:non-scaling-stroke}._9UThgG_layerLabel{fill:var(--lx-label-secondary);font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-strong);letter-spacing:.02em;opacity:var(--lx-vs-alpha)}._9UThgG_edgeGroup,._9UThgG_nodeGroup{cursor:pointer}._9UThgG_edgeVisible{fill:none;stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:calc(1.7px + var(--lx-vs-ring) * 1.1px);stroke-linecap:round;vector-effect:non-scaling-stroke;transition:stroke-opacity var(--lx-motion-base) var(--lx-easing), stroke-width var(--lx-motion-base) var(--lx-easing)}._9UThgG_edgeHit{fill:none;stroke:#0000;stroke-width:14px;pointer-events:stroke;vector-effect:non-scaling-stroke}._9UThgG_edgeGroup:hover ._9UThgG_edgeVisible,._9UThgG_edgeGroup:focus-visible ._9UThgG_edgeVisible,._9UThgG_edgeGroup[data-selected] ._9UThgG_edgeVisible,._9UThgG_edgeGroup[data-connected] ._9UThgG_edgeVisible{stroke-opacity:1;stroke-width:3px;filter:drop-shadow(0 0 3px var(--visual-tone))}._9UThgG_edgeGroup[data-dimmed] ._9UThgG_edgeVisible{stroke:color-mix(in srgb, var(--lx-border-strong) 72%, var(--lx-surface-base));stroke-width:1.2px}._9UThgG_edgeGroup[data-dimmed] ._9UThgG_edgeLabel{visibility:hidden}._9UThgG_edgeGroup[data-connected] ._9UThgG_edgeLabel,._9UThgG_edgeGroup[data-selected] ._9UThgG_edgeLabel{opacity:1}._9UThgG_arrowMarker path{fill:var(--visual-tone);fill-opacity:var(--lx-vs-alpha)}._9UThgG_edgeLabel rect{fill:var(--lx-surface-base);stroke:color-mix(in srgb, var(--visual-tone) 26%, var(--lx-border-subtle));stroke-width:1px;vector-effect:non-scaling-stroke;opacity:var(--lx-vs-alpha)}._9UThgG_edgeLabel text{fill:var(--lx-label-primary);font-weight:var(--lx-weight-medium);opacity:var(--lx-vs-alpha)}._9UThgG_edgeLabel{pointer-events:none;transition:opacity var(--lx-motion-fast) var(--lx-easing)}._9UThgG_edgeTooltip{pointer-events:none;opacity:0;visibility:hidden;transition:opacity var(--lx-motion-fast) var(--lx-easing)}._9UThgG_edgeTooltip rect{fill:var(--lx-surface-base);stroke:var(--visual-tone);stroke-width:1.2px;vector-effect:non-scaling-stroke}._9UThgG_edgeTooltip text{fill:var(--lx-label-primary);font-weight:var(--lx-weight-medium)}._9UThgG_graphSvg[data-dense-edges] ._9UThgG_edgeLabel,._9UThgG_edgeGroup[data-crowded] ._9UThgG_edgeLabel{opacity:0}._9UThgG_graphSvg[data-dense-edges] ._9UThgG_edgeGroup:hover ._9UThgG_edgeTooltip,._9UThgG_graphSvg[data-dense-edges] ._9UThgG_edgeGroup:focus-visible ._9UThgG_edgeTooltip{opacity:1;visibility:visible}._9UThgG_edgeGroup[data-crowded]:hover ._9UThgG_edgeLabel,._9UThgG_edgeGroup[data-crowded]:focus-visible ._9UThgG_edgeLabel,._9UThgG_edgeGroup[data-crowded][data-selected] ._9UThgG_edgeLabel,._9UThgG_edgeGroup[data-crowded][data-visual-state=current] ._9UThgG_edgeLabel{opacity:1}._9UThgG_nodeShape{fill:color-mix(in srgb, var(--visual-tone) 12%, var(--lx-surface-base));fill-opacity:var(--lx-vs-alpha);stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:calc(1.6px + var(--lx-vs-ring) * 1.2px);vector-effect:non-scaling-stroke;transition:fill-opacity var(--lx-motion-base) var(--lx-easing), stroke-opacity var(--lx-motion-base) var(--lx-easing), stroke-width var(--lx-motion-base) var(--lx-easing)}._9UThgG_nodeRing{fill:none;stroke:var(--visual-tone);stroke-width:2px;stroke-opacity:calc(var(--lx-vs-ring) * .34);vector-effect:non-scaling-stroke;transition:stroke-opacity var(--lx-motion-base) var(--lx-easing)}._9UThgG_nodeLabel{fill:var(--lx-label-primary);font-weight:var(--lx-weight-medium);opacity:var(--lx-vs-alpha);pointer-events:none}._9UThgG_nodeGroup[data-visual-state=current] ._9UThgG_nodeLabel,._9UThgG_nodeGroup[data-visual-state=selected] ._9UThgG_nodeLabel{font-weight:var(--lx-weight-strong)}._9UThgG_nodeGroup:hover ._9UThgG_nodeShape,._9UThgG_nodeGroup:focus-visible ._9UThgG_nodeShape,._9UThgG_nodeGroup[data-selected] ._9UThgG_nodeShape{fill:color-mix(in srgb, var(--visual-tone) 22%, var(--lx-surface-base));fill-opacity:1;stroke-opacity:1;stroke-width:2.6px}._9UThgG_nodeGroup[data-selected] ._9UThgG_nodeRing{stroke-opacity:.5}[data-stroke=dashed] ._9UThgG_edgeVisible{stroke-dasharray:9 6}[data-stroke=dotted] ._9UThgG_edgeVisible{stroke-dasharray:2 6}@media (prefers-reduced-motion:reduce){._9UThgG_edgeVisible,._9UThgG_edgeLabel,._9UThgG_nodeShape,._9UThgG_nodeRing{transition:none}}@media (forced-colors:active){._9UThgG_nodeShape{fill:canvas;stroke:canvastext}._9UThgG_edgeVisible{stroke:canvastext}._9UThgG_nodeGroup[data-visual-state=current] ._9UThgG_nodeShape,._9UThgG_nodeGroup[data-selected] ._9UThgG_nodeShape{fill:highlight}}";
const tagId$10 = "@dsh-portable/visual/graph.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$10) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$10;
	tag.textContent = css$10;
	document.head.appendChild(tag);
}
var graph_module_css_default = {
	"arrowMarker": "_9UThgG_arrowMarker",
	"edgeGroup": "_9UThgG_edgeGroup",
	"edgeHit": "_9UThgG_edgeHit",
	"edgeLabel": "_9UThgG_edgeLabel",
	"edgeTooltip": "_9UThgG_edgeTooltip",
	"edgeVisible": "_9UThgG_edgeVisible",
	"graphSvg": "_9UThgG_graphSvg",
	"layerBand": "_9UThgG_layerBand",
	"layerLabel": "_9UThgG_layerLabel",
	"nodeGroup": "_9UThgG_nodeGroup",
	"nodeLabel": "_9UThgG_nodeLabel",
	"nodeRing": "_9UThgG_nodeRing",
	"nodeShape": "_9UThgG_nodeShape"
};
//#endregion
//#region src/client/visuals/renderers/NodeLinkRenderer.tsx
/**
* `node_link`: topologies, trees, dependency and process graphs.
*
* Three things changed relative to the first implementation, all of them
* visible in the five-node decision tree that prompted them.
*
* 1. Geometry comes from the content (see `layout/graph-layout.ts`) instead of
*    a fixed 560×390 canvas with 29px circles, so a small tree is compact and a
*    long Chinese label gets a box that fits it.
* 2. Emphasis is ranked (see `state/graph-state.ts`) instead of binary, and is
*    applied once per mark, so the branch a frame is not about stays readable
*    rather than being drawn at a tenth of full strength.
* 3. The layer headings, edge labels and node labels are real type at 12–13px,
*    not 10px furniture.
*
* Edges are routed and their labels placed in `layout/graph-edges.ts`, which
* owns the return lane a backwards edge takes and the search that keeps a chip
* off the node boxes and off the other chips.
*/
/** Above this, drawing every edge label at once turns the figure into noise. */
const DENSE_EDGE_COUNT = 12;
const NODE_LINE_HEIGHT = 17;
function NodeLinkRenderer({ content, focus }) {
	const labels = useVisualLabels();
	const id = useId();
	const [viewportRef, containerWidth] = useContainerWidth();
	const layout = useMemo(() => graphLayout(content, containerWidth), [containerWidth, content]);
	const routes = useMemo(() => edgeRoutes(content, layout), [content, layout]);
	const emphasis = useMemo(() => graphEmphasis(content, focus), [content, focus]);
	const [selected, setSelected] = useState();
	const [hoveredNodeId, setHoveredNodeId] = useState();
	const nodeById = useMemo(() => new Map(content.nodes.map((node) => [node.id, node])), [content.nodes]);
	const selectNode = (node, tone) => setSelected({
		id: node.id,
		label: node.label,
		detail: node.detail,
		kind: "node",
		tone: toneAt(tone)
	});
	const selectEdge = (edge, tone) => setSelected({
		id: edge.id,
		label: edge.label ?? `${nodeById.get(edge.from)?.label ?? edge.from} → ${nodeById.get(edge.to)?.label ?? edge.to}`,
		detail: edge.detail,
		kind: "edge",
		tone: toneAt(tone)
	});
	const summary = labelTemplate(labels.nodeLinkSummary, {
		nodes: content.nodes.length,
		edges: content.edges.length
	});
	const roving = useRovingFocus(useMemo(() => [...content.nodes.map((node) => node.id), ...content.edges.map((edge) => edge.id)], [content.edges, content.nodes]));
	const denseEdges = content.edges.length > DENSE_EDGE_COUNT;
	const legendStates = useMemo(() => emphasis.active ? [...new Set([...content.nodes, ...content.edges].map((item) => emphasis.state(item.id)))] : [], [
		content.edges,
		content.nodes,
		emphasis
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [
			/* @__PURE__ */ jsx(FigureViewport, {
				viewportRef,
				children: /* @__PURE__ */ jsxs("svg", {
					ref: roving.containerRef,
					className: graph_module_css_default.graphSvg,
					width: layout.renderWidth,
					height: layout.renderHeight,
					viewBox: `0 0 ${layout.width} ${layout.height}`,
					role: "group",
					"aria-label": summary,
					"data-dense-edges": denseEdges || void 0,
					children: [
						/* @__PURE__ */ jsx("defs", { children: DEFAULT_TONES.map((tone) => /* @__PURE__ */ jsx("marker", {
							id: `${id}-arrow-${tone}`,
							className: graph_module_css_default.arrowMarker,
							"data-tone": tone,
							markerWidth: "7",
							markerHeight: "7",
							refX: "6",
							refY: "3.5",
							orient: "auto",
							markerUnits: "strokeWidth",
							children: /* @__PURE__ */ jsx("path", { d: "M0,0 L7,3.5 L0,7 z" })
						}, tone)) }),
						!layout.showHeaders ? null : layout.layers.map((layer, index) => /* @__PURE__ */ jsxs("g", {
							className: graph_module_css_default.layerBand,
							"data-visual-id": layer.id,
							"data-visual-state": emphasis.state(layer.id),
							children: [/* @__PURE__ */ jsx("rect", {
								x: layer.band.x,
								y: layer.band.y,
								width: layer.band.width,
								height: layer.band.height,
								rx: "12"
							}), /* @__PURE__ */ jsx("text", {
								className: graph_module_css_default.layerLabel,
								x: layer.headerX,
								y: layer.headerY,
								textAnchor: layer.headerAnchor,
								dominantBaseline: "middle",
								children: layer.label ?? labelTemplate(labels.layerLabel, { index: index + 1 })
							})]
						}, layer.id)),
						/* @__PURE__ */ jsx("g", { children: content.edges.map((edge, edgeIndex) => {
							const route = routes.get(edge.id);
							if (route === void 0) return null;
							const tone = toneAt(edge.tone, edgeIndex);
							const state = emphasis.state(edge.id);
							const label = route.label;
							const connection = labelTemplate(labels.connection, {
								from: nodeById.get(edge.from)?.label ?? edge.from,
								to: nodeById.get(edge.to)?.label ?? edge.to
							});
							const isConnected = hoveredNodeId !== void 0 && (edge.from === hoveredNodeId || edge.to === hoveredNodeId);
							const isDimmed = hoveredNodeId !== void 0 && !isConnected;
							const tooltipText = `${edge.label ?? connection}${edge.detail === void 0 ? "" : ` · ${edge.detail}`}`;
							const tooltipBox = edgeLabelBox(tooltipText);
							const tooltipAnchor = label === void 0 ? {
								x: ((layout.nodes.get(edge.from)?.x ?? 0) + (layout.nodes.get(edge.to)?.x ?? 0)) / 2,
								y: ((layout.nodes.get(edge.from)?.y ?? 0) + (layout.nodes.get(edge.to)?.y ?? 0)) / 2
							} : {
								x: label.x,
								y: label.y
							};
							return /* @__PURE__ */ jsxs("g", {
								className: graph_module_css_default.edgeGroup,
								"data-tone": tone,
								"data-stroke": edge.stroke ?? "solid",
								"data-visual-state": selected?.id === edge.id ? "selected" : state,
								"data-selected": selected?.id === edge.id || void 0,
								"data-connected": isConnected || void 0,
								"data-dimmed": isDimmed || void 0,
								"data-visual-id": edge.id,
								"data-crowded": label?.crowded === true || void 0,
								role: "button",
								"aria-label": `${edge.label ?? labels.edgeKind}: ${labelTemplate(labels.connection, {
									from: nodeById.get(edge.from)?.label ?? edge.from,
									to: nodeById.get(edge.to)?.label ?? edge.to
								})}${edge.detail === void 0 ? "" : `. ${edge.detail}`}`,
								onClick: () => selectEdge(edge, tone),
								...roving.itemProps(edge.id, () => selectEdge(edge, tone)),
								children: [
									/* @__PURE__ */ jsx("title", { children: tooltipText }),
									/* @__PURE__ */ jsx("path", {
										className: graph_module_css_default.edgeVisible,
										d: route.path,
										markerEnd: edge.directed === true ? `url(#${id}-arrow-${tone})` : void 0
									}),
									/* @__PURE__ */ jsx("path", {
										className: graph_module_css_default.edgeHit,
										d: route.path
									}),
									label === void 0 ? null : /* @__PURE__ */ jsxs("g", {
										className: graph_module_css_default.edgeLabel,
										children: [/* @__PURE__ */ jsx("rect", {
											x: label.x - label.width / 2,
											y: label.y - label.height / 2,
											width: label.width,
											height: label.height,
											rx: edgeLabelRadius(label)
										}), /* @__PURE__ */ jsx("text", {
											x: label.x,
											textAnchor: "middle",
											dominantBaseline: "middle",
											fontSize: 12,
											children: label.lines.map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
												x: label.x,
												y: label.y - (label.lines.length - 1) * 15 / 2 + lineIndex * 15,
												children: line
											}, line + String(lineIndex)))
										})]
									}),
									!denseEdges ? null : /* @__PURE__ */ jsxs("g", {
										className: graph_module_css_default.edgeTooltip,
										role: "tooltip",
										"aria-hidden": "true",
										transform: `translate(${tooltipAnchor.x} ${tooltipAnchor.y})`,
										children: [/* @__PURE__ */ jsx("rect", {
											x: -tooltipBox.width / 2,
											y: -tooltipBox.height / 2,
											width: tooltipBox.width,
											height: tooltipBox.height,
											rx: edgeLabelRadius(tooltipBox)
										}), /* @__PURE__ */ jsx("text", {
											textAnchor: "middle",
											dominantBaseline: "middle",
											fontSize: 12,
											children: tooltipBox.lines.map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
												x: "0",
												y: -((tooltipBox.lines.length - 1) * 15) / 2 + lineIndex * 15,
												children: line
											}, line + String(lineIndex)))
										})]
									})
								]
							}, edge.id);
						}) }),
						/* @__PURE__ */ jsx("g", { children: content.nodes.map((node, nodeIndex) => {
							const box = layout.nodes.get(node.id);
							if (box === void 0) return null;
							const tone = toneAt(node.tone, nodeIndex);
							const state = emphasis.state(node.id);
							const firstLineOffset = -((box.lines.length - 1) * NODE_LINE_HEIGHT) / 2;
							return /* @__PURE__ */ jsxs("g", {
								className: graph_module_css_default.nodeGroup,
								"data-tone": tone,
								"data-visual-state": selected?.id === node.id ? "selected" : state,
								"data-selected": selected?.id === node.id || void 0,
								"data-visual-id": node.id,
								role: "button",
								"aria-label": `${node.label}${node.detail === void 0 ? "" : `。${node.detail}`}`,
								transform: `translate(${box.x} ${box.y})`,
								onClick: () => selectNode(node, tone),
								...roving.itemProps(node.id, () => selectNode(node, tone)),
								onPointerEnter: () => setHoveredNodeId(node.id),
								onPointerLeave: () => setHoveredNodeId(void 0),
								onFocus: () => setHoveredNodeId(node.id),
								onBlur: () => setHoveredNodeId(void 0),
								children: [
									/* @__PURE__ */ jsx("rect", {
										className: graph_module_css_default.nodeRing,
										x: -box.width / 2 - 5,
										y: -box.height / 2 - 5,
										width: box.width + 10,
										height: box.height + 10,
										rx: box.cornerRadius + 5
									}),
									/* @__PURE__ */ jsx("rect", {
										className: graph_module_css_default.nodeShape,
										x: -box.width / 2,
										y: -box.height / 2,
										width: box.width,
										height: box.height,
										rx: box.cornerRadius
									}),
									/* @__PURE__ */ jsx("text", {
										className: graph_module_css_default.nodeLabel,
										textAnchor: "middle",
										dominantBaseline: "middle",
										fontSize: 13,
										children: box.lines.map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
											x: "0",
											y: firstLineOffset + lineIndex * NODE_LINE_HEIGHT,
											children: line
										}, line + String(lineIndex)))
									}),
									!box.truncated ? null : /* @__PURE__ */ jsx("title", { children: node.label })
								]
							}, node.id);
						}) })
					]
				})
			}),
			/* @__PURE__ */ jsx(StateLegend, { states: legendStates }),
			/* @__PURE__ */ jsxs("div", {
				className: shell_module_css_default.srOnly,
				children: [/* @__PURE__ */ jsx("p", { children: summary }), /* @__PURE__ */ jsxs("ul", { children: [content.nodes.map((node) => /* @__PURE__ */ jsx("li", { children: node.detail === void 0 ? node.label : `${node.label}: ${node.detail}` }, node.id)), content.edges.map((edge) => {
					const connection = labelTemplate(labels.connection, {
						from: nodeById.get(edge.from)?.label ?? edge.from,
						to: nodeById.get(edge.to)?.label ?? edge.to
					});
					return /* @__PURE__ */ jsx("li", { children: edge.label === void 0 ? connection : `${connection}, ${edge.label}` }, edge.id);
				})] })]
			}),
			/* @__PURE__ */ jsx(SelectionSurface, {
				hint: labels.nodeLinkInteractionHint,
				selected,
				kindLabel: selected?.kind === "edge" ? labels.edgeKind : labels.nodeKind,
				onClose: () => setSelected(void 0)
			})
		]
	});
}
//#endregion
//#region src/client/visuals/layout/scene-labels.ts
/** Small geometry helpers for labels that sit outside scene_2d shapes. */
const LABEL_FONT_SIZE = 12;
const LABEL_LINE_HEIGHT = 17;
const LABEL_GAP = 12;
const labelRect = (center, text) => {
	const width = measureText(text, LABEL_FONT_SIZE) + 8;
	const height = LABEL_LINE_HEIGHT;
	return {
		x1: center.x - width / 2,
		y1: center.y - height / 2,
		x2: center.x + width / 2,
		y2: center.y + height / 2
	};
};
function overlapArea(a, b) {
	return Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
}
function outsideArea(rect, bounds) {
	return Math.max(0, bounds.left - rect.x1) + Math.max(0, rect.x2 - bounds.right) + Math.max(0, bounds.top - rect.y1) + Math.max(0, rect.y2 - bounds.bottom);
}
/**
* Pick a polygon label position that has room around nearby geometry.
*
* The old fixed `centroid + 18px` rule only worked when the space below every
* polygon was empty. Candidates are tried above and below the shape first,
* then at the sides and finally inside it. A small overlap score keeps the
* helper deterministic while allowing a tight scene to remain labelled.
*/
function polygonLabelAnchor(points, text, occupied, bounds) {
	if (points.length === 0) return {
		x: (bounds.left + bounds.right) / 2,
		y: (bounds.top + bounds.bottom) / 2
	};
	const minX = Math.min(...points.map((point) => point.x));
	const maxX = Math.max(...points.map((point) => point.x));
	const minY = Math.min(...points.map((point) => point.y));
	const maxY = Math.max(...points.map((point) => point.y));
	const center = points.reduce((total, point) => ({
		x: total.x + point.x / points.length,
		y: total.y + point.y / points.length
	}), {
		x: 0,
		y: 0
	});
	const halfLabelWidth = (measureText(text, LABEL_FONT_SIZE) + 8) / 2;
	const clampX = (x) => Math.max(bounds.left + halfLabelWidth, Math.min(bounds.right - halfLabelWidth, x));
	const candidates = [
		{
			x: clampX(center.x),
			y: maxY + LABEL_GAP + LABEL_LINE_HEIGHT / 2
		},
		{
			x: clampX(center.x),
			y: minY - LABEL_GAP - LABEL_LINE_HEIGHT / 2
		},
		{
			x: clampX(maxX + LABEL_GAP + halfLabelWidth),
			y: center.y
		},
		{
			x: clampX(minX - LABEL_GAP - halfLabelWidth),
			y: center.y
		},
		{
			x: clampX(center.x),
			y: center.y
		}
	];
	let best = candidates[candidates.length - 1];
	let bestScore = Number.POSITIVE_INFINITY;
	for (const candidate of candidates) {
		const rect = labelRect(candidate, text);
		const score = outsideArea(rect, bounds) * 100 + occupied.reduce((total, other) => total + overlapArea(rect, other), 0);
		if (score < bestScore) {
			best = candidate;
			bestScore = score;
			if (score === 0) break;
		}
	}
	return best;
}
//#endregion
//#region src/client/visuals/renderers/Scene2DRenderer.tsx
/** `scene_2d`: geometry, vectors, fields and annotated schematics on axes. */
/**
* Place a segment or arrow label clear of its own line.
*
* A flat vertical offset drops the label onto whatever else crosses the middle
* of the figure — in a parallelogram construction the resultant's label, the
* shape's label and a declared text anchor all landed on the same few pixels.
* Offsetting along the segment's normal separates them by construction.
*/
function segmentLabelAnchor(x1, y1, x2, y2) {
	const length = Math.hypot(x2 - x1, y2 - y1) || 1;
	const normalX = -(y2 - y1) / length;
	const normalY = (x2 - x1) / length;
	const direction = normalY > 0 ? -1 : 1;
	return {
		x: (x1 + x2) / 2 + normalX * 13 * direction,
		y: (y1 + y2) / 2 + normalY * 13 * direction
	};
}
function midpointTicks(majorTicks, minimum, maximum) {
	return majorTicks.slice(1).map((value, index) => {
		return ((majorTicks[index] ?? value) + value) / 2;
	}).filter((value) => value > minimum && value < maximum);
}
function sceneLabelLines(text) {
	return text === void 0 ? [] : wrapLabel(text, {
		fontSize: 12,
		maxWidth: 136,
		maxLines: 2
	}).lines;
}
function sceneElementBounds(element, content, geometry) {
	const x = (value) => scaleX(value, content.xAxis, geometry);
	const y = (value) => scaleY(value, content.yAxis, geometry);
	if (element.type === "point") {
		const cx = x(element.x);
		const cy = y(element.y);
		const radius = element.size ?? 6;
		return {
			x1: cx - radius,
			y1: cy - radius,
			x2: cx + radius,
			y2: cy + radius
		};
	}
	if (element.type === "segment" || element.type === "arrow") {
		const x1 = x(element.x1);
		const y1 = y(element.y1);
		const x2 = x(element.x2);
		const y2 = y(element.y2);
		return {
			x1: Math.min(x1, x2) - 4,
			y1: Math.min(y1, y2) - 4,
			x2: Math.max(x1, x2) + 4,
			y2: Math.max(y1, y2) + 4
		};
	}
	if (element.type === "circle") {
		const cx = x(element.cx);
		const cy = y(element.cy);
		const rx = Math.abs(x(element.cx + element.r) - cx);
		const ry = Math.abs(y(element.cy + element.r) - cy);
		return {
			x1: cx - rx,
			y1: cy - ry,
			x2: cx + rx,
			y2: cy + ry
		};
	}
	if (element.type === "rect") {
		const x1 = x(element.x);
		const x2 = x(element.x + element.width);
		const y1 = y(element.y);
		const y2 = y(element.y + element.height);
		return {
			x1: Math.min(x1, x2),
			y1: Math.min(y1, y2),
			x2: Math.max(x1, x2),
			y2: Math.max(y1, y2)
		};
	}
	if (element.type === "polygon") {
		const points = element.points.map((point) => ({
			x: x(point.x),
			y: y(point.y)
		}));
		return {
			x1: Math.min(...points.map((point) => point.x)),
			y1: Math.min(...points.map((point) => point.y)),
			x2: Math.max(...points.map((point) => point.x)),
			y2: Math.max(...points.map((point) => point.y))
		};
	}
	if (element.type !== "label") return {
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 0
	};
	const cx = x(element.x);
	const cy = y(element.y);
	const halfWidth = (measureText(element.text, 12) + 8) / 2;
	return {
		x1: cx - halfWidth,
		y1: cy - 9,
		x2: cx + halfWidth,
		y2: cy + 9
	};
}
function Scene2DRenderer({ content, focus }) {
	const labels = useVisualLabels();
	const id = useId();
	const [viewportRef, containerWidth] = useContainerWidth();
	const geometry = useMemo(() => chartGeometry(containerWidth), [containerWidth]);
	const [selected, setSelected] = useState();
	const xTicks = useMemo(() => ticks(content.xAxis.min, content.xAxis.max), [content.xAxis.max, content.xAxis.min]);
	const yTicks = useMemo(() => ticks(content.yAxis.min, content.yAxis.max), [content.yAxis.max, content.yAxis.min]);
	const xMinorTicks = useMemo(() => midpointTicks(xTicks, content.xAxis.min, content.xAxis.max), [
		content.xAxis.max,
		content.xAxis.min,
		xTicks
	]);
	const yMinorTicks = useMemo(() => midpointTicks(yTicks, content.yAxis.min, content.yAxis.max), [
		content.yAxis.max,
		content.yAxis.min,
		yTicks
	]);
	const elementBounds = useMemo(() => new Map(content.elements.map((element) => [element.id, sceneElementBounds(element, content, geometry)])), [content, geometry]);
	const zeroX = content.xAxis.min <= 0 && content.xAxis.max >= 0 ? scaleX(0, content.xAxis, geometry) : void 0;
	const zeroY = content.yAxis.min <= 0 && content.yAxis.max >= 0 ? scaleY(0, content.yAxis, geometry) : void 0;
	const roving = useRovingFocus(useMemo(() => content.elements.map((element) => element.id), [content.elements]));
	const selectElement = (element, tone) => setSelected({
		id: element.id,
		label: element.type === "label" ? element.text : element.label ?? labelTemplate(labels.elementFallback, { id: element.id }),
		detail: element.detail,
		kind: "element",
		tone: toneAt(tone)
	});
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [/* @__PURE__ */ jsx(FigureViewport, {
			viewportRef,
			children: /* @__PURE__ */ jsxs("svg", {
				ref: roving.containerRef,
				className: plot_module_css_default.sceneSvg,
				width: geometry.width,
				height: geometry.height,
				viewBox: `0 0 ${geometry.width} ${geometry.height}`,
				role: "group",
				"aria-label": labelTemplate(labels.sceneSummary, {
					elements: content.elements.length,
					labels: content.elements.map((element) => element.type === "label" ? element.text : element.label).filter(Boolean).join(", ")
				}),
				children: [
					/* @__PURE__ */ jsxs("defs", { children: [/* @__PURE__ */ jsx("clipPath", {
						id: `${id}-scene-clip`,
						children: /* @__PURE__ */ jsx("rect", {
							x: geometry.left,
							y: geometry.top,
							width: geometry.plotWidth,
							height: geometry.plotHeight
						})
					}), DEFAULT_TONES.map((tone) => /* @__PURE__ */ jsx("marker", {
						id: `${id}-scene-arrow-${tone}`,
						className: plot_module_css_default.arrowMarker,
						"data-tone": tone,
						markerWidth: "9",
						markerHeight: "9",
						refX: "8",
						refY: "4.5",
						orient: "auto",
						markerUnits: "strokeWidth",
						children: /* @__PURE__ */ jsx("path", { d: "M0,0 L9,4.5 L0,9 z" })
					}, tone))] }),
					/* @__PURE__ */ jsx("rect", {
						className: plot_module_css_default.plotFrame,
						x: geometry.left,
						y: geometry.top,
						width: geometry.plotWidth,
						height: geometry.plotHeight
					}),
					content.grid !== true ? null : yMinorTicks.map((value) => /* @__PURE__ */ jsx("line", {
						className: plot_module_css_default.minorGridLine,
						x1: geometry.left,
						x2: geometry.left + geometry.plotWidth,
						y1: scaleY(value, content.yAxis, geometry),
						y2: scaleY(value, content.yAxis, geometry)
					}, `my-${String(value)}`)),
					content.grid !== true ? null : xMinorTicks.map((value) => /* @__PURE__ */ jsx("line", {
						className: plot_module_css_default.minorGridLine,
						x1: scaleX(value, content.xAxis, geometry),
						x2: scaleX(value, content.xAxis, geometry),
						y1: geometry.top,
						y2: geometry.top + geometry.plotHeight
					}, `mx-${String(value)}`)),
					content.grid !== true ? null : yTicks.map((value) => /* @__PURE__ */ jsx("line", {
						className: plot_module_css_default.gridLine,
						x1: geometry.left,
						x2: geometry.left + geometry.plotWidth,
						y1: scaleY(value, content.yAxis, geometry),
						y2: scaleY(value, content.yAxis, geometry)
					}, `gy-${String(value)}`)),
					content.grid !== true ? null : xTicks.map((value) => /* @__PURE__ */ jsx("line", {
						className: plot_module_css_default.gridLine,
						x1: scaleX(value, content.xAxis, geometry),
						x2: scaleX(value, content.xAxis, geometry),
						y1: geometry.top,
						y2: geometry.top + geometry.plotHeight
					}, `gx-${String(value)}`)),
					zeroX === void 0 ? null : /* @__PURE__ */ jsx("line", {
						className: plot_module_css_default.zeroAxis,
						x1: zeroX,
						x2: zeroX,
						y1: geometry.top,
						y2: geometry.top + geometry.plotHeight
					}),
					zeroY === void 0 ? null : /* @__PURE__ */ jsx("line", {
						className: plot_module_css_default.zeroAxis,
						x1: geometry.left,
						x2: geometry.left + geometry.plotWidth,
						y1: zeroY,
						y2: zeroY
					}),
					zeroX === void 0 || zeroY === void 0 ? null : /* @__PURE__ */ jsxs("g", {
						className: plot_module_css_default.originMarker,
						"aria-hidden": "true",
						children: [/* @__PURE__ */ jsx("circle", {
							cx: zeroX,
							cy: zeroY,
							r: "3.5"
						}), /* @__PURE__ */ jsx("text", {
							x: zeroX + 7,
							y: zeroY - 7,
							children: "O"
						})]
					}),
					yTicks.map((value) => /* @__PURE__ */ jsx("text", {
						className: plot_module_css_default.tickLabel,
						x: geometry.left - 9,
						y: scaleY(value, content.yAxis, geometry),
						textAnchor: "end",
						dominantBaseline: "middle",
						children: formatNumber(value)
					}, `yt-${String(value)}`)),
					xTicks.map((value) => /* @__PURE__ */ jsx("text", {
						className: plot_module_css_default.tickLabel,
						x: scaleX(value, content.xAxis, geometry),
						y: geometry.top + geometry.plotHeight + 19,
						textAnchor: "middle",
						children: formatNumber(value)
					}, `xt-${String(value)}`)),
					/* @__PURE__ */ jsx("g", {
						clipPath: `url(#${id}-scene-clip)`,
						children: content.elements.map((element, index) => {
							const tone = toneAt(element.tone, index);
							const common = {
								className: plot_module_css_default.sceneElement,
								"data-tone": tone,
								"data-visual-state": selected?.id === element.id ? "selected" : elementState(element.id, focus),
								"data-selected": selected?.id === element.id || void 0,
								"data-visual-id": element.id,
								"data-element-type": element.type,
								role: "button",
								"aria-label": `${element.type === "label" ? element.text : element.label ?? element.type}${element.detail === void 0 ? "" : `。${element.detail}`}`,
								onClick: () => selectElement(element, tone),
								...roving.itemProps(element.id, () => selectElement(element, tone))
							};
							if (element.type === "point") {
								const x = scaleX(element.x, content.xAxis, geometry);
								const y = scaleY(element.y, content.yAxis, geometry);
								return /* @__PURE__ */ jsxs("g", {
									...common,
									children: [/* @__PURE__ */ jsx("circle", {
										className: plot_module_css_default.scenePoint,
										cx: x,
										cy: y,
										r: element.size ?? 6
									}), element.label === void 0 ? null : /* @__PURE__ */ jsx("text", {
										className: plot_module_css_default.shapeLabel,
										x: x + 10,
										y: y - 10,
										children: sceneLabelLines(element.label).map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
											x: x + 10,
											dy: lineIndex === 0 ? "0" : "1.1em",
											children: line
										}, lineIndex))
									})]
								}, element.id);
							}
							if (element.type === "segment" || element.type === "arrow") {
								const x1 = scaleX(element.x1, content.xAxis, geometry);
								const y1 = scaleY(element.y1, content.yAxis, geometry);
								const x2 = scaleX(element.x2, content.xAxis, geometry);
								const y2 = scaleY(element.y2, content.yAxis, geometry);
								return /* @__PURE__ */ jsxs("g", {
									...common,
									"data-stroke": element.stroke ?? "solid",
									children: [
										/* @__PURE__ */ jsx("line", {
											className: plot_module_css_default.sceneLine,
											x1,
											y1,
											x2,
											y2,
											markerEnd: element.type === "arrow" ? `url(#${id}-scene-arrow-${tone})` : void 0
										}),
										/* @__PURE__ */ jsx("line", {
											className: plot_module_css_default.sceneHit,
											x1,
											y1,
											x2,
											y2
										}),
										element.label === void 0 ? null : (() => {
											const anchor = segmentLabelAnchor(x1, y1, x2, y2);
											return /* @__PURE__ */ jsx("text", {
												className: plot_module_css_default.shapeLabel,
												x: anchor.x,
												y: anchor.y,
												textAnchor: "middle",
												dominantBaseline: "middle",
												children: sceneLabelLines(element.label).map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
													x: anchor.x,
													dy: lineIndex === 0 ? sceneLabelLines(element.label).length > 1 ? "-0.55em" : "0.34em" : "1.1em",
													children: line
												}, lineIndex))
											});
										})()
									]
								}, element.id);
							}
							if (element.type === "circle") {
								const cx = scaleX(element.cx, content.xAxis, geometry);
								const cy = scaleY(element.cy, content.yAxis, geometry);
								const rx = Math.abs(scaleX(element.cx + element.r, content.xAxis, geometry) - cx);
								const ry = Math.abs(scaleY(element.cy + element.r, content.yAxis, geometry) - cy);
								return /* @__PURE__ */ jsxs("g", {
									...common,
									children: [/* @__PURE__ */ jsx("ellipse", {
										className: plot_module_css_default.sceneShape,
										cx,
										cy,
										rx,
										ry
									}), element.label === void 0 ? null : /* @__PURE__ */ jsx("text", {
										className: plot_module_css_default.shapeLabel,
										x: cx,
										y: cy,
										textAnchor: "middle",
										dominantBaseline: "middle",
										children: sceneLabelLines(element.label).map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
											x: cx,
											dy: lineIndex === 0 ? sceneLabelLines(element.label).length > 1 ? "-0.55em" : "0.34em" : "1.1em",
											children: line
										}, lineIndex))
									})]
								}, element.id);
							}
							if (element.type === "rect") {
								const x = scaleX(element.x, content.xAxis, geometry);
								const y = scaleY(element.y + element.height, content.yAxis, geometry);
								const width = Math.abs(scaleX(element.x + element.width, content.xAxis, geometry) - x);
								const height = Math.abs(scaleY(element.y, content.yAxis, geometry) - y);
								return /* @__PURE__ */ jsxs("g", {
									...common,
									children: [/* @__PURE__ */ jsx("rect", {
										className: plot_module_css_default.sceneShape,
										x,
										y,
										width,
										height,
										rx: "3"
									}), element.label === void 0 ? null : /* @__PURE__ */ jsx("text", {
										className: plot_module_css_default.shapeLabel,
										x: x + width / 2,
										y: y + height / 2,
										textAnchor: "middle",
										dominantBaseline: "middle",
										children: sceneLabelLines(element.label).map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
											x: x + width / 2,
											dy: lineIndex === 0 ? sceneLabelLines(element.label).length > 1 ? "-0.55em" : "0.34em" : "1.1em",
											children: line
										}, lineIndex))
									})]
								}, element.id);
							}
							if (element.type === "polygon") {
								const pixelPoints = element.points.map((point) => ({
									x: scaleX(point.x, content.xAxis, geometry),
									y: scaleY(point.y, content.yAxis, geometry)
								}));
								const points = pixelPoints.map((point) => `${point.x},${point.y}`).join(" ");
								const anchor = element.label === void 0 ? void 0 : polygonLabelAnchor(pixelPoints, element.label, content.elements.filter((other) => other.id !== element.id).map((other) => elementBounds.get(other.id)).filter((bounds) => bounds !== void 0), {
									left: geometry.left,
									right: geometry.left + geometry.plotWidth,
									top: geometry.top,
									bottom: geometry.top + geometry.plotHeight
								});
								return /* @__PURE__ */ jsxs("g", {
									...common,
									children: [/* @__PURE__ */ jsx("polygon", {
										className: plot_module_css_default.sceneShape,
										points
									}), anchor === void 0 ? null : /* @__PURE__ */ jsx("text", {
										className: plot_module_css_default.shapeLabel,
										x: anchor.x,
										y: anchor.y,
										textAnchor: "middle",
										dominantBaseline: "middle",
										children: sceneLabelLines(element.label).map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
											x: anchor.x,
											dy: lineIndex === 0 ? sceneLabelLines(element.label).length > 1 ? "-0.55em" : "0.34em" : "1.1em",
											children: line
										}, lineIndex))
									})]
								}, element.id);
							}
							if (element.type === "label") return /* @__PURE__ */ jsx("g", {
								...common,
								children: /* @__PURE__ */ jsx("text", {
									className: plot_module_css_default.sceneText,
									x: scaleX(element.x, content.xAxis, geometry),
									y: scaleY(element.y, content.yAxis, geometry),
									textAnchor: "middle",
									dominantBaseline: "middle",
									children: element.text
								})
							}, element.id);
							return null;
						})
					}),
					/* @__PURE__ */ jsx("text", {
						className: plot_module_css_default.axisLabel,
						x: geometry.left + geometry.plotWidth / 2,
						y: geometry.height - 6,
						textAnchor: "middle",
						children: content.xAxis.label ?? "x"
					}),
					/* @__PURE__ */ jsx("text", {
						className: plot_module_css_default.axisLabel,
						x: "14",
						y: geometry.top + geometry.plotHeight / 2,
						textAnchor: "middle",
						transform: `rotate(-90 14 ${geometry.top + geometry.plotHeight / 2})`,
						children: content.yAxis.label ?? "y"
					})
				]
			})
		}), /* @__PURE__ */ jsx(SelectionSurface, {
			hint: labels.sceneInteractionHint,
			selected,
			kindLabel: labels.elementKind,
			onClose: () => setSelected(void 0)
		})]
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/relation.module.css.mjs
const css$9 = "._5U3G3a_tableViewport{padding:var(--lx-space-2xs)}._5U3G3a_relationTable{border-spacing:0;border-collapse:separate;table-layout:fixed;width:100%;min-width:460px;color:var(--lx-label-primary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs)}._5U3G3a_relationTable th,._5U3G3a_relationTable td{border-right:1px solid var(--lx-border-subtle);border-bottom:1px solid var(--lx-border-subtle);padding:var(--lx-space-sm) var(--lx-space-md);text-align:center;overflow-wrap:anywhere}._5U3G3a_relationTable tr>:last-child{border-right:0}._5U3G3a_relationTable tbody tr:last-child>*{border-bottom:0}._5U3G3a_relationTable thead th{background:color-mix(in srgb, var(--lx-accent-soft) 30%, transparent);color:var(--lx-label-primary);font-size:var(--lx-text-sm);font-weight:var(--lx-weight-strong)}._5U3G3a_relationTable thead th:first-child,._5U3G3a_relationTable tbody th{width:24%}._5U3G3a_relationTable tbody th{background:var(--lx-surface-sunken);color:var(--lx-label-primary);text-align:left;font-weight:var(--lx-weight-medium)}._5U3G3a_relationTable td{color:var(--lx-label-secondary)}._5U3G3a_relationTable td[data-tone]{color:var(--visual-tone);font-weight:var(--lx-weight-medium);background:color-mix(in srgb, var(--visual-tone) 7%, transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--visual-tone) 10%, transparent)}._5U3G3a_relationTable th[data-visual-state],._5U3G3a_relationTable tr[data-visual-state]>*{opacity:var(--lx-vs-alpha)}._5U3G3a_relationTable th[data-visual-state=current]{box-shadow:inset 0 -3px 0 var(--lx-accent)}._5U3G3a_relationTable tr[data-visual-state=current]>th{box-shadow:inset 3px 0 0 var(--lx-accent)}._5U3G3a_cellButton{appearance:none;border-radius:var(--lx-radius-xs);max-width:100%;padding:var(--lx-space-3xs) var(--lx-space-xs);color:inherit;font:inherit;line-height:inherit;overflow-wrap:anywhere;cursor:pointer;background:0 0;border:1px solid #0000}._5U3G3a_cellButton:hover{border-color:var(--lx-border-default);background:color-mix(in srgb, var(--lx-accent) 8%, transparent)}._5U3G3a_cellButton:active{background:color-mix(in srgb, var(--lx-accent) 14%, transparent)}._5U3G3a_matrixTable td{padding:var(--lx-space-xs)}._5U3G3a_matrixCell{appearance:none;border:1px solid color-mix(in srgb, var(--visual-tone) 28%, var(--lx-border-subtle));border-radius:var(--lx-radius-sm);width:100%;min-height:38px;padding:var(--lx-space-2xs) var(--lx-space-xs);background:color-mix(in srgb, var(--visual-tone) 10%, transparent);color:var(--visual-tone);font:inherit;font-size:var(--lx-text-2xs);opacity:var(--lx-vs-alpha);cursor:pointer}._5U3G3a_matrixCell:hover{border-color:var(--visual-tone);background:color-mix(in srgb, var(--visual-tone) 18%, transparent)}._5U3G3a_matrixCell[data-visual-state=current]{font-weight:var(--lx-weight-strong);border-width:2px}._5U3G3a_emptyCell{color:var(--lx-label-tertiary);font-size:var(--lx-text-md)}._5U3G3a_setMap{gap:var(--lx-space-lg);display:grid}._5U3G3a_setZones{gap:var(--lx-space-md);grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));display:grid}._5U3G3a_setZone{border:1.5px solid color-mix(in srgb, var(--visual-tone) 50%, transparent);border-radius:var(--lx-radius-lg);min-width:0;padding:var(--lx-space-lg);background:color-mix(in srgb, var(--visual-tone) 7%, transparent);opacity:var(--lx-vs-alpha);position:relative}._5U3G3a_setZone[data-visual-state=current]{border-width:2px}._5U3G3a_setZone h4,._5U3G3a_intersections h4{align-items:center;gap:var(--lx-space-sm);margin:0 0 var(--lx-space-sm);color:var(--lx-label-primary);font-size:var(--lx-text-sm);font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-sm);display:flex}._5U3G3a_setZone h4>span{border-radius:var(--lx-radius-circle);background:var(--visual-tone);flex:none;width:8px;height:8px}._5U3G3a_setZone>div{gap:var(--lx-space-xs);flex-wrap:wrap;align-content:flex-start;min-height:34px;display:flex}._5U3G3a_setItem{border-color:color-mix(in srgb, var(--visual-tone) 28%, var(--lx-border-subtle));border-radius:var(--lx-radius-pill);background:color-mix(in srgb, var(--visual-tone) 10%, var(--lx-surface-base));opacity:var(--lx-vs-alpha)}._5U3G3a_emptySet{color:var(--lx-label-tertiary);font-size:var(--lx-text-2xs);line-height:var(--lx-leading-2xs);align-self:center}._5U3G3a_intersections{border:1px dashed var(--lx-border-strong);border-radius:var(--lx-radius-lg);padding:var(--lx-space-md)}._5U3G3a_intersections>div{gap:var(--lx-space-sm);grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr));display:grid}._5U3G3a_intersectionItem{gap:var(--lx-space-3xs);padding:var(--lx-space-xs) var(--lx-space-sm);text-align:left;opacity:var(--lx-vs-alpha);justify-items:start;display:grid}._5U3G3a_intersectionItem strong{color:var(--lx-label-primary);font-size:var(--lx-text-2xs);line-height:var(--lx-leading-2xs)}._5U3G3a_intersectionItem span{color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro)}._5U3G3a_vennContainer{padding:var(--lx-space-sm);border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-md);background:var(--lx-surface-sunken);justify-content:center;align-items:center;display:flex}._5U3G3a_vennSvg{width:100%;max-width:480px;height:auto;overflow:visible}._5U3G3a_vennCircle{fill:color-mix(in srgb, var(--visual-tone) 14%, transparent);stroke:var(--visual-tone);stroke-width:2px;mix-blend-mode:multiply;transition:fill var(--lx-motion-fast) var(--lx-easing), stroke-width var(--lx-motion-fast) var(--lx-easing)}[data-theme=dark] ._5U3G3a_vennCircle{mix-blend-mode:screen;fill:color-mix(in srgb, var(--visual-tone) 20%, transparent)}._5U3G3a_vennLabel{fill:var(--visual-tone);font-size:var(--lx-text-xs);font-weight:var(--lx-weight-strong);letter-spacing:.02em}._5U3G3a_vennIntersectionLabel{fill:var(--lx-label-secondary);font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-medium)}._5U3G3a_vennItems{pointer-events:none}._5U3G3a_vennItem{fill:var(--lx-label-primary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-medium)}._5U3G3a_vennOverflow{fill:var(--lx-label-tertiary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong)}@container _5U3G3a_visual-view (width<=560px){._5U3G3a_relationTable{min-width:420px}}";
const tagId$9 = "@dsh-portable/visual/relation.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$9;
	tag.textContent = css$9;
	document.head.appendChild(tag);
}
var relation_module_css_default = {
	"cellButton": "_5U3G3a_cellButton",
	"emptyCell": "_5U3G3a_emptyCell",
	"emptySet": "_5U3G3a_emptySet",
	"intersectionItem": "_5U3G3a_intersectionItem",
	"intersections": "_5U3G3a_intersections",
	"matrixCell": "_5U3G3a_matrixCell",
	"matrixTable": "_5U3G3a_matrixTable",
	"relationTable": "_5U3G3a_relationTable",
	"setItem": "_5U3G3a_setItem",
	"setMap": "_5U3G3a_setMap",
	"setZone": "_5U3G3a_setZone",
	"setZones": "_5U3G3a_setZones",
	"tableViewport": "_5U3G3a_tableViewport",
	"vennCircle": "_5U3G3a_vennCircle",
	"vennContainer": "_5U3G3a_vennContainer",
	"vennIntersectionLabel": "_5U3G3a_vennIntersectionLabel",
	"vennItem": "_5U3G3a_vennItem",
	"vennItems": "_5U3G3a_vennItems",
	"vennLabel": "_5U3G3a_vennLabel",
	"vennOverflow": "_5U3G3a_vennOverflow",
	"vennSvg": "_5U3G3a_vennSvg",
	"visual-view": "_5U3G3a_visual-view"
};
//#endregion
//#region src/client/visuals/renderers/RelationRenderer.tsx
/** `relation`: comparison tables, pairwise matrices and set membership. */
function RelationRenderer({ content, focus }) {
	const labels = useVisualLabels();
	const diagramId = useId();
	const [selected, setSelected] = useState();
	const close = () => setSelected(void 0);
	if (content.variant === "comparison") return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [/* @__PURE__ */ jsx("div", {
			className: `${shell_module_css_default.viewport} ${relation_module_css_default.tableViewport}`,
			children: /* @__PURE__ */ jsxs("table", {
				className: relation_module_css_default.relationTable,
				children: [
					/* @__PURE__ */ jsx("caption", {
						className: shell_module_css_default.srOnly,
						children: labels.comparisonCaption
					}),
					/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", {
						scope: "col",
						children: labels.comparisonDimension
					}), content.subjects.map((subject) => /* @__PURE__ */ jsx("th", {
						scope: "col",
						"data-tone": toneAt(subject.tone),
						"data-visual-state": elementState(subject.id, focus),
						"data-visual-id": subject.id,
						children: /* @__PURE__ */ jsx("button", {
							type: "button",
							className: relation_module_css_default.cellButton,
							onClick: () => setSelected({
								label: subject.label,
								detail: subject.detail,
								kind: labels.comparisonSubject
							}),
							children: subject.label
						})
					}, subject.id))] }) }),
					/* @__PURE__ */ jsx("tbody", { children: content.rows.map((row) => /* @__PURE__ */ jsxs("tr", {
						"data-visual-state": elementState(row.id, focus),
						"data-visual-id": row.id,
						children: [/* @__PURE__ */ jsx("th", {
							scope: "row",
							children: /* @__PURE__ */ jsx("button", {
								type: "button",
								className: relation_module_css_default.cellButton,
								onClick: () => setSelected({
									label: row.label,
									detail: row.detail,
									kind: labels.comparisonDimension
								}),
								children: row.label
							})
						}), content.subjects.map((subject) => {
							const cell = row.cells.find((item) => item.subjectId === subject.id);
							return /* @__PURE__ */ jsx("td", {
								"data-tone": toneAt(cell?.tone),
								children: cell?.value ?? "—"
							}, subject.id);
						})]
					}, row.id)) })
				]
			})
		}), /* @__PURE__ */ jsx(SelectionSurface, {
			hint: labels.comparisonInteractionHint,
			selected,
			onClose: close
		})]
	});
	if (content.variant === "matrix") return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [/* @__PURE__ */ jsx("div", {
			className: `${shell_module_css_default.viewport} ${relation_module_css_default.tableViewport}`,
			children: /* @__PURE__ */ jsxs("table", {
				className: `${relation_module_css_default.relationTable} ${relation_module_css_default.matrixTable}`,
				children: [
					/* @__PURE__ */ jsx("caption", {
						className: shell_module_css_default.srOnly,
						children: labels.matrixCaption
					}),
					/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", {
						scope: "col",
						children: labels.matrixAxes
					}), content.columns.map((column) => /* @__PURE__ */ jsx("th", {
						scope: "col",
						"data-visual-state": elementState(column.id, focus),
						"data-visual-id": column.id,
						children: column.label
					}, column.id))] }) }),
					/* @__PURE__ */ jsx("tbody", { children: content.rows.map((row) => /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", {
						scope: "row",
						"data-visual-state": elementState(row.id, focus),
						"data-visual-id": row.id,
						children: row.label
					}), content.columns.map((column) => {
						const cell = content.cells.find((item) => item.rowId === row.id && item.columnId === column.id);
						return /* @__PURE__ */ jsx("td", { children: cell === void 0 ? /* @__PURE__ */ jsx("span", {
							className: relation_module_css_default.emptyCell,
							"aria-label": labels.noRelation,
							children: "·"
						}) : /* @__PURE__ */ jsx("button", {
							type: "button",
							className: relation_module_css_default.matrixCell,
							"data-tone": toneAt(cell.tone),
							"data-visual-state": elementState(cell.id, focus),
							"data-visual-id": cell.id,
							onClick: () => setSelected({
								label: cell.label,
								detail: cell.detail,
								kind: `${row.label} × ${column.label}`
							}),
							children: cell.label
						}) }, column.id);
					})] }, row.id)) })
				]
			})
		}), /* @__PURE__ */ jsx(SelectionSurface, {
			hint: labels.matrixInteractionHint,
			selected,
			onClose: close
		})]
	});
	const setById = new Map(content.sets.map((set) => [set.id, set]));
	const exclusiveItems = (setId) => content.items.filter((item) => item.setIds.length === 1 && item.setIds[0] === setId);
	const sharedItems = content.items.filter((item) => item.setIds.length !== 1);
	const isTwoSets = content.sets.length === 2;
	const setA = content.sets[0];
	const setB = content.sets[1];
	const vennItems = (items, x, keyPrefix) => {
		const visible = items.slice(0, 4);
		const lines = visible.flatMap((item) => wrapLabel(item.label, {
			fontSize: 10,
			maxWidth: 82,
			maxLines: 2
		}).lines.map((line, lineIndex) => ({
			item,
			line,
			lineIndex
		})));
		const overflow = items.length - visible.length;
		return [...lines.map(({ item, line, lineIndex }, index) => /* @__PURE__ */ jsx("text", {
			className: relation_module_css_default.vennItem,
			x,
			y: 68 + index * 17,
			textAnchor: "middle",
			children: line
		}, `${keyPrefix}-${item.id}-${String(lineIndex)}`)), overflow > 0 ? /* @__PURE__ */ jsxs("text", {
			className: relation_module_css_default.vennOverflow,
			x,
			y: 68 + lines.length * 17,
			textAnchor: "middle",
			children: ["+", overflow]
		}, `${keyPrefix}-overflow`) : null];
	};
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [/* @__PURE__ */ jsxs("div", {
			className: relation_module_css_default.setMap,
			role: "group",
			"aria-label": labels.setsLabel,
			children: [
				!isTwoSets || !setA || !setB ? null : /* @__PURE__ */ jsx("div", {
					className: relation_module_css_default.vennContainer,
					children: /* @__PURE__ */ jsxs("svg", {
						className: relation_module_css_default.vennSvg,
						viewBox: "0 0 520 180",
						role: "img",
						"aria-label": labels.setsLabel,
						children: [
							/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("filter", {
								id: `${diagramId}-venn-glow`,
								x: "-20%",
								y: "-20%",
								width: "140%",
								height: "140%",
								children: /* @__PURE__ */ jsx("feDropShadow", {
									dx: "0",
									dy: "2",
									stdDeviation: "4",
									floodOpacity: "0.12"
								})
							}) }),
							/* @__PURE__ */ jsx("circle", {
								className: relation_module_css_default.vennCircle,
								"data-tone": toneAt(setA.tone, 0),
								cx: "195",
								cy: "90",
								r: "78",
								filter: `url(#${diagramId}-venn-glow)`
							}),
							/* @__PURE__ */ jsx("circle", {
								className: relation_module_css_default.vennCircle,
								"data-tone": toneAt(setB.tone, 1),
								cx: "325",
								cy: "90",
								r: "78",
								filter: `url(#${diagramId}-venn-glow)`
							}),
							/* @__PURE__ */ jsx("text", {
								className: relation_module_css_default.vennLabel,
								"data-tone": toneAt(setA.tone, 0),
								x: "195",
								y: "25",
								textAnchor: "middle",
								children: setA.label
							}),
							/* @__PURE__ */ jsx("text", {
								className: relation_module_css_default.vennLabel,
								"data-tone": toneAt(setB.tone, 1),
								x: "325",
								y: "25",
								textAnchor: "middle",
								children: setB.label
							}),
							/* @__PURE__ */ jsx("text", {
								className: relation_module_css_default.vennIntersectionLabel,
								x: "260",
								y: "25",
								textAnchor: "middle",
								children: "∩"
							}),
							/* @__PURE__ */ jsxs("g", {
								className: relation_module_css_default.vennItems,
								"aria-hidden": "true",
								children: [
									vennItems(exclusiveItems(setA.id), 157, "a"),
									vennItems(exclusiveItems(setB.id), 363, "b"),
									vennItems(sharedItems, 260, "shared")
								]
							})
						]
					})
				}),
				/* @__PURE__ */ jsx("div", {
					className: relation_module_css_default.setZones,
					children: content.sets.map((set, setIndex) => /* @__PURE__ */ jsxs("section", {
						className: relation_module_css_default.setZone,
						"data-tone": toneAt(set.tone, setIndex),
						"data-visual-state": elementState(set.id, focus),
						"data-visual-id": set.id,
						children: [/* @__PURE__ */ jsxs("h4", { children: [/* @__PURE__ */ jsx("span", { "aria-hidden": "true" }), set.label] }), /* @__PURE__ */ jsxs("div", { children: [exclusiveItems(set.id).map((item) => /* @__PURE__ */ jsx("button", {
							type: "button",
							className: `${shell_module_css_default.control} ${relation_module_css_default.setItem}`,
							"data-visual-state": elementState(item.id, focus),
							"data-visual-id": item.id,
							onClick: () => setSelected({
								label: item.label,
								detail: item.detail,
								kind: set.label
							}),
							children: item.label
						}, item.id)), exclusiveItems(set.id).length === 0 ? /* @__PURE__ */ jsx("span", {
							className: relation_module_css_default.emptySet,
							children: labels.noExclusiveItems
						}) : null] })]
					}, set.id))
				}),
				sharedItems.length === 0 ? null : /* @__PURE__ */ jsxs("section", {
					className: relation_module_css_default.intersections,
					children: [/* @__PURE__ */ jsx("h4", { children: labels.intersections }), /* @__PURE__ */ jsx("div", { children: sharedItems.map((item) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: `${shell_module_css_default.control} ${relation_module_css_default.intersectionItem}`,
						"data-visual-state": elementState(item.id, focus),
						"data-visual-id": item.id,
						onClick: () => setSelected({
							label: item.label,
							detail: item.detail,
							kind: item.setIds.map((setId) => setById.get(setId)?.label ?? setId).join(" ∩ ") || labels.uncategorized
						}),
						children: [/* @__PURE__ */ jsx("strong", { children: item.label }), /* @__PURE__ */ jsx("span", { children: item.setIds.map((setId) => setById.get(setId)?.label ?? setId).join(" ∩ ") || labels.uncategorized })]
					}, item.id)) })]
				})
			]
		}), /* @__PURE__ */ jsx(SelectionSurface, {
			hint: labels.setsInteractionHint,
			selected,
			onClose: close
		})]
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/timeline.module.css.mjs
const css$8 = ".EucK5G_timelineCanvas{min-width:0;position:relative}.EucK5G_timelineAxis{border-radius:var(--lx-radius-pill);background:color-mix(in srgb, var(--lx-border-strong) 80%, var(--lx-accent));height:2.5px;position:absolute;left:66px;right:66px}.EucK5G_timelineAxis:after{border-top:5px solid #0000;border-bottom:5px solid #0000;border-left:8px solid var(--lx-border-strong);content:\"\";position:absolute;top:-4px;right:-2px}.EucK5G_timelineEra,.EucK5G_timelineEvent{appearance:none;border:1px solid color-mix(in srgb, var(--visual-tone) 42%, var(--lx-border-subtle));background:color-mix(in srgb, var(--visual-tone) 9%, var(--lx-surface-base));color:var(--lx-label-primary);font:inherit;opacity:var(--lx-vs-alpha);cursor:pointer;transition:border-color var(--lx-motion-fast) var(--lx-easing), background-color var(--lx-motion-fast) var(--lx-easing), transform var(--lx-motion-fast) var(--lx-easing), box-shadow var(--lx-motion-fast) var(--lx-easing)}.EucK5G_timelineEra{z-index:1;border-radius:var(--lx-radius-pill);min-height:26px;padding:var(--lx-space-3xs) var(--lx-space-md);color:var(--visual-tone);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-micro);text-overflow:ellipsis;white-space:nowrap;position:absolute;overflow:hidden;box-shadow:0 1px 3px #0000000d}.EucK5G_timelineEvent{z-index:2;box-sizing:border-box;gap:var(--lx-space-3xs);border-radius:var(--lx-radius-md);width:156px;min-height:64px;padding:var(--lx-space-xs) var(--lx-space-sm);text-align:left;box-shadow:var(--lx-shadow-sm);display:grid;position:absolute;transform:translate(-50%)}.EucK5G_timelineEvent:before{border:2.5px solid var(--lx-surface-base);border-radius:var(--lx-radius-circle);background:var(--visual-tone);width:12px;height:12px;box-shadow:0 0 4px var(--visual-tone);content:\"\";position:absolute;left:calc(50% - 6px)}.EucK5G_timelineEvent:after{background:color-mix(in srgb, var(--visual-tone) 75%, transparent);content:\"\";width:1.5px;height:20px;position:absolute;left:50%}.EucK5G_timelineEvent[data-side=top]:before{bottom:-33px}.EucK5G_timelineEvent[data-side=top]:after{bottom:-21px}.EucK5G_timelineEvent[data-side=bottom]:before{top:-33px}.EucK5G_timelineEvent[data-side=bottom]:after{top:-21px}.EucK5G_timelineEvent>span{color:var(--visual-tone);font-size:var(--lx-text-micro);font-variant-numeric:tabular-nums;font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-micro)}.EucK5G_timelineEvent>strong{min-width:0;color:var(--lx-label-primary);font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-medium);line-height:var(--lx-leading-2xs);overflow-wrap:anywhere;-webkit-line-clamp:3;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}.EucK5G_timelineEra:hover,.EucK5G_timelineEvent:hover{border-color:var(--visual-tone);background:color-mix(in srgb, var(--visual-tone) 16%, var(--lx-surface-base))}.EucK5G_timelineEra[data-visual-state=current],.EucK5G_timelineEvent[data-visual-state=current]{border-color:var(--visual-tone);box-shadow:0 0 0 3px color-mix(in srgb, var(--visual-tone) 18%, transparent);border-width:2px}.EucK5G_timelineEraChips{gap:var(--lx-space-sm);flex-wrap:wrap;display:flex}.EucK5G_eraChip{border-color:color-mix(in srgb, var(--visual-tone) 42%, var(--lx-border-subtle));border-radius:var(--lx-radius-pill);padding:var(--lx-space-2xs) var(--lx-space-md);background:color-mix(in srgb, var(--visual-tone) 9%, var(--lx-surface-base));opacity:var(--lx-vs-alpha);text-align:left;justify-items:start;gap:0;display:inline-grid}.EucK5G_eraChip strong{color:var(--visual-tone);font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-2xs)}.EucK5G_eraChip span{color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro)}.EucK5G_timelineVertical{padding:var(--lx-space-2xs) 0 var(--lx-space-2xs) var(--lx-space-md);gap:0;margin:0;list-style:none;display:grid}.EucK5G_timelineVertical li{border-left:2px solid color-mix(in srgb, var(--visual-tone) 46%, var(--lx-border-default));padding:0 0 var(--lx-space-lg) var(--lx-space-2xl);opacity:var(--lx-vs-alpha);position:relative}.EucK5G_timelineVertical li:last-child{padding-bottom:0}.EucK5G_timelineVertical li:before{border:2px solid var(--lx-surface-base);border-radius:var(--lx-radius-circle);background:var(--visual-tone);content:\"\";width:9px;height:9px;position:absolute;top:15px;left:-6px}.EucK5G_verticalEvent{gap:var(--lx-space-3xs) var(--lx-space-lg);border-radius:var(--lx-radius-md);width:min(100%,620px);padding:var(--lx-space-sm) var(--lx-space-md);text-align:left;grid-template-columns:minmax(72px,auto) minmax(0,1fr);display:grid}.EucK5G_verticalEvent>span{color:var(--visual-tone);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong)}.EucK5G_verticalEvent>strong{color:var(--lx-label-primary);font-size:var(--lx-text-xs);overflow-wrap:anywhere}.EucK5G_verticalEvent>small{color:var(--lx-label-secondary);font-size:var(--lx-text-2xs);line-height:var(--lx-leading-2xs);grid-column:1/-1}.EucK5G_timelineVertical li[data-visual-state=current]{border-left-color:var(--visual-tone);border-left-width:3px}@media (prefers-reduced-motion:reduce){.EucK5G_timelineEra,.EucK5G_timelineEvent{transition:none}}";
const tagId$8 = "@dsh-portable/visual/timeline.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$8) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$8;
	tag.textContent = css$8;
	document.head.appendChild(tag);
}
var timeline_module_css_default = {
	"eraChip": "EucK5G_eraChip",
	"timelineAxis": "EucK5G_timelineAxis",
	"timelineCanvas": "EucK5G_timelineCanvas",
	"timelineEra": "EucK5G_timelineEra",
	"timelineEraChips": "EucK5G_timelineEraChips",
	"timelineEvent": "EucK5G_timelineEvent",
	"timelineVertical": "EucK5G_timelineVertical",
	"verticalEvent": "EucK5G_verticalEvent"
};
//#endregion
//#region src/client/visuals/renderers/TimelineRenderer.tsx
/** `timeline`: chronologies, phases and eras, horizontal or vertical. */
/** Vertical distance from the axis to the top of an upper-row event card. */
const CARD_OFFSET = 86;
/** Card width (156px) plus a small breathing room between neighbouring cards. */
const MIN_EVENT_GAP = 172;
const AXIS_INSET = 66;
/** One non-overlapping horizontal lane per era (the protocol caps eras at 8). */
function timelineEraTop(index) {
	return 14 + index * 28;
}
function timelinePosition(event, index, count) {
	if (event.position !== void 0) return Math.max(0, Math.min(1, event.position));
	return count <= 1 ? .5 : index / (count - 1);
}
/**
* Resolve explicit positions that are too close to hold two event cards.
*
* The protocol's normalized positions are useful for showing long gaps, but
* they can legitimately put several milestones in the same small interval.
* Leaving those values untouched makes the fixed-width cards paint on top of
* each other. We preserve the order and spread only colliding centres; the
* canvas grows when the spread cannot fit, so the axis and era spans remain
* honest and the viewport can scroll on a narrow surface.
*/
function timelineEventLayout(content, containerWidth) {
	const count = content.events.length;
	const minimumWidth = 132 + Math.max(0, count - 1) * MIN_EVENT_GAP;
	const baseWidth = Math.max(minimumWidth, Math.floor(containerWidth) - 2);
	if (count === 0) return {
		width: baseWidth,
		positions: []
	};
	const ordered = content.events.map((event, index) => AXIS_INSET + timelinePosition(event, index, count) * (baseWidth - 132)).map((position, index) => ({
		position,
		index
	})).sort((a, b) => a.position - b.position || a.index - b.index);
	const resolved = new Array(count);
	let previous = AXIS_INSET;
	for (const [orderIndex, item] of ordered.entries()) {
		const position = orderIndex === 0 ? Math.max(AXIS_INSET, item.position) : Math.max(item.position, previous + MIN_EVENT_GAP);
		resolved[item.index] = position;
		previous = position;
	}
	const width = baseWidth;
	const overflow = Math.max(0, previous - (width - AXIS_INSET));
	if (overflow > 0) for (let index = 0; index < resolved.length; index += 1) resolved[index] = Math.max(AXIS_INSET, (resolved[index] ?? AXIS_INSET) - overflow);
	return {
		width,
		positions: resolved.map((position) => position ?? AXIS_INSET)
	};
}
function TimelineRenderer({ content, focus }) {
	const labels = useVisualLabels();
	const [viewportRef, containerWidth] = useContainerWidth();
	const [selected, setSelected] = useState();
	const eras = content.eras ?? [];
	const eventIndex = useMemo(() => new Map(content.events.map((event, index) => [event.id, index])), [content.events]);
	const selectEvent = (event) => setSelected({
		label: `${event.time} · ${event.label}`,
		detail: event.detail,
		kind: labels.timelineEventKind
	});
	const selectEra = (era) => setSelected({
		label: era.label,
		detail: era.detail,
		kind: labels.timelineEraKind
	});
	if ((content.orientation ?? "horizontal") === "vertical" || containerWidth < 420) return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		role: "group",
		"aria-label": labels.timelineLabel,
		children: [
			eras.length === 0 ? null : /* @__PURE__ */ jsx("div", {
				className: timeline_module_css_default.timelineEraChips,
				role: "group",
				"aria-label": labels.timelineEraKind,
				children: eras.map((era, index) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: `${shell_module_css_default.control} ${timeline_module_css_default.eraChip}`,
					"data-tone": toneAt(era.tone, index),
					"data-visual-state": elementState(era.id, focus),
					"data-visual-id": era.id,
					onClick: () => selectEra(era),
					children: [/* @__PURE__ */ jsx("strong", { children: era.label }), /* @__PURE__ */ jsxs("span", { children: [
						content.events[eventIndex.get(era.startEventId) ?? 0]?.time,
						" – ",
						content.events[eventIndex.get(era.endEventId) ?? 0]?.time
					] })]
				}, era.id))
			}),
			/* @__PURE__ */ jsx("ol", {
				className: timeline_module_css_default.timelineVertical,
				children: content.events.map((event, index) => /* @__PURE__ */ jsx("li", {
					"data-tone": toneAt(event.tone, index),
					"data-visual-state": elementState(event.id, focus),
					"data-visual-id": event.id,
					children: /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: `${shell_module_css_default.control} ${timeline_module_css_default.verticalEvent}`,
						title: event.label,
						onClick: () => selectEvent(event),
						children: [
							/* @__PURE__ */ jsx("span", { children: event.time }),
							/* @__PURE__ */ jsx("strong", { children: event.label }),
							event.detail === void 0 ? null : /* @__PURE__ */ jsx("small", { children: event.detail })
						]
					})
				}, event.id))
			}),
			/* @__PURE__ */ jsx(SelectionSurface, {
				hint: labels.timelineInteractionHint,
				selected,
				onClose: () => setSelected(void 0)
			})
		]
	});
	const eventLayout = timelineEventLayout(content, containerWidth);
	const width = eventLayout.width;
	const eraRows = eras.length;
	const eraLaneBottom = eras.length === 0 ? 0 : 14 + (eraRows - 1) * 28 + 26;
	const axisY = Math.max(90, eraLaneBottom + 8 + CARD_OFFSET);
	const height = axisY + 130;
	const eventX = (_event, index) => eventLayout.positions[index] ?? AXIS_INSET;
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		role: "group",
		"aria-label": labels.timelineLabel,
		children: [/* @__PURE__ */ jsx("div", {
			className: shell_module_css_default.viewport,
			ref: viewportRef,
			children: /* @__PURE__ */ jsxs("div", {
				className: timeline_module_css_default.timelineCanvas,
				style: {
					width,
					height
				},
				children: [
					eras.map((era, index) => {
						const startIndex = eventIndex.get(era.startEventId) ?? 0;
						const endIndex = eventIndex.get(era.endEventId) ?? startIndex;
						const start = eventX(content.events[startIndex], startIndex);
						const end = eventX(content.events[endIndex], endIndex);
						return /* @__PURE__ */ jsx("button", {
							type: "button",
							className: timeline_module_css_default.timelineEra,
							"data-tone": toneAt(era.tone, index),
							"data-visual-state": elementState(era.id, focus),
							"data-visual-id": era.id,
							style: {
								left: Math.min(start, end),
								top: timelineEraTop(index),
								width: Math.max(48, Math.abs(end - start))
							},
							onClick: () => selectEra(era),
							children: era.label
						}, era.id);
					}),
					/* @__PURE__ */ jsx("div", {
						className: timeline_module_css_default.timelineAxis,
						style: { top: axisY },
						"aria-hidden": "true"
					}),
					content.events.map((event, index) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: timeline_module_css_default.timelineEvent,
						"data-tone": toneAt(event.tone, index),
						"data-side": index % 2 === 0 ? "top" : "bottom",
						"data-visual-state": elementState(event.id, focus),
						"data-visual-id": event.id,
						title: event.label,
						style: {
							left: eventX(event, index),
							top: index % 2 === 0 ? axisY - CARD_OFFSET : axisY + 24
						},
						onClick: () => selectEvent(event),
						children: [/* @__PURE__ */ jsx("span", { children: event.time }), /* @__PURE__ */ jsx("strong", { children: event.label })]
					}, event.id))
				]
			})
		}), /* @__PURE__ */ jsx(SelectionSurface, {
			hint: labels.timelineInteractionHint,
			selected,
			onClose: () => setSelected(void 0)
		})]
	});
}
//#endregion
//#region src/client/markdown.tsx
/**
* Localized Markdown for every visual surface.
*
* Harness 0.2 made `MarkdownText` require its chrome labels (code-card copy
* and wrap actions, footnote heading). Upstream plugins build them from the
* shared `common` locale vocabulary through their namespace-bound `t`
* (`packages/client/ui-tool/src/client/tool/models/primitive-labels.ts`). An
* owning view builds them once from its own `t` and provides them here, so
* nested renderers do not each thread a `t` they would otherwise not need.
*/
/**
* Build Markdown chrome labels from the shared `common` vocabulary. A
* namespace-bound translate consults `common` after the namespace misses.
* @param t - the owning view's locale seat.
*/
function markdownLabelsOf(t) {
	return {
		code: {
			copyLabel: t("copy"),
			copiedLabel: t("copied"),
			toolbarLabels: {
				codeLabel: t("codeBlock.title"),
				wrapLabel: t("codeBlock.wrap"),
				unwrapLabel: t("codeBlock.unwrap")
			}
		},
		footnotes: t("markdown.footnotes")
	};
}
/** Isolated-render defaults (tests, the browser fixture); live views always provide localized labels. */
const DEFAULT_MARKDOWN_LABELS = {
	code: {
		copyLabel: "Copy",
		copiedLabel: "Copied",
		toolbarLabels: {
			codeLabel: "Code block",
			wrapLabel: "Wrap lines",
			unwrapLabel: "Do not wrap lines"
		}
	},
	footnotes: "Footnotes"
};
const MarkdownLabelsContext = createContext(DEFAULT_MARKDOWN_LABELS);
const MarkdownLabelsProvider = MarkdownLabelsContext.Provider;
/** `MarkdownText` with the surrounding surface's localized chrome labels. */
function LocalizedMarkdown({ text }) {
	return /* @__PURE__ */ jsx(MarkdownText, {
		text,
		labels: useContext(MarkdownLabelsContext)
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/formula.module.css.mjs
const css$7 = ".rr6fpG_formulaMeta{justify-content:space-between;align-items:center;gap:var(--lx-space-lg);min-width:0;color:var(--lx-accent);font-size:var(--lx-text-2xs);font-variant-numeric:tabular-nums;font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-2xs);display:flex}.rr6fpG_formulaMeta code{border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-xs);padding:var(--lx-space-3xs) var(--lx-space-sm);background:var(--lx-surface-sunken);color:var(--lx-label-secondary);font-family:var(--lx-font-mono);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-regular);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.rr6fpG_formulaSteps{gap:0;margin:0;padding:0;list-style:none;display:grid}.rr6fpG_formulaSteps>li{min-width:0;opacity:var(--lx-vs-alpha)}.rr6fpG_formulaStepCard{gap:var(--lx-space-md);border:1px solid color-mix(in srgb, var(--visual-tone) 32%, var(--lx-border-subtle));border-radius:var(--lx-radius-md);min-width:0;padding:var(--lx-space-md);background:color-mix(in srgb, var(--visual-tone) 7%, var(--lx-surface-base));grid-template-columns:30px minmax(0,1fr);align-items:start;display:grid;box-shadow:0 1px 3px #0000000a}.rr6fpG_formulaSteps>li[data-visual-state=current] .rr6fpG_formulaStepCard{border-width:2px;border-color:var(--visual-tone);box-shadow:0 0 10px color-mix(in srgb, var(--visual-tone) 30%, transparent)}.rr6fpG_formulaStepCard>span{border-radius:var(--lx-radius-circle);background:color-mix(in srgb, var(--visual-tone) 16%, var(--lx-surface-base));width:28px;height:28px;color:var(--visual-tone);font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-strong);place-items:center;display:grid}.rr6fpG_formulaStepCard>div{gap:var(--lx-space-2xs);min-width:0;display:grid}.rr6fpG_formulaExpression{padding:var(--lx-space-sm) 0;color:var(--lx-label-primary);font-size:var(--lx-text-formula);font-weight:var(--lx-weight-medium);line-height:var(--lx-leading-formula);scrollbar-width:thin;overflow:auto hidden}.rr6fpG_formulaExpression>div{min-width:max-content}.rr6fpG_formulaExpression .katex-display{text-align:left;margin:2px 0}.rr6fpG_formulaStepCard strong{color:var(--visual-tone);font-size:var(--lx-text-2xs);line-height:var(--lx-leading-2xs)}.rr6fpG_formulaStepCard p{color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs);margin:0}.rr6fpG_formulaRule{gap:var(--lx-space-xs) var(--lx-space-md);border-left:2px solid color-mix(in srgb, var(--visual-tone) 32%, var(--lx-border-subtle));min-height:44px;padding:var(--lx-space-3xs) var(--lx-space-md);color:var(--lx-label-secondary);font-size:var(--lx-text-2xs);line-height:var(--lx-leading-2xs);grid-template-columns:30px auto minmax(0,1fr);align-items:center;margin-left:14px;display:grid}.rr6fpG_formulaRule>span:first-child{color:var(--visual-tone);font-size:var(--lx-text-lg);text-align:center}.rr6fpG_formulaRule strong{color:var(--visual-tone);font-size:var(--lx-text-micro);letter-spacing:.04em;text-transform:uppercase}.rr6fpG_formulaUnknown{gap:var(--lx-space-md);padding:var(--lx-space-3xs) var(--lx-space-md);color:var(--lx-label-tertiary);grid-template-columns:30px minmax(0,1fr);align-items:center;display:grid}.rr6fpG_formulaUnknown>span:first-child{color:var(--visual-tone);font-size:var(--lx-text-lg);text-align:center}.rr6fpG_formulaUnknown>span:last-child{border:1px dashed var(--lx-border-default);border-radius:var(--lx-radius-md);min-height:38px;padding:var(--lx-space-xs) var(--lx-space-md);color:var(--lx-label-tertiary);font-size:var(--lx-text-2xs);align-items:center;display:flex}.rr6fpG_formulaConclusion{gap:var(--lx-space-3xs);border:1px solid var(--lx-border-subtle);border-left:3.5px solid var(--lx-success);border-radius:var(--lx-radius-md);padding:var(--lx-space-sm) var(--lx-space-md);background:color-mix(in srgb, var(--lx-success) 10%, var(--lx-surface-base));box-shadow:var(--lx-shadow-sm);display:grid}.rr6fpG_formulaConclusion span{color:var(--lx-success);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);letter-spacing:var(--lx-tracking-eyebrow);text-transform:uppercase}.rr6fpG_formulaConclusion strong{color:var(--lx-label-primary);font-size:var(--lx-text-sm);line-height:var(--lx-leading-sm)}@container rr6fpG_visual-view (width<=360px){.rr6fpG_formulaStepCard{padding:var(--lx-space-sm);grid-template-columns:24px minmax(0,1fr)}.rr6fpG_formulaStepCard>span{width:23px;height:23px}.rr6fpG_formulaRule{grid-template-columns:24px minmax(0,1fr)}.rr6fpG_formulaRule strong,.rr6fpG_formulaRule>span:last-child{grid-column:2}}";
const tagId$7 = "@dsh-portable/visual/formula.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$7;
	tag.textContent = css$7;
	document.head.appendChild(tag);
}
var formula_module_css_default = {
	"formulaConclusion": "rr6fpG_formulaConclusion",
	"formulaExpression": "rr6fpG_formulaExpression",
	"formulaMeta": "rr6fpG_formulaMeta",
	"formulaRule": "rr6fpG_formulaRule",
	"formulaStepCard": "rr6fpG_formulaStepCard",
	"formulaSteps": "rr6fpG_formulaSteps",
	"formulaUnknown": "rr6fpG_formulaUnknown",
	"visual-view": "rr6fpG_visual-view"
};
//#endregion
//#region src/client/visuals/renderers/FormulaStepsRenderer.tsx
/** `formula_steps`: a derivation revealed one justified transformation at a time. */
function initialRevealedIndex(content, storageKey) {
	const lastIndex = content.steps.length - 1;
	if (storageKey === void 0 || typeof sessionStorage === "undefined") return 0;
	try {
		const stored = JSON.parse(sessionStorage.getItem(`dsh-learning/visual@4:formula:${storageKey}`) ?? "{}");
		return typeof stored.revealedIndex === "number" && Number.isInteger(stored.revealedIndex) ? Math.max(0, Math.min(lastIndex, stored.revealedIndex)) : 0;
	} catch {
		return 0;
	}
}
function FormulaStepsRenderer({ content, focus, storageKey }) {
	const labels = useVisualLabels();
	const [revealedIndex, setRevealedIndex] = useState(() => initialRevealedIndex(content, storageKey));
	const lastIndex = content.steps.length - 1;
	useEffect(() => {
		if (storageKey === void 0 || typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.setItem(`dsh-learning/visual@4:formula:${storageKey}`, JSON.stringify({ revealedIndex }));
		} catch {}
	}, [revealedIndex, storageKey]);
	useEffect(() => {
		const focusedIndex = content.steps.findIndex((step) => focus.currentIds.has(step.id));
		if (focusedIndex >= 0) setRevealedIndex((current) => Math.max(current, focusedIndex));
	}, [content.steps, focus.currentIds]);
	const move = (delta) => setRevealedIndex((current) => Math.max(0, Math.min(lastIndex, current + delta)));
	const onKeyDown = (event) => {
		if (event.target !== event.currentTarget) return;
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			move(-1);
		} else if (event.key === "ArrowRight") {
			event.preventDefault();
			move(1);
		} else if (event.key === "Home") {
			event.preventDefault();
			setRevealedIndex(0);
		} else if (event.key === "End") {
			event.preventDefault();
			setRevealedIndex(lastIndex);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		role: "group",
		tabIndex: 0,
		onKeyDown,
		"aria-label": labels.formulaLabel,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: formula_module_css_default.formulaMeta,
				children: [/* @__PURE__ */ jsx("span", { children: labelTemplate(labels.formulaProgress, {
					current: revealedIndex + 1,
					total: content.steps.length
				}) }), content.notation === void 0 ? null : /* @__PURE__ */ jsx("code", { children: content.notation })]
			}),
			/* @__PURE__ */ jsx("ol", {
				className: formula_module_css_default.formulaSteps,
				"aria-live": "polite",
				children: content.steps.slice(0, revealedIndex + 1).map((step, index) => /* @__PURE__ */ jsxs("li", {
					"data-tone": toneAt(step.tone, index),
					"data-visual-state": elementState(step.id, focus),
					"data-visual-id": step.id,
					children: [index === 0 || step.rule === void 0 ? null : /* @__PURE__ */ jsxs("div", {
						className: formula_module_css_default.formulaRule,
						children: [
							/* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								children: "↓"
							}),
							/* @__PURE__ */ jsx("strong", { children: labels.formulaRule }),
							/* @__PURE__ */ jsx("span", { children: step.rule })
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: formula_module_css_default.formulaStepCard,
						children: [/* @__PURE__ */ jsx("span", { children: index + 1 }), /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("div", {
								className: formula_module_css_default.formulaExpression,
								"aria-label": step.expression,
								children: /* @__PURE__ */ jsx(LocalizedMarkdown, { text: displayMath(step.expression) })
							}),
							step.label === void 0 ? null : /* @__PURE__ */ jsx("strong", { children: step.label }),
							step.detail === void 0 ? null : /* @__PURE__ */ jsx("p", { children: step.detail })
						] })]
					})]
				}, step.id))
			}),
			revealedIndex >= lastIndex ? /* @__PURE__ */ jsxs("div", {
				className: formula_module_css_default.formulaConclusion,
				"aria-live": "polite",
				children: [/* @__PURE__ */ jsx("span", { children: labels.formulaConclusion }), /* @__PURE__ */ jsx("strong", { children: content.conclusion ?? labels.formulaComplete })]
			}) : /* @__PURE__ */ jsxs("div", {
				className: formula_module_css_default.formulaUnknown,
				"aria-hidden": "true",
				children: [/* @__PURE__ */ jsx("span", { children: "↓" }), /* @__PURE__ */ jsx("span", { children: labels.revealNextFormulaStep })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: shell_module_css_default.controlRow,
				children: [
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: shell_module_css_default.control,
						onClick: () => move(-1),
						disabled: revealedIndex === 0,
						children: labels.previousStep
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: `${shell_module_css_default.control} ${shell_module_css_default.controlPrimary}`,
						onClick: () => move(1),
						disabled: revealedIndex >= lastIndex,
						children: labels.revealNextFormulaStep
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: shell_module_css_default.control,
						onClick: () => setRevealedIndex(0),
						disabled: revealedIndex === 0,
						children: labels.reset
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: shell_module_css_default.selectionSlot,
				children: /* @__PURE__ */ jsx("p", {
					className: shell_module_css_default.interactionHint,
					children: labels.formulaInteractionHint
				})
			})
		]
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/study.module.css.mjs
const css$6 = "._9KV1ZG_studySource{gap:var(--lx-space-3xs) var(--lx-space-md);border:1px solid var(--lx-border-subtle);border-left:3.5px solid var(--lx-accent);border-radius:var(--lx-radius-md);padding:var(--lx-space-sm) var(--lx-space-md);background:color-mix(in srgb, var(--lx-accent-soft) 22%, var(--lx-surface-base));grid-template-columns:auto minmax(0,1fr);align-items:baseline;display:grid}._9KV1ZG_studySource>span{color:var(--lx-accent);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);letter-spacing:var(--lx-tracking-eyebrow);text-transform:uppercase}._9KV1ZG_studySource>strong{color:var(--lx-label-primary);font-size:var(--lx-text-sm);line-height:var(--lx-leading-sm)}._9KV1ZG_studySource>p{margin:var(--lx-space-3xs) 0 0;color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs);grid-column:1/-1}._9KV1ZG_studySource>p b{margin-right:var(--lx-space-xs);color:var(--lx-label-primary);font-weight:var(--lx-weight-medium)}._9KV1ZG_studyDependencyMap{gap:var(--lx-space-xs);border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-md);min-width:0;padding:var(--lx-space-sm) var(--lx-space-md);background:var(--lx-surface-sunken);display:grid}._9KV1ZG_studyDependencyHeader{justify-content:space-between;gap:var(--lx-space-md);color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);letter-spacing:var(--lx-tracking-eyebrow);text-transform:uppercase;display:flex}._9KV1ZG_studyDependencyTrack{grid-template-columns:subgrid;gap:var(--lx-space-sm);grid-column:1/-1;min-width:0;display:grid}._9KV1ZG_studyDependencyLevel{gap:var(--lx-space-xs);align-content:start;min-width:0;display:grid;position:relative}._9KV1ZG_studyDependencyLevel:not(:last-child):after{top:50%;right:calc(var(--lx-space-sm) * -1);color:var(--lx-accent);content:\"→\";font-size:var(--lx-text-md);font-weight:var(--lx-weight-strong);position:absolute}._9KV1ZG_studyDependencyNode{border:1px solid color-mix(in srgb, var(--lx-accent) 26%, var(--lx-border-subtle));border-radius:var(--lx-radius-sm);min-width:0;padding:var(--lx-space-2xs) var(--lx-space-xs);background:color-mix(in srgb, var(--lx-accent-soft) 18%, var(--lx-surface-base));color:var(--lx-label-primary);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro);overflow-wrap:anywhere}._9KV1ZG_studyDependencyNode[data-role=foundation]{border-color:color-mix(in srgb, var(--lx-success) 36%, var(--lx-border-subtle))}._9KV1ZG_studyDependencyNode[data-role=practice]{border-style:dashed}._9KV1ZG_studyLayout{gap:var(--lx-space-lg);grid-template-columns:minmax(160px,.32fr) minmax(0,1fr);min-width:0;display:grid}._9KV1ZG_studySections{gap:var(--lx-space-xs);flex-direction:column;min-width:0;display:flex}._9KV1ZG_sectionTab{gap:0 var(--lx-space-sm);min-width:0;padding:var(--lx-space-sm);text-align:left;opacity:var(--lx-vs-alpha);transition:background-color var(--lx-motion-fast) var(--lx-easing), border-color var(--lx-motion-fast) var(--lx-easing);grid-template-columns:24px minmax(0,1fr);justify-items:start;display:grid}._9KV1ZG_sectionTab>span{border-radius:var(--lx-radius-circle);background:var(--lx-border-subtle);width:22px;height:22px;color:var(--lx-label-secondary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);grid-row:1/3;place-items:center;display:grid}._9KV1ZG_sectionTab>strong{color:var(--lx-label-primary);font-size:var(--lx-text-2xs);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._9KV1ZG_sectionTab>small{color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._9KV1ZG_sectionTab[aria-selected=true]{border-color:var(--lx-accent);background:color-mix(in srgb, var(--lx-accent-soft) 42%, var(--lx-surface-base));box-shadow:var(--lx-shadow-sm)}._9KV1ZG_sectionTab[aria-selected=true]>span{background:var(--lx-accent);color:var(--lx-label-on-accent)}._9KV1ZG_studySectionPanel{gap:var(--lx-space-md);border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-md);min-width:0;padding:var(--lx-space-lg);background:var(--lx-surface-sunken);flex-direction:column;display:flex}._9KV1ZG_studySectionPanel>header{gap:var(--lx-space-xs);display:grid}._9KV1ZG_studySectionPanel>header span{color:var(--lx-accent);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro)}._9KV1ZG_studySectionPanel>header h4{color:var(--lx-label-primary);font-size:var(--lx-text-base);line-height:var(--lx-leading-base);margin:0}._9KV1ZG_studySectionPanel>header p{color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs);margin:0}._9KV1ZG_studyConcepts{gap:var(--lx-space-sm);grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr));display:grid}._9KV1ZG_conceptCard{gap:var(--lx-space-3xs);border-color:color-mix(in srgb, var(--visual-tone) 32%, var(--lx-border-subtle));border-radius:var(--lx-radius-md);min-width:0;padding:var(--lx-space-sm) var(--lx-space-md);background:color-mix(in srgb, var(--visual-tone) 8%, var(--lx-surface-base));opacity:var(--lx-vs-alpha);text-align:left;transition:border-color var(--lx-motion-fast) var(--lx-easing), box-shadow var(--lx-motion-fast) var(--lx-easing);justify-items:start;display:grid;box-shadow:0 1px 3px #0000000a}._9KV1ZG_conceptCard:hover{border-color:var(--visual-tone);box-shadow:0 0 8px color-mix(in srgb, var(--visual-tone) 24%, transparent)}._9KV1ZG_conceptCard>span{color:var(--visual-tone);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong)}._9KV1ZG_conceptCard>strong{color:var(--lx-label-primary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs)}._9KV1ZG_conceptCard>small{gap:var(--lx-space-3xs);color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro);display:grid}._9KV1ZG_conceptCard>small b{color:var(--lx-label-secondary);font-weight:var(--lx-weight-medium)}._9KV1ZG_conceptCard[data-selected]{border-color:var(--visual-tone);box-shadow:0 0 10px color-mix(in srgb, var(--visual-tone) 32%, transparent);border-width:2px}._9KV1ZG_studyDetail{gap:var(--lx-space-xs) var(--lx-space-md);border:1px solid color-mix(in srgb, var(--lx-accent) 26%, var(--lx-border-subtle));border-left:3.5px solid var(--lx-accent);border-radius:var(--lx-radius-md);padding:var(--lx-space-md);background:color-mix(in srgb, var(--lx-accent-soft) 24%, var(--lx-surface-base));box-shadow:var(--lx-shadow-sm);grid-template-columns:minmax(0,1fr) 28px;display:grid;position:relative}._9KV1ZG_studyDetail>div{gap:var(--lx-space-sm);align-items:baseline;min-width:0;display:flex}._9KV1ZG_studyDetail>div span{color:var(--lx-accent);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);flex:none}._9KV1ZG_studyDetail>div strong{min-width:0;color:var(--lx-label-primary);font-size:var(--lx-text-sm);overflow-wrap:anywhere}._9KV1ZG_studyDetail>p{color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs);grid-column:1;margin:0}._9KV1ZG_studyDetail>dl{gap:var(--lx-space-sm);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro);grid-column:1;margin:0;display:flex}._9KV1ZG_studyDetail dt{color:var(--lx-label-tertiary)}._9KV1ZG_studyDetail dd{color:var(--lx-label-secondary);margin:0}._9KV1ZG_studyDetail>button{grid-area:1/2/4;align-self:start}@container _9KV1ZG_visual-view (width<=560px){._9KV1ZG_studyLayout{grid-template-columns:1fr}._9KV1ZG_studySections{scrollbar-width:thin;flex-direction:row;padding-bottom:3px;overflow-x:auto}._9KV1ZG_sectionTab{min-width:156px}}";
const tagId$6 = "@dsh-portable/visual/study.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$6;
	tag.textContent = css$6;
	document.head.appendChild(tag);
}
var study_module_css_default = {
	"conceptCard": "_9KV1ZG_conceptCard",
	"sectionTab": "_9KV1ZG_sectionTab",
	"studyConcepts": "_9KV1ZG_studyConcepts",
	"studyDependencyHeader": "_9KV1ZG_studyDependencyHeader",
	"studyDependencyLevel": "_9KV1ZG_studyDependencyLevel",
	"studyDependencyMap": "_9KV1ZG_studyDependencyMap",
	"studyDependencyNode": "_9KV1ZG_studyDependencyNode",
	"studyDependencyTrack": "_9KV1ZG_studyDependencyTrack",
	"studyDetail": "_9KV1ZG_studyDetail",
	"studyLayout": "_9KV1ZG_studyLayout",
	"studySectionPanel": "_9KV1ZG_studySectionPanel",
	"studySections": "_9KV1ZG_studySections",
	"studySource": "_9KV1ZG_studySource",
	"visual-view": "_9KV1ZG_visual-view"
};
//#endregion
//#region src/client/visuals/renderers/StudyMapRenderer.tsx
/** `study_map`: a navigable overview of supplied source material. */
function studyRoleLabel(role, labels) {
	if (role === "foundation") return labels.roleFoundation;
	if (role === "core") return labels.roleCore;
	if (role === "extension") return labels.roleExtension;
	if (role === "practice") return labels.rolePractice;
}
function StudyMapRenderer({ content, focus }) {
	const labels = useVisualLabels();
	const id = useId();
	const conceptById = useMemo(() => new Map(content.concepts.map((concept) => [concept.id, concept])), [content.concepts]);
	const dependencyLevels = useMemo(() => {
		const levelCache = /* @__PURE__ */ new Map();
		const levelFor = (conceptId, trail = /* @__PURE__ */ new Set()) => {
			const cached = levelCache.get(conceptId);
			if (cached !== void 0) return cached;
			const concept = conceptById.get(conceptId);
			if (concept === void 0 || trail.has(conceptId)) return 0;
			const nextTrail = new Set(trail);
			nextTrail.add(conceptId);
			const level = Math.max(0, ...(concept.prerequisiteIds ?? []).map((prerequisiteId) => levelFor(prerequisiteId, nextTrail) + 1));
			levelCache.set(conceptId, level);
			return level;
		};
		const levels = [];
		for (const concept of content.concepts) {
			const level = levelFor(concept.id);
			levels[level] ??= [];
			levels[level].push(concept);
		}
		return levels.filter((level) => level !== void 0);
	}, [conceptById, content.concepts]);
	const focusedConcept = content.concepts.find((concept) => focus.currentIds.has(concept.id));
	const focusedSection = content.sections.find((section) => focus.currentIds.has(section.id));
	const [sectionId, setSectionId] = useState(focusedConcept?.sectionId ?? focusedSection?.id ?? content.sections[0]?.id ?? "");
	const [selectedConceptId, setSelectedConceptId] = useState(focusedConcept?.id);
	useEffect(() => {
		const concept = content.concepts.find((item) => focus.currentIds.has(item.id));
		const section = content.sections.find((item) => focus.currentIds.has(item.id));
		if (concept !== void 0) {
			setSectionId(concept.sectionId);
			setSelectedConceptId(concept.id);
		} else if (section !== void 0) setSectionId(section.id);
	}, [
		content.concepts,
		content.sections,
		focus.currentIds
	]);
	const section = content.sections.find((item) => item.id === sectionId) ?? content.sections[0];
	const concepts = content.concepts.filter((concept) => concept.sectionId === section?.id);
	const selectedConcept = selectedConceptId === void 0 ? void 0 : conceptById.get(selectedConceptId);
	const selectSection = (nextId) => {
		setSectionId(nextId);
		setSelectedConceptId(void 0);
	};
	const sectionKeyDown = (event, index) => {
		if (event.key !== "ArrowUp" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
		event.preventDefault();
		const nextIndex = (index + (event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1) + content.sections.length) % content.sections.length;
		const next = content.sections[nextIndex];
		if (next !== void 0) {
			selectSection(next.id);
			(event.currentTarget.parentElement?.querySelectorAll("[role=\"tab\"]"))?.[nextIndex]?.focus();
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: study_module_css_default.studySource,
				children: [
					/* @__PURE__ */ jsx("span", { children: labels.studySource }),
					/* @__PURE__ */ jsx("strong", { children: content.sourceLabel }),
					content.goal === void 0 ? null : /* @__PURE__ */ jsxs("p", { children: [/* @__PURE__ */ jsx("b", { children: labels.studyGoal }), content.goal] })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: study_module_css_default.studyDependencyMap,
				role: "img",
				"aria-label": `${labels.prerequisite} ${labels.studyConcepts}`,
				"aria-hidden": "true",
				style: { gridTemplateColumns: `repeat(${Math.max(1, dependencyLevels.length)}, minmax(0, 1fr))` },
				children: [/* @__PURE__ */ jsxs("div", {
					className: study_module_css_default.studyDependencyHeader,
					children: [/* @__PURE__ */ jsx("span", { children: labels.prerequisite }), /* @__PURE__ */ jsx("span", { children: labels.studyConcepts })]
				}), /* @__PURE__ */ jsx("div", {
					className: study_module_css_default.studyDependencyTrack,
					children: dependencyLevels.map((level, levelIndex) => /* @__PURE__ */ jsx("div", {
						className: study_module_css_default.studyDependencyLevel,
						children: level.map((concept) => /* @__PURE__ */ jsx("span", {
							className: study_module_css_default.studyDependencyNode,
							"data-role": concept.role,
							children: concept.label
						}, concept.id))
					}, `level-${String(levelIndex)}`))
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: study_module_css_default.studyLayout,
				children: [/* @__PURE__ */ jsx("nav", {
					className: study_module_css_default.studySections,
					role: "tablist",
					"aria-label": labels.studySections,
					children: content.sections.map((item, index) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: `${shell_module_css_default.control} ${study_module_css_default.sectionTab}`,
						role: "tab",
						id: `${id}-tab-${item.id}`,
						"aria-controls": `${id}-panel`,
						tabIndex: item.id === section?.id ? 0 : -1,
						"aria-selected": item.id === section?.id,
						"data-visual-state": elementState(item.id, focus, content.concepts.filter((concept) => concept.sectionId === item.id).map((concept) => concept.id)),
						"data-visual-id": item.id,
						onClick: () => selectSection(item.id),
						onKeyDown: (event) => sectionKeyDown(event, index),
						children: [
							/* @__PURE__ */ jsx("span", { children: index + 1 }),
							/* @__PURE__ */ jsx("strong", { children: item.label }),
							item.anchor === void 0 ? null : /* @__PURE__ */ jsx("small", { children: item.anchor })
						]
					}, item.id))
				}), /* @__PURE__ */ jsxs("section", {
					className: study_module_css_default.studySectionPanel,
					role: "tabpanel",
					id: `${id}-panel`,
					"aria-labelledby": section === void 0 ? void 0 : `${id}-tab-${section.id}`,
					children: [section === void 0 ? null : /* @__PURE__ */ jsxs("header", { children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: section.anchor === void 0 ? labels.studySummary : `${labels.studyAnchor} · ${section.anchor}` }), /* @__PURE__ */ jsx("h4", { children: section.label })] }), section.summary === void 0 ? null : /* @__PURE__ */ jsx("p", { children: section.summary })] }), /* @__PURE__ */ jsx("div", {
						className: study_module_css_default.studyConcepts,
						role: "group",
						"aria-label": labels.studyConcepts,
						children: concepts.map((concept, index) => {
							const role = studyRoleLabel(concept.role, labels);
							const prerequisites = (concept.prerequisiteIds ?? []).map((prerequisiteId) => conceptById.get(prerequisiteId)?.label ?? prerequisiteId);
							return /* @__PURE__ */ jsxs("button", {
								type: "button",
								className: `${shell_module_css_default.control} ${study_module_css_default.conceptCard}`,
								"data-tone": toneAt(concept.tone, index),
								"data-role": concept.role,
								"data-visual-state": concept.id === selectedConceptId ? "selected" : elementState(concept.id, focus),
								"data-selected": concept.id === selectedConceptId || void 0,
								"data-visual-id": concept.id,
								onClick: () => setSelectedConceptId(concept.id),
								children: [
									/* @__PURE__ */ jsx("span", { children: role ?? labels.studyConcepts }),
									/* @__PURE__ */ jsx("strong", { children: concept.label }),
									/* @__PURE__ */ jsxs("small", { children: [/* @__PURE__ */ jsx("b", { children: labels.prerequisite }), prerequisites.length === 0 ? labels.noPrerequisite : prerequisites.join(" → ")] })
								]
							}, concept.id);
						})
					})]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: shell_module_css_default.selectionSlot,
				children: selectedConcept === void 0 ? /* @__PURE__ */ jsx("p", {
					className: shell_module_css_default.interactionHint,
					children: labels.studyInteractionHint
				}) : /* @__PURE__ */ jsxs("aside", {
					className: study_module_css_default.studyDetail,
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: studyRoleLabel(selectedConcept.role, labels) ?? labels.studyConcepts }), /* @__PURE__ */ jsx("strong", { children: selectedConcept.label })] }),
						/* @__PURE__ */ jsx("p", { children: selectedConcept.detail ?? labels.noDetail }),
						/* @__PURE__ */ jsxs("dl", { children: [/* @__PURE__ */ jsx("dt", { children: labels.prerequisite }), /* @__PURE__ */ jsx("dd", { children: (selectedConcept.prerequisiteIds ?? []).map((prerequisiteId) => conceptById.get(prerequisiteId)?.label ?? prerequisiteId).join(" → ") || labels.noPrerequisite })] }),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: `${shell_module_css_default.control} ${shell_module_css_default.closeButton}`,
							onClick: () => setSelectedConceptId(void 0),
							"aria-label": labels.closeDetail,
							children: "×"
						})
					]
				})
			})
		]
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/recall.module.css.mjs
const css$5 = "._3bGaZq_recallToolbar{justify-content:space-between;align-items:baseline;gap:var(--lx-space-xs) var(--lx-space-lg);min-width:0;color:var(--lx-accent);font-size:var(--lx-text-2xs);font-variant-numeric:tabular-nums;font-weight:var(--lx-weight-strong);flex-wrap:wrap;display:flex}._3bGaZq_recallToolbar output{color:var(--lx-label-secondary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-regular)}._3bGaZq_recallInstructions{color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs);margin:0}._3bGaZq_recallCard{gap:var(--lx-space-lg);border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-lg);background:var(--lx-surface-base);min-height:200px;box-shadow:var(--lx-shadow-md);opacity:var(--lx-vs-alpha);transition:box-shadow var(--lx-motion-base) var(--lx-easing);align-content:start;padding:clamp(16px,3.2cqi,24px);display:grid}._3bGaZq_recallCardHeader{justify-content:space-between;align-items:center;gap:var(--lx-space-lg);display:flex}._3bGaZq_recallCardHeader>span{color:var(--lx-accent);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);letter-spacing:var(--lx-tracking-eyebrow);text-transform:uppercase}._3bGaZq_recallCardHeader>small{border-radius:var(--lx-radius-pill);padding:var(--lx-space-3xs) var(--lx-space-sm);background:var(--lx-surface-sunken);border:1px solid var(--lx-border-subtle);color:var(--lx-label-secondary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-medium)}._3bGaZq_recallCardHeader>small[data-status=mastered]{border-color:color-mix(in srgb, var(--lx-success) 30%, transparent);background:color-mix(in srgb, var(--lx-success) 12%, transparent);color:var(--lx-success)}._3bGaZq_recallCardHeader>small[data-status=review]{border-color:color-mix(in srgb, var(--lx-warn) 30%, transparent);background:color-mix(in srgb, var(--lx-warn) 12%, transparent);color:var(--lx-warn)}._3bGaZq_recallCard>h4{color:var(--lx-label-primary);font-size:clamp(16px,3.4cqi,20px);font-weight:var(--lx-weight-strong);margin:0;line-height:1.5}._3bGaZq_recallTags{gap:var(--lx-space-xs);flex-wrap:wrap;margin:-3px 0 0;padding:0;list-style:none;display:flex}._3bGaZq_recallTags li{border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-pill);padding:var(--lx-space-3xs) var(--lx-space-sm);background:var(--lx-surface-sunken);color:var(--lx-label-secondary);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro)}._3bGaZq_recallRevealSlot{align-content:start;min-height:56px;display:grid}._3bGaZq_recallRevealPlaceholder{min-height:56px;display:block}._3bGaZq_recallReveal{gap:var(--lx-space-2xs);border-left:3.5px solid var(--lx-warn);border-radius:0 var(--lx-radius-sm) var(--lx-radius-sm) 0;padding:var(--lx-space-sm) var(--lx-space-md);background:color-mix(in srgb, var(--lx-warn) 8%, var(--lx-surface-base));display:grid}._3bGaZq_recallReveal[data-kind=answer]{border-left-color:var(--lx-success);background:color-mix(in srgb, var(--lx-success) 8%, var(--lx-surface-base))}._3bGaZq_recallReveal>span{color:var(--lx-warn);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong)}._3bGaZq_recallReveal[data-kind=answer]>span{color:var(--lx-success)}._3bGaZq_recallReveal>p{color:var(--lx-label-primary);font-size:var(--lx-text-sm);line-height:var(--lx-leading-sm);margin:0}._3bGaZq_recallRevealButton{justify-self:start;width:max-content;min-width:128px}._3bGaZq_recallRating{align-self:end}._3bGaZq_ratingButton[aria-pressed=true]{border-color:var(--lx-accent);background:color-mix(in srgb, var(--lx-accent-soft) 50%, transparent);color:var(--lx-accent);font-weight:var(--lx-weight-medium)}._3bGaZq_recallNavigation>:last-child{margin-left:auto}@container _3bGaZq_visual-view (width<=560px){._3bGaZq_recallNavigation>*{flex:1}._3bGaZq_recallNavigation>:last-child{flex-basis:100%;margin-left:0}._3bGaZq_recallCard{min-height:190px}}@container _3bGaZq_visual-view (width<=360px){._3bGaZq_recallToolbar{align-items:flex-start;gap:var(--lx-space-3xs);flex-direction:column}}";
const tagId$5 = "@dsh-portable/visual/recall.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$5;
	tag.textContent = css$5;
	document.head.appendChild(tag);
}
var recall_module_css_default = {
	"ratingButton": "_3bGaZq_ratingButton",
	"recallCard": "_3bGaZq_recallCard",
	"recallCardHeader": "_3bGaZq_recallCardHeader",
	"recallInstructions": "_3bGaZq_recallInstructions",
	"recallNavigation": "_3bGaZq_recallNavigation",
	"recallRating": "_3bGaZq_recallRating",
	"recallReveal": "_3bGaZq_recallReveal",
	"recallRevealButton": "_3bGaZq_recallRevealButton",
	"recallRevealPlaceholder": "_3bGaZq_recallRevealPlaceholder",
	"recallRevealSlot": "_3bGaZq_recallRevealSlot",
	"recallTags": "_3bGaZq_recallTags",
	"recallToolbar": "_3bGaZq_recallToolbar",
	"visual-view": "_3bGaZq_visual-view"
};
//#endregion
//#region src/client/visuals/renderers/RecallDeckRenderer.tsx
/** `recall_deck`: retrieval practice, one card at a time. */
function initialRecallState(content, storageKey) {
	const initial = {
		index: 0,
		stage: "prompt",
		statuses: {}
	};
	if (storageKey === void 0 || typeof sessionStorage === "undefined") return initial;
	try {
		const stored = JSON.parse(sessionStorage.getItem(`dsh-learning/visual@4:recall:${storageKey}`) ?? "{}");
		if (typeof stored.index === "number" && Number.isInteger(stored.index)) initial.index = Math.max(0, Math.min(content.cards.length - 1, stored.index));
		if (stored.stage === "prompt" || stored.stage === "hint" || stored.stage === "answer") initial.stage = stored.stage;
		if (typeof stored.statuses === "object" && stored.statuses !== null && !Array.isArray(stored.statuses)) for (const card of content.cards) {
			const status = stored.statuses[card.id];
			if (status === "mastered" || status === "review") initial.statuses[card.id] = status;
		}
		if (initial.stage === "hint" && content.cards[initial.index]?.hint === void 0) initial.stage = "answer";
	} catch {}
	return initial;
}
function RecallDeckRenderer({ content, focus, storageKey, onRecallStatusChange }) {
	const labels = useVisualLabels();
	const initial = useMemo(() => initialRecallState(content, storageKey), [content, storageKey]);
	const [cardIndex, setCardIndex] = useState(initial.index);
	const [stage, setStage] = useState(initial.stage);
	const [statuses, setStatuses] = useState(initial.statuses);
	const current = content.cards[cardIndex];
	const followedFocus = useRef(-1);
	useEffect(() => {
		const focusedIndex = content.cards.findIndex((card) => focus.currentIds.has(card.id));
		if (focusedIndex < 0 || focusedIndex === followedFocus.current) return;
		followedFocus.current = focusedIndex;
		setCardIndex(focusedIndex);
		setStage("prompt");
	}, [content.cards, focus.currentIds]);
	useEffect(() => {
		if (storageKey === void 0 || typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.setItem(`dsh-learning/visual@4:recall:${storageKey}`, JSON.stringify({
				index: cardIndex,
				stage,
				statuses
			}));
		} catch {}
	}, [
		cardIndex,
		stage,
		statuses,
		storageKey
	]);
	if (current === void 0) return /* @__PURE__ */ jsx(EmptyFigure, {});
	const move = (delta) => {
		setCardIndex((index) => Math.max(0, Math.min(content.cards.length - 1, index + delta)));
		setStage("prompt");
	};
	const reset = () => {
		setCardIndex(0);
		setStage("prompt");
		setStatuses({});
	};
	const mark = (status) => {
		setStatuses((value) => ({
			...value,
			[current.id]: status
		}));
		onRecallStatusChange?.(current.id, status);
	};
	const masteredCount = Object.values(statuses).filter((status) => status === "mastered").length;
	const reviewCount = Object.values(statuses).filter((status) => status === "review").length;
	const status = statuses[current.id];
	const revealNext = () => {
		if (stage !== "answer" && (stage === "hint" || current.hint === void 0)) onRecallStatusChange?.(current.id, "revealed");
		setStage((value) => value === "prompt" && current.hint !== void 0 ? "hint" : "answer");
	};
	const onKeyDown = (event) => {
		if (event.target !== event.currentTarget) return;
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			move(-1);
		} else if (event.key === "ArrowRight") {
			event.preventDefault();
			move(1);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		role: "group",
		tabIndex: 0,
		onKeyDown,
		"aria-label": labels.recallDeckLabel,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: recall_module_css_default.recallToolbar,
				children: [/* @__PURE__ */ jsx("span", { children: labelTemplate(labels.recallProgress, {
					current: cardIndex + 1,
					total: content.cards.length
				}) }), /* @__PURE__ */ jsx("output", { children: labelTemplate(labels.recallStatus, {
					mastered: masteredCount,
					review: reviewCount
				}) })]
			}),
			content.instructions === void 0 ? null : /* @__PURE__ */ jsx("p", {
				className: recall_module_css_default.recallInstructions,
				children: content.instructions
			}),
			/* @__PURE__ */ jsxs("article", {
				className: recall_module_css_default.recallCard,
				"data-visual-id": current.id,
				"data-visual-state": elementState(current.id, focus),
				"data-stage": stage,
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: recall_module_css_default.recallCardHeader,
						children: [/* @__PURE__ */ jsx("span", { children: labels.recallPrompt }), /* @__PURE__ */ jsx("small", {
							"data-status": status ?? "unrated",
							children: status === "mastered" ? labels.mastered : status === "review" ? labels.reviewAgain : labels.unrated
						})]
					}),
					/* @__PURE__ */ jsx("h4", { children: current.prompt }),
					current.tags === void 0 || current.tags.length === 0 ? null : /* @__PURE__ */ jsx("ul", {
						className: recall_module_css_default.recallTags,
						children: current.tags.map((tag) => /* @__PURE__ */ jsx("li", { children: tag }, tag))
					}),
					/* @__PURE__ */ jsxs("div", {
						className: recall_module_css_default.recallRevealSlot,
						children: [
							stage === "prompt" ? /* @__PURE__ */ jsx("span", {
								className: recall_module_css_default.recallRevealPlaceholder,
								"aria-hidden": "true"
							}) : null,
							stage !== "prompt" && current.hint !== void 0 ? /* @__PURE__ */ jsxs("section", {
								className: recall_module_css_default.recallReveal,
								"data-kind": "hint",
								"aria-live": "polite",
								children: [/* @__PURE__ */ jsx("span", { children: labels.recallHint }), /* @__PURE__ */ jsx("p", { children: current.hint })]
							}) : null,
							stage !== "answer" ? null : /* @__PURE__ */ jsxs("section", {
								className: recall_module_css_default.recallReveal,
								"data-kind": "answer",
								"aria-live": "polite",
								children: [/* @__PURE__ */ jsx("span", { children: labels.recallAnswer }), /* @__PURE__ */ jsx("p", { children: current.answer })]
							})
						]
					}),
					stage === "answer" ? /* @__PURE__ */ jsxs("div", {
						className: `${shell_module_css_default.controlRow} ${recall_module_css_default.recallRating}`,
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							className: `${shell_module_css_default.control} ${recall_module_css_default.ratingButton}`,
							"aria-pressed": status === "review",
							onClick: () => mark("review"),
							children: labels.reviewAgain
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							className: `${shell_module_css_default.control} ${recall_module_css_default.ratingButton}`,
							"aria-pressed": status === "mastered",
							onClick: () => mark("mastered"),
							children: labels.mastered
						})]
					}) : /* @__PURE__ */ jsx("button", {
						type: "button",
						className: `${shell_module_css_default.control} ${shell_module_css_default.controlPrimary} ${recall_module_css_default.recallRevealButton}`,
						onClick: revealNext,
						children: stage === "prompt" && current.hint !== void 0 ? labels.showHint : labels.showAnswer
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: `${shell_module_css_default.controlRow} ${recall_module_css_default.recallNavigation}`,
				children: [
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: shell_module_css_default.control,
						onClick: () => move(-1),
						disabled: cardIndex === 0,
						children: ["← ", labels.previousCard]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: shell_module_css_default.control,
						onClick: () => move(1),
						disabled: cardIndex >= content.cards.length - 1,
						children: [labels.nextCard, " →"]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: shell_module_css_default.control,
						onClick: reset,
						disabled: cardIndex === 0 && stage === "prompt" && Object.keys(statuses).length === 0,
						children: labels.resetDeck
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: shell_module_css_default.selectionSlot,
				children: /* @__PURE__ */ jsx("p", {
					className: shell_module_css_default.interactionHint,
					children: labels.recallInteractionHint
				})
			})
		]
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/data-table.module.css.mjs
const css$4 = ".nXAmUa_toolbar{align-items:center;gap:var(--lx-space-sm);flex-wrap:wrap;display:flex}.nXAmUa_search{flex:220px}.nXAmUa_search input{border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-sm);width:100%;min-height:36px;padding:var(--lx-space-xs) var(--lx-space-md);background:var(--lx-surface-base);color:var(--lx-label-primary);font:inherit;font-size:var(--lx-text-xs);transition:border-color var(--lx-motion-fast) var(--lx-easing), box-shadow var(--lx-motion-fast) var(--lx-easing)}.nXAmUa_search input:focus{border-color:var(--lx-accent);box-shadow:0 0 0 3px color-mix(in srgb, var(--lx-accent) 15%, transparent);outline:none}.nXAmUa_toolbar output{color:var(--lx-label-secondary);font-size:var(--lx-text-xs);font-variant-numeric:tabular-nums;font-weight:var(--lx-weight-medium)}.nXAmUa_tableViewport{padding:var(--lx-space-2xs);border-radius:var(--lx-radius-md);box-shadow:var(--lx-shadow-sm)}.nXAmUa_table{border-spacing:0;border-collapse:separate;width:100%;min-width:520px;color:var(--lx-label-primary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-xs)}.nXAmUa_table th,.nXAmUa_table td{border-right:1px solid var(--lx-border-subtle);border-bottom:1px solid var(--lx-border-subtle);padding:var(--lx-space-sm) var(--lx-space-md);text-align:left;white-space:nowrap}.nXAmUa_table tr>:last-child{border-right:0}.nXAmUa_table tbody tr:last-child>*{border-bottom:0}.nXAmUa_table thead th{z-index:1;background:var(--lx-surface-sunken);opacity:var(--lx-vs-alpha);border-bottom:1.5px solid var(--lx-border-subtle);padding:0;position:sticky;top:0}.nXAmUa_table thead button{align-items:center;gap:var(--lx-space-xs);width:100%;min-height:40px;padding:var(--lx-space-sm) var(--lx-space-md);color:inherit;font:inherit;font-weight:var(--lx-weight-strong);cursor:pointer;transition:background-color var(--lx-motion-fast) var(--lx-easing);background:0 0;border:0;display:flex}.nXAmUa_table thead button:hover{background:color-mix(in srgb, var(--lx-accent) 9%, transparent)}.nXAmUa_table thead small{color:var(--lx-label-tertiary);font-weight:var(--lx-weight-regular)}.nXAmUa_table thead i{color:var(--lx-label-tertiary);margin-left:auto;font-style:normal}.nXAmUa_table tbody tr{opacity:var(--lx-vs-alpha);cursor:pointer;transition:background-color var(--lx-motion-fast) var(--lx-easing)}.nXAmUa_table tbody tr:nth-child(2n)>*{background:color-mix(in srgb, var(--lx-surface-sunken) 50%, var(--lx-surface-base))}.nXAmUa_table tbody tr:hover>*{background:color-mix(in srgb, var(--lx-accent) 9%, transparent)!important}.nXAmUa_table tbody tr[data-selected]>*{background:color-mix(in srgb, var(--lx-accent) 15%, transparent)!important}.nXAmUa_table tbody tr[data-outlier]>:first-child{box-shadow:inset 3.5px 0 0 var(--lx-danger,#d94b4b)}.nXAmUa_table tbody th{font-weight:var(--lx-weight-medium)}.nXAmUa_table td{color:var(--lx-label-secondary)}.nXAmUa_table [data-missing]{color:var(--lx-label-tertiary);font-style:italic}.nXAmUa_outlierMark{width:17px;height:17px;margin-right:var(--lx-space-xs);border-radius:var(--lx-radius-circle);background:color-mix(in srgb, var(--lx-danger,#d94b4b) 14%, transparent);color:var(--lx-danger,#d94b4b);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);place-items:center;display:inline-grid}.nXAmUa_empty{padding:var(--lx-space-xl);color:var(--lx-label-tertiary);text-align:center;margin:0}.nXAmUa_chartViewport{border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-md);background:var(--lx-surface-base);width:100%;box-shadow:var(--lx-shadow-sm);overflow-x:auto}.nXAmUa_chart{width:100%;min-width:360px;display:block}.nXAmUa_chartFrame{fill:var(--lx-surface-base);stroke:var(--lx-border-subtle)}.nXAmUa_chartGrid{stroke:color-mix(in srgb, var(--lx-border-subtle) 72%, transparent);stroke-width:1px;stroke-dasharray:2 4;vector-effect:non-scaling-stroke}.nXAmUa_xLabel,.nXAmUa_yLabel{fill:var(--lx-label-secondary);font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-medium);text-anchor:middle}.nXAmUa_tick{fill:var(--lx-label-tertiary);font-size:var(--lx-text-micro);font-variant-numeric:tabular-nums}.nXAmUa_chartLine{fill:none;stroke:var(--visual-tone);stroke-width:2.25px;stroke-linejoin:round;filter:drop-shadow(0 0 3px color-mix(in srgb, var(--visual-tone) 40%, transparent));vector-effect:non-scaling-stroke}.nXAmUa_chartPoint{fill:var(--visual-tone);stroke:var(--lx-surface-base);stroke-width:1.5px;cursor:pointer;filter:drop-shadow(0 0 2px var(--visual-tone));vector-effect:non-scaling-stroke}.nXAmUa_chartBar{fill:color-mix(in srgb, var(--visual-tone) 72%, transparent);stroke:var(--visual-tone);cursor:pointer;vector-effect:non-scaling-stroke}.nXAmUa_chartPoint[data-outlier],.nXAmUa_chartBar[data-outlier]{stroke:var(--lx-danger,#d94b4b);stroke-width:2.5px;filter:drop-shadow(0 0 4px color-mix(in srgb, var(--lx-danger,#d94b4b) 60%, transparent))}.nXAmUa_chartPoint[data-selected],.nXAmUa_chartBar[data-selected]{stroke:var(--lx-label-primary);stroke-width:3px}.nXAmUa_chartTooltip{pointer-events:none}.nXAmUa_chartTooltip rect{fill:var(--lx-surface-base);stroke:var(--lx-border-strong);stroke-width:1px;filter:drop-shadow(0 2px 5px color-mix(in srgb, var(--lx-label-primary) 16%, transparent))}.nXAmUa_chartTooltip text{fill:var(--lx-label-primary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-medium)}@container nXAmUa_visual-view (width<=560px){.nXAmUa_table{min-width:460px}}";
const tagId$4 = "@dsh-portable/visual/data-table.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$4;
	tag.textContent = css$4;
	document.head.appendChild(tag);
}
var data_table_module_css_default = {
	"chart": "nXAmUa_chart",
	"chartBar": "nXAmUa_chartBar",
	"chartFrame": "nXAmUa_chartFrame",
	"chartGrid": "nXAmUa_chartGrid",
	"chartLine": "nXAmUa_chartLine",
	"chartPoint": "nXAmUa_chartPoint",
	"chartTooltip": "nXAmUa_chartTooltip",
	"chartViewport": "nXAmUa_chartViewport",
	"empty": "nXAmUa_empty",
	"outlierMark": "nXAmUa_outlierMark",
	"search": "nXAmUa_search",
	"table": "nXAmUa_table",
	"tableViewport": "nXAmUa_tableViewport",
	"tick": "nXAmUa_tick",
	"toolbar": "nXAmUa_toolbar",
	"visual-view": "nXAmUa_visual-view",
	"xLabel": "nXAmUa_xLabel",
	"yLabel": "nXAmUa_yLabel"
};
//#endregion
//#region src/client/visuals/renderers/DataTableRenderer.tsx
/** `data_table`: typed records with local filtering, sorting and a linked chart. */
function valueOf(row, columnId) {
	return row.cells.find((cell) => cell.columnId === columnId)?.value ?? null;
}
function formatValue(value, column) {
	if (value === null) return "—";
	if (column.type === "boolean") return value === true ? "✓" : value === false ? "✕" : String(value);
	if (column.type === "number" && typeof value === "number") return `${formatNumber(value)}${column.unit === void 0 ? "" : ` ${column.unit}`}`;
	return String(value);
}
function compareValues(left, right, column) {
	if (left === null) return right === null ? 0 : 1;
	if (right === null) return -1;
	if (column.type === "number") return Number(left) - Number(right);
	if (column.type === "boolean") return Number(left) - Number(right);
	if (column.type === "date") {
		const difference = Date.parse(String(left)) - Date.parse(String(right));
		if (Number.isFinite(difference)) return difference;
	}
	return String(left).localeCompare(String(right), void 0, {
		numeric: true,
		sensitivity: "base"
	});
}
function matchesFilter(value, filter) {
	const expected = filter.value;
	if (filter.operator === "contains") return String(value ?? "").toLocaleLowerCase().includes(String(expected ?? "").toLocaleLowerCase());
	if (filter.operator === "equals") return value === expected || String(value) === String(expected);
	if (filter.operator === "not_equals") return !(value === expected || String(value) === String(expected));
	const left = typeof value === "number" ? value : Number(value);
	const right = typeof expected === "number" ? expected : Number(expected);
	if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
	if (filter.operator === "gt") return left > right;
	if (filter.operator === "gte") return left >= right;
	if (filter.operator === "lt") return left < right;
	return left <= right;
}
function numericValue(value, column, fallback) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (column.type === "boolean" && typeof value === "boolean") return value ? 1 : 0;
	if (column.type === "date" && value !== null) {
		const parsed = Date.parse(String(value));
		if (Number.isFinite(parsed)) return parsed;
	}
	if (column.type === "string" && value !== null) return fallback;
}
function extent(values) {
	const min = Math.min(...values);
	const max = Math.max(...values);
	if (min !== max) return {
		min,
		max
	};
	const padding = Math.max(1, Math.abs(min) * .08);
	return {
		min: min - padding,
		max: max + padding
	};
}
function LinkedChart({ content, rows, selectedRowId, outlierIds, onSelect }) {
	const chart = content.chart;
	const [hoveredRowId, setHoveredRowId] = useState();
	const [viewportRef, measuredWidth] = useContainerWidth();
	if (chart === void 0) return null;
	const xColumn = content.columns.find((column) => column.id === chart.xColumnId);
	const yColumn = content.columns.find((column) => column.id === chart.yColumnId);
	if (xColumn === void 0 || yColumn === void 0) return null;
	const points = rows.flatMap((row, index) => {
		const x = numericValue(valueOf(row, xColumn.id), xColumn, index);
		const y = numericValue(valueOf(row, yColumn.id), yColumn, index);
		return x === void 0 || y === void 0 ? [] : [{
			row,
			x,
			y,
			series: chart.seriesColumnId === void 0 ? "" : String(valueOf(row, chart.seriesColumnId) ?? "—")
		}];
	});
	if (points.length === 0) return null;
	const width = Math.max(360, Math.round(measuredWidth));
	const height = 250;
	const frame = {
		left: 54,
		right: 18,
		top: 18,
		bottom: 42
	};
	const plotWidth = width - frame.left - frame.right;
	const plotHeight = height - frame.top - frame.bottom;
	const xExtent = extent(points.map((point) => point.x));
	const yExtent = extent(points.map((point) => point.y));
	const xTicks = ticks(xExtent.min, xExtent.max, 5);
	const yTicks = ticks(yExtent.min, yExtent.max, 5);
	const xAt = (value) => frame.left + (value - xExtent.min) / (xExtent.max - xExtent.min) * plotWidth;
	const yAt = (value) => frame.top + (1 - (value - yExtent.min) / (yExtent.max - yExtent.min)) * plotHeight;
	const groups = [...new Set(points.map((point) => point.series))];
	const activePoint = points.find((point) => point.row.id === hoveredRowId) ?? points.find((point) => point.row.id === selectedRowId);
	const tooltipWidth = Math.min(190, Math.max(132, plotWidth - 16));
	const tooltipHeight = 42;
	const tooltipX = activePoint === void 0 ? 0 : Math.max(frame.left + tooltipWidth / 2, Math.min(frame.left + plotWidth - tooltipWidth / 2, xAt(activePoint.x)));
	const tooltipY = activePoint === void 0 ? 0 : Math.max(frame.top + tooltipHeight + 6, yAt(activePoint.y) - 12);
	return /* @__PURE__ */ jsx("div", {
		className: data_table_module_css_default.chartViewport,
		ref: viewportRef,
		children: /* @__PURE__ */ jsxs("svg", {
			className: data_table_module_css_default.chart,
			viewBox: `0 0 ${String(width)} ${String(height)}`,
			role: "img",
			"aria-label": `${yColumn.label} / ${xColumn.label}`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					className: data_table_module_css_default.chartFrame,
					x: frame.left,
					y: frame.top,
					width: plotWidth,
					height: plotHeight
				}),
				/* @__PURE__ */ jsx("text", {
					className: data_table_module_css_default.yLabel,
					x: 12,
					y: frame.top + plotHeight / 2,
					transform: `rotate(-90 12 ${String(frame.top + plotHeight / 2)})`,
					children: yColumn.label
				}),
				/* @__PURE__ */ jsx("text", {
					className: data_table_module_css_default.xLabel,
					x: frame.left + plotWidth / 2,
					y: 242,
					children: xColumn.label
				}),
				xTicks.map((value) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
					className: data_table_module_css_default.chartGrid,
					x1: xAt(value),
					x2: xAt(value),
					y1: frame.top,
					y2: frame.top + plotHeight
				}), /* @__PURE__ */ jsx("text", {
					className: data_table_module_css_default.tick,
					x: xAt(value),
					y: 226,
					textAnchor: "middle",
					children: formatNumber(value)
				})] }, `x-${String(value)}`)),
				yTicks.map((value) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
					className: data_table_module_css_default.chartGrid,
					x1: frame.left,
					x2: frame.left + plotWidth,
					y1: yAt(value),
					y2: yAt(value)
				}), /* @__PURE__ */ jsx("text", {
					className: data_table_module_css_default.tick,
					x: frame.left - 8,
					y: yAt(value),
					textAnchor: "end",
					dominantBaseline: "middle",
					children: formatNumber(value)
				})] }, `y-${String(value)}`)),
				chart.type === "line" ? groups.map((group, groupIndex) => {
					const path = points.filter((point) => point.series === group).sort((left, right) => left.x - right.x).map((point, index) => `${index === 0 ? "M" : "L"}${xAt(point.x).toFixed(2)},${yAt(point.y).toFixed(2)}`).join(" ");
					return /* @__PURE__ */ jsx("path", {
						className: data_table_module_css_default.chartLine,
						"data-tone": toneAt(void 0, groupIndex),
						d: path
					}, group);
				}) : null,
				points.map((point, index) => {
					const tone = toneAt(void 0, Math.max(0, groups.indexOf(point.series)));
					const selected = selectedRowId === point.row.id;
					const outlier = outlierIds.has(point.row.id);
					const state = selected ? "selected" : elementState(point.row.id, {
						currentIds: /* @__PURE__ */ new Set(),
						visitedIds: /* @__PURE__ */ new Set(),
						active: false
					});
					if (chart.type === "bar") {
						const baseline = yAt(Math.max(0, yExtent.min));
						const y = yAt(point.y);
						const barWidth = Math.max(5, Math.min(34, plotWidth / Math.max(1, points.length) * .62));
						return /* @__PURE__ */ jsx("rect", {
							className: data_table_module_css_default.chartBar,
							"data-tone": tone,
							"data-selected": selected || void 0,
							"data-outlier": outlier || void 0,
							"data-visual-id": point.row.id,
							"data-visual-state": state,
							x: xAt(point.x) - barWidth / 2,
							y: Math.min(y, baseline),
							width: barWidth,
							height: Math.max(2, Math.abs(baseline - y)),
							role: "button",
							tabIndex: 0,
							onClick: () => onSelect(point.row),
							onPointerEnter: () => setHoveredRowId(point.row.id),
							onPointerLeave: () => setHoveredRowId(void 0),
							onFocus: () => setHoveredRowId(point.row.id),
							onBlur: () => setHoveredRowId(void 0),
							children: /* @__PURE__ */ jsx("title", { children: `${xColumn.label}: ${formatValue(valueOf(point.row, xColumn.id), xColumn)}; ${yColumn.label}: ${formatValue(valueOf(point.row, yColumn.id), yColumn)}` })
						}, point.row.id);
					}
					return /* @__PURE__ */ jsx("circle", {
						className: data_table_module_css_default.chartPoint,
						"data-tone": tone,
						"data-selected": selected || void 0,
						"data-outlier": outlier || void 0,
						"data-visual-id": point.row.id,
						"data-visual-state": state,
						cx: xAt(point.x),
						cy: yAt(point.y),
						r: outlier || selected ? 7 : 5,
						role: "button",
						tabIndex: 0,
						onClick: () => onSelect(point.row),
						onPointerEnter: () => setHoveredRowId(point.row.id),
						onPointerLeave: () => setHoveredRowId(void 0),
						onFocus: () => setHoveredRowId(point.row.id),
						onBlur: () => setHoveredRowId(void 0),
						children: /* @__PURE__ */ jsx("title", { children: `${xColumn.label}: ${formatValue(valueOf(point.row, xColumn.id), xColumn)}; ${yColumn.label}: ${formatValue(valueOf(point.row, yColumn.id), yColumn)}` })
					}, point.row.id);
				}),
				activePoint === void 0 ? null : /* @__PURE__ */ jsxs("g", {
					className: data_table_module_css_default.chartTooltip,
					transform: `translate(${tooltipX} ${tooltipY})`,
					"aria-hidden": "true",
					children: [/* @__PURE__ */ jsx("rect", {
						x: -tooltipWidth / 2,
						y: -42,
						width: tooltipWidth,
						height: tooltipHeight,
						rx: "6"
					}), /* @__PURE__ */ jsxs("text", {
						x: -tooltipWidth / 2 + 10,
						y: -27,
						children: [/* @__PURE__ */ jsxs("tspan", {
							x: -tooltipWidth / 2 + 10,
							children: [
								xColumn.label,
								": ",
								formatValue(valueOf(activePoint.row, xColumn.id), xColumn)
							]
						}), /* @__PURE__ */ jsxs("tspan", {
							x: -tooltipWidth / 2 + 10,
							dy: "15",
							children: [
								yColumn.label,
								": ",
								formatValue(valueOf(activePoint.row, yColumn.id), yColumn),
								outlierIds.has(activePoint.row.id) ? " · 异常值" : ""
							]
						})]
					})]
				})
			]
		})
	});
}
function DataTableRenderer({ content, focus }) {
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState(content.initialSort);
	const [filter, setFilter] = useState(content.initialFilter);
	const [selectedRowId, setSelectedRowId] = useState();
	const outlierIds = useMemo(() => new Set(content.outlierIds ?? []), [content.outlierIds]);
	const selectedRow = content.rows.find((row) => row.id === selectedRowId);
	const visibleRows = useMemo(() => {
		const needle = query.trim().toLocaleLowerCase();
		const filtered = content.rows.filter((row) => {
			if (filter !== void 0 && !matchesFilter(valueOf(row, filter.columnId), filter)) return false;
			return needle === "" || content.columns.some((column) => formatValue(valueOf(row, column.id), column).toLocaleLowerCase().includes(needle)) || row.detail?.toLocaleLowerCase().includes(needle) === true;
		});
		if (sort === void 0) return filtered;
		const column = content.columns.find((item) => item.id === sort.columnId);
		if (column === void 0) return filtered;
		return [...filtered].sort((left, right) => {
			const order = compareValues(valueOf(left, column.id), valueOf(right, column.id), column);
			return sort.direction === "asc" ? order : -order;
		});
	}, [
		content.columns,
		content.rows,
		filter,
		query,
		sort
	]);
	const selectRow = (row) => setSelectedRowId((current) => current === row.id ? void 0 : row.id);
	const changeSort = (columnId) => setSort((current) => current?.columnId === columnId ? {
		columnId,
		direction: current.direction === "asc" ? "desc" : "asc"
	} : {
		columnId,
		direction: "asc"
	});
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: data_table_module_css_default.toolbar,
				children: [
					/* @__PURE__ */ jsxs("label", {
						className: data_table_module_css_default.search,
						children: [/* @__PURE__ */ jsx("span", {
							className: shell_module_css_default.srOnly,
							children: "筛选数据"
						}), /* @__PURE__ */ jsx("input", {
							type: "search",
							value: query,
							placeholder: "筛选数据…",
							onChange: (event) => setQuery(event.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ jsxs("output", {
						"aria-live": "polite",
						children: [
							visibleRows.length,
							" / ",
							content.rows.length
						]
					}),
					filter === void 0 ? null : /* @__PURE__ */ jsx("button", {
						type: "button",
						className: shell_module_css_default.control,
						onClick: () => setFilter(void 0),
						children: "清除预设筛选"
					})
				]
			}),
			/* @__PURE__ */ jsx(LinkedChart, {
				content,
				rows: visibleRows,
				selectedRowId,
				outlierIds,
				onSelect: selectRow
			}),
			/* @__PURE__ */ jsxs("div", {
				className: `${shell_module_css_default.viewport} ${data_table_module_css_default.tableViewport}`,
				children: [/* @__PURE__ */ jsxs("table", {
					className: data_table_module_css_default.table,
					children: [
						/* @__PURE__ */ jsx("caption", {
							className: shell_module_css_default.srOnly,
							children: "数据表"
						}),
						/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: content.columns.map((column) => {
							const active = sort?.columnId === column.id;
							return /* @__PURE__ */ jsx("th", {
								scope: "col",
								"data-visual-id": column.id,
								"data-visual-state": elementState(column.id, focus),
								children: /* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => changeSort(column.id),
									"aria-label": `${column.label}，排序`,
									children: [
										/* @__PURE__ */ jsx("span", { children: column.label }),
										column.unit === void 0 ? null : /* @__PURE__ */ jsx("small", { children: column.unit }),
										/* @__PURE__ */ jsx("i", {
											"aria-hidden": "true",
											children: active ? sort.direction === "asc" ? "↑" : "↓" : "↕"
										})
									]
								})
							}, column.id);
						}) }) }),
						/* @__PURE__ */ jsx("tbody", { children: visibleRows.map((row) => {
							const selected = row.id === selectedRowId;
							const outlier = outlierIds.has(row.id);
							return /* @__PURE__ */ jsx("tr", {
								"data-visual-id": row.id,
								"data-visual-state": selected ? "selected" : elementState(row.id, focus),
								"data-selected": selected || void 0,
								"data-outlier": outlier || void 0,
								onClick: () => selectRow(row),
								children: content.columns.map((column, index) => {
									const value = valueOf(row, column.id);
									return /* @__PURE__ */ jsxs(index === 0 ? "th" : "td", {
										...index === 0 ? { scope: "row" } : {},
										"data-missing": value === null || void 0,
										children: [index === 0 && outlier ? /* @__PURE__ */ jsx("span", {
											className: data_table_module_css_default.outlierMark,
											title: "异常值",
											"aria-label": "异常值",
											children: "!"
										}) : null, /* @__PURE__ */ jsx("span", { children: formatValue(value, column) })]
									}, column.id);
								})
							}, row.id);
						}) })
					]
				}), visibleRows.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: data_table_module_css_default.empty,
					children: "没有匹配的记录。"
				}) : null]
			}),
			/* @__PURE__ */ jsx(SelectionSurface, {
				hint: "选择一行可在表格与图表中联动查看。",
				selected: selectedRow === void 0 ? void 0 : {
					label: content.columns.slice(0, 2).map((column) => formatValue(valueOf(selectedRow, column.id), column)).join(" · "),
					detail: selectedRow.detail ?? (outlierIds.has(selectedRow.id) ? "该记录被标记为异常值。" : void 0),
					kind: outlierIds.has(selectedRow.id) ? "异常记录" : "记录"
				},
				onClose: () => setSelectedRowId(void 0)
			})
		]
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/process.module.css.mjs
const css$3 = ".Qj8xxG_processViewport{overscroll-behavior-inline:contain;border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-lg);background:var(--lx-surface-sunken);scrollbar-width:thin;min-width:0;position:relative;overflow-x:auto}.Qj8xxG_processSvg{touch-action:pan-y;min-width:100%;max-width:none;display:block;overflow:visible}.Qj8xxG_processSvg text{font-family:inherit}.Qj8xxG_processArrow path,.Qj8xxG_diagramArrow path,.Qj8xxG_causalArrow path{fill:var(--visual-tone);fill-opacity:var(--lx-vs-alpha)}.Qj8xxG_transitionGroup,.Qj8xxG_stateGroup,.Qj8xxG_messageGroup,.Qj8xxG_participantGroup,.Qj8xxG_causalLink,.Qj8xxG_causalVariable,.Qj8xxG_causalLoop{--visual-tone:var(--lx-accent);cursor:pointer;outline:none}.Qj8xxG_transitionLine{fill:none;stroke:var(--visual-tone);stroke-width:calc(1.7px + var(--lx-vs-ring) * .8px);stroke-opacity:var(--lx-vs-alpha);stroke-linecap:round;vector-effect:non-scaling-stroke;transition:stroke-opacity var(--lx-motion-fast) var(--lx-easing), stroke-width var(--lx-motion-fast) var(--lx-easing)}.Qj8xxG_transitionHit{fill:none;stroke:#0000;stroke-width:16px;pointer-events:stroke;vector-effect:non-scaling-stroke}.Qj8xxG_transitionLabel rect{fill:var(--lx-surface-base);stroke:color-mix(in srgb, var(--visual-tone) 34%, var(--lx-border-subtle));stroke-width:1px;vector-effect:non-scaling-stroke}.Qj8xxG_transitionLabel text{fill:var(--lx-label-primary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-medium);pointer-events:none}.Qj8xxG_stateRing{fill:none;stroke:var(--visual-tone);stroke-width:2px;stroke-opacity:calc(var(--lx-vs-ring) * .4);vector-effect:non-scaling-stroke;transition:stroke-opacity var(--lx-motion-fast) var(--lx-easing)}.Qj8xxG_stateShape{fill:color-mix(in srgb, var(--visual-tone) 10%, var(--lx-surface-base));fill-opacity:var(--lx-vs-alpha);stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:calc(1.6px + var(--lx-vs-ring) * 1.2px);vector-effect:non-scaling-stroke;transition:fill-opacity var(--lx-motion-fast) var(--lx-easing), stroke-width var(--lx-motion-fast) var(--lx-easing)}.Qj8xxG_stateLabel{fill:var(--lx-label-primary);font-size:var(--lx-text-xs);font-weight:var(--lx-weight-strong);opacity:var(--lx-vs-alpha);pointer-events:none}.Qj8xxG_stateMarker{fill:var(--visual-tone);font-size:9px;font-weight:var(--lx-weight-strong);letter-spacing:.05em;pointer-events:none}.Qj8xxG_currentStateMarker{fill:var(--visual-tone);stroke:var(--lx-surface-base);stroke-width:1.5px;vector-effect:non-scaling-stroke}.Qj8xxG_transitionGroup:hover .Qj8xxG_transitionLine,.Qj8xxG_transitionGroup:focus-visible .Qj8xxG_transitionLine,.Qj8xxG_transitionGroup[data-visual-state=selected] .Qj8xxG_transitionLine{stroke-opacity:1;stroke-width:3px}.Qj8xxG_stateGroup:hover .Qj8xxG_stateShape,.Qj8xxG_stateGroup:focus-visible .Qj8xxG_stateShape,.Qj8xxG_stateGroup[data-visual-state=selected] .Qj8xxG_stateShape,.Qj8xxG_stateGroup[data-visual-state=current] .Qj8xxG_stateShape{fill:color-mix(in srgb, var(--visual-tone) 20%, var(--lx-surface-base));fill-opacity:1;stroke-opacity:1;stroke-width:2.8px}.Qj8xxG_stateGroup[data-visual-state=current] .Qj8xxG_stateRing,.Qj8xxG_stateGroup[data-visual-state=selected] .Qj8xxG_stateRing{stroke-opacity:.58}.Qj8xxG_participantCard{fill:color-mix(in srgb, var(--visual-tone) 11%, var(--lx-surface-base));stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:1.5px;vector-effect:non-scaling-stroke}.Qj8xxG_participantLabel{fill:var(--lx-label-primary);font-size:var(--lx-text-xs);font-weight:var(--lx-weight-strong);pointer-events:none}.Qj8xxG_lifeline{fill:none;stroke:var(--visual-tone);stroke-dasharray:4 5;stroke-opacity:.58;stroke-width:1.2px;vector-effect:non-scaling-stroke}.Qj8xxG_activation{fill:color-mix(in srgb, var(--visual-tone) 16%, var(--lx-surface-base));stroke:var(--visual-tone);stroke-width:1.5px;vector-effect:non-scaling-stroke}.Qj8xxG_messageLine{fill:none;stroke:var(--visual-tone);stroke-width:1.8px;stroke-opacity:var(--lx-vs-alpha);vector-effect:non-scaling-stroke}.Qj8xxG_messageGroup[data-message-type=return] .Qj8xxG_messageLine{stroke-dasharray:7 5;stroke-opacity:.78}.Qj8xxG_messageGroup[data-message-type=async] .Qj8xxG_messageLine{stroke-dasharray:2 5}.Qj8xxG_messageGroup[data-stroke=dashed] .Qj8xxG_messageLine{stroke-dasharray:7 5}.Qj8xxG_messageHit{fill:none;stroke:#0000;stroke-width:16px;pointer-events:stroke;vector-effect:non-scaling-stroke}.Qj8xxG_messageLabel rect{fill:var(--lx-surface-base);stroke:color-mix(in srgb, var(--visual-tone) 30%, var(--lx-border-subtle));stroke-width:1px;vector-effect:non-scaling-stroke}.Qj8xxG_messageLabel text{fill:var(--lx-label-primary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-medium);pointer-events:none}.Qj8xxG_messageGroup[data-message-type=return] .Qj8xxG_messageLabel rect{stroke-dasharray:4 3}.Qj8xxG_messageGroup[data-message-type=async] .Qj8xxG_messageLabel rect{stroke-dasharray:1 3}.Qj8xxG_messageGroup:hover .Qj8xxG_messageLine,.Qj8xxG_messageGroup:focus-visible .Qj8xxG_messageLine,.Qj8xxG_messageGroup[data-visual-state=selected] .Qj8xxG_messageLine{stroke-width:3px;stroke-opacity:1}.Qj8xxG_participantGroup:hover .Qj8xxG_participantCard,.Qj8xxG_participantGroup:focus-visible .Qj8xxG_participantCard,.Qj8xxG_participantGroup[data-visual-state=selected] .Qj8xxG_participantCard,.Qj8xxG_participantGroup[data-visual-state=current] .Qj8xxG_participantCard{fill:color-mix(in srgb, var(--visual-tone) 22%, var(--lx-surface-base));stroke-width:2.6px;stroke-opacity:1}.Qj8xxG_participantGroup[data-visual-state=current] .Qj8xxG_participantCard{filter:drop-shadow(0 0 .2rem color-mix(in srgb, var(--visual-tone) 28%, transparent))}.Qj8xxG_causalLinkPath{fill:none;stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:calc(1.8px + var(--lx-vs-ring) * .7px);stroke-linecap:round;vector-effect:non-scaling-stroke;transition:stroke-width var(--lx-motion-fast) var(--lx-easing), stroke-opacity var(--lx-motion-fast) var(--lx-easing)}.Qj8xxG_causalLinkHit{fill:none;stroke:#0000;stroke-width:18px;pointer-events:stroke;vector-effect:non-scaling-stroke}.Qj8xxG_causalSign rect,.Qj8xxG_causalDelay rect{fill:var(--lx-surface-base);stroke:color-mix(in srgb, var(--visual-tone) 44%, var(--lx-border-subtle));stroke-width:1.2px;vector-effect:non-scaling-stroke;box-shadow:0 1px 3px #0000000f}.Qj8xxG_causalSign text,.Qj8xxG_causalDelay text,.Qj8xxG_causalLinkLabel{fill:var(--visual-tone);font-size:var(--lx-text-xs);font-weight:var(--lx-weight-strong)}.Qj8xxG_causalLabelGroup{pointer-events:none}.Qj8xxG_causalLabelBg{fill:var(--lx-surface-base);fill-opacity:.94;stroke:color-mix(in srgb, var(--visual-tone) 24%, var(--lx-border-subtle));stroke-width:1px}.Qj8xxG_causalLinkLabel{fill:var(--lx-label-primary);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-medium)}.Qj8xxG_causalVariableShape{fill:color-mix(in srgb, var(--visual-tone) 10%, var(--lx-surface-base));fill-opacity:var(--lx-vs-alpha);stroke:var(--visual-tone);stroke-opacity:var(--lx-vs-alpha);stroke-width:calc(1.6px + var(--lx-vs-ring) * 1.2px);vector-effect:non-scaling-stroke;transition:fill-opacity var(--lx-motion-fast) var(--lx-easing), stroke-width var(--lx-motion-fast) var(--lx-easing)}.Qj8xxG_causalVariableLabel{fill:var(--lx-label-primary);font-size:var(--lx-text-xs);font-weight:var(--lx-weight-strong);pointer-events:none}.Qj8xxG_causalLoopBadge rect{fill:color-mix(in srgb, var(--visual-tone) 14%, var(--lx-surface-base));stroke:var(--visual-tone);stroke-width:1.5px;vector-effect:non-scaling-stroke;filter:drop-shadow(0 2px 6px color-mix(in srgb, var(--visual-tone) 16%, transparent));transition:fill var(--lx-motion-fast) var(--lx-easing), stroke-width var(--lx-motion-fast) var(--lx-easing)}.Qj8xxG_causalLoopBadge text{fill:var(--visual-tone);font-size:var(--lx-text-micro);font-weight:var(--lx-weight-strong);letter-spacing:.02em;pointer-events:none}.Qj8xxG_causalLink:hover .Qj8xxG_causalLinkPath,.Qj8xxG_causalLink:focus-visible .Qj8xxG_causalLinkPath,.Qj8xxG_causalLink[data-visual-state=selected] .Qj8xxG_causalLinkPath{stroke-width:3px;stroke-opacity:1;filter:drop-shadow(0 0 4px var(--visual-tone))}.Qj8xxG_causalVariable:hover .Qj8xxG_causalVariableShape,.Qj8xxG_causalVariable:focus-visible .Qj8xxG_causalVariableShape,.Qj8xxG_causalVariable[data-visual-state=selected] .Qj8xxG_causalVariableShape,.Qj8xxG_causalVariable[data-visual-state=current] .Qj8xxG_causalVariableShape{fill:color-mix(in srgb, var(--visual-tone) 24%, var(--lx-surface-base));fill-opacity:1;stroke-width:2.8px;stroke-opacity:1;filter:drop-shadow(0 0 6px color-mix(in srgb, var(--visual-tone) 30%, transparent))}.Qj8xxG_causalLoop:hover .Qj8xxG_causalLoopBadge rect,.Qj8xxG_causalLoop:focus-visible .Qj8xxG_causalLoopBadge rect,.Qj8xxG_causalLoop[data-visual-state=selected] .Qj8xxG_causalLoopBadge rect{fill:color-mix(in srgb, var(--visual-tone) 26%, var(--lx-surface-base));stroke-width:2.2px;filter:drop-shadow(0 0 8px color-mix(in srgb, var(--visual-tone) 36%, transparent))}.Qj8xxG_causalLoopBadge[data-loop-kind=balancing] rect{stroke-dasharray:5 3}.Qj8xxG_processSteps{gap:var(--lx-space-xs);margin:0;padding:0;list-style:none;display:grid}.Qj8xxG_processSteps li{gap:var(--lx-space-3xs);border-left:3px solid var(--lx-border-default);padding:var(--lx-space-xs) var(--lx-space-md);color:var(--lx-label-secondary);font-size:var(--lx-text-2xs);display:grid}.Qj8xxG_processSteps li[data-active]{border-left-color:var(--lx-accent);background:color-mix(in srgb, var(--lx-accent) 7%, transparent)}.Qj8xxG_processSteps strong{color:var(--lx-label-primary);font-weight:var(--lx-weight-strong)}.Qj8xxG_stepButton{justify-items:start;gap:var(--lx-space-3xs);text-align:left;background:0 0;border-color:#0000;width:100%;display:grid}.Qj8xxG_stepButton span{color:var(--lx-label-secondary);font-size:var(--lx-text-2xs);line-height:var(--lx-leading-2xs)}@media (width<=560px){.Qj8xxG_processSvg{min-width:520px}}@media (prefers-reduced-motion:reduce){.Qj8xxG_transitionLine,.Qj8xxG_stateShape,.Qj8xxG_stateRing,.Qj8xxG_messageLine,.Qj8xxG_causalLinkPath{transition:none}}@media (forced-colors:active){.Qj8xxG_stateShape,.Qj8xxG_participantCard,.Qj8xxG_causalVariableShape{fill:canvas;stroke:canvastext}.Qj8xxG_transitionLine,.Qj8xxG_messageLine,.Qj8xxG_causalLinkPath{stroke:canvastext}.Qj8xxG_stateGroup[data-visual-state=current] .Qj8xxG_stateShape,.Qj8xxG_participantGroup[data-visual-state=current] .Qj8xxG_participantCard,.Qj8xxG_causalVariable[data-visual-state=current] .Qj8xxG_causalVariableShape{fill:highlight}}";
const tagId$3 = "@dsh-portable/visual/process.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$3;
	tag.textContent = css$3;
	document.head.appendChild(tag);
}
var process_module_css_default = {
	"activation": "Qj8xxG_activation",
	"causalArrow": "Qj8xxG_causalArrow",
	"causalDelay": "Qj8xxG_causalDelay",
	"causalLabelBg": "Qj8xxG_causalLabelBg",
	"causalLabelGroup": "Qj8xxG_causalLabelGroup",
	"causalLink": "Qj8xxG_causalLink",
	"causalLinkHit": "Qj8xxG_causalLinkHit",
	"causalLinkLabel": "Qj8xxG_causalLinkLabel",
	"causalLinkPath": "Qj8xxG_causalLinkPath",
	"causalLoop": "Qj8xxG_causalLoop",
	"causalLoopBadge": "Qj8xxG_causalLoopBadge",
	"causalSign": "Qj8xxG_causalSign",
	"causalVariable": "Qj8xxG_causalVariable",
	"causalVariableLabel": "Qj8xxG_causalVariableLabel",
	"causalVariableShape": "Qj8xxG_causalVariableShape",
	"currentStateMarker": "Qj8xxG_currentStateMarker",
	"diagramArrow": "Qj8xxG_diagramArrow",
	"lifeline": "Qj8xxG_lifeline",
	"messageGroup": "Qj8xxG_messageGroup",
	"messageHit": "Qj8xxG_messageHit",
	"messageLabel": "Qj8xxG_messageLabel",
	"messageLine": "Qj8xxG_messageLine",
	"participantCard": "Qj8xxG_participantCard",
	"participantGroup": "Qj8xxG_participantGroup",
	"participantLabel": "Qj8xxG_participantLabel",
	"processArrow": "Qj8xxG_processArrow",
	"processSteps": "Qj8xxG_processSteps",
	"processSvg": "Qj8xxG_processSvg",
	"processViewport": "Qj8xxG_processViewport",
	"stateGroup": "Qj8xxG_stateGroup",
	"stateLabel": "Qj8xxG_stateLabel",
	"stateMarker": "Qj8xxG_stateMarker",
	"stateRing": "Qj8xxG_stateRing",
	"stateShape": "Qj8xxG_stateShape",
	"stepButton": "Qj8xxG_stepButton",
	"transitionGroup": "Qj8xxG_transitionGroup",
	"transitionHit": "Qj8xxG_transitionHit",
	"transitionLabel": "Qj8xxG_transitionLabel",
	"transitionLine": "Qj8xxG_transitionLine"
};
//#endregion
//#region src/client/visuals/renderers/StateTransitionRenderer.tsx
/**
* `state_transition`: a state machine whose current state is visible.
*
* This is intentionally a small diagram renderer.  States and transitions
* remain real, keyboard reachable marks, while trigger/guard/action are kept
* on the transition so the learner can inspect the rule without leaving the
* figure.  The renderer also understands the common `nodes`/`edges` aliases;
* that makes hand-written examples easy to migrate from a node-link payload.
*/
const STATE_WIDTH = 150;
const STATE_HEIGHT = 60;
const STATE_GAP = 112;
const SIDE_PADDING = 28;
const ROW_HEIGHT = 122;
function transitionLabelLayout(label) {
	const lines = wrapLabel(label, {
		fontSize: 11,
		maxWidth: 220,
		maxLines: 2
	}).lines;
	return {
		width: Math.min(244, Math.max(92, Math.max(...lines.map((line) => measureText(line, 11)), 0) + 20)),
		height: lines.length > 1 ? 34 : 26,
		lines
	};
}
function edgeFrom(edge) {
	return edge.from;
}
function edgeTo(edge) {
	return edge.to;
}
function stateDetail(state) {
	return state.detail;
}
function edgeDetail(edge) {
	const parts = [
		`Trigger: ${edge.trigger}`,
		edge.guard === void 0 ? void 0 : `Guard: ${edge.guard}`,
		edge.action === void 0 ? void 0 : `Action: ${edge.action}`,
		edge.detail
	].filter((part) => part !== void 0 && part.length > 0);
	return parts.length === 0 ? void 0 : parts.join(" · ");
}
function edgeCaption(edge) {
	return [
		edge.trigger,
		edge.guard === void 0 ? void 0 : `[${edge.guard}]`,
		edge.action === void 0 ? void 0 : `/ ${edge.action}`
	].filter((part) => part !== void 0 && part.length > 0).join(" ");
}
function orderedStates(content) {
	return [...content.states].sort((left, right) => {
		return (left.initial === true ? 0 : 1) - (right.initial === true ? 0 : 1);
	});
}
function layoutStates(states, width) {
	const perRow = Math.max(1, Math.floor((Math.max(width, 360) - 56 + STATE_GAP) / 262));
	const rows = Math.max(1, Math.ceil(states.length / perRow));
	const canvasWidth = Math.max(Math.max(width, 360), 56 + perRow * STATE_WIDTH + (perRow - 1) * STATE_GAP);
	const canvasHeight = 56 + rows * STATE_HEIGHT + (rows - 1) * 62;
	const boxes = /* @__PURE__ */ new Map();
	states.forEach((state, index) => {
		const row = Math.floor(index / perRow);
		const column = index % perRow;
		const rowCount = Math.min(perRow, states.length - row * perRow);
		const rowWidth = rowCount * STATE_WIDTH + Math.max(0, rowCount - 1) * STATE_GAP;
		const start = (canvasWidth - rowWidth) / 2;
		boxes.set(state.id, {
			x: start + column * 262 + STATE_WIDTH / 2,
			y: SIDE_PADDING + row * ROW_HEIGHT + STATE_HEIGHT / 2,
			width: STATE_WIDTH,
			height: STATE_HEIGHT
		});
	});
	return {
		width: canvasWidth,
		height: canvasHeight,
		boxes
	};
}
function stateVisualState(id, focus, currentStateId, related = []) {
	if (focus.active) return elementState(id, focus, related);
	return id === currentStateId ? "current" : "overview";
}
function StateTransitionRenderer({ content, focus }) {
	const diagramId = useId();
	const [viewportRef, containerWidth] = useContainerWidth();
	const [selected, setSelected] = useState();
	const [activeStepId, setActiveStepId] = useState(content.steps?.[0]?.id);
	const states = useMemo(() => orderedStates(content), [content]);
	const transitions = useMemo(() => [...content.transitions], [content]);
	const layout = useMemo(() => layoutStates(states, containerWidth), [containerWidth, states]);
	const stateById = useMemo(() => new Map(states.map((state) => [state.id, state])), [states]);
	const currentStateId = content.steps?.find((step) => step.id === activeStepId)?.currentStateId;
	const currentTransitionId = content.steps?.find((step) => step.id === activeStepId)?.transitionId;
	const initialStateId = states.find((state) => state.initial === true)?.id;
	const terminalIds = useMemo(() => new Set(states.filter((state) => state.final === true).map((state) => state.id)), [states]);
	const roving = useRovingFocus(useMemo(() => [...states.map((state) => state.id), ...transitions.map((edge) => edge.id)], [states, transitions]));
	const selectState = (state) => setSelected({
		label: state.label,
		detail: stateDetail(state),
		kind: state.id === initialStateId || state.initial === true ? "Initial state" : terminalIds.has(state.id) ? "Terminal state" : "State",
		tone: toneAt(state.tone)
	});
	const selectTransition = (edge) => {
		const from = stateById.get(edgeFrom(edge) ?? "")?.label ?? edgeFrom(edge) ?? "State";
		const to = stateById.get(edgeTo(edge) ?? "")?.label ?? edgeTo(edge) ?? "State";
		setSelected({
			label: edgeCaption(edge) || `${from} → ${to}`,
			detail: edgeDetail(edge) ?? `${from} → ${to}`,
			kind: "Transition",
			tone: toneAt(edge.tone)
		});
	};
	const summary = `State transition diagram with ${states.length} states and ${transitions.length} transitions.`;
	const legendStates = useMemo(() => focus.active ? states.map((state) => stateVisualState(state.id, focus, currentStateId)) : [], [
		currentStateId,
		focus,
		states
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [
			/* @__PURE__ */ jsx("div", {
				className: process_module_css_default.processViewport,
				ref: viewportRef,
				children: /* @__PURE__ */ jsxs("svg", {
					ref: roving.containerRef,
					className: process_module_css_default.processSvg,
					width: layout.width,
					height: layout.height,
					viewBox: `0 0 ${layout.width} ${layout.height}`,
					role: "group",
					"aria-label": summary,
					children: [
						/* @__PURE__ */ jsx("defs", { children: DEFAULT_TONES.map((tone) => /* @__PURE__ */ jsx("marker", {
							id: `${diagramId}-${tone}`,
							className: process_module_css_default.processArrow,
							"data-tone": tone,
							markerWidth: "8",
							markerHeight: "8",
							refX: "7",
							refY: "4",
							orient: "auto",
							markerUnits: "strokeWidth",
							children: /* @__PURE__ */ jsx("path", { d: "M0,0 L8,4 L0,8 z" })
						}, tone)) }),
						/* @__PURE__ */ jsx("g", {
							className: process_module_css_default.transitionLayer,
							children: transitions.map((edge, index) => {
								const from = layout.boxes.get(edgeFrom(edge) ?? "");
								const to = layout.boxes.get(edgeTo(edge) ?? "");
								if (from === void 0 || to === void 0) return null;
								const sameRow = Math.abs(from.y - to.y) < 1;
								const hasReverse = transitions.some((other) => other.id !== edge.id && edgeFrom(other) === edgeTo(edge) && edgeTo(other) === edgeFrom(edge));
								const isForward = to.x >= from.x;
								let path = "";
								let labelX = (from.x + to.x) / 2;
								let labelY = (from.y + to.y) / 2;
								if (sameRow) {
									if (isForward) {
										const startX = from.x + from.width / 2;
										const endX = to.x - to.width / 2;
										const startY = from.y;
										const endY = to.y;
										if (hasReverse) {
											const curveY = startY - 26;
											path = `M ${startX} ${startY} Q ${(startX + endX) / 2} ${curveY} ${endX} ${endY}`;
											labelX = (startX + endX) / 2;
											labelY = curveY - 10;
										} else {
											path = `M ${startX} ${startY} L ${endX} ${endY}`;
											labelX = (startX + endX) / 2;
											labelY = startY - 14;
										}
									} else {
										const startX = from.x - from.width / 2;
										const endX = to.x + to.width / 2;
										const startY = from.y;
										const endY = to.y;
										const curveY = startY + 36;
										path = `M ${startX} ${startY} Q ${(startX + endX) / 2} ${curveY} ${endX} ${endY}`;
										labelX = (startX + endX) / 2;
										labelY = curveY + 14;
									}
								} else {
									const startX = isForward ? from.x + from.width / 2 : from.x;
									const endX = isForward ? to.x - to.width / 2 : to.x;
									const startY = from.y + from.height / 2;
									const endY = to.y - to.height / 2;
									const direction = isForward ? 1 : -1;
									path = `M ${startX} ${startY} C ${startX + direction * 50} ${startY + 24}, ${endX - direction * 50} ${endY - 24}, ${endX} ${endY}`;
									labelX = (startX + endX) / 2;
									labelY = (startY + endY) / 2;
								}
								const state = focus.active ? elementState(edge.id, focus, [edgeFrom(edge), edgeTo(edge)]) : edge.id === currentTransitionId ? "current" : "overview";
								const tone = toneAt(edge.tone, index);
								const caption = edgeCaption(edge);
								const diagramCaption = caption;
								const labelLayout = transitionLabelLayout(diagramCaption);
								labelY += (index % 3 - 1) * 14;
								return /* @__PURE__ */ jsxs("g", {
									className: process_module_css_default.transitionGroup,
									"data-tone": tone,
									"data-visual-id": edge.id,
									"data-visual-state": state,
									role: "button",
									"aria-label": `Transition ${caption || `${edgeFrom(edge)} to ${edgeTo(edge)}`}`,
									onClick: () => selectTransition(edge),
									...roving.itemProps(edge.id, () => selectTransition(edge)),
									children: [
										/* @__PURE__ */ jsx("path", {
											className: process_module_css_default.transitionLine,
											d: path,
											markerEnd: `url(#${diagramId}-${tone})`
										}),
										/* @__PURE__ */ jsx("path", {
											className: process_module_css_default.transitionHit,
											d: path
										}),
										diagramCaption === "" ? null : /* @__PURE__ */ jsxs("g", {
											className: process_module_css_default.transitionLabel,
											transform: `translate(${labelX} ${labelY})`,
											children: [/* @__PURE__ */ jsx("rect", {
												x: -labelLayout.width / 2,
												y: -labelLayout.height / 2,
												width: labelLayout.width,
												height: labelLayout.height,
												rx: "9"
											}), /* @__PURE__ */ jsx("text", {
												textAnchor: "middle",
												dominantBaseline: "middle",
												children: labelLayout.lines.map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
													x: "0",
													dy: lineIndex === 0 ? labelLayout.lines.length > 1 ? "-0.55em" : "0.34em" : "1.1em",
													children: line
												}, lineIndex))
											})]
										})
									]
								}, edge.id);
							})
						}),
						/* @__PURE__ */ jsx("g", { children: states.map((state, index) => {
							const box = layout.boxes.get(state.id);
							if (box === void 0) return null;
							const tone = toneAt(state.tone, index);
							const related = transitions.flatMap((edge) => edgeFrom(edge) === state.id ? [edgeTo(edge)] : edgeTo(edge) === state.id ? [edgeFrom(edge)] : []);
							const isCurrent = state.id === currentStateId;
							const visualState = isCurrent ? "current" : stateVisualState(state.id, focus, currentStateId, related);
							const isInitial = state.id === initialStateId || state.initial === true;
							const isTerminal = terminalIds.has(state.id);
							return /* @__PURE__ */ jsxs("g", {
								className: process_module_css_default.stateGroup,
								transform: `translate(${box.x} ${box.y})`,
								"data-tone": tone,
								"data-visual-id": state.id,
								"data-visual-state": selected?.label === state.label ? "selected" : visualState,
								"data-initial": isInitial || void 0,
								"data-terminal": isTerminal || void 0,
								"aria-current": isCurrent ? "step" : void 0,
								role: "button",
								"aria-label": `${state.label}${state.detail === void 0 ? "" : `。${state.detail}`}`,
								onClick: () => selectState(state),
								...roving.itemProps(state.id, () => selectState(state)),
								children: [
									/* @__PURE__ */ jsx("rect", {
										className: process_module_css_default.stateRing,
										x: -box.width / 2 - 4,
										y: -box.height / 2 - 4,
										width: box.width + 8,
										height: box.height + 8,
										rx: "14"
									}),
									/* @__PURE__ */ jsx("rect", {
										className: process_module_css_default.stateShape,
										x: -box.width / 2,
										y: -box.height / 2,
										width: box.width,
										height: box.height,
										rx: "12"
									}),
									isCurrent ? /* @__PURE__ */ jsx("path", {
										className: process_module_css_default.currentStateMarker,
										d: `M 0 ${-box.height / 2 - 16} l -7 8 h 14 z`
									}) : null,
									!isTerminal ? null : /* @__PURE__ */ jsx("rect", {
										x: -box.width / 2 + 4,
										y: -box.height / 2 + 4,
										width: box.width - 8,
										height: box.height - 8,
										rx: "8",
										fill: "none",
										stroke: "var(--visual-tone)",
										strokeWidth: "1.2",
										opacity: "0.75"
									}),
									/* @__PURE__ */ jsx("text", {
										className: process_module_css_default.stateLabel,
										textAnchor: "middle",
										dominantBaseline: "middle",
										children: state.label
									}),
									!isInitial ? null : /* @__PURE__ */ jsxs("g", {
										className: process_module_css_default.stateMarker,
										transform: `translate(${-box.width / 2 - 18} 0)`,
										children: [/* @__PURE__ */ jsx("circle", {
											cx: "-6",
											cy: "0",
											r: "4",
											fill: "var(--visual-tone)"
										}), /* @__PURE__ */ jsx("line", {
											x1: "-2",
											y1: "0",
											x2: "10",
											y2: "0",
											stroke: "var(--visual-tone)",
											strokeWidth: "1.8",
											markerEnd: `url(#${diagramId}-${tone})`
										})]
									}),
									state.detail === void 0 ? null : /* @__PURE__ */ jsx("title", { children: state.detail })
								]
							}, state.id);
						}) })
					]
				})
			}),
			/* @__PURE__ */ jsx(StateLegend, { states: legendStates }),
			/* @__PURE__ */ jsxs("div", {
				className: shell_module_css_default.srOnly,
				children: [/* @__PURE__ */ jsx("p", { children: summary }), /* @__PURE__ */ jsxs("ul", { children: [states.map((state) => /* @__PURE__ */ jsxs("li", { children: [state.label, state.detail === void 0 ? "" : `: ${state.detail}`] }, state.id)), transitions.map((edge) => /* @__PURE__ */ jsxs("li", { children: [edgeCaption(edge) || edge.id, edgeDetail(edge) === void 0 ? "" : `: ${edgeDetail(edge)}`] }, edge.id))] })]
			}),
			/* @__PURE__ */ jsx(SelectionSurface, {
				hint: "Select a state or transition to inspect its rule.",
				selected,
				onClose: () => setSelected(void 0)
			}),
			content.steps === void 0 || content.steps.length === 0 ? null : /* @__PURE__ */ jsx("ol", {
				className: process_module_css_default.processSteps,
				"aria-label": "State transition steps",
				children: content.steps.map((step) => {
					const active = focus.active ? focus.currentIds.has(step.currentStateId) : step.id === activeStepId;
					return /* @__PURE__ */ jsx("li", {
						"data-active": active || void 0,
						children: /* @__PURE__ */ jsxs("button", {
							type: "button",
							className: `${shell_module_css_default.control} ${process_module_css_default.stepButton}`,
							onClick: () => setActiveStepId(step.id),
							children: [/* @__PURE__ */ jsx("strong", { children: step.label }), step.description === void 0 ? null : /* @__PURE__ */ jsx("span", { children: step.description })]
						})
					}, step.id);
				})
			})
		]
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/sequence-buffer.module.css.mjs
const css$2 = "._7XLDMW_viewport{border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-md);width:100%;padding:var(--lx-space-md);background:var(--lx-surface-sunken);overflow-x:auto}._7XLDMW_buffer{grid-template-columns:repeat(var(--buffer-columns), minmax(64px, 1fr));gap:var(--lx-space-xs);align-items:end;min-width:max-content;display:grid}._7XLDMW_range{justify-content:space-between;align-items:center;gap:var(--lx-space-sm);border:1.5px solid color-mix(in srgb, var(--visual-tone) 58%, var(--lx-border-default));border-radius:var(--lx-radius-pill);min-height:34px;padding:var(--lx-space-3xs) var(--lx-space-sm);background:color-mix(in srgb, var(--visual-tone) 12%, var(--lx-surface-base));color:var(--lx-label-primary);font:inherit;font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-medium);overflow-wrap:anywhere;opacity:var(--lx-vs-alpha);cursor:pointer;transition:transform var(--lx-motion-fast) var(--lx-easing), box-shadow var(--lx-motion-fast) var(--lx-easing);display:flex;box-shadow:0 1px 3px #0000000d}._7XLDMW_range span{overflow-wrap:anywhere;min-width:0}._7XLDMW_range small{color:var(--lx-label-tertiary);font-variant-numeric:tabular-nums;flex:none}._7XLDMW_range[data-visual-state=current],._7XLDMW_range[data-visual-state=selected]{box-shadow:0 0 8px color-mix(in srgb, var(--visual-tone) 36%, transparent);border-width:2px}._7XLDMW_slotGrid,._7XLDMW_pointerGrid{grid-column:1/-1;grid-template-columns:repeat(var(--buffer-columns), minmax(64px, 1fr));gap:var(--lx-space-xs);display:grid}._7XLDMW_slot{grid-template-rows:minmax(var(--lx-leading-micro), auto) 1fr var(--lx-leading-micro);gap:var(--lx-space-3xs);border:1.2px solid color-mix(in srgb, var(--visual-tone) 38%, var(--lx-border-subtle));border-radius:var(--lx-radius-md);min-width:64px;min-height:80px;padding:var(--lx-space-xs);background:color-mix(in srgb, var(--visual-tone) 8%, var(--lx-surface-base));color:var(--lx-label-primary);font:inherit;text-align:center;opacity:var(--lx-vs-alpha);cursor:pointer;transition:border-color var(--lx-motion-fast) var(--lx-easing), transform var(--lx-motion-fast) var(--lx-easing), box-shadow var(--lx-motion-fast) var(--lx-easing);align-items:center;display:grid;box-shadow:0 1px 3px #0000000a}._7XLDMW_slot:hover,._7XLDMW_pointer:hover,._7XLDMW_range:hover{border-color:var(--visual-tone);box-shadow:0 0 8px color-mix(in srgb, var(--visual-tone) 24%, transparent)}._7XLDMW_slot[data-visual-state=current],._7XLDMW_slot[data-visual-state=selected]{border-width:2px;border-color:var(--visual-tone);box-shadow:0 0 10px color-mix(in srgb, var(--visual-tone) 32%, transparent)}._7XLDMW_slot small{min-height:var(--lx-leading-micro);color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);line-height:var(--lx-leading-micro);font-weight:var(--lx-weight-medium)}._7XLDMW_slot strong{overflow-wrap:anywhere;color:var(--visual-tone);font-size:var(--lx-text-base);font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-sm)}._7XLDMW_slot>span{border-radius:var(--lx-radius-xs);background:var(--lx-surface-sunken);color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);font-variant-numeric:tabular-nums;padding:1px 4px;display:inline-block}._7XLDMW_slot[data-missing] strong{color:var(--lx-label-tertiary);font-weight:var(--lx-weight-regular)}._7XLDMW_pointerGrid{align-items:start;row-gap:var(--lx-space-xs);grid-auto-rows:minmax(34px,auto)}._7XLDMW_pointer{border-radius:var(--lx-radius-sm);min-width:0;padding:2px var(--lx-space-3xs) var(--lx-space-3xs);color:var(--visual-tone);font:inherit;font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-strong);opacity:var(--lx-vs-alpha);cursor:pointer;transition:transform var(--lx-motion-fast) var(--lx-easing);background:0 0;border:1px solid #0000;justify-items:center;gap:2px;display:grid}._7XLDMW_pointer i{font-size:var(--lx-text-base);filter:drop-shadow(0 0 2px var(--visual-tone));font-style:normal;line-height:1}._7XLDMW_pointer span{overflow-wrap:anywhere;text-align:center;max-width:100%}._7XLDMW_pointer small{color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);font-variant-numeric:tabular-nums}._7XLDMW_pointer[data-visual-state=current],._7XLDMW_pointer[data-visual-state=selected]{background:color-mix(in srgb, var(--visual-tone) 12%, var(--lx-surface-base));border-color:color-mix(in srgb, var(--visual-tone) 40%, transparent)}";
const tagId$2 = "@dsh-portable/visual/sequence-buffer.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$2;
	tag.textContent = css$2;
	document.head.appendChild(tag);
}
var sequence_buffer_module_css_default = {
	"buffer": "_7XLDMW_buffer",
	"pointer": "_7XLDMW_pointer",
	"pointerGrid": "_7XLDMW_pointerGrid",
	"range": "_7XLDMW_range",
	"slot": "_7XLDMW_slot",
	"slotGrid": "_7XLDMW_slotGrid",
	"viewport": "_7XLDMW_viewport"
};
//#endregion
//#region src/client/visuals/renderers/SequenceBufferRenderer.tsx
/** `sequence_buffer`: discrete slots, pointers and ranges with local step playback. */
function displayValue(value) {
	if (value === null) return "∅";
	if (typeof value === "boolean") return value ? "true" : "false";
	if (typeof value === "number") return formatNumber(value);
	return value;
}
function steppedContent(content, stepIndex) {
	const slotValues = new Map(content.slots.map((slot) => [slot.id, slot.value]));
	const pointerIndexes = new Map((content.pointers ?? []).map((pointer) => [pointer.id, pointer.index]));
	const rangeBounds = new Map((content.ranges ?? []).map((range) => [range.id, {
		start: range.start,
		end: range.end
	}]));
	for (const step of (content.steps ?? []).slice(0, stepIndex + 1)) {
		for (const snapshot of step.slots ?? []) if (snapshot.value !== void 0) slotValues.set(snapshot.slotId, snapshot.value);
		for (const snapshot of step.pointers ?? []) pointerIndexes.set(snapshot.pointerId, snapshot.index);
		for (const snapshot of step.ranges ?? []) rangeBounds.set(snapshot.rangeId, {
			start: snapshot.start,
			end: snapshot.end
		});
	}
	return {
		slotValues,
		pointerIndexes,
		rangeBounds
	};
}
function SequenceBufferRenderer({ content, focus }) {
	const [stepIndex, setStepIndex] = useState(0);
	const [selected, setSelected] = useState();
	const slots = useMemo(() => [...content.slots].sort((left, right) => left.index - right.index), [content.slots]);
	const slotOrder = useMemo(() => new Map(slots.map((slot, index) => [slot.index, index + 1])), [slots]);
	const current = steppedContent(content, stepIndex);
	const gridStyle = { "--buffer-columns": String(Math.max(1, slots.length)) };
	const steps = content.steps ?? [];
	const sequence = useMemo(() => ({
		initialFrameId: steps[0]?.id,
		frames: steps.map((step) => ({
			id: step.id,
			label: step.label,
			description: step.description,
			focusIds: []
		}))
	}), [steps]);
	const columnAt = (index) => slotOrder.get(index) ?? Math.max(1, Math.min(slots.length, index + 1));
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [
			steps.length < 2 ? null : /* @__PURE__ */ jsx(SequenceController, {
				sequence,
				frameIndex: stepIndex,
				onFrameChange: setStepIndex
			}),
			/* @__PURE__ */ jsx("div", {
				className: sequence_buffer_module_css_default.viewport,
				role: "group",
				"aria-label": "序列缓冲区",
				children: /* @__PURE__ */ jsxs("div", {
					className: sequence_buffer_module_css_default.buffer,
					style: gridStyle,
					children: [
						(content.ranges ?? []).map((range, rangeIndex) => {
							const bounds = current.rangeBounds.get(range.id) ?? range;
							const start = columnAt(Math.min(bounds.start, bounds.end));
							const end = columnAt(Math.max(bounds.start, bounds.end));
							return /* @__PURE__ */ jsxs("button", {
								type: "button",
								className: sequence_buffer_module_css_default.range,
								style: {
									gridColumn: `${String(start)} / span ${String(Math.max(1, end - start + 1))}`,
									gridRow: String(rangeIndex + 1)
								},
								"data-tone": toneAt(range.tone, rangeIndex),
								"data-visual-id": range.id,
								"data-visual-state": selected?.id === range.id ? "selected" : elementState(range.id, focus),
								onClick: () => setSelected({
									id: range.id,
									label: range.label,
									detail: `${String(bounds.start)} … ${String(bounds.end)}`,
									kind: "区间"
								}),
								children: [/* @__PURE__ */ jsx("span", { children: range.label }), /* @__PURE__ */ jsxs("small", { children: [
									bounds.start,
									"…",
									bounds.end
								] })]
							}, range.id);
						}),
						/* @__PURE__ */ jsx("div", {
							className: sequence_buffer_module_css_default.slotGrid,
							style: gridStyle,
							children: slots.map((slot, index) => {
								const value = current.slotValues.has(slot.id) ? current.slotValues.get(slot.id) ?? null : slot.value;
								return /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: sequence_buffer_module_css_default.slot,
									"data-tone": toneAt(slot.tone, index),
									"data-visual-id": slot.id,
									"data-visual-state": selected?.id === slot.id ? "selected" : elementState(slot.id, focus),
									"data-missing": value === null || void 0,
									onClick: () => setSelected({
										id: slot.id,
										label: slot.label ?? `[${String(slot.index)}]`,
										detail: displayValue(value),
										kind: "槽位"
									}),
									children: [
										/* @__PURE__ */ jsx("small", { children: slot.label }),
										/* @__PURE__ */ jsx("strong", { children: displayValue(value) }),
										/* @__PURE__ */ jsx("span", { children: slot.index })
									]
								}, slot.id);
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: sequence_buffer_module_css_default.pointerGrid,
							style: gridStyle,
							children: (content.pointers ?? []).map((pointer, pointerIndex) => {
								const index = current.pointerIndexes.get(pointer.id) ?? pointer.index;
								return /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: sequence_buffer_module_css_default.pointer,
									style: {
										gridColumn: columnAt(index),
										gridRow: String(pointerIndex + 1)
									},
									"data-tone": toneAt(pointer.tone, pointerIndex),
									"data-visual-id": pointer.id,
									"data-visual-state": selected?.id === pointer.id ? "selected" : elementState(pointer.id, focus),
									onClick: () => setSelected({
										id: pointer.id,
										label: pointer.label,
										detail: `index ${String(index)}`,
										kind: "指针"
									}),
									children: [
										/* @__PURE__ */ jsx("i", {
											"aria-hidden": "true",
											children: "↑"
										}),
										/* @__PURE__ */ jsx("span", { children: pointer.label }),
										/* @__PURE__ */ jsx("small", { children: index })
									]
								}, pointer.id);
							})
						})
					]
				})
			}),
			/* @__PURE__ */ jsx(SelectionSurface, {
				hint: "选择槽位、指针或区间查看当前步骤中的值。",
				selected,
				onClose: () => setSelected(void 0)
			})
		]
	});
}
//#endregion
//#region src/client/visuals/renderers/SequenceDiagramRenderer.tsx
/** `sequence_diagram`: participants, lifelines and ordered messages. */
const CARD_WIDTH = 128;
const CARD_HEIGHT = 42;
const MIN_ACTOR_GAP = 174;
const SIDE_MARGIN = 72;
const LIFELINE_TOP = 74;
const MESSAGE_TOP = 108;
const MESSAGE_GAP = 68;
function messageLabelWidth(label) {
	return Math.min(250, Math.max(72, label.length * 7 + 24));
}
function messageDetail(message, participants) {
	return [
		`${participants.get(message.from)?.label ?? message.from} → ${participants.get(message.to)?.label ?? message.to}`,
		message.type,
		message.detail
	].filter((part) => part !== void 0 && part.length > 0).join(" · ");
}
function SequenceDiagramRenderer({ content, focus }) {
	const diagramId = useId();
	const [viewportRef, containerWidth] = useContainerWidth();
	const [selected, setSelected] = useState();
	const participants = content.participants;
	const messages = content.messages;
	const participantById = useMemo(() => new Map(participants.map((participant) => [participant.id, participant])), [participants]);
	const width = Math.max(520, containerWidth, 144 + Math.max(0, participants.length - 1) * MIN_ACTOR_GAP);
	const actorGap = participants.length <= 1 ? 0 : (width - 144) / (participants.length - 1);
	const height = Math.max(150, MESSAGE_TOP + messages.length * MESSAGE_GAP + 36);
	const participantX = (index) => participants.length <= 1 ? width / 2 : SIDE_MARGIN + index * actorGap;
	const participantIndex = useMemo(() => new Map(participants.map((participant, index) => [participant.id, index])), [participants]);
	const roving = useRovingFocus(useMemo(() => [...participants.map((participant) => participant.id), ...messages.map((message) => message.id)], [messages, participants]));
	const selectParticipant = (participant) => setSelected({
		label: participant.label,
		detail: participant.detail,
		kind: "Participant",
		tone: toneAt(participant.tone)
	});
	const selectMessage = (message) => setSelected({
		label: message.label,
		detail: messageDetail(message, participantById),
		kind: "Message",
		tone: toneAt(message.tone)
	});
	const summary = `Sequence diagram with ${participants.length} participants and ${messages.length} messages.`;
	const legendStates = useMemo(() => focus.active ? [...participants, ...messages].map((item) => elementState(item.id, focus)) : [], [
		focus,
		messages,
		participants
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [
			/* @__PURE__ */ jsx("div", {
				className: process_module_css_default.processViewport,
				ref: viewportRef,
				children: /* @__PURE__ */ jsxs("svg", {
					ref: roving.containerRef,
					className: process_module_css_default.processSvg,
					width,
					height,
					viewBox: `0 0 ${width} ${height}`,
					role: "group",
					"aria-label": summary,
					children: [
						/* @__PURE__ */ jsx("defs", { children: DEFAULT_TONES.map((tone) => /* @__PURE__ */ jsx("marker", {
							id: `${diagramId}-${tone}`,
							className: process_module_css_default.diagramArrow,
							"data-tone": tone,
							markerWidth: "8",
							markerHeight: "8",
							refX: "7",
							refY: "4",
							orient: "auto",
							markerUnits: "strokeWidth",
							children: /* @__PURE__ */ jsx("path", { d: "M0,0 L8,4 L0,8 z" })
						}, tone)) }),
						/* @__PURE__ */ jsx("g", {
							"aria-hidden": "true",
							children: participants.map((participant, index) => {
								const x = participantX(index);
								const tone = toneAt(participant.tone, index);
								return /* @__PURE__ */ jsx("line", {
									className: process_module_css_default.lifeline,
									"data-tone": tone,
									x1: x,
									y1: LIFELINE_TOP,
									x2: x,
									y2: height - 18
								}, participant.id);
							})
						}),
						/* @__PURE__ */ jsx("g", {
							"aria-hidden": "true",
							children: messages.map((message, index) => {
								const toIndex = participantIndex.get(message.to);
								if (toIndex === void 0) return null;
								const x = participantX(toIndex);
								const y = MESSAGE_TOP + index * MESSAGE_GAP;
								const tone = toneAt(message.tone, index);
								return /* @__PURE__ */ jsx("rect", {
									className: process_module_css_default.activation,
									"data-tone": tone,
									x: x - 6,
									y: y - 8,
									width: "12",
									height: "36",
									rx: "4"
								}, `act-${message.id}`);
							})
						}),
						/* @__PURE__ */ jsx("g", { children: messages.map((message, index) => {
							const fromIndex = participantIndex.get(message.from);
							const toIndex = participantIndex.get(message.to);
							if (fromIndex === void 0 || toIndex === void 0) return null;
							const fromX = participantX(fromIndex);
							const toX = participantX(toIndex);
							const y = MESSAGE_TOP + index * MESSAGE_GAP;
							const tone = toneAt(message.tone, index);
							const state = focus.active ? elementState(message.id, focus, [message.from, message.to]) : "overview";
							const self = message.type === "self" || message.from === message.to;
							const startX = self ? fromX : fromX;
							const endX = self ? fromX : toX;
							const selfRadius = Math.min(84, Math.max(36, actorGap * .42));
							const path = self ? `M ${fromX} ${y} C ${fromX + selfRadius} ${y - 24}, ${fromX + selfRadius} ${y + 26}, ${fromX} ${y + 28}` : `M ${startX} ${y} L ${endX} ${y}`;
							const labelX = self ? fromX + selfRadius + 8 : (fromX + toX) / 2;
							const labelY = self ? y - 14 : y - 12;
							const boxWidth = messageLabelWidth(message.label);
							return /* @__PURE__ */ jsxs("g", {
								className: process_module_css_default.messageGroup,
								"data-tone": tone,
								"data-message-type": message.type,
								"data-visual-id": message.id,
								"data-visual-state": state,
								role: "button",
								"aria-label": `Message ${message.label}: ${messageDetail(message, participantById)}`,
								onClick: () => selectMessage(message),
								...roving.itemProps(message.id, () => selectMessage(message)),
								children: [
									/* @__PURE__ */ jsx("path", {
										className: process_module_css_default.messageLine,
										d: path,
										markerEnd: `url(#${diagramId}-${tone})`
									}),
									/* @__PURE__ */ jsx("path", {
										className: process_module_css_default.messageHit,
										d: path
									}),
									/* @__PURE__ */ jsxs("g", {
										className: process_module_css_default.messageLabel,
										transform: `translate(${labelX} ${labelY})`,
										children: [/* @__PURE__ */ jsx("rect", {
											x: -boxWidth / 2,
											y: "-13",
											width: boxWidth,
											height: "26",
											rx: "9"
										}), /* @__PURE__ */ jsx("text", {
											textAnchor: "middle",
											dominantBaseline: "middle",
											children: message.label
										})]
									}),
									message.detail === void 0 ? null : /* @__PURE__ */ jsx("title", { children: message.detail })
								]
							}, message.id);
						}) }),
						/* @__PURE__ */ jsx("g", { children: participants.map((participant, index) => {
							const x = participantX(index);
							const tone = toneAt(participant.tone, index);
							const state = focus.active ? elementState(participant.id, focus) : "overview";
							return /* @__PURE__ */ jsxs("g", {
								className: process_module_css_default.participantGroup,
								transform: `translate(${x} 39)`,
								"data-tone": tone,
								"data-visual-id": participant.id,
								"data-visual-state": selected?.label === participant.label ? "selected" : state,
								role: "button",
								"aria-label": `Participant: ${participant.label}`,
								onClick: () => selectParticipant(participant),
								...roving.itemProps(participant.id, () => selectParticipant(participant)),
								children: [
									/* @__PURE__ */ jsx("rect", {
										className: process_module_css_default.participantCard,
										x: -64,
										y: -21,
										width: CARD_WIDTH,
										height: CARD_HEIGHT,
										rx: "11"
									}),
									/* @__PURE__ */ jsx("text", {
										className: process_module_css_default.participantLabel,
										textAnchor: "middle",
										dominantBaseline: "middle",
										children: participant.label
									}),
									participant.detail === void 0 ? null : /* @__PURE__ */ jsx("title", { children: participant.detail })
								]
							}, participant.id);
						}) })
					]
				})
			}),
			/* @__PURE__ */ jsx(StateLegend, { states: legendStates }),
			/* @__PURE__ */ jsxs("div", {
				className: shell_module_css_default.srOnly,
				children: [/* @__PURE__ */ jsx("p", { children: summary }), /* @__PURE__ */ jsx("ol", { children: messages.map((message) => /* @__PURE__ */ jsxs("li", { children: [
					messageDetail(message, participantById),
					": ",
					message.label
				] }, message.id)) })]
			}),
			/* @__PURE__ */ jsx(SelectionSurface, {
				hint: "Select a participant or message to inspect the interaction.",
				selected,
				onClose: () => setSelected(void 0)
			})
		]
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/code-trace.module.css.mjs
const css$1 = ".g5u1rq_workspace{gap:var(--lx-space-md);grid-template-columns:minmax(0,1.65fr) minmax(220px,.85fr);align-items:start;display:grid}.g5u1rq_source,.g5u1rq_panel{border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-md);background:var(--lx-surface-base);min-width:0;overflow:hidden}.g5u1rq_source>header{justify-content:space-between;align-items:center;gap:var(--lx-space-md);border-bottom:1px solid var(--lx-border-subtle);padding:var(--lx-space-sm) var(--lx-space-md);background:var(--lx-surface-sunken);display:flex}.g5u1rq_source>header span{border-radius:var(--lx-radius-pill);padding:var(--lx-space-3xs) var(--lx-space-sm);background:color-mix(in srgb, var(--lx-accent) 11%, transparent);color:var(--lx-accent);font-size:var(--lx-text-micro);text-transform:uppercase}.g5u1rq_source>header strong{color:var(--lx-label-secondary);font-size:var(--lx-text-xs);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.g5u1rq_source ol{max-height:430px;padding:var(--lx-space-xs) 0;counter-reset:none;margin:0;list-style:none;overflow:auto}.g5u1rq_codeLine{min-width:max-content;opacity:var(--lx-vs-alpha);transition:background-color var(--lx-motion-fast) var(--lx-easing), border-color var(--lx-motion-fast) var(--lx-easing);border-left:3.5px solid #0000;grid-template-columns:48px minmax(300px,1fr);display:grid}.g5u1rq_lineGutter{justify-content:flex-end;align-items:center;gap:var(--lx-space-2xs);padding:2px var(--lx-space-sm) 2px var(--lx-space-xs);color:var(--lx-label-tertiary);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:var(--lx-text-2xs);font-variant-numeric:tabular-nums;user-select:none;display:flex}.g5u1rq_stepArrow{color:var(--lx-accent);filter:drop-shadow(0 0 3px var(--lx-accent));font-size:9px;font-style:normal;line-height:1}.g5u1rq_codeLine code{padding:2px var(--lx-space-md) 2px var(--lx-space-sm);color:var(--lx-label-primary);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:var(--lx-text-xs);white-space:pre;line-height:1.65;display:block}.g5u1rq_codeLine[data-current]{border-left-color:var(--lx-accent);background:color-mix(in srgb, var(--lx-accent) 12%, transparent)}.g5u1rq_codeLine[data-current] .g5u1rq_lineGutter{color:var(--lx-accent);font-weight:var(--lx-weight-strong)}.g5u1rq_token_keyword{color:var(--lx-tone-purple);font-weight:var(--lx-weight-medium)}.g5u1rq_token_type{color:var(--lx-tone-blue);font-weight:var(--lx-weight-medium)}.g5u1rq_token_string{color:var(--lx-tone-green)}.g5u1rq_token_number{color:var(--lx-tone-orange);font-variant-numeric:tabular-nums}.g5u1rq_token_comment{color:var(--lx-label-tertiary);font-style:italic}.g5u1rq_token_operator{color:color-mix(in srgb, var(--lx-label-primary) 85%, transparent)}.g5u1rq_inspector{gap:var(--lx-space-md);min-width:0;display:grid}.g5u1rq_panel h4{border-bottom:1px solid var(--lx-border-subtle);padding:var(--lx-space-sm) var(--lx-space-md);background:var(--lx-surface-sunken);color:var(--lx-label-secondary);font-size:var(--lx-text-xs);font-weight:var(--lx-weight-strong);line-height:var(--lx-leading-xs);margin:0}.g5u1rq_variables{margin:0;display:grid}.g5u1rq_variables>div{justify-content:space-between;gap:var(--lx-space-sm);min-width:0;padding:var(--lx-space-xs) var(--lx-space-md);border-bottom:1px solid var(--lx-border-subtle);transition:background-color var(--lx-motion-base) var(--lx-easing);display:flex}.g5u1rq_variables>div:last-child{border-bottom:0}.g5u1rq_variables dt{min-width:0;color:var(--lx-label-secondary);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:var(--lx-text-xs)}.g5u1rq_variables dt small{margin-left:var(--lx-space-xs);color:var(--lx-label-tertiary);font-family:inherit;font-size:var(--lx-text-micro)}.g5u1rq_variables dd{overflow-wrap:anywhere;max-width:60%;color:var(--lx-accent);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:var(--lx-text-xs);font-weight:var(--lx-weight-strong);text-align:right;margin:0}.g5u1rq_stack{padding:var(--lx-space-xs);margin:0;list-style:none;display:grid}.g5u1rq_stack li{align-items:baseline;gap:var(--lx-space-xs);border-radius:var(--lx-radius-xs);min-width:0;padding:var(--lx-space-xs) var(--lx-space-sm);color:var(--lx-label-secondary);font-size:var(--lx-text-xs);opacity:var(--lx-vs-alpha);display:flex}.g5u1rq_stack li:first-child{background:color-mix(in srgb, var(--lx-accent) 12%, transparent);color:var(--lx-label-primary);font-weight:var(--lx-weight-medium)}.g5u1rq_stack li>span{color:var(--lx-accent);font-size:var(--lx-text-micro)}.g5u1rq_stack li strong{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.g5u1rq_stack li small{color:var(--lx-label-tertiary);font-variant-numeric:tabular-nums;margin-left:auto}.g5u1rq_output{min-height:46px;max-height:150px;padding:var(--lx-space-sm) var(--lx-space-md);background:var(--lx-surface-sunken);color:var(--lx-label-primary);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:var(--lx-text-xs);line-height:var(--lx-leading-sm);white-space:pre-wrap;margin:0;overflow:auto}.g5u1rq_empty{padding:var(--lx-space-md);color:var(--lx-label-tertiary);font-size:var(--lx-text-xs);margin:0}.g5u1rq_description{color:var(--lx-label-secondary);font-size:var(--lx-text-xs);line-height:var(--lx-leading-sm);margin:0}@container g5u1rq_visual-view (width<=650px){.g5u1rq_workspace{grid-template-columns:1fr}.g5u1rq_inspector{grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr))}}";
const tagId$1 = "@dsh-portable/visual/code-trace.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId$1;
	tag.textContent = css$1;
	document.head.appendChild(tag);
}
var code_trace_module_css_default = {
	"codeLine": "g5u1rq_codeLine",
	"description": "g5u1rq_description",
	"empty": "g5u1rq_empty",
	"inspector": "g5u1rq_inspector",
	"lineGutter": "g5u1rq_lineGutter",
	"output": "g5u1rq_output",
	"panel": "g5u1rq_panel",
	"source": "g5u1rq_source",
	"stack": "g5u1rq_stack",
	"stepArrow": "g5u1rq_stepArrow",
	"token_comment": "g5u1rq_token_comment",
	"token_keyword": "g5u1rq_token_keyword",
	"token_number": "g5u1rq_token_number",
	"token_operator": "g5u1rq_token_operator",
	"token_string": "g5u1rq_token_string",
	"token_type": "g5u1rq_token_type",
	"variables": "g5u1rq_variables",
	"visual-view": "g5u1rq_visual-view",
	"workspace": "g5u1rq_workspace"
};
//#endregion
//#region src/client/visuals/renderers/CodeTraceRenderer.tsx
/** `code_trace`: source lines, current execution point, variables, stack and output. */
function tokenizeLine(lineText, language) {
	if (lineText === "") return [{
		text: " ",
		type: "plain"
	}];
	const tokens = [];
	let cursor = 0;
	const len = lineText.length;
	const KEYWORDS = /* @__PURE__ */ new Set([
		"const",
		"let",
		"var",
		"function",
		"def",
		"return",
		"if",
		"else",
		"for",
		"while",
		"class",
		"import",
		"export",
		"from",
		"in",
		"of",
		"new",
		"async",
		"await",
		"try",
		"catch",
		"yield",
		"type",
		"interface",
		"None",
		"null",
		"true",
		"false",
		"True",
		"False",
		"elif",
		"pass",
		"break",
		"continue",
		"lambda",
		"with",
		"as",
		"is",
		"not",
		"and",
		"or"
	]);
	const TYPES = /* @__PURE__ */ new Set([
		"number",
		"string",
		"boolean",
		"any",
		"void",
		"int",
		"float",
		"str",
		"list",
		"dict",
		"set",
		"tuple",
		"self",
		"this",
		"console",
		"print",
		"len",
		"range",
		"Array"
	]);
	while (cursor < len) {
		const char = lineText[cursor];
		if (char === "/" && lineText[cursor + 1] === "/" || char === "#" && language.toLowerCase().includes("py")) {
			tokens.push({
				text: lineText.slice(cursor),
				type: "comment"
			});
			break;
		}
		if (char === "\"" || char === "'" || char === "`") {
			const quote = char;
			let end = cursor + 1;
			while (end < len && lineText[end] !== quote) {
				if (lineText[end] === "\\") end += 1;
				end += 1;
			}
			end = Math.min(len, end + 1);
			tokens.push({
				text: lineText.slice(cursor, end),
				type: "string"
			});
			cursor = end;
			continue;
		}
		if (/[0-9]/.test(char) && (cursor === 0 || /[\s([\{,+\-*/=><!:]/.test(lineText[cursor - 1]))) {
			let end = cursor;
			while (end < len && /[0-9.eE_]/.test(lineText[end])) end += 1;
			tokens.push({
				text: lineText.slice(cursor, end),
				type: "number"
			});
			cursor = end;
			continue;
		}
		if (/[a-zA-Z_$]/.test(char)) {
			let end = cursor;
			while (end < len && /[a-zA-Z0-9_$]/.test(lineText[end])) end += 1;
			const word = lineText.slice(cursor, end);
			if (KEYWORDS.has(word)) tokens.push({
				text: word,
				type: "keyword"
			});
			else if (TYPES.has(word)) tokens.push({
				text: word,
				type: "type"
			});
			else tokens.push({
				text: word,
				type: "plain"
			});
			cursor = end;
			continue;
		}
		if (/[+\-*/%=><!&|^~?:;.,()[\]{}]/.test(char)) {
			tokens.push({
				text: char,
				type: "operator"
			});
			cursor += 1;
			continue;
		}
		tokens.push({
			text: char,
			type: "plain"
		});
		cursor += 1;
	}
	return tokens;
}
function traceValue(value) {
	if (value === null) return "null";
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "number") return formatNumber(value);
	return value ? "true" : "false";
}
function CodeTraceRenderer({ content, focus }) {
	const [stepIndex, setStepIndex] = useState(0);
	const step = content.steps[stepIndex] ?? content.steps[0];
	const lines = useMemo(() => [...content.lines].sort((left, right) => left.number - right.number), [content.lines]);
	const tokenizedLines = useMemo(() => new Map(lines.map((line) => [line.number, tokenizeLine(line.text, content.language)])), [content.language, lines]);
	const sequence = useMemo(() => ({
		initialFrameId: content.steps[0]?.id,
		frames: content.steps.map((item) => ({
			id: item.id,
			label: item.label,
			description: item.description,
			focusIds: []
		}))
	}), [content.steps]);
	if (step === void 0) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [
			content.steps.length < 2 ? null : /* @__PURE__ */ jsx(SequenceController, {
				sequence,
				frameIndex: stepIndex,
				onFrameChange: setStepIndex
			}),
			/* @__PURE__ */ jsxs("div", {
				className: code_trace_module_css_default.workspace,
				children: [/* @__PURE__ */ jsxs("section", {
					className: code_trace_module_css_default.source,
					"aria-label": `${content.language} 代码`,
					children: [/* @__PURE__ */ jsxs("header", { children: [/* @__PURE__ */ jsx("span", { children: content.language }), /* @__PURE__ */ jsx("strong", { children: step.label })] }), /* @__PURE__ */ jsx("ol", { children: lines.map((line) => {
						const current = line.number === step.currentLine;
						const tokens = tokenizedLines.get(line.number) ?? [{
							text: line.text || " ",
							type: "plain"
						}];
						return /* @__PURE__ */ jsxs("li", {
							className: code_trace_module_css_default.codeLine,
							"data-current": current || void 0,
							"data-visual-id": current ? step.id : void 0,
							"data-visual-state": current ? "current" : elementState(`line-${String(line.number)}`, focus),
							"aria-current": current ? "step" : void 0,
							children: [/* @__PURE__ */ jsxs("span", {
								className: code_trace_module_css_default.lineGutter,
								"aria-hidden": "true",
								children: [current ? /* @__PURE__ */ jsx("i", {
									className: code_trace_module_css_default.stepArrow,
									children: "▶"
								}) : null, line.number]
							}), /* @__PURE__ */ jsx("code", { children: tokens.map((token, tokenIdx) => /* @__PURE__ */ jsx("span", {
								className: token.type !== "plain" ? code_trace_module_css_default[`token_${token.type}`] : void 0,
								children: token.text
							}, tokenIdx)) })]
						}, line.number);
					}) })]
				}), /* @__PURE__ */ jsxs("div", {
					className: code_trace_module_css_default.inspector,
					children: [
						/* @__PURE__ */ jsxs("section", {
							className: code_trace_module_css_default.panel,
							"aria-label": "变量",
							children: [/* @__PURE__ */ jsx("h4", { children: "变量" }), step.variables.length === 0 ? /* @__PURE__ */ jsx("p", {
								className: code_trace_module_css_default.empty,
								children: "暂无局部变量"
							}) : /* @__PURE__ */ jsx("dl", {
								className: code_trace_module_css_default.variables,
								children: step.variables.map((variable) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("dt", { children: [variable.name, variable.type === void 0 ? null : /* @__PURE__ */ jsx("small", { children: variable.type })] }), /* @__PURE__ */ jsx("dd", { children: traceValue(variable.value) })] }, variable.name))
							})]
						}),
						/* @__PURE__ */ jsxs("section", {
							className: code_trace_module_css_default.panel,
							"aria-label": "调用栈",
							children: [/* @__PURE__ */ jsx("h4", { children: "调用栈" }), step.stack.length === 0 ? /* @__PURE__ */ jsx("p", {
								className: code_trace_module_css_default.empty,
								children: "调用栈为空"
							}) : /* @__PURE__ */ jsx("ol", {
								className: code_trace_module_css_default.stack,
								children: step.stack.map((frame, index) => /* @__PURE__ */ jsxs("li", {
									"data-visual-id": frame.id,
									"data-visual-state": elementState(frame.id, focus),
									children: [
										/* @__PURE__ */ jsx("span", { children: index === 0 ? "▶" : String(index + 1) }),
										/* @__PURE__ */ jsx("strong", { children: frame.function }),
										frame.line === void 0 ? null : /* @__PURE__ */ jsxs("small", { children: [":", frame.line] })
									]
								}, frame.id))
							})]
						}),
						/* @__PURE__ */ jsxs("section", {
							className: code_trace_module_css_default.panel,
							"aria-label": "输出",
							children: [/* @__PURE__ */ jsx("h4", { children: "输出" }), /* @__PURE__ */ jsx("pre", {
								className: code_trace_module_css_default.output,
								children: step.output ?? "—"
							})]
						})
					]
				})]
			}),
			step.description === void 0 ? null : /* @__PURE__ */ jsx("p", {
				className: code_trace_module_css_default.description,
				children: step.description
			})
		]
	});
}
//#endregion
//#region \0dsh-css:src/client/visuals/styles/field-2d.module.css.mjs
const css = ".eUEOuq_field{touch-action:pan-y;outline:none;max-width:none;display:block}.eUEOuq_field:focus-visible{outline:2px solid var(--lx-accent);outline-offset:-2px}.eUEOuq_frame{fill:var(--lx-surface-sunken);stroke:var(--lx-border-subtle);vector-effect:non-scaling-stroke}.eUEOuq_heatCell{shape-rendering:geometricprecision}.eUEOuq_contour{fill:none;stroke:#ffffffd9;stroke-width:1.35px;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:.88;filter:drop-shadow(0 0 1px #00000080);vector-effect:non-scaling-stroke}.eUEOuq_vector{stroke:var(--lx-label-primary);stroke-width:1.5px;stroke-linecap:round;stroke-opacity:.76;filter:drop-shadow(0 0 1px #0000004d);vector-effect:non-scaling-stroke}.eUEOuq_arrowHead path{fill:var(--lx-label-primary)}.eUEOuq_zeroVector{fill:var(--lx-label-primary);fill-opacity:.7}.eUEOuq_tick{fill:var(--lx-label-secondary);font-size:var(--lx-text-micro);font-variant-numeric:tabular-nums}.eUEOuq_axisLabel{fill:var(--lx-label-secondary);font-size:var(--lx-text-2xs);font-weight:var(--lx-weight-medium)}.eUEOuq_probe line{stroke:var(--lx-accent);stroke-width:1.2px;stroke-dasharray:4 3;stroke-opacity:.9;filter:drop-shadow(0 0 2px var(--lx-accent));vector-effect:non-scaling-stroke}.eUEOuq_readout{align-items:center;gap:var(--lx-space-sm) var(--lx-space-lg);min-height:36px;padding:var(--lx-space-xs) var(--lx-space-sm);border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-md);background:var(--lx-surface-base);color:var(--lx-label-secondary);font-size:var(--lx-text-xs);flex-wrap:wrap;display:flex}.eUEOuq_readout output{color:var(--lx-label-primary);font-weight:var(--lx-weight-medium);flex:240px}.eUEOuq_legend{align-items:center;gap:var(--lx-space-xs);color:var(--lx-label-tertiary);font-size:var(--lx-text-micro);font-variant-numeric:tabular-nums;grid-template-columns:auto 120px auto;display:grid}.eUEOuq_legend i{border:1px solid var(--lx-border-subtle);border-radius:var(--lx-radius-pill);background:linear-gradient(90deg,#3e4be0,#24db9e,#c3e61a,#ee5f2f);height:10px;box-shadow:0 1px 3px #0000001f}";
const tagId = "@dsh-portable/visual/field-2d.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@dsh-portable/visual";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var field_2d_module_css_default = {
	"arrowHead": "eUEOuq_arrowHead",
	"axisLabel": "eUEOuq_axisLabel",
	"contour": "eUEOuq_contour",
	"field": "eUEOuq_field",
	"frame": "eUEOuq_frame",
	"heatCell": "eUEOuq_heatCell",
	"legend": "eUEOuq_legend",
	"probe": "eUEOuq_probe",
	"readout": "eUEOuq_readout",
	"tick": "eUEOuq_tick",
	"vector": "eUEOuq_vector",
	"zeroVector": "eUEOuq_zeroVector"
};
//#endregion
//#region src/client/visuals/renderers/Field2DRenderer.tsx
/** `field_2d`: scalar heatmaps and contours with optional vector arrows. */
function sampleCount(value) {
	return Math.max(2, Math.min(32, value ?? 15));
}
function scalarGrid(content) {
	const scalar = content.scalar;
	if (scalar?.samples !== void 0) return {
		...scalar.samples,
		values: [...scalar.samples.values]
	};
	if (scalar?.expression === void 0) return void 0;
	const columns = sampleCount(content.xAxis.samples);
	const rows = sampleCount(content.yAxis.samples);
	const evaluate = compileMathExpression(scalar.expression);
	return {
		columns,
		rows,
		values: Array.from({ length: rows }).flatMap((_, row) => Array.from({ length: columns }, (_unused, column) => {
			const x = interpolate(content.xAxis.min, content.xAxis.max, column / Math.max(1, columns - 1));
			const y = interpolate(content.yAxis.min, content.yAxis.max, row / Math.max(1, rows - 1));
			return evaluate({
				x,
				y
			});
		}))
	};
}
function vectorGrid(content) {
	const vector = content.vector;
	if (vector?.samples !== void 0) return {
		...vector.samples,
		u: [...vector.samples.u],
		v: [...vector.samples.v]
	};
	if (vector?.expression === void 0) return void 0;
	const columns = sampleCount(content.xAxis.samples);
	const rows = sampleCount(content.yAxis.samples);
	const u = compileMathExpression(vector.expression.u);
	const v = compileMathExpression(vector.expression.v);
	const bindings = Array.from({ length: rows }).flatMap((_, row) => Array.from({ length: columns }, (_unused, column) => ({
		x: interpolate(content.xAxis.min, content.xAxis.max, column / Math.max(1, columns - 1)),
		y: interpolate(content.yAxis.min, content.yAxis.max, row / Math.max(1, rows - 1))
	})));
	return {
		columns,
		rows,
		u: bindings.map(u),
		v: bindings.map(v)
	};
}
function scaleBounds(content, grid) {
	if (grid === void 0) return void 0;
	const finite = grid.values.filter(Number.isFinite);
	if (finite.length === 0) return void 0;
	let min = content.scalar?.min ?? Math.min(...finite);
	let max = content.scalar?.max ?? Math.max(...finite);
	if (min === max) {
		const padding = Math.max(1, Math.abs(min) * .08);
		min -= padding;
		max += padding;
	}
	return {
		min,
		max
	};
}
function fieldColor(value, min, max) {
	if (!Number.isFinite(value)) return "transparent";
	const ratio = normalizedPosition(value, min, max);
	return `hsl(${String(Math.round(235 - ratio * 220))} 72% ${String(Math.round(52 + Math.abs(ratio - .5) * 8))}%)`;
}
function pointFor(grid, column, row, content, geometry) {
	const xValue = interpolate(content.xAxis.min, content.xAxis.max, column / Math.max(1, grid.columns - 1));
	const yValue = interpolate(content.yAxis.min, content.yAxis.max, row / Math.max(1, grid.rows - 1));
	return {
		x: geometry.left + normalizedPosition(xValue, content.xAxis.min, content.xAxis.max) * geometry.plotWidth,
		y: geometry.top + (1 - normalizedPosition(yValue, content.yAxis.min, content.yAxis.max)) * geometry.plotHeight,
		value: grid.values[row * grid.columns + column] ?? NaN
	};
}
function crossing(left, right, level) {
	if (!Number.isFinite(left.value) || !Number.isFinite(right.value) || left.value === right.value) return void 0;
	if (left.value < level && right.value < level || left.value > level && right.value > level) return void 0;
	const ratio = (level - left.value) / (right.value - left.value);
	if (ratio < 0 || ratio > 1) return void 0;
	return {
		x: left.x + (right.x - left.x) * ratio,
		y: left.y + (right.y - left.y) * ratio
	};
}
function contourPaths(grid, content, geometry, levels) {
	const paths = [];
	for (const level of levels) {
		const commands = [];
		for (let row = 0; row < grid.rows - 1; row += 1) for (let column = 0; column < grid.columns - 1; column += 1) {
			const bottomLeft = pointFor(grid, column, row, content, geometry);
			const bottomRight = pointFor(grid, column + 1, row, content, geometry);
			const topRight = pointFor(grid, column + 1, row + 1, content, geometry);
			const topLeft = pointFor(grid, column, row + 1, content, geometry);
			const intersections = [
				crossing(bottomLeft, bottomRight, level),
				crossing(bottomRight, topRight, level),
				crossing(topRight, topLeft, level),
				crossing(topLeft, bottomLeft, level)
			].filter((point) => point !== void 0);
			if (intersections.length === 2) commands.push(`M${intersections[0].x.toFixed(2)},${intersections[0].y.toFixed(2)}L${intersections[1].x.toFixed(2)},${intersections[1].y.toFixed(2)}`);
			else if (intersections.length === 4) {
				commands.push(`M${intersections[0].x.toFixed(2)},${intersections[0].y.toFixed(2)}L${intersections[1].x.toFixed(2)},${intersections[1].y.toFixed(2)}`);
				commands.push(`M${intersections[2].x.toFixed(2)},${intersections[2].y.toFixed(2)}L${intersections[3].x.toFixed(2)},${intersections[3].y.toFixed(2)}`);
			}
		}
		paths.push(commands.join(""));
	}
	return paths;
}
function nearestScalar(grid, content, probe) {
	if (grid === void 0) return void 0;
	const column = Math.round(normalizedPosition(probe.x, content.xAxis.min, content.xAxis.max) * (grid.columns - 1));
	const row = Math.round(normalizedPosition(probe.y, content.yAxis.min, content.yAxis.max) * (grid.rows - 1));
	const value = grid.values[row * grid.columns + column];
	return value !== void 0 && Number.isFinite(value) ? value : void 0;
}
function nearestVector(grid, content, probe) {
	if (grid === void 0) return void 0;
	const column = Math.round(normalizedPosition(probe.x, content.xAxis.min, content.xAxis.max) * (grid.columns - 1));
	const index = Math.round(normalizedPosition(probe.y, content.yAxis.min, content.yAxis.max) * (grid.rows - 1)) * grid.columns + column;
	const u = grid.u[index];
	const v = grid.v[index];
	return u !== void 0 && v !== void 0 && Number.isFinite(u) && Number.isFinite(v) ? {
		u,
		v
	} : void 0;
}
function Field2DRenderer({ content }) {
	const id = useId();
	const [viewportRef, width] = useContainerWidth();
	const geometry = useMemo(() => chartGeometry(width), [width]);
	const scalar = useMemo(() => scalarGrid(content), [content]);
	const vector = useMemo(() => vectorGrid(content), [content]);
	const bounds = useMemo(() => scaleBounds(content, scalar), [content, scalar]);
	const [probe, setProbe] = useState();
	const xTicks = useMemo(() => ticks(content.xAxis.min, content.xAxis.max), [content.xAxis.max, content.xAxis.min]);
	const yTicks = useMemo(() => ticks(content.yAxis.min, content.yAxis.max), [content.yAxis.max, content.yAxis.min]);
	const levels = bounds === void 0 ? [] : Array.from({ length: 5 }, (_, index) => interpolate(bounds.min, bounds.max, (index + 1) / 6));
	const contours = useMemo(() => scalar === void 0 ? [] : contourPaths(scalar, content, geometry, levels), [
		content,
		geometry,
		levels.join("\0"),
		scalar
	]);
	const vectorMagnitude = vector === void 0 ? 0 : Math.max(0, ...vector.u.map((u, index) => Math.hypot(u, vector.v[index] ?? 0)).filter(Number.isFinite));
	const probeScalar = probe === void 0 ? void 0 : nearestScalar(scalar, content, probe);
	const probeVector = probe === void 0 ? void 0 : nearestVector(vector, content, probe);
	const probeText = probe === void 0 ? "在场中移动指针或使用方向键读取坐标。" : [
		`x ${formatNumber(probe.x)}`,
		`y ${formatNumber(probe.y)}`,
		...probeScalar === void 0 ? [] : [`值 ${formatNumber(probeScalar)}`],
		...probeVector === void 0 ? [] : [`向量 (${formatNumber(probeVector.u)}, ${formatNumber(probeVector.v)})`]
	].join("，");
	const moveProbe = (event) => {
		const rect = event.currentTarget.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		const px = (event.clientX - rect.left) * (geometry.width / rect.width);
		const py = (event.clientY - rect.top) * (geometry.height / rect.height);
		if (px < geometry.left - 4 || px > geometry.left + geometry.plotWidth + 4 || py < geometry.top - 4 || py > geometry.top + geometry.plotHeight + 4) {
			setProbe(void 0);
			return;
		}
		const xRatio = normalizedPosition(px, geometry.left, geometry.left + geometry.plotWidth);
		const yRatio = 1 - normalizedPosition(py, geometry.top, geometry.top + geometry.plotHeight);
		setProbe({
			x: interpolate(content.xAxis.min, content.xAxis.max, xRatio),
			y: interpolate(content.yAxis.min, content.yAxis.max, yRatio)
		});
	};
	const keyProbe = (event) => {
		if (event.key === "Escape") {
			setProbe(void 0);
			return;
		}
		if (![
			"ArrowLeft",
			"ArrowRight",
			"ArrowUp",
			"ArrowDown",
			"Home"
		].includes(event.key)) return;
		event.preventDefault();
		if (event.key === "Home") {
			setProbe({
				x: (content.xAxis.min + content.xAxis.max) / 2,
				y: (content.yAxis.min + content.yAxis.max) / 2
			});
			return;
		}
		const current = probe ?? {
			x: (content.xAxis.min + content.xAxis.max) / 2,
			y: (content.yAxis.min + content.yAxis.max) / 2
		};
		const columns = Math.max(2, scalar?.columns ?? vector?.columns ?? sampleCount(content.xAxis.samples));
		const rows = Math.max(2, scalar?.rows ?? vector?.rows ?? sampleCount(content.yAxis.samples));
		const dx = (content.xAxis.max - content.xAxis.min) / (columns - 1);
		const dy = (content.yAxis.max - content.yAxis.min) / (rows - 1);
		setProbe({
			x: Math.max(content.xAxis.min, Math.min(content.xAxis.max, current.x + (event.key === "ArrowRight" ? dx : event.key === "ArrowLeft" ? -dx : 0))),
			y: Math.max(content.yAxis.min, Math.min(content.yAxis.max, current.y + (event.key === "ArrowUp" ? dy : event.key === "ArrowDown" ? -dy : 0)))
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [/* @__PURE__ */ jsx(FigureViewport, {
			viewportRef,
			children: /* @__PURE__ */ jsxs("svg", {
				className: field_2d_module_css_default.field,
				width: geometry.width,
				height: geometry.height,
				viewBox: `0 0 ${String(geometry.width)} ${String(geometry.height)}`,
				role: "img",
				tabIndex: 0,
				"aria-label": probeText,
				onPointerMove: moveProbe,
				onKeyDown: keyProbe,
				children: [
					/* @__PURE__ */ jsxs("defs", { children: [/* @__PURE__ */ jsx("clipPath", {
						id: `${id}-field-clip`,
						children: /* @__PURE__ */ jsx("rect", {
							x: geometry.left,
							y: geometry.top,
							width: geometry.plotWidth,
							height: geometry.plotHeight
						})
					}), /* @__PURE__ */ jsx("marker", {
						id: `${id}-field-arrow`,
						className: field_2d_module_css_default.arrowHead,
						markerWidth: "7",
						markerHeight: "7",
						refX: "6",
						refY: "3.5",
						orient: "auto",
						markerUnits: "strokeWidth",
						children: /* @__PURE__ */ jsx("path", { d: "M0,0 L7,3.5 L0,7 z" })
					})] }),
					/* @__PURE__ */ jsx("rect", {
						className: field_2d_module_css_default.frame,
						x: geometry.left,
						y: geometry.top,
						width: geometry.plotWidth,
						height: geometry.plotHeight
					}),
					/* @__PURE__ */ jsxs("g", {
						clipPath: `url(#${id}-field-clip)`,
						children: [
							scalar === void 0 || bounds === void 0 ? null : scalar.values.map((value, index) => {
								const column = index % scalar.columns;
								const row = Math.floor(index / scalar.columns);
								const cellWidth = geometry.plotWidth / scalar.columns;
								const cellHeight = geometry.plotHeight / scalar.rows;
								return /* @__PURE__ */ jsx("rect", {
									className: field_2d_module_css_default.heatCell,
									x: geometry.left + column * cellWidth,
									y: geometry.top + (scalar.rows - row - 1) * cellHeight,
									width: cellWidth + .5,
									height: cellHeight + .5,
									fill: fieldColor(value, bounds.min, bounds.max)
								}, `heat-${String(index)}`);
							}),
							contours.map((path, index) => /* @__PURE__ */ jsx("path", {
								className: field_2d_module_css_default.contour,
								d: path
							}, `contour-${String(index)}`)),
							vector === void 0 ? null : vector.u.map((u, index) => {
								const v = vector.v[index] ?? NaN;
								if (!Number.isFinite(u) || !Number.isFinite(v)) return null;
								const column = index % vector.columns;
								const row = Math.floor(index / vector.columns);
								const x = geometry.left + column / Math.max(1, vector.columns - 1) * geometry.plotWidth;
								const y = geometry.top + (1 - row / Math.max(1, vector.rows - 1)) * geometry.plotHeight;
								const magnitude = Math.hypot(u, v);
								if (magnitude === 0 || vectorMagnitude === 0) return /* @__PURE__ */ jsx("circle", {
									className: field_2d_module_css_default.zeroVector,
									cx: x,
									cy: y,
									r: "1.8"
								}, `vector-${String(index)}`);
								const cell = Math.min(geometry.plotWidth / Math.max(2, vector.columns), geometry.plotHeight / Math.max(2, vector.rows));
								const length = Math.max(4, magnitude / vectorMagnitude * cell * .56);
								const dx = u / magnitude * length / 2;
								const dy = -(v / magnitude) * length / 2;
								return /* @__PURE__ */ jsx("line", {
									className: field_2d_module_css_default.vector,
									x1: x - dx,
									y1: y - dy,
									x2: x + dx,
									y2: y + dy,
									markerEnd: `url(#${id}-field-arrow)`
								}, `vector-${String(index)}`);
							}),
							probe === void 0 ? null : /* @__PURE__ */ jsxs("g", {
								className: field_2d_module_css_default.probe,
								children: [/* @__PURE__ */ jsx("line", {
									x1: geometry.left,
									x2: geometry.left + geometry.plotWidth,
									y1: geometry.top + (1 - normalizedPosition(probe.y, content.yAxis.min, content.yAxis.max)) * geometry.plotHeight,
									y2: geometry.top + (1 - normalizedPosition(probe.y, content.yAxis.min, content.yAxis.max)) * geometry.plotHeight
								}), /* @__PURE__ */ jsx("line", {
									y1: geometry.top,
									y2: geometry.top + geometry.plotHeight,
									x1: geometry.left + normalizedPosition(probe.x, content.xAxis.min, content.xAxis.max) * geometry.plotWidth,
									x2: geometry.left + normalizedPosition(probe.x, content.xAxis.min, content.xAxis.max) * geometry.plotWidth
								})]
							})
						]
					}),
					xTicks.map((value) => /* @__PURE__ */ jsx("text", {
						className: field_2d_module_css_default.tick,
						x: geometry.left + normalizedPosition(value, content.xAxis.min, content.xAxis.max) * geometry.plotWidth,
						y: geometry.top + geometry.plotHeight + 19,
						textAnchor: "middle",
						children: formatNumber(value)
					}, `x-${String(value)}`)),
					yTicks.map((value) => /* @__PURE__ */ jsx("text", {
						className: field_2d_module_css_default.tick,
						x: geometry.left - 9,
						y: geometry.top + (1 - normalizedPosition(value, content.yAxis.min, content.yAxis.max)) * geometry.plotHeight,
						textAnchor: "end",
						dominantBaseline: "middle",
						children: formatNumber(value)
					}, `y-${String(value)}`)),
					content.xAxis.label === void 0 ? null : /* @__PURE__ */ jsx("text", {
						className: field_2d_module_css_default.axisLabel,
						x: geometry.left + geometry.plotWidth / 2,
						y: geometry.height - 8,
						textAnchor: "middle",
						children: content.xAxis.label
					}),
					content.yAxis.label === void 0 ? null : /* @__PURE__ */ jsx("text", {
						className: field_2d_module_css_default.axisLabel,
						x: 13,
						y: geometry.top + geometry.plotHeight / 2,
						textAnchor: "middle",
						transform: `rotate(-90 13 ${String(geometry.top + geometry.plotHeight / 2)})`,
						children: content.yAxis.label
					})
				]
			})
		}), /* @__PURE__ */ jsxs("div", {
			className: field_2d_module_css_default.readout,
			children: [
				bounds === void 0 ? null : /* @__PURE__ */ jsxs("div", {
					className: field_2d_module_css_default.legend,
					children: [
						/* @__PURE__ */ jsx("span", { children: formatNumber(bounds.min) }),
						/* @__PURE__ */ jsx("i", { "aria-hidden": "true" }),
						/* @__PURE__ */ jsx("span", { children: formatNumber(bounds.max) })
					]
				}),
				vector === void 0 ? null : /* @__PURE__ */ jsxs("span", { children: ["最大向量模：", formatNumber(vectorMagnitude)] }),
				/* @__PURE__ */ jsx("output", {
					role: "status",
					"aria-live": "polite",
					children: probeText
				})
			]
		})]
	});
}
//#endregion
//#region src/client/visuals/renderers/CausalLoopRenderer.tsx
/** `causal_loop`: signed, delayed links and named reinforcing/balancing loops. */
function computeVariableBox(label) {
	const wrapped = wrapLabel(label, {
		fontSize: 13,
		maxWidth: 124,
		maxLines: 2
	});
	const maxLineWidth = Math.max(...wrapped.lines.map((line) => measureText(line, 13)), 0);
	return {
		width: Math.max(104, Math.min(168, maxLineWidth + 28)),
		height: wrapped.lines.length > 1 ? 52 : 40,
		lines: wrapped.lines
	};
}
function variablePosition(index, count, width, height) {
	if (count <= 1) return {
		x: width / 2,
		y: height / 2 + 10
	};
	const radiusX = Math.min(width * .38, Math.max(145, count * 32));
	const radiusY = Math.min(height * .31, Math.max(90, count * 24));
	const angle = -Math.PI / 2 + index * (Math.PI * 2 / count);
	return {
		x: width / 2 + Math.cos(angle) * radiusX,
		y: height / 2 + 10 + Math.sin(angle) * radiusY
	};
}
function boxBoundary(from, to, box) {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const scale = 1 / Math.max(Math.abs(dx) / (box.width / 2), Math.abs(dy) / (box.height / 2), 1);
	return {
		x: from.x + dx * scale,
		y: from.y + dy * scale
	};
}
function polaritySymbol(polarity) {
	return polarity === "negative" || polarity === "-" ? "−" : "+";
}
function loopKind(type) {
	return type === "balancing" || type === "B" ? "balancing" : "reinforcing";
}
function linkDetail(link, variables) {
	const from = variables.get(link.from)?.label ?? link.from;
	const to = variables.get(link.to)?.label ?? link.to;
	const delay = link.delay === void 0 ? void 0 : `Delay: ${link.delay}`;
	return [
		from,
		`→ ${to}`,
		link.polarity,
		delay,
		link.detail
	].filter((part) => part !== void 0 && part.length > 0).join(" · ");
}
function CausalLoopRenderer({ content, focus }) {
	const diagramId = useId();
	const [viewportRef, containerWidth] = useContainerWidth();
	const [selected, setSelected] = useState();
	const variables = content.variables;
	const links = content.links;
	const loops = content.loops ?? [];
	const variableById = useMemo(() => new Map(variables.map((variable) => [variable.id, variable])), [variables]);
	const boxByVarId = useMemo(() => new Map(variables.map((variable) => [variable.id, computeVariableBox(variable.label)])), [variables]);
	const width = Math.max(560, containerWidth, 36 + loops.length * 168);
	const height = Math.max(340, 170 + Math.min(170, Math.max(100, variables.length * 24)) * 2);
	const positions = useMemo(() => new Map(variables.map((variable, index) => [variable.id, variablePosition(index, variables.length, width, height)])), [
		height,
		variables,
		width
	]);
	const linkById = useMemo(() => new Map(links.map((link) => [link.id, link])), [links]);
	const roving = useRovingFocus(useMemo(() => [
		...loops.map((loop) => loop.id),
		...variables.map((variable) => variable.id),
		...links.map((link) => link.id)
	], [
		links,
		loops,
		variables
	]));
	const loopBoxes = useMemo(() => new Map(loops.map((loop, loopIndex) => {
		const loopVars = loop.linkIds.flatMap((linkId) => {
			const link = linkById.get(linkId);
			return link ? [link.from, link.to] : [];
		});
		const pts = [...new Set(loopVars)].map((id) => positions.get(id)).filter(Boolean);
		const cx = pts.length > 0 ? pts.reduce((sum, p) => sum + p.x, 0) / pts.length : width / 2 + (loopIndex - (loops.length - 1) / 2) * 140;
		const cy = pts.length > 0 ? pts.reduce((sum, p) => sum + p.y, 0) / pts.length : height / 2 + 10;
		const labelText = `${loopKind(loop.type) === "reinforcing" ? "↻ R" : "↺ B"} · ${loop.label}`;
		const labelWidth = Math.max(114, measureText(labelText, 12) + 26);
		return [loop.id, {
			cx,
			cy,
			labelText,
			labelWidth
		}];
	})), [
		height,
		linkById,
		loops,
		positions,
		width
	]);
	const selectVariable = (variable) => setSelected({
		id: variable.id,
		label: variable.label,
		detail: variable.detail,
		kind: "Variable",
		tone: toneAt(variable.tone)
	});
	const selectLink = (link) => setSelected({
		id: link.id,
		label: link.label ?? `${polaritySymbol(link.polarity)} ${variableById.get(link.to)?.label ?? link.to}`,
		detail: linkDetail(link, variableById),
		kind: "Causal link",
		tone: toneAt(link.tone)
	});
	const selectLoop = (loop) => {
		const kind = loopKind(loop.type);
		const linksInLoop = loop.linkIds.map((id) => linkById.get(id)?.label ?? id).join(" → ");
		setSelected({
			id: loop.id,
			label: `${kind === "reinforcing" ? "R" : "B"} · ${loop.label}`,
			detail: loop.detail ?? linksInLoop,
			kind: kind === "reinforcing" ? "Reinforcing loop" : "Balancing loop",
			tone: toneAt(loop.tone)
		});
	};
	const summary = `Causal loop diagram with ${variables.length} variables, ${links.length} signed links and ${loops.length} named loops.`;
	const legendStates = useMemo(() => focus.active ? [
		...variables,
		...links,
		...loops
	].map((item) => elementState(item.id, focus)) : [], [
		focus,
		links,
		loops,
		variables
	]);
	const placedCausalLabels = [...[...loopBoxes.values()].map((box) => ({
		x: box.cx,
		y: box.cy,
		width: box.labelWidth,
		height: 32
	})), ...variables.flatMap((variable) => {
		const position = positions.get(variable.id);
		const box = boxByVarId.get(variable.id);
		return position === void 0 || box === void 0 ? [] : [{
			x: position.x,
			y: position.y,
			width: box.width + 10,
			height: box.height + 10
		}];
	})];
	return /* @__PURE__ */ jsxs("div", {
		className: shell_module_css_default.rendererStack,
		children: [
			/* @__PURE__ */ jsx("div", {
				className: process_module_css_default.processViewport,
				ref: viewportRef,
				children: /* @__PURE__ */ jsxs("svg", {
					ref: roving.containerRef,
					className: process_module_css_default.processSvg,
					width,
					height,
					viewBox: `0 0 ${width} ${height}`,
					role: "group",
					"aria-label": summary,
					children: [
						/* @__PURE__ */ jsx("defs", { children: DEFAULT_TONES.map((tone) => /* @__PURE__ */ jsx("marker", {
							id: `${diagramId}-${tone}`,
							className: process_module_css_default.causalArrow,
							"data-tone": tone,
							markerWidth: "8",
							markerHeight: "8",
							refX: "7",
							refY: "4",
							orient: "auto",
							markerUnits: "strokeWidth",
							children: /* @__PURE__ */ jsx("path", { d: "M0,0 L8,4 L0,8 z" })
						}, tone)) }),
						/* @__PURE__ */ jsx("g", { children: loops.map((loop, index) => {
							const kind = loopKind(loop.type);
							const tone = toneAt(loop.tone, index);
							const box = loopBoxes.get(loop.id) ?? {
								cx: width / 2,
								cy: height / 2 + 10,
								labelText: loop.label,
								labelWidth: 120
							};
							const isSelected = selected?.id === loop.id;
							const state = focus.active ? elementState(loop.id, focus, loop.linkIds) : isSelected ? "selected" : "overview";
							return /* @__PURE__ */ jsx("g", {
								className: process_module_css_default.causalLoop,
								"data-tone": tone,
								"data-visual-id": loop.id,
								"data-visual-state": state,
								role: "button",
								"aria-label": `${kind === "reinforcing" ? "Reinforcing" : "Balancing"} loop: ${loop.label}`,
								onClick: () => selectLoop(loop),
								...roving.itemProps(loop.id, () => selectLoop(loop)),
								transform: `translate(${box.cx} ${box.cy})`,
								children: /* @__PURE__ */ jsxs("g", {
									className: process_module_css_default.causalLoopBadge,
									"data-loop-kind": kind,
									children: [/* @__PURE__ */ jsx("rect", {
										x: -box.labelWidth / 2,
										y: "-16",
										width: box.labelWidth,
										height: "32",
										rx: "16"
									}), /* @__PURE__ */ jsx("text", {
										x: "0",
										y: "1",
										textAnchor: "middle",
										dominantBaseline: "middle",
										children: box.labelText
									})]
								})
							}, loop.id);
						}) }),
						/* @__PURE__ */ jsx("g", { children: links.map((link, index) => {
							const from = positions.get(link.from);
							const to = positions.get(link.to);
							const fromBox = boxByVarId.get(link.from) ?? {
								width: 120,
								height: 42,
								lines: []
							};
							const toBox = boxByVarId.get(link.to) ?? {
								width: 120,
								height: 42,
								lines: []
							};
							if (from === void 0 || to === void 0) return null;
							const start = boxBoundary(from, to, fromBox);
							const end = boxBoundary(to, from, toBox);
							const midX = (start.x + end.x) / 2;
							const midY = (start.y + end.y) / 2;
							const curve = links.some((other) => other.id !== link.id && other.from === link.to && other.to === link.from) ? 38 : (index % 3 - 1) * 16;
							const dx = end.x - start.x;
							const dy = end.y - start.y;
							const length = Math.max(1, Math.hypot(dx, dy));
							const normalX = -dy / length;
							const normalY = dx / length;
							const controlX = midX + normalX * curve;
							const controlY = midY + normalY * curve;
							const path = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
							const tone = toneAt(link.tone, index);
							const isLinkInSelectedLoop = selected?.id !== void 0 && loops.some((l) => l.id === selected.id && l.linkIds.includes(link.id));
							const state = focus.active ? elementState(link.id, focus, [link.from, link.to]) : selected?.id === link.id || isLinkInSelectedLoop ? "selected" : "overview";
							const delay = link.delay === void 0 ? void 0 : link.delay > 0 ? `+${link.delay}` : "delay";
							const tMid = .5;
							const midCurveX = .25 * start.x + 1 * tMid * controlX + tMid * tMid * end.x;
							const midCurveY = .25 * start.y + 1 * tMid * controlY + tMid * tMid * end.y;
							const signX = midCurveX + normalX * 12;
							const signY = midCurveY + normalY * 12;
							const annotationLane = index % 5 - 2;
							const labelLines = link.label === void 0 ? [] : wrapLabel(link.label, {
								fontSize: 11,
								maxWidth: 150,
								maxLines: 2
							}).lines;
							const labelWidth = labelLines.length === 0 ? 0 : Math.max(...labelLines.map((line) => measureText(line, 11))) + 12;
							const labelHeight = labelLines.length > 1 ? 30 : 18;
							const baseLabelX = signX + normalX * 28;
							const baseLabelY = signY + normalY * 28 + annotationLane * 24;
							let labelX = baseLabelX;
							let labelY = baseLabelY;
							if (link.label !== void 0) {
								for (let attempt = 0; attempt < 8; attempt += 1) {
									const candidateY = baseLabelY + (attempt === 0 ? 0 : Math.ceil(attempt / 2) * 30 * (attempt % 2 === 1 ? 1 : -1));
									if (!placedCausalLabels.some((previous) => Math.abs(previous.x - baseLabelX) < (previous.width + labelWidth) / 2 + 8 && Math.abs(previous.y - candidateY) < (previous.height + labelHeight) / 2 + 6)) {
										labelX = baseLabelX;
										labelY = candidateY;
										break;
									}
								}
								placedCausalLabels.push({
									x: labelX,
									y: labelY,
									width: labelWidth,
									height: labelHeight
								});
							}
							return /* @__PURE__ */ jsxs("g", {
								className: process_module_css_default.causalLink,
								"data-tone": tone,
								"data-visual-id": link.id,
								"data-visual-state": state,
								role: "button",
								"aria-label": `${polaritySymbol(link.polarity)} link: ${linkDetail(link, variableById)}`,
								onClick: () => selectLink(link),
								...roving.itemProps(link.id, () => selectLink(link)),
								children: [
									/* @__PURE__ */ jsx("path", {
										className: process_module_css_default.causalLinkPath,
										d: path,
										markerEnd: `url(#${diagramId}-${tone})`
									}),
									/* @__PURE__ */ jsx("path", {
										className: process_module_css_default.causalLinkHit,
										d: path
									}),
									/* @__PURE__ */ jsxs("g", {
										className: process_module_css_default.causalSign,
										transform: `translate(${signX + normalX * annotationLane * 14} ${signY + normalY * annotationLane * 14})`,
										children: [/* @__PURE__ */ jsx("rect", {
											x: "-12",
											y: "-12",
											width: "24",
											height: "24",
											rx: "12"
										}), /* @__PURE__ */ jsx("text", {
											x: "0",
											y: "1",
											textAnchor: "middle",
											dominantBaseline: "middle",
											children: polaritySymbol(link.polarity)
										})]
									}),
									delay === void 0 ? null : /* @__PURE__ */ jsxs("g", {
										className: process_module_css_default.causalDelay,
										transform: `translate(${signX + 34 + normalX * annotationLane * 10} ${signY - 25 + normalY * annotationLane * 10})`,
										children: [/* @__PURE__ */ jsx("rect", {
											x: "-18",
											y: "-11",
											width: "36",
											height: "22",
											rx: "8"
										}), /* @__PURE__ */ jsxs("text", {
											x: "0",
											y: "1",
											textAnchor: "middle",
											dominantBaseline: "middle",
											children: ["⏱ ", delay]
										})]
									}),
									link.label === void 0 ? null : /* @__PURE__ */ jsxs("g", {
										className: process_module_css_default.causalLabelGroup,
										transform: `translate(${labelX} ${labelY})`,
										children: [/* @__PURE__ */ jsx("rect", {
											x: -labelWidth / 2,
											y: -labelHeight / 2,
											width: labelWidth,
											height: labelHeight,
											rx: "4",
											className: process_module_css_default.causalLabelBg
										}), /* @__PURE__ */ jsx("text", {
											className: process_module_css_default.causalLinkLabel,
											textAnchor: "middle",
											dominantBaseline: "middle",
											children: labelLines.map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
												x: "0",
												dy: lineIndex === 0 ? labelLines.length > 1 ? "-0.55em" : "0.34em" : "1.1em",
												children: line
											}, lineIndex))
										})]
									}),
									link.label === void 0 ? null : /* @__PURE__ */ jsx("title", { children: link.label })
								]
							}, link.id);
						}) }),
						/* @__PURE__ */ jsx("g", { children: variables.map((variable, index) => {
							const position = positions.get(variable.id);
							if (position === void 0) return null;
							const tone = toneAt(variable.tone, index);
							const box = boxByVarId.get(variable.id) ?? {
								width: 120,
								height: 42,
								lines: [variable.label]
							};
							const isVarInSelectedLoop = selected?.id !== void 0 && loops.some((l) => l.id === selected.id && l.linkIds.some((lid) => {
								const link = linkById.get(lid);
								return link && (link.from === variable.id || link.to === variable.id);
							}));
							const state = focus.active ? elementState(variable.id, focus) : selected?.id === variable.id || isVarInSelectedLoop ? "selected" : "overview";
							return /* @__PURE__ */ jsxs("g", {
								className: process_module_css_default.causalVariable,
								transform: `translate(${position.x} ${position.y})`,
								"data-tone": tone,
								"data-visual-id": variable.id,
								"data-visual-state": state,
								role: "button",
								"aria-label": `Variable: ${variable.label}`,
								onClick: () => selectVariable(variable),
								...roving.itemProps(variable.id, () => selectVariable(variable)),
								children: [
									/* @__PURE__ */ jsx("rect", {
										className: process_module_css_default.causalVariableShape,
										x: -box.width / 2,
										y: -box.height / 2,
										width: box.width,
										height: box.height,
										rx: "12"
									}),
									/* @__PURE__ */ jsx("text", {
										className: process_module_css_default.causalVariableLabel,
										textAnchor: "middle",
										children: box.lines.map((line, lineIndex) => /* @__PURE__ */ jsx("tspan", {
											x: "0",
											dy: lineIndex === 0 ? box.lines.length > 1 ? "-0.28em" : "0.34em" : "1.25em",
											children: line
										}, lineIndex))
									}),
									variable.detail === void 0 ? null : /* @__PURE__ */ jsx("title", { children: variable.detail })
								]
							}, variable.id);
						}) })
					]
				})
			}),
			/* @__PURE__ */ jsx(StateLegend, { states: legendStates }),
			/* @__PURE__ */ jsxs("div", {
				className: shell_module_css_default.srOnly,
				children: [/* @__PURE__ */ jsx("p", { children: summary }), /* @__PURE__ */ jsxs("ul", { children: [
					variables.map((variable) => /* @__PURE__ */ jsxs("li", { children: [variable.label, variable.detail === void 0 ? "" : `: ${variable.detail}`] }, variable.id)),
					links.map((link) => /* @__PURE__ */ jsx("li", { children: linkDetail(link, variableById) }, link.id)),
					loops.map((loop) => /* @__PURE__ */ jsxs("li", { children: [
						loopKind(loop.type) === "reinforcing" ? "R" : "B",
						" · ",
						loop.label
					] }, loop.id))
				] })]
			}),
			/* @__PURE__ */ jsx(SelectionSurface, {
				hint: "Select a variable, signed link or loop to inspect the feedback relationship.",
				selected,
				onClose: () => setSelected(void 0)
			})
		]
	});
}
//#endregion
//#region src/client/visuals/index.tsx
/**
* The visual shell: one card, one heading, one optional sequence controller,
* one error boundary, and whichever native renderer the payload names.
*
* The shell owns everything that is not renderer-specific, including the
* emphasis a sequence frame produces. Frames earlier than the current one
* contribute a `visited` tier, so the controller and the figure agree about
* what has already been covered without each renderer re-deriving it.
*/
const VISUAL_RENDERER_REGISTRY = {
	plot: PlotRenderer,
	node_link: NodeLinkRenderer,
	scene_2d: Scene2DRenderer,
	relation: RelationRenderer,
	timeline: TimelineRenderer,
	formula_steps: FormulaStepsRenderer,
	study_map: StudyMapRenderer,
	recall_deck: RecallDeckRenderer,
	data_table: DataTableRenderer,
	state_transition: StateTransitionRenderer,
	sequence_buffer: SequenceBufferRenderer,
	sequence_diagram: SequenceDiagramRenderer,
	code_trace: CodeTraceRenderer,
	field_2d: Field2DRenderer,
	causal_loop: CausalLoopRenderer
};
function RegisteredVisual({ content, focus, storageKey, onRecallStatusChange }) {
	const Renderer = VISUAL_RENDERER_REGISTRY[content.kind];
	return /* @__PURE__ */ jsx(Renderer, {
		content,
		focus,
		storageKey,
		onRecallStatusChange
	});
}
function VisualView({ visual, storageKey, labels: suppliedLabels, onRecallStatusChange }) {
	const titleId = useId();
	const descriptionId = useId();
	const initialFrameIndex = visual.sequence === void 0 ? 0 : Math.max(0, visual.sequence.frames.findIndex((frame) => frame.id === visual.sequence?.initialFrameId));
	const [frameIndex, setFrameIndex] = useState(initialFrameIndex);
	const labels = useMemo(() => ({
		...DEFAULT_VISUAL_LABELS,
		...suppliedLabels
	}), [suppliedLabels]);
	const focus = useMemo(() => {
		const frames = visual.sequence?.frames;
		if (frames === void 0) return visualFocus([]);
		return visualFocus(frames[frameIndex]?.focusIds ?? [], frames.slice(0, frameIndex).flatMap((frame) => frame.focusIds));
	}, [frameIndex, visual.sequence]);
	useEffect(() => setFrameIndex(initialFrameIndex), [initialFrameIndex, visual.sequence]);
	return /* @__PURE__ */ jsx(VisualLabelsProvider, {
		value: labels,
		children: /* @__PURE__ */ jsxs("section", {
			className: shell_module_css_default.visualShell,
			...visualScope,
			"data-learning-visual": visual.content.kind,
			"data-render-state": "ready",
			"aria-labelledby": titleId,
			"aria-describedby": visual.description === void 0 ? void 0 : descriptionId,
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: shell_module_css_default.visualHeader,
					children: [
						/* @__PURE__ */ jsx("span", {
							className: shell_module_css_default.visualEyebrow,
							"aria-hidden": "true",
							children: labels.eyebrow
						}),
						/* @__PURE__ */ jsx("h3", {
							id: titleId,
							children: visual.title
						}),
						visual.description === void 0 ? null : /* @__PURE__ */ jsx("p", {
							id: descriptionId,
							children: visual.description
						})
					]
				}),
				visual.sequence === void 0 || visual.sequence.frames.length === 0 ? null : /* @__PURE__ */ jsx(SequenceController, {
					sequence: visual.sequence,
					frameIndex,
					onFrameChange: setFrameIndex
				}),
				/* @__PURE__ */ jsx(VisualErrorBoundary, {
					fallbackMarkdown: visual.fallbackMarkdown,
					labels,
					children: /* @__PURE__ */ jsx(RegisteredVisual, {
						content: visual.content,
						focus,
						storageKey,
						onRecallStatusChange
					})
				}, `${visual.title}:${visual.content.kind}`)
			]
		})
	});
}
//#endregion
export { DEFAULT_MARKDOWN_LABELS, DEFAULT_VISUAL_LABELS, LocalizedMarkdown, MarkdownLabelsProvider, VisualView, labelTemplate, markdownLabelsOf, visualScope };
