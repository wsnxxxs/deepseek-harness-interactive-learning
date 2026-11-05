// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { VisualView } from '../src/client/visuals/index.tsx'
import { DEFAULT_VISUAL_LABELS } from '../src/client/visuals/core/labels.ts'
import { VisualProtocolError, parseVisualDocument } from '../src/protocol/index.ts'
import { VISUAL_VARIANT_CORPUS } from './visual-corpus.ts'

/** Render one document the way an owning view does once its call has settled. */
function renderVisual(visual: unknown, callId: string) {
  return render(<VisualView visual={parseVisualDocument(visual)} storageKey={`corpus:${callId}`} />)
}

/** The substantive markup each content kind must actually produce. */
const REQUIRED_MARKUP: Readonly<Record<string, string>> = {
  plot: 'svg',
  node_link: 'svg [data-roving-id]',
  scene_2d: 'svg [data-roving-id]',
  relation: 'table, [class*=setMap]',
  timeline: '[class*=timelineEvent], [class*=timelineVertical] button',
  formula_steps: '[class*=formulaStepCard]',
  study_map: '[role="tab"]',
  recall_deck: 'article',
  data_table: 'table',
  state_transition: '[data-visual-id]',
  sequence_buffer: '[data-visual-id]',
  sequence_diagram: '[data-visual-id]',
  code_trace: 'pre, code',
  field_2d: 'svg, canvas',
  causal_loop: '[data-visual-id]',
}

afterEach(cleanup)

/**
 * A payload the closed schema accepts must reach its renderer. Every path that
 * substitutes Markdown, the description, or the error boundary for the figure
 * is a degradation the learner experiences as "the chart did not come".
 */
describe('every accepted visual variant renders instead of degrading', () => {
  const entries = Object.entries(VISUAL_VARIANT_CORPUS)

  it('covers all fifteen content kinds', () => {
    const kinds = new Set(entries.map(([, visual]) => (visual.content as { kind: string }).kind))
    expect([...kinds].sort()).toEqual([
      'causal_loop', 'code_trace', 'data_table', 'field_2d', 'formula_steps', 'node_link', 'plot',
      'recall_deck', 'relation', 'scene_2d', 'sequence_buffer', 'sequence_diagram', 'state_transition',
      'study_map', 'timeline',
    ])
    expect(entries.length).toBeGreaterThanOrEqual(28)
  })

  it.each(entries)('accepts and renders %s', (name, visual) => {
    // 1. The closed schema must accept it: a rejection is the harshest degradation.
    expect(() => parseVisualDocument(visual), `${name} failed schema validation`).not.toThrow(VisualProtocolError)

    // 2. A renderer crash falls to the error boundary, which is also a degradation.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = renderVisual(visual, `call_${name}`)

    const shell = container.querySelector('[data-learning-visual]')
    expect(shell, `${name} did not mount a visual shell`).not.toBeNull()
    expect(shell?.getAttribute('data-render-state')).toBe('ready')

    // 3. No text-substitution surface may be present.
    expect(container.querySelector('[role="alert"]'), `${name} hit the renderer error boundary`).toBeNull()
    expect(container.textContent).not.toContain(DEFAULT_VISUAL_LABELS.errorTitle)

    // 4. The renderer must have produced its real markup, not an empty shell.
    const kind = (visual.content as { kind: string }).kind
    const required = REQUIRED_MARKUP[kind] ?? '*'
    expect(shell?.querySelector(required), `${name} rendered no ${kind} content`).not.toBeNull()

    expect(consoleError, `${name} logged a renderer error`).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

/**
 * A curve can satisfy the closed schema and still sample to nothing visible:
 * `log` or `sqrt` over a negative domain produces no finite value, and a curve
 * whose outputs sit outside the declared y range is drawn entirely outside the
 * clip. Both used to leave an empty frame with no explanation, which reads as
 * a broken chart rather than as a chart with nothing in it.
 */
describe('a plot with nothing inside its axes says so', () => {
  const plot = (id: string, expression: unknown, xAxis: unknown, yAxis: unknown) => ({
    title: id,
    content: { kind: 'plot', xAxis, yAxis, series: [{ type: 'curve', id: 'probe', label: 'Probe', expression }] },
  })
  const x = { op: 'variable', name: 'x' }

  const cases = {
    logOfNegatives: plot('log', { op: 'log', value: x }, { label: 'x', min: -3, max: -1, samples: 32 }, { label: 'y', min: -2, max: 2 }),
    sqrtOfNegatives: plot('sqrt', { op: 'sqrt', value: x }, { label: 'x', min: -4, max: -1, samples: 32 }, { label: 'y', min: 0, max: 2 }),
    entirelyOffAxis: plot('off', { op: 'add', left: x, right: { op: 'constant', value: 1000 } }, { label: 'x', min: 0, max: 1, samples: 32 }, { label: 'y', min: 0, max: 1 }),
  }

  it.each(Object.entries(cases))('explains the empty result for %s', (name, visual) => {
    expect(() => parseVisualDocument(visual)).not.toThrow()
    const { container } = renderVisual(visual, `empty_${name}`)

    // Still a real chart, not a text fallback.
    expect(container.querySelector('[data-learning-visual="plot"]')).not.toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
    // ...but the blank area is named rather than left to look broken.
    expect(container.textContent).toContain(DEFAULT_VISUAL_LABELS.noValuesInRange)
    expect(container.querySelector('[data-empty]')).not.toBeNull()
    // The accessible description carries the same fact.
    expect(container.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toContain(DEFAULT_VISUAL_LABELS.noValuesInRange)
  })

  it('stays silent when the series does have values in range', () => {
    const healthy = plot('ok', { op: 'variable', name: 'x' }, { label: 'x', min: 0, max: 4, samples: 32 }, { label: 'y', min: 0, max: 4 })
    expect(() => parseVisualDocument(healthy)).not.toThrow()
    const { container } = renderVisual(healthy, 'empty_none')
    // Guard against passing merely because the payload never rendered.
    expect(container.querySelector('[data-learning-visual="plot"]')).not.toBeNull()
    expect(container.textContent).not.toContain(DEFAULT_VISUAL_LABELS.noValuesInRange)
    expect(container.querySelector('[data-empty]')).toBeNull()
  })

  it('marks only the empty series when another one is fine', () => {
    const mixed = {
      title: 'One good series, one empty',
      content: {
        kind: 'plot',
        xAxis: { label: 'x', min: 0, max: 4, samples: 32 },
        yAxis: { label: 'y', min: 0, max: 4 },
        series: [
          { type: 'curve', id: 'good', label: 'Good', expression: { op: 'variable', name: 'x' } },
          { type: 'curve', id: 'gone', label: 'Gone', expression: { op: 'add', left: { op: 'variable', name: 'x' }, right: { op: 'constant', value: 500 } } },
        ],
      },
    }
    expect(() => parseVisualDocument(mixed)).not.toThrow()
    const { container } = renderVisual(mixed, 'empty_mixed')

    // The chart is not blank overall, so no whole-chart notice.
    expect(container.textContent).not.toContain(DEFAULT_VISUAL_LABELS.noValuesInRange)
    const flagged = [...container.querySelectorAll('[data-empty]')]
    expect(flagged).toHaveLength(1)
    expect(flagged[0]?.textContent).toContain('Gone')
  })
})
