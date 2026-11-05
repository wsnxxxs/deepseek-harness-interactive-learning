import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import type { LearningQuestionWait } from '../../src/client/learning-waits.ts'
import {
  CHECKPOINT_PROTOCOL,
  CHECKPOINT_RESULT_PROTOCOL,
  parseLearningCheckpointResultV1,
  RESPONSE_PROTOCOL,
  VISUAL_PROTOCOL_V3,
  VISUAL_RESULT_PROTOCOL_V3,
  type LearningActivityV1,
  type LearningCheckpointKindV1,
  type LearningCheckpointResultV1,
  type LearningCheckpointV1,
  type LearningResponseV1,
  type LearningVisualV3,
  type MathExpressionV1,
} from '../../src/protocol.ts'
import { encodeLearningCheckpointDetail, learningCheckpointQuestionId } from '../../src/transport.ts'
import { compareActivity, parameterActivity, processActivity } from '../fixtures.ts'
import { startedBlock, t, ToolView, toolViewProps } from '../toolview-harness.tsx'
import '../../packages/visual/tests/browser/host-theme.css'
import './page.css'

// The native renderer gallery (every visual content kind) is the visual
// package's own fixture page: packages/visual/tests/browser.
const SESSION_ID = 'learning-browser-fixture'
const VISUAL_CALL_ID = 'call:logistic-regression-visual'

type CheckpointSessionKey = 'a' | 'b'

function checkpointFixture(kind: LearningCheckpointKindV1): LearningCheckpointV1 {
  return {
    protocol: CHECKPOINT_PROTOCOL,
    kind,
    prompt: kind === 'single_choice'
      ? 'Which item leaves this queue first?'
      : 'Explain one observable change before the lesson continues.',
    context: 'Use only the example already visible in this turn.',
    expectedEvidence: 'attempt',
    ...(kind === 'single_choice' ? {
      options: [
        { id: 'first', label: 'The first inserted item' },
        { id: 'last', label: 'The last inserted item' },
      ],
    } : {}),
    fallbackMarkdown: 'Pause and contribute one step before continuing.',
  }
}

function checkpointIdentity(sessionKey: CheckpointSessionKey) {
  const sessionId = `learning-browser-checkpoint-${sessionKey}`
  return {
    sessionId,
    callId: `call:checkpoint:${sessionKey}`,
    waitId: `wait_browser_${sessionKey}`,
    checkpointId: `checkpoint_browser_${sessionKey}`,
  }
}

function runningCheckpointBlock(callId: string, checkpoint: LearningCheckpointV1) {
  return startedBlock(callId, 'learning_checkpoint', JSON.stringify(checkpoint))
}

function completedCheckpointBlock(
  callId: string,
  checkpoint: LearningCheckpointV1,
  result: LearningCheckpointResultV1,
) {
  return {
    kind: 'tool-result' as const,
    seq: 3,
    time: 3_000,
    callId,
    call: { name: 'learning_checkpoint', argsRaw: JSON.stringify(checkpoint) },
    callTime: 2_000,
    content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    isError: false,
    callView: null,
    resultView: null,
    subCalls: [],
  }
}


function logitExpression(): MathExpressionV1 {
  return {
    op: 'add',
    left: { op: 'variable', name: 'beta0' },
    right: {
      op: 'mul',
      left: { op: 'variable', name: 'beta1' },
      right: { op: 'variable', name: 'x' },
    },
  }
}

/**
 * The main browser fixture mirrors the target teaching turn: two local sliders,
 * observed classes, an intentionally unbounded linear approximation, the
 * logistic curve, and a derived decision boundary.
 */
