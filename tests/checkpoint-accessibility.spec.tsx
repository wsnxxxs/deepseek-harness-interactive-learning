// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'

afterEach(cleanup)

/**
 * The payload always states which cognitive move it wants. Showing a generic
 * "checkpoint" label instead would narrate the teaching machinery, which the
 * standing policy rules out, and would leave the learner guessing how to engage.
 */
describe('the checkpoint header names the thinking being asked for', () => {
  it('labels each expected evidence kind rather than the machinery', async () => {
    const { LearningCheckpoint } = await import('../src/client/LearningCheckpoint.tsx')
    const { CHECKPOINT_PROTOCOL } = await import('../src/protocol.ts')
    const { en } = await import('../src/client/locales.ts')
    const translate = ((key: keyof typeof en) => en[key]) as never

    const expected = [
      ['prediction', en.checkpointEvidencePrediction],
      ['explanation', en.checkpointEvidenceExplanation],
      ['contrast', en.checkpointEvidenceContrast],
      ['transfer', en.checkpointEvidenceTransfer],
      ['attempt', en.checkpointEvidenceAttempt],
    ] as const

    for (const [evidence, label] of expected) {
      const { container, unmount } = render(
        <LearningCheckpoint
          checkpoint={{
            protocol: CHECKPOINT_PROTOCOL,
            kind: 'free_text',
            prompt: 'What happens to the residual when the learning rate doubles?',
            expectedEvidence: evidence,
            fallbackMarkdown: 'Reason about the residual before continuing.',
          }}
          storageKey={`evidence-${evidence}`}
          busy={false}
          error={null}
          onSubmit={async () => {}}
          onSkip={async () => {}}
          onCancel={async () => {}}
          t={translate}
        />,
      )
      const eyebrow = container.querySelector('[data-learning-evidence]')
      expect(eyebrow?.getAttribute('data-learning-evidence')).toBe(evidence)
      expect(eyebrow?.textContent?.trim()).toBe(label)
      expect(container.textContent).not.toContain(en.checkpointEyebrow)
      unmount()
    }
  })
})
