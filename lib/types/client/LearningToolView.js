import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives';
import { useEffect } from 'react';
import { parseLearningActivity, parseLearningActivityV2, parseLearningResponse, parseLearningResponseV2, ACTIVITY_PROTOCOL_V2, RESPONSE_PROTOCOL_V2, } from "../protocol.js";
import { RoundActivity } from "./RoundActivity.js";
import { emitLearningCallLifecycle } from "./lifecycle.js";
import css from './LearningActivity.module.css';
function activityOf(block) {
    const raw = 'kind' in block ? block.call?.argsRaw : block.argsRaw;
    if (raw === undefined || raw === '')
        return undefined;
    try {
        const parsed = JSON.parse(raw);
        return parsed.protocol === ACTIVITY_PROTOCOL_V2
            ? parseLearningActivityV2(parsed)
            : parseLearningActivity(parsed);
    }
    catch {
        return undefined;
    }
}
function responseOf(block) {
    if (!('kind' in block))
        return undefined;
    const text = block.content.filter(item => item.type === 'text').map(item => item.text).join('');
    if (text === '')
        return undefined;
    try {
        const parsed = JSON.parse(text);
        return parsed.protocol === RESPONSE_PROTOCOL_V2
            ? parseLearningResponseV2(parsed)
            : parseLearningResponse(parsed);
    }
    catch {
        return undefined;
    }
}
function ActivityOutline({ activity }) {
    switch (activity.kind) {
        case 'parameter_explorer':
            return (_jsxs("div", { className: css.replayOutline, children: [_jsx("ul", { children: activity.payload.parameters.map(item => _jsxs("li", { children: [item.label, ": ", item.min, "\u2013", item.max] }, item.id)) }), _jsx("ul", { children: activity.payload.curves.map(item => _jsx("li", { children: item.label }, item.id)) })] }));
        case 'process_stepper':
            return (_jsx("ol", { className: css.replaySteps, children: activity.payload.steps.map(step => (_jsxs("li", { children: [_jsx("strong", { children: step.title }), _jsx(MarkdownText, { text: step.content })] }, step.id))) }));
        case 'structure_compare':
            return (_jsx("div", { className: css.replayCompare, children: [activity.payload.left, activity.payload.right].map(side => (_jsxs("section", { children: [_jsx("strong", { children: side.title }), _jsx("ul", { children: side.items.map(item => _jsx("li", { children: item.label }, item.id)) })] }, side.title))) }));
    }
}
export function LearningToolView({ block, inspect, t }) {
    const activity = activityOf(block);
    const done = 'kind' in block;
    const response = responseOf(block);
    const callId = block.callId;
    const raw = 'kind' in block ? block.call?.argsRaw : block.argsRaw;
    useEffect(() => {
        if (done || raw === undefined || raw === '')
            return;
        if (activity === undefined)
            emitLearningCallLifecycle('learning.call.stream_started', { callId });
        else
            emitLearningCallLifecycle('learning.call.args_completed', {
                callId,
                phase: activity.protocol === ACTIVITY_PROTOCOL_V2 ? activity.phase : undefined,
                seq: activity.protocol === ACTIVITY_PROTOCOL_V2 ? activity.seq : undefined,
            });
    }, [activity, callId, done, raw]);
    if (activity === undefined) {
        if (!done) {
            return (_jsxs("div", { className: css.toolRow, "data-state": "running", role: "status", children: [_jsx("span", { children: _jsx("small", { children: t('waiting') }) }), _jsx("span", { className: css.runningDot, "aria-hidden": "true" })] }));
        }
        return _jsx("div", { className: css.toolRow, "data-state": done ? 'done' : 'running', children: t('invalidActivity') });
    }
    if (activity.protocol === ACTIVITY_PROTOCOL_V2) {
        if (!done) {
            return (_jsxs("button", { className: css.toolRow, "data-state": "running", type: "button", onClick: inspect, children: [_jsxs("span", { children: [_jsx("strong", { children: activity.focus.title }), _jsx("small", { children: t('waiting') })] }), _jsx("span", { className: css.runningDot, "aria-hidden": "true" })] }));
        }
        const v2Response = response?.protocol === RESPONSE_PROTOCOL_V2 ? response : undefined;
        const initialAnswer = v2Response?.phase === 'question' ? v2Response.answer : undefined;
        return (_jsx("div", { className: css.completedRound, "data-learning-result": v2Response?.action ?? 'unknown', children: _jsx(RoundActivity, { activity: activity, completed: true, initialAnswer: initialAnswer, t: t }) }));
    }
    if (!done) {
        return (_jsxs("button", { className: css.toolRow, "data-state": "running", type: "button", onClick: inspect, children: [_jsxs("span", { children: [_jsx("strong", { children: activity.title }), _jsx("small", { children: t('waiting') })] }), _jsx("span", { className: css.runningDot, "aria-hidden": "true" })] }));
    }
    const status = response?.action === 'submit' ? t('completed')
        : response?.action === 'skip' ? t('skipped')
            : response?.action === 'cancel' ? t('cancelled') : t('noResponse');
    return (_jsxs("details", { className: css.replay, children: [_jsx("summary", { children: _jsxs("span", { children: [_jsx("strong", { children: activity.title }), _jsx("small", { children: status })] }) }), _jsxs("div", { className: css.replayBody, children: [_jsx("p", { children: activity.objective }), _jsx(ActivityOutline, { activity: activity }), _jsxs("details", { children: [_jsx("summary", { children: t('fallback') }), _jsx(MarkdownText, { text: activity.fallbackMarkdown })] }), _jsxs("section", { className: css.response, children: [_jsx("strong", { children: t('response') }), response === undefined ? _jsx("p", { children: t('noResponse') }) : _jsx("pre", { children: JSON.stringify(response, null, 2) })] })] })] }));
}
//# sourceMappingURL=LearningToolView.js.map