const logisticVisual: LearningVisualV3 = {
  protocol: VISUAL_PROTOCOL_V3,
  kind: 'parameter_chart',
  title: '为什么逻辑回归需要 Sigmoid',
  description: '橙色虚线展示线性概率近似如何越界；拖动截距和斜率，观察 Sigmoid 如何始终把概率压在 0 到 1 之间。',
  parameters: [
    { id: 'beta0', label: 'β₀（截距）', min: -8, max: 2, step: 0.1, initial: -5 },
    { id: 'beta1', label: 'β₁（斜率）', min: 0.1, max: 5, step: 0.1, initial: 1 },
  ],
  xAxis: { label: '学习时长（小时）', min: 0, max: 10, samples: 160 },
  yAxis: { label: 'P（通过）', min: -0.5, max: 1.5 },
  series: [
    {
      type: 'points',
      id: 'failed-observations',
      label: '不及格（y = 0）',
      tone: 'red',
      points: [1, 1.5, 2, 2.5, 3, 3.5, 4].map(x => ({ x, y: 0 })),
    },
    {
      type: 'points',
      id: 'passed-observations',
      label: '通过（y = 1）',
      tone: 'green',
      points: [5.5, 6, 6.5, 7, 7.5, 8, 9].map(x => ({ x, y: 1 })),
    },
    {
      type: 'curve',
      id: 'linear-probability',
      label: '线性概率近似（可越界）',
      tone: 'orange',
      stroke: 'dashed',
      expression: {
        op: 'add',
        left: { op: 'constant', value: -0.36 },
        right: {
          op: 'mul',
          left: { op: 'constant', value: 0.18 },
          right: { op: 'variable', name: 'x' },
        },
      },
    },
    {
      type: 'curve',
      id: 'logistic-probability',
      label: '逻辑回归（Sigmoid）',
      tone: 'blue',
      stroke: 'solid',
      expression: { op: 'sigmoid', value: logitExpression() },
    },
  ],
  metrics: [{
    id: 'decision-boundary',
    label: '决策边界 P = 0.5 → x =',
    expression: {
      op: 'div',
      left: { op: 'neg', value: { op: 'variable', name: 'beta0' } },
      right: { op: 'variable', name: 'beta1' },
    },
    digits: 1,
    suffix: ' 小时',
  }],
}

function runningVisualBlock() {
  return startedBlock(VISUAL_CALL_ID, 'learning_visual', JSON.stringify(logisticVisual))
}

function completedVisualBlock() {
  return {
    kind: 'tool-result' as const,
    seq: 3,
    time: 3_000,
    callId: VISUAL_CALL_ID,
    call: { name: 'learning_visual', argsRaw: JSON.stringify(logisticVisual) },
    callTime: 2_000,
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ protocol: VISUAL_RESULT_PROTOCOL_V3, status: 'ready' }),
    }],
    isError: false,
    callView: null,
    resultView: null,
    subCalls: [],
  }
}

const legacyActivities = {
  parameter_explorer: parameterActivity,
  process_stepper: processActivity,
  structure_compare: compareActivity,
} as const
type LegacyKind = keyof typeof legacyActivities

function legacyResponse(kind: LegacyKind, activityId: string): LearningResponseV1 {
  if (kind === 'parameter_explorer') {
    return {
      protocol: RESPONSE_PROTOCOL,
      activityId,
      action: 'submit',
      answer: { parameters: { slope: 1.5 }, explanation: 'The slope controls the line direction.' },
    }
  }
  if (kind === 'process_stepper') {
    return {
      protocol: RESPONSE_PROTOCOL,
      activityId,
      action: 'submit',
      answer: { checkpoints: ['A'], explanation: 'FIFO removes A first.' },
    }
  }
  return {
    protocol: RESPONSE_PROTOCOL,
    activityId,
    action: 'submit',
    answer: { selectedDifferences: ['lookup_cost'], explanation: 'Arrays support indexed lookup.' },
  }
}

function legacyReplayBlock(kind: LegacyKind, activity: LearningActivityV1) {
  const activityId = `legacy-${kind}`
  return {
    kind: 'tool-result' as const,
    seq: 3,
    time: 3_000,
    callId: `call:${activityId}`,
    call: { name: 'learning_activity', argsRaw: JSON.stringify(activity) },
    callTime: 2_000,
    content: [{ type: 'text' as const, text: JSON.stringify(legacyResponse(kind, activityId)) }],
    isError: false,
    callView: null,
    resultView: null,
    subCalls: [],
  }
}

/** Visual fixtures never claim the ordinary composer as a pending interaction. */
const NO_WAITS: readonly LearningQuestionWait[] = []

type FixtureView = 'v3-running' | 'v3-completed' | 'checkpoint' | 'legacy-replay'

interface FixtureReadiness {
  fixtureKey: string
  ready: boolean
  expectedKind: string | null
  renderedKind: string | null
  renderState: string | null
  hasError: boolean
  hasFallback: boolean
  hasMarkdown: boolean
}

