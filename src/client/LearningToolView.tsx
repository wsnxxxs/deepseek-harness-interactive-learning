import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client'
import type { ToolCallBlock } from '@deepseek-ai/dsh-client-runtime/client'
import { useEffect } from 'react'
import {
  parseLearningActivity,
  parseLearningActivityV2,
  parseLearningResponse,
  parseLearningResponseV2,
  ACTIVITY_PROTOCOL_V2,
  RESPONSE_PROTOCOL_V2,
  type LearningActivityV1,
  type LearningActivityV2,
  type LearningResponseV1,
  type LearningResponseV2,
} from '../protocol.ts'
import { RoundActivity } from './RoundActivity.tsx'
import { emitLearningCallLifecycle } from './lifecycle.ts'
import css from './LearningActivity.module.css'

type LearningToolViewProps = ToolCallViewProps & PropsLocale<'interactive-learning'>

function activityOf(block: ToolCallBlock): LearningActivityV1 | LearningActivityV2 | undefined {
  const raw = 'kind' in block ? block.call?.argsRaw : block.argsRaw
  if (raw === undefined || raw === '') return undefined
  try {
    const parsed = JSON.parse(raw) as { protocol?: unknown }
    return parsed.protocol === ACTIVITY_PROTOCOL_V2
      ? parseLearningActivityV2(parsed)
      : parseLearningActivity(parsed)
  } catch {
    return undefined
  }
}

function responseOf(block: ToolCallBlock): LearningResponseV1 | LearningResponseV2 | undefined {
  if (!('kind' in block)) return undefined
  const text = block.content.filter(item => item.type === 'text').map(item => item.text).join('')
  if (text === '') return undefined
  try {
    const parsed = JSON.parse(text) as { protocol?: unknown }
    return parsed.protocol === RESPONSE_PROTOCOL_V2
      ? parseLearningResponseV2(parsed)
      : parseLearningResponse(parsed)
  } catch {
    return undefined
  }
}

function ActivityOutline({ activity }: { activity: LearningActivityV1 }) {
  switch (activity.kind) {
    case 'parameter_explorer':
      return (
        <div className={css.replayOutline}>
          <ul>{activity.payload.parameters.map(item => <li key={item.id}>{item.label}: {item.min}–{item.max}</li>)}</ul>
          <ul>{activity.payload.curves.map(item => <li key={item.id}>{item.label}</li>)}</ul>
        </div>
      )
    case 'process_stepper':
      return (
        <ol className={css.replaySteps}>
          {activity.payload.steps.map(step => (
            <li key={step.id}><strong>{step.title}</strong><MarkdownText text={step.content} /></li>
          ))}
        </ol>
      )
    case 'structure_compare':
      return (
        <div className={css.replayCompare}>
          {[activity.payload.left, activity.payload.right].map(side => (
            <section key={side.title}>
              <strong>{side.title}</strong>
              <ul>{side.items.map(item => <li key={item.id}>{item.label}</li>)}</ul>
            </section>
          ))}
        </div>
      )
  }
}

export function LearningToolView({ block, inspect, t }: LearningToolViewProps) {
  const activity = activityOf(block)
  const done = 'kind' in block
  const response = responseOf(block)
  const callId = block.callId
  const raw = 'kind' in block ? block.call?.argsRaw : block.argsRaw
  useEffect(() => {
    if (done || raw === undefined || raw === '') return
    if (activity === undefined) emitLearningCallLifecycle('learning.call.stream_started', { callId })
    else emitLearningCallLifecycle('learning.call.args_completed', {
      callId,
      phase: activity.protocol === ACTIVITY_PROTOCOL_V2 ? activity.phase : undefined,
      seq: activity.protocol === ACTIVITY_PROTOCOL_V2 ? activity.seq : undefined,
    })
  }, [activity, callId, done, raw])
  if (activity === undefined) {
    if (!done) {
      return (
        <div className={css.toolRow} data-state="running" role="status">
          <span><small>{t('waiting')}</small></span>
          <span className={css.runningDot} aria-hidden="true" />
        </div>
      )
    }
    return <div className={css.toolRow} data-state={done ? 'done' : 'running'}>{t('invalidActivity')}</div>
  }
  if (activity.protocol === ACTIVITY_PROTOCOL_V2) {
    if (!done) {
      return (
        <button className={css.toolRow} data-state="running" type="button" onClick={inspect}>
          <span><strong>{activity.focus.title}</strong><small>{t('waiting')}</small></span>
          <span className={css.runningDot} aria-hidden="true" />
        </button>
      )
    }
    const v2Response = response?.protocol === RESPONSE_PROTOCOL_V2 ? response : undefined
    const initialAnswer = v2Response?.phase === 'question' ? v2Response.answer : undefined
    return (
      <div className={css.completedRound} data-learning-result={v2Response?.action ?? 'unknown'}>
        <RoundActivity activity={activity} completed initialAnswer={initialAnswer} t={t} />
      </div>
    )
  }
  if (!done) {
    return (
      <button className={css.toolRow} data-state="running" type="button" onClick={inspect}>
        <span><strong>{activity.title}</strong><small>{t('waiting')}</small></span>
        <span className={css.runningDot} aria-hidden="true" />
      </button>
    )
  }
  const status = response?.action === 'submit' ? t('completed')
    : response?.action === 'skip' ? t('skipped')
      : response?.action === 'cancel' ? t('cancelled') : t('noResponse')
  return (
    <details className={css.replay}>
      <summary>
        <span><strong>{activity.title}</strong><small>{status}</small></span>
      </summary>
      <div className={css.replayBody}>
        <p>{activity.objective}</p>
        <ActivityOutline activity={activity} />
        <details>
          <summary>{t('fallback')}</summary>
          <MarkdownText text={activity.fallbackMarkdown} />
        </details>
        <section className={css.response}>
          <strong>{t('response')}</strong>
          {response === undefined ? <p>{t('noResponse')}</p> : <pre>{JSON.stringify(response, null, 2)}</pre>}
        </section>
      </div>
    </details>
  )
}
