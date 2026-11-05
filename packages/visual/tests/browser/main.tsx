import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { VisualView } from '../../src/client/visuals/index.tsx'
import { parseVisualDocument, type VisualDocument } from '../../src/protocol/index.ts'
import { visualCatalog } from '../fixtures.ts'
import { DECISION_TREE_VISUAL } from '../visual-corpus.ts'
import './host-theme.css'
import './page.css'

/**
 * A schema-valid plot whose curve samples to nothing inside the declared axes.
 * Gallery-only: it exists so the empty-chart notice can be inspected visually
 * alongside the ordinary catalog.
 */
const emptyRangePlot = {
  title: '超出坐标范围的曲线',
  description: '声明的 y 轴范围内没有任何取值，图表会说明这一点而不是留下空白。',
  content: {
    kind: 'plot',
    xAxis: { label: 'x', min: 0, max: 1, samples: 32 },
    yAxis: { label: 'y', min: 0, max: 1 },
    series: [{
      type: 'curve',
      id: 'off_range',
      label: 'x + 1000',
      expression: { op: 'add', left: { op: 'variable', name: 'x' }, right: { op: 'constant', value: 1000 } },
    }],
  },
}

const entries: ReadonlyArray<readonly [string, VisualDocument]> = [
  ...Object.entries(visualCatalog),
  // The reported regression shape: a small decision tree stepped through by a
  // sequence, which is where a fixed canvas and a global dim opacity showed
  // worst. Kept in the gallery so it can be inspected in a real browser.
  ['decisionTree', DECISION_TREE_VISUAL],
  ['emptyRangePlot', emptyRangePlot],
].map(([key, source]) => [key as string, parseVisualDocument(source)] as const)

const documents = new Map(entries)

function declaredIds(visual: VisualDocument): string[] {
  const { content } = visual
  switch (content.kind) {
    case 'plot': return [...(content.parameters ?? []), ...content.series, ...(content.metrics ?? [])].map(item => item.id)
    case 'node_link': return [...(content.groups ?? []), ...content.nodes, ...content.edges].map(item => item.id)
    case 'scene_2d': return content.elements.map(item => item.id)
    case 'timeline': return [...content.events, ...(content.eras ?? [])].map(item => item.id)
    case 'formula_steps': return content.steps.map(item => item.id)
    case 'study_map': return [...content.sections, ...content.concepts].map(item => item.id)
    case 'recall_deck': return content.cards.map(item => item.id)
    case 'data_table': return [...content.columns, ...content.rows].map(item => item.id)
    case 'state_transition': return [...content.states, ...content.transitions, ...(content.steps ?? [])].map(item => item.id)
    case 'sequence_buffer': return [...content.slots, ...(content.pointers ?? []), ...(content.ranges ?? []), ...(content.steps ?? [])].map(item => item.id)
    case 'sequence_diagram': return [...content.participants, ...content.messages].map(item => item.id)
    case 'code_trace': return content.steps.map(item => item.id)
    case 'field_2d': return []
    case 'causal_loop': return [...content.variables, ...content.links, ...(content.loops ?? [])].map(item => item.id)
    case 'relation':
      switch (content.variant) {
        case 'comparison': return [...content.subjects, ...content.rows].map(item => item.id)
        case 'matrix': return [...content.rows, ...content.columns, ...content.cells].map(item => item.id)
        case 'sets': return [...content.sets, ...content.items].map(item => item.id)
      }
  }
}

interface Readiness {
  key: string
  ready: boolean
  renderedKind: string | null
  renderState: string | null
  hasError: boolean
  hasNativeContent: boolean
}

function VisualGallery() {
  const [key, setKey] = useState('derivativePlot')
  const [readiness, setReadiness] = useState<Readiness | null>(null)
  const turnRef = useRef<HTMLElement>(null)
  const visual = documents.get(key) as VisualDocument

  useEffect(() => {
    const host = turnRef.current
    if (host === null) return
    const expectedIds = new Set(declaredIds(visual))
    const measure = (): void => {
      const shell = host.querySelector<HTMLElement>('[data-learning-visual]')
      const renderedKind = shell?.dataset.learningVisual ?? null
      const renderState = shell?.dataset.renderState ?? null
      const hasError = host.querySelector('[role="alert"]') !== null
      const hasNativeContent = expectedIds.size === 0 || [...host.querySelectorAll<HTMLElement>('[data-visual-id]')]
        .some(node => expectedIds.has(node.dataset.visualId ?? ''))
      const ready = renderedKind === visual.content.kind && renderState === 'ready' && !hasError && hasNativeContent
      setReadiness({ key, ready, renderedKind, renderState, hasError, hasNativeContent })
    }
    measure()
    const observer = new MutationObserver(measure)
    observer.observe(host, { childList: true, subtree: true, attributes: true })
    return () => observer.disconnect()
  }, [key, visual])

  const current = readiness?.key === key ? readiness : null
  useEffect(() => {
    ;(window as unknown as { __VISUAL_GALLERY__: unknown }).__VISUAL_GALLERY__ = {
      visualKey: key,
      visualKind: visual.content.kind,
      catalogKeys: entries.map(([entryKey]) => entryKey),
      readiness: current,
      ready: current?.ready === true,
    }
  }, [current, key, visual])

  return (
    <main>
      <header>
        <p className="kicker">Visual gallery</p>
        <h1>Renderer browser fixture</h1>
        <p>Every content kind, rendered natively by VisualView from a validated document.</p>
      </header>
      <nav aria-label="Visual gallery">
        {entries.map(([entryKey, entry]) => (
          <button
            key={entryKey}
            type="button"
            aria-label={`${entryKey}: ${entry.title} (${entry.content.kind})`}
            aria-pressed={key === entryKey}
            data-testid={`choice-${entryKey}`}
            data-visual-kind={entry.content.kind}
            onClick={() => setKey(entryKey)}
          >
            {entryKey} · {entry.content.kind}
          </button>
        ))}
      </nav>
      <section className="status" aria-label="Gallery status">
        <span>Kind <strong>{visual.content.kind}</strong></span>
        <span>
          Renderer <strong data-testid="visual-readiness" data-ready={String(current?.ready === true)} data-render-state={current?.renderState ?? undefined}>
            {current?.ready === true ? 'ready' : 'not ready'}
          </strong>
        </span>
      </section>
      <article ref={turnRef} className="gallery-turn" data-testid="gallery" data-visual-key={key} data-visual-kind={visual.content.kind}>
        <VisualView key={key} visual={visual} storageKey={`gallery:${key}`} />
      </article>
    </main>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(<VisualGallery />)