const initialReadiness: FixtureReadiness = {
  fixtureKey: '',
  ready: false,
  expectedKind: null,
  renderedKind: null,
  renderState: null,
  hasError: false,
  hasFallback: false,
  hasMarkdown: false,
}

function sameReadiness(left: FixtureReadiness, right: FixtureReadiness): boolean {
  return left.fixtureKey === right.fixtureKey
    && left.ready === right.ready
    && left.expectedKind === right.expectedKind
    && left.renderedKind === right.renderedKind
    && left.renderState === right.renderState
    && left.hasError === right.hasError
    && left.hasFallback === right.hasFallback
    && left.hasMarkdown === right.hasMarkdown
}

function checkpointResultFromRequest(answer: unknown): LearningCheckpointResultV1 | undefined {
  try {
    if (typeof answer !== 'object' || answer === null || !('answers' in answer)) return undefined
    const answers = answer.answers
    if (!Array.isArray(answers) || typeof answers[0]?.custom !== 'string') return undefined
    return parseLearningCheckpointResultV1(JSON.parse(answers[0].custom))
  } catch {
    return undefined
  }
}

function BrowserAcceptance() {
  const [mode, setMode] = useState<'learning' | 'standard'>('learning')
  const [view, setView] = useState<FixtureView>('v3-completed')
  const [legacyKind, setLegacyKind] = useState<LegacyKind>('parameter_explorer')
  const [checkpointKind, setCheckpointKind] = useState<LearningCheckpointKindV1>('free_text')
  const [checkpointSession, setCheckpointSession] = useState<CheckpointSessionKey>('a')
  const [checkpointResult, setCheckpointResult] = useState<LearningCheckpointResultV1 | null>(null)
  const [checkpointRespondCount, setCheckpointRespondCount] = useState(0)
  const [checkpointMountEpoch, setCheckpointMountEpoch] = useState(0)
  const [draft, setDraft] = useState('')
  const [sentMessages, setSentMessages] = useState<string[]>([])
  const [readiness, setReadiness] = useState<FixtureReadiness>(initialReadiness)
  const fixtureRef = useRef<HTMLElement>(null)
  const legacyActivity = legacyActivities[legacyKind]()
  const checkpoint = useMemo(() => checkpointFixture(checkpointKind), [checkpointKind])
  const checkpointIds = checkpointIdentity(checkpointSession)
  // Stand-in for the question plugin's PendingQuestion carrier: `answer`
  // resolves the Host waterfall with one answer batch, or rejects.
  const respondToCheckpoint = useCallback(async (answer: unknown): Promise<void> => {
    const result = checkpointResultFromRequest(answer)
    if (result === undefined) throw new Error('malformed checkpoint receipt')
    setCheckpointRespondCount(count => count + 1)
    setCheckpointResult(result)
  }, [])
  const pendingCheckpoint = useMemo((): LearningQuestionWait => ({
    kind: 'question',
    key: `question_${checkpointIds.waitId}`,
    sessionId: checkpointIds.sessionId,
    questions: [{
      id: learningCheckpointQuestionId(checkpointIds.waitId),
      question: checkpoint.prompt,
      detail: encodeLearningCheckpointDetail({ ...checkpointIds, checkpoint }),
    }],
    answer: respondToCheckpoint,
    dismiss: async () => {},
  }), [checkpoint, checkpointIds.callId, checkpointIds.checkpointId, checkpointIds.sessionId, checkpointIds.waitId, respondToCheckpoint])
  const checkpointWaits = useMemo(
    () => (checkpointResult === null ? [pendingCheckpoint] : NO_WAITS),
    [checkpointResult, pendingCheckpoint],
  )
  const expectedKind = mode !== 'learning'
    ? null
    : view.startsWith('v3-')
      ? logisticVisual.kind
      : view === 'checkpoint'
        ? checkpoint.kind
        : null
  const activeProtocol = mode !== 'learning'
    ? null
    : view.startsWith('v3-')
      ? VISUAL_PROTOCOL_V3
      : view === 'checkpoint'
        ? CHECKPOINT_PROTOCOL
        : legacyActivity.protocol
  const activeFixtureKey = mode === 'standard'
    ? 'standard'
    : view === 'checkpoint'
      ? `${view}:${checkpointSession}:${checkpointKind}:${checkpointResult?.status ?? 'pending'}:${String(checkpointMountEpoch)}`
      : view === 'legacy-replay'
        ? `${view}:${legacyKind}`
        : view
  const currentReadiness = readiness.fixtureKey === activeFixtureKey
    ? readiness
    : { ...initialReadiness, fixtureKey: activeFixtureKey, expectedKind }
  const protocolLabel = activeProtocol === VISUAL_PROTOCOL_V3
    ? 'visual@3 replay'
    : activeProtocol === CHECKPOINT_PROTOCOL
      ? 'checkpoint@1'
      : activeProtocol === null
        ? 'none'
        : 'activity@1 replay'

  useEffect(() => {
    const host = fixtureRef.current
    if (host === null) return

    const measure = (): void => {
      const renderedVisual = host.querySelector<HTMLElement>('[data-learning-visual]')
      const renderedCheckpoint = host.querySelector<HTMLElement>('[data-learning-checkpoint]')
      const completedCheckpoint = host.querySelector<HTMLElement>('[data-learning-result="submitted"], [data-learning-result="skipped"], [data-learning-result="cancelled"]')
      const renderedKind = renderedVisual?.dataset.learningVisual ?? renderedCheckpoint?.dataset.learningCheckpoint ?? null
      const renderState = renderedVisual?.dataset.renderState
        ?? completedCheckpoint?.dataset.learningResult
        ?? (renderedCheckpoint === null ? null : 'pending')
      const hasError = host.querySelector('[data-learning-result="error"], [role="alert"]') !== null
      const hasFallback = host.querySelector('[data-learning-fallback]') !== null
      const hasMarkdown = [...host.querySelectorAll('[data-markdown-text]')].some(node => (
        node.closest('[data-learning-visual][data-render-state="ready"]') === null
      ))
      const hasCompletedLegacyResult = host.querySelector('[data-learning-result]:not([data-learning-result="error"])') !== null
      const ready = mode === 'standard'
          ? host.matches('[data-testid="standard-clean"]') && !hasMarkdown
        : view === 'legacy-replay'
          ? hasCompletedLegacyResult && !hasError && !hasFallback && !hasMarkdown
        : view === 'checkpoint'
          ? checkpointResult === null
            ? renderedKind === checkpoint.kind && renderState === 'pending' && !hasError && !hasFallback && !hasMarkdown
            : renderState === checkpointResult.status && !hasError && !hasFallback && !hasMarkdown
        : renderedKind === expectedKind
            && !hasError
            && !hasFallback
            && !hasMarkdown
      const next = { fixtureKey: activeFixtureKey, ready, expectedKind, renderedKind, renderState, hasError, hasFallback, hasMarkdown }
      setReadiness(current => sameReadiness(current, next) ? current : next)
    }

    measure()
    const observer = new MutationObserver(measure)
    observer.observe(host, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [activeFixtureKey, checkpoint.kind, checkpointResult, expectedKind, legacyKind, mode, view])

  useEffect(() => {
    ;(window as unknown as { __LEARNING_ACCEPTANCE__: unknown }).__LEARNING_ACCEPTANCE__ = {
      mode,
      view,
      protocol: activeProtocol,
      visualKind: expectedKind,
      checkpoint: view === 'checkpoint' ? {
        kind: checkpoint.kind,
        sessionId: checkpointIds.sessionId,
        callId: checkpointIds.callId,
        waitId: checkpointIds.waitId,
        checkpointId: checkpointIds.checkpointId,
        status: checkpointResult?.status ?? 'pending',
        respondCount: checkpointRespondCount,
        storageKey: `dsh-learning/checkpoint@1:${checkpointIds.waitId}`,
      } : null,
      readiness: currentReadiness,
      ready: currentReadiness.ready,
      rendererReady: currentReadiness.ready,
      pending: mode === 'learning' && view === 'checkpoint' && checkpointResult === null ? [checkpointIds.waitId] : [],
      pendingCount: mode === 'learning' && view === 'checkpoint' && checkpointResult === null ? 1 : 0,
      fixtureComposerEnabled: true,
      sentMessages,
    }
  }, [activeProtocol, checkpoint.kind, checkpointIds.callId, checkpointIds.checkpointId, checkpointIds.sessionId, checkpointIds.waitId, checkpointRespondCount, checkpointResult, currentReadiness, expectedKind, mode, sentMessages, view])

  const sendMessage = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const message = draft.trim()
    if (message === '') return
    setSentMessages(current => [...current, message])
    setDraft('')
  }

  const openCheckpoint = (kind: LearningCheckpointKindV1 = checkpointKind): void => {
    setMode('learning')
    setView('checkpoint')
    if (kind !== checkpointKind) {
      try {
        sessionStorage.removeItem(`dsh-learning/checkpoint@1:${checkpointIds.waitId}`)
      } catch {}
      setCheckpointKind(kind)
    }
    setCheckpointResult(null)
    setCheckpointMountEpoch(epoch => epoch + 1)
  }

  const switchCheckpointSession = (session: CheckpointSessionKey): void => {
    setCheckpointSession(session)
    setCheckpointResult(null)
    setCheckpointMountEpoch(epoch => epoch + 1)
  }

  const resetCheckpoint = (): void => {
    try {
      sessionStorage.removeItem(`dsh-learning/checkpoint@1:${checkpointIds.waitId}`)
    } catch {}
    setCheckpointResult(null)
    setCheckpointMountEpoch(epoch => epoch + 1)
  }

  return (
    <main>
      <header className="acceptance-header">
        <div>
          <p className="kicker">Learning browser fixture</p>
          <h1>Checkpoint and replay fixture</h1>
          <p>切换真实 ToolView：checkpoint 交互、visual@3 与 V1 活动回放；完整的原生图形画廊位于 visual 包的浏览器页。下方输入框只用于组件页隔离检查。</p>
        </div>
        <div className="mode-row" role="group" aria-label="Agent preset">
          <button type="button" aria-pressed={mode === 'learning'} onClick={() => setMode('learning')}>Learning preset</button>
          <button type="button" aria-pressed={mode === 'standard'} onClick={() => setMode('standard')}>Standard preset</button>
        </div>
      </header>

      <nav aria-label="ToolView fixtures">
        <button type="button" aria-pressed={view === 'v3-running'} onClick={() => { setMode('learning'); setView('v3-running') }}>
          V3 running ToolView
        </button>
        <button type="button" aria-pressed={view === 'v3-completed'} onClick={() => { setMode('learning'); setView('v3-completed') }}>
          V3 completed ToolView
        </button>
        <button type="button" aria-pressed={view === 'checkpoint'} onClick={() => openCheckpoint()}>
          Checkpoint gate
        </button>
        <button type="button" aria-pressed={view === 'legacy-replay'} onClick={() => { setMode('learning'); setView('legacy-replay') }}>
          Legacy V1 replay
        </button>
      </nav>

      <section className="status" aria-label="Acceptance status">
        <span>Mode <strong>{mode}</strong></span>
        <span>Protocol <strong>{protocolLabel}</strong></span>
        <span>
          Renderer <strong data-testid="visual-readiness" data-ready={String(currentReadiness.ready)} data-render-state={currentReadiness.renderState ?? undefined}>{currentReadiness.ready ? 'ready' : 'not ready'}</strong>
        </span>
        <span>Pending interactions <strong data-testid="pending-count">{mode === 'learning' && view === 'checkpoint' && checkpointResult === null ? 1 : 0}</strong></span>
        <span>Fixture composer <strong>available</strong></span>
      </section>

      <section className="conversation-shell">
        {mode === 'standard' ? (
          <article ref={fixtureRef} className="assistant-turn standard-clean" data-testid="standard-clean">
            Standard preset 不渲染 Learning 工具；下方仅保留组件页自己的测试输入框。
          </article>
        ) : view === 'checkpoint' ? (
          <article
            ref={fixtureRef}
            className="assistant-turn"
            data-testid="checkpoint-fixture"
            data-checkpoint-session={checkpointSession}
            data-checkpoint-status={checkpointResult?.status ?? 'pending'}
          >
            <p>This is one answer-free, optional checkpoint. It owns one pending wait; the separate input below belongs only to this component harness.</p>
            <div className="legacy-toolbar checkpoint-toolbar" role="group" aria-label="Checkpoint fixture controls">
              <span>Kind:</span>
              <button type="button" aria-pressed={checkpointKind === 'free_text'} onClick={() => openCheckpoint('free_text')}>Free text</button>
              <button type="button" aria-pressed={checkpointKind === 'single_choice'} onClick={() => openCheckpoint('single_choice')}>Single choice</button>
              <span>Session:</span>
              <button type="button" aria-pressed={checkpointSession === 'a'} onClick={() => switchCheckpointSession('a')}>Session A</button>
              <button type="button" aria-pressed={checkpointSession === 'b'} onClick={() => switchCheckpointSession('b')}>Session B</button>
              <button type="button" data-testid="checkpoint-remount" disabled={checkpointResult !== null} onClick={() => setCheckpointMountEpoch(epoch => epoch + 1)}>Simulate refresh</button>
              <button type="button" data-testid="checkpoint-reset" onClick={resetCheckpoint}>Fresh pending</button>
            </div>
            <div className="tool-state" data-state={checkpointResult === null ? 'running' : 'completed'}>
              ToolView: checkpoint@1 · {checkpointResult?.status ?? 'pending'} · session {checkpointSession.toUpperCase()}
            </div>
            <div data-testid="checkpoint-tool-view">
              <ToolView
                key={`${checkpointSession}:${checkpointKind}:${String(checkpointMountEpoch)}:${checkpointResult?.status ?? 'pending'}`}
                {...toolViewProps(checkpointResult === null
                  ? runningCheckpointBlock(checkpointIds.callId, checkpoint)
                  : completedCheckpointBlock(checkpointIds.callId, checkpoint, checkpointResult),
                { sessionId: checkpointIds.sessionId, waits: checkpointWaits })}
              />
            </div>
            <p className="continuation" data-testid="checkpoint-continuation">
              Respond callbacks: <strong data-testid="checkpoint-respond-count">{checkpointRespondCount}</strong>. No reveal or Continue gate follows a terminal result.
            </p>
          </article>
        ) : view === 'legacy-replay' ? (
          <article ref={fixtureRef} className="assistant-turn" data-testid="legacy-replay">
            <div className="legacy-toolbar" role="group" aria-label="Legacy replay kind">
              <span>Optional legacy replay:</span>
              {(Object.keys(legacyActivities) as LegacyKind[]).map(kind => (
                <button key={kind} type="button" aria-pressed={legacyKind === kind} onClick={() => setLegacyKind(kind)}>
                  {kind}
                </button>
              ))}
            </div>
            <ToolView {...toolViewProps(legacyReplayBlock(legacyKind, legacyActivity), { sessionId: SESSION_ID, waits: NO_WAITS })} />
          </article>
        ) : (
          <article ref={fixtureRef} className="assistant-turn" data-testid={view === 'v3-running' ? 'v3-running-tool-view' : 'v3-completed-tool-view'}>
            <p>逻辑回归的出发点只有一个：我们想用一条曲线预测<strong>概率</strong>，但普通线性输出会越过 0 和 1。</p>
            <p>拖动下面两个参数。橙色虚线代表会越界的线性近似，蓝色实线则经过 Sigmoid 压缩。</p>
            <div className="tool-state" data-state={view === 'v3-running' ? 'running' : 'completed'}>
              ToolView: {view === 'v3-running' ? 'running call' : 'completed result'} · pending=[]
            </div>
            <ToolView {...toolViewProps(view === 'v3-running' ? runningVisualBlock() : completedVisualBlock(), { sessionId: SESSION_ID, waits: NO_WAITS })} />
            <p className="continuation" data-testid="same-turn-continuation">
              关键点：不论参数怎样变化，蓝色曲线始终位于 0 到 1 之间；P = 0.5 所在的 x 就是当前决策边界。你觉得增大 β₁ 会让边界附近的曲线更陡还是更平？
            </p>
          </article>
        )}

        {sentMessages.map((message, index) => (
          <p className="user-message" data-testid="sent-message" key={`${String(index)}:${message}`}>{message}</p>
        ))}

        <form className="ordinary-composer" data-testid="ordinary-composer" onSubmit={sendMessage}>
          <label htmlFor="ordinary-message">组件页测试输入</label>
          <div>
            <textarea
              id="ordinary-message"
              aria-label="Message"
              placeholder="此输入框不代表真实 Host composer…"
              rows={2}
              value={draft}
              onChange={event => setDraft(event.target.value)}
            />
            <button type="submit" disabled={draft.trim() === ''}>发送</button>
          </div>
        </form>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(<BrowserAcceptance />)
