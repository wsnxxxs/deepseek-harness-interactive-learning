// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { VisualView } from '../src/client/visuals/index.tsx'
import { DEFAULT_VISUAL_LABELS as labels, labelTemplate } from '../src/client/visuals/core/labels.ts'
import { parseVisualDocument, type VisualDocument } from '../src/protocol/index.ts'
import { visualCatalog } from './fixtures.ts'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

describe('semantic visual gallery', () => {
  const entries = Object.entries(visualCatalog) as Array<[
    keyof typeof visualCatalog,
    VisualDocument,
  ]>

  it.each(entries)('parses and renders %s natively without Markdown downgrade', (name, source) => {
    const visual = parseVisualDocument(source)
    const view = render(<VisualView visual={visual} storageKey={`s-v4:v4-${name}`} />)
    const root = view.container.querySelector(`[data-learning-visual="${visual.content.kind}"]`)
    expect(root, `${name} did not reach its native renderer`).toBeTruthy()
    expect(root?.getAttribute('data-render-state')).toBe('ready')
    expect(view.container.querySelector('[role="alert"]')).toBeNull()

    if (visual.content.kind === 'plot') {
      const svg = root?.querySelector('svg[role="img"]')
      const curve = root?.querySelector('[data-visual-id="function"]')
      expect(svg).toBeTruthy()
      expect(curve?.tagName.toLocaleLowerCase()).toBe('path')
      const initialPath = curve?.getAttribute('d')
      expect(initialPath).toBeTruthy()
      const slider = screen.getByRole('slider', { name: /^指数 n/ }) as HTMLInputElement
      fireEvent.change(slider, { target: { value: '2' } })
      expect(slider.value).toBe('2')
      expect(root?.querySelector('[data-visual-id="function"]')?.getAttribute('d')).not.toBe(initialPath)
      expect(screen.getByText('x = 1 处切线斜率').parentElement?.textContent).toContain('2.0')
      return
    }

    if (visual.content.kind === 'node_link') {
      expect(root?.querySelector('svg[role="group"]')).toBeTruthy()
      expect(root?.querySelectorAll('[data-visual-id^="w_"]')).toHaveLength(12)
      expect(root?.querySelectorAll('[data-visual-id^="v_"]')).toHaveLength(8)
      const inputNode = root?.querySelector('[data-visual-id="x1"]')
      const hiddenNode = root?.querySelector('[data-visual-id="h1"]')
      // Frame 1 focuses the input layer. The hidden units the inputs feed are
      // where that signal goes, so they stay legible context rather than being
      // faded out of the figure.
      expect(inputNode?.getAttribute('data-visual-state')).toBe('current')
      expect(hiddenNode?.getAttribute('data-visual-state')).toBe('related')
      fireEvent.click(screen.getByRole('button', { name: labels.nextStep }))
      expect(hiddenNode?.getAttribute('data-visual-state')).toBe('current')
      // The layer the previous frame covered is marked as already seen, not dropped.
      expect(inputNode?.getAttribute('data-visual-state')).toBe('related')
      fireEvent.click(hiddenNode as Element)
      expect(hiddenNode?.getAttribute('data-selected')).toBe('true')
      expect(hiddenNode?.getAttribute('data-visual-state')).toBe('selected')
      expect(screen.getByText('隐藏单元：加权求和后通过激活函数')).toBeTruthy()
      return
    }

    if (visual.content.kind === 'scene_2d') {
      expect(root?.querySelector('svg[role="group"]')).toBeTruthy()
      expect(root?.querySelector('[data-visual-id="parallelogram"] polygon')).toBeTruthy()
      const sum = root?.querySelector('[data-visual-id="vector_sum"]')
      expect(sum?.querySelectorAll('line')).toHaveLength(2)
      fireEvent.click(sum as Element)
      expect(sum?.getAttribute('data-selected')).toBe('true')
      expect(screen.getByText('合向量直接连接共同起点和最终端点。')).toBeTruthy()
      return
    }

    if (visual.content.kind === 'timeline') {
      expect(root?.querySelector(`[aria-label="${labels.timelineLabel}"]`)).toBeTruthy()
      expect(root?.querySelectorAll('[data-visual-id]')).toHaveLength(6)
      const event = root?.querySelector('[data-visual-id="perceptron"]')
      expect(event?.tagName.toLocaleLowerCase()).toBe('button')
      fireEvent.click(event as Element)
      expect(screen.getByText('用可学习权重完成线性分类。')).toBeTruthy()
      expect(screen.getByRole('button', { name: labels.closeDetail })).toBeTruthy()
      return
    }

    if (visual.content.kind === 'formula_steps') {
      expect(root?.querySelector(`[aria-label="${labels.formulaLabel}"]`)).toBeTruthy()
      const initialStep = root?.querySelector<HTMLElement>('[data-visual-id="limit_definition"]')
      const initialKatex = initialStep?.querySelector<HTMLElement>('.katex')
      expect(initialStep).toBeTruthy()
      expect(initialKatex).toBeTruthy()
      expect(initialKatex?.closest('[hidden], [aria-hidden="true"]')).toBeNull()
      expect(initialKatex === undefined ? 'none' : getComputedStyle(initialKatex).display).not.toBe('none')
      expect(initialStep?.textContent).not.toContain('$$')
      expect(root?.querySelector('[data-visual-id="expand_square"]')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: labels.revealNextFormulaStep }))
      const expandedStep = root?.querySelector<HTMLElement>('[data-visual-id="expand_square"]')
      expect(expandedStep?.querySelector('.katex')).toBeTruthy()
      expect(expandedStep?.textContent).not.toContain('$$')
      expect(screen.getByText('完全平方公式')).toBeTruthy()
      expect(screen.getByText(labelTemplate(labels.formulaProgress, { current: 2, total: 4 }))).toBeTruthy()
      return
    }

    if (visual.content.kind === 'study_map') {
      expect(root?.querySelector(`[aria-label="${labels.studySections}"]`)).toBeTruthy()
      const section = root?.querySelector('[data-visual-id="derivatives_section"]')
      expect(section?.getAttribute('role')).toBe('tab')
      fireEvent.click(section as Element)
      expect(section?.getAttribute('aria-selected')).toBe('true')
      const concept = root?.querySelector('[data-visual-id="derivative_definition"]')
      expect(concept).toBeTruthy()
      fireEvent.click(concept as Element)
      expect(concept?.getAttribute('data-selected')).toBe('true')
      expect(screen.getByText('差商在 Δx→0 时的极限。')).toBeTruthy()
      return
    }

    if (visual.content.kind === 'recall_deck') {
      expect(root?.querySelector(`[aria-label="${labels.recallDeckLabel}"]`)).toBeTruthy()
      const card = root?.querySelector('[data-visual-id="power_rule"]')
      expect(card?.getAttribute('data-stage')).toBe('prompt')
      fireEvent.click(screen.getByRole('button', { name: labels.showHint }))
      expect(card?.getAttribute('data-stage')).toBe('hint')
      expect(screen.getByText('指数移到前面，再减 1。')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: labels.showAnswer }))
      expect(card?.getAttribute('data-stage')).toBe('answer')
      expect(screen.getByText('n·xⁿ⁻¹')).toBeTruthy()
      const mastered = screen.getByRole('button', { name: labels.mastered })
      fireEvent.click(mastered)
      expect(mastered.getAttribute('aria-pressed')).toBe('true')
      expect(root?.querySelector('output')?.textContent).toContain(labelTemplate(labels.recallStatus, { mastered: 1, review: 0 }))
      fireEvent.click(screen.getByRole('button', { name: new RegExp(labels.nextCard) }))
      expect(root?.getAttribute('data-render-state')).toBe('ready')
      expect(root?.querySelector('[data-visual-id="power_rule"]')).toBeNull()
      expect(root?.querySelector('[data-visual-id="product_rule"]')?.getAttribute('data-stage')).toBe('prompt')
      return
    }

    if (visual.content.kind === 'data_table') {
      expect(root?.querySelector('table')).toBeTruthy()
      expect(root?.querySelector('[data-visual-id="record_d"]')).toBeTruthy()
      return
    }

    if (visual.content.kind === 'state_transition') {
      expect(root?.querySelector('[data-visual-id="draft"]')).toBeTruthy()
      expect(root?.querySelector('[data-visual-id="submit"]')).toBeTruthy()
      return
    }

    if (visual.content.kind === 'sequence_buffer') {
      expect(root?.querySelector('[data-visual-id="slot_0"]')).toBeTruthy()
      expect(root?.querySelector('[data-visual-id="window"]')).toBeTruthy()
      return
    }

    if (visual.content.kind === 'sequence_diagram') {
      expect(root?.querySelector('[data-visual-id="client"]')).toBeTruthy()
      expect(root?.querySelector('[data-visual-id="request"]')).toBeTruthy()
      return
    }

    if (visual.content.kind === 'code_trace') {
      expect(root?.querySelector('pre, code')).toBeTruthy()
      expect(root?.querySelector('[data-visual-id="trace_init"]')).toBeTruthy()
      return
    }

    if (visual.content.kind === 'field_2d') {
      expect(root?.querySelector('svg, canvas')).toBeTruthy()
      return
    }

    if (visual.content.kind === 'causal_loop') {
      expect(root?.querySelector('[data-visual-id="users"]')).toBeTruthy()
      expect(root?.querySelector('[data-visual-id="growth_loop"]')).toBeTruthy()
      return
    }

    expect(visual.content.kind).toBe('relation')
    if (visual.content.kind !== 'relation') throw new Error('fixture mismatch')
    if (visual.content.variant === 'comparison') {
      expect(root?.querySelector('table caption')?.textContent).toBe(labels.comparisonCaption)
      const subject = screen.getByRole('button', { name: '数组' })
      fireEvent.click(subject)
      expect(screen.getByText('连续内存中的索引序列。')).toBeTruthy()
      expect(screen.getByRole('button', { name: labels.closeDetail })).toBeTruthy()
      return
    }
    if (visual.content.variant === 'matrix') {
      expect(root?.querySelector('table caption')?.textContent).toBe(labels.matrixCaption)
      const cell = screen.getByRole('button', { name: '∂u/∂x' })
      fireEvent.click(cell)
      expect(screen.getByText('x 对 u 的局部影响。')).toBeTruthy()
      expect(screen.getByRole('button', { name: labels.closeDetail })).toBeTruthy()
      return
    }
    expect(root?.querySelector(`[aria-label="${labels.setsLabel}"]`)).toBeTruthy()
    const sharedItem = screen.getByRole('button', { name: /6/ })
    fireEvent.click(sharedItem)
    expect(screen.getByText('6 同时能被 2 和 3 整除。')).toBeTruthy()
    expect(screen.getByRole('button', { name: labels.closeDetail })).toBeTruthy()
  })

  it('retains local plot state when the same visual is replayed', () => {
    const visual = parseVisualDocument(visualCatalog.derivativePlot)
    const first = render(<VisualView visual={visual} storageKey="s-v4:v4-plot-replay" />)
    fireEvent.change(screen.getByRole('slider', { name: /^指数 n/ }), { target: { value: '1.5' } })
    first.unmount()

    const replay = render(<VisualView visual={visual} storageKey="s-v4:v4-plot-replay" />)
    expect((screen.getByRole('slider', { name: /^指数 n/ }) as HTMLInputElement).value).toBe('1.5')
    expect(replay.container.querySelector('[data-learning-visual="plot"]')).toBeTruthy()
  })
})
