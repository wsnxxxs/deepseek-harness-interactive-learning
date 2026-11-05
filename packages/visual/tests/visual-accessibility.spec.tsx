// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { VisualView } from '../src/client/visuals/index.tsx'
import { parseVisualDocument } from '../src/protocol/index.ts'
import { visualCatalog } from './fixtures.ts'

afterEach(cleanup)

function rovingItems(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-roving-id]')]
}

function activeRovingId(container: HTMLElement): string | undefined {
  return rovingItems(container).find(item => item.getAttribute('tabindex') === '0')?.dataset.rovingId
}

/**
 * A node_link visual may declare 48 nodes and 160 edges. Every one of them in
 * the tab order would make a single diagram a 200-stop detour before the
 * learner reaches the rest of the conversation.
 */
describe('figures are one tab stop with arrow-key traversal', () => {
  it('keeps exactly one node_link item tabbable however many it draws', () => {
    const visual = parseVisualDocument(visualCatalog.fullyConnectedNetwork)
    const { container } = render(<VisualView visual={visual} />)

    const items = rovingItems(container)
    // 9 nodes + 20 edges are all reachable, but only one is in the tab order.
    expect(items.length).toBe(29)
    expect(items.filter(item => item.getAttribute('tabindex') === '0')).toHaveLength(1)
    expect(activeRovingId(container)).toBe('x1')
  })

  it('moves the tabbable item with the arrow keys, Home and End', () => {
    const visual = parseVisualDocument(visualCatalog.fullyConnectedNetwork)
    const { container } = render(<VisualView visual={visual} />)
    const itemAt = (id: string): HTMLElement => {
      const item = rovingItems(container).find(candidate => candidate.dataset.rovingId === id)
      if (item === undefined) throw new Error(`missing roving item: ${id}`)
      return item
    }

    fireEvent.keyDown(itemAt('x1'), { key: 'ArrowRight' })
    expect(activeRovingId(container)).toBe('x2')

    fireEvent.keyDown(itemAt('x2'), { key: 'ArrowRight' })
    expect(activeRovingId(container)).toBe('x3')

    fireEvent.keyDown(itemAt('x3'), { key: 'ArrowLeft' })
    expect(activeRovingId(container)).toBe('x2')

    fireEvent.keyDown(itemAt('x2'), { key: 'Home' })
    expect(activeRovingId(container)).toBe('x1')

    fireEvent.keyDown(itemAt('x1'), { key: 'End' })
    // Nodes are traversed before edges, so End lands on the last edge.
    expect(activeRovingId(container)).toBe('v_4_2')

    // Traversal never runs off either end of the figure.
    fireEvent.keyDown(itemAt('v_4_2'), { key: 'ArrowRight' })
    expect(activeRovingId(container)).toBe('v_4_2')
  })

  it('still selects an item with Enter while roving', () => {
    const visual = parseVisualDocument(visualCatalog.fullyConnectedNetwork)
    const { container } = render(<VisualView visual={visual} />)
    const node = rovingItems(container).find(item => item.dataset.rovingId === 'x1')

    fireEvent.keyDown(node!, { key: 'Enter' })
    // The detail panel shows the selected node's own explanation.
    expect(screen.getByText('第 1 个输入特征')).toBeTruthy()
  })

  it('applies the same single tab stop to scene_2d elements', () => {
    const visual = parseVisualDocument(visualCatalog.vectorScene)
    const { container } = render(<VisualView visual={visual} />)

    expect(rovingItems(container).length).toBe(6)
    expect(rovingItems(container).filter(item => item.getAttribute('tabindex') === '0')).toHaveLength(1)
  })
})

/**
 * Arrow-key probing used to write its readout only into an aria-hidden card
 * and into the accessible name of a focused role="img", neither of which a
 * screen reader reliably announces.
 */
describe('keyboard chart probing is announced', () => {
  it('fills a polite live region while probing and clears it on Escape', () => {
    const visual = parseVisualDocument(visualCatalog.derivativePlot)
    const { container } = render(<VisualView visual={visual} />)
    const live = container.querySelector('[role="status"][aria-live="polite"]')
    const chart = container.querySelector('svg[role="img"]')
    expect(live?.textContent).toBe('')

    fireEvent.keyDown(chart!, { key: 'ArrowRight' })
    expect(live?.textContent).toContain('f(x) = xⁿ')

    fireEvent.keyDown(chart!, { key: 'Escape' })
    expect(live?.textContent).toBe('')
  })
})

describe('labelled groupings carry a role that exposes the label', () => {
  it('names the node_link figure with a summary, not the whole transcript', () => {
    const visual = parseVisualDocument(visualCatalog.fullyConnectedNetwork)
    const { container } = render(<VisualView visual={visual} />)
    const figure = container.querySelector('svg[role="group"]')

    const name = figure?.getAttribute('aria-label') ?? ''
    expect(name).toContain('20')
    // The full structured alternative belongs in readable content, not in the
    // accessible name, where it would be announced as one wall of text.
    expect(name).not.toContain('第 1 个输入特征')
    expect(screen.getByText('x₁: 第 1 个输入特征')).toBeTruthy()
  })

  it('exposes the legend and the sequence as groups', () => {
    const visual = parseVisualDocument(visualCatalog.fullyConnectedNetwork)
    const { container } = render(<VisualView visual={visual} />)
    const labelled = [...container.querySelectorAll('div[aria-label]')]

    expect(labelled.length).toBeGreaterThan(0)
    for (const element of labelled) expect(element.getAttribute('role')).toBe('group')
  })
})
