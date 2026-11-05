import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LEARNING_TEACHING_POLICY } from '../src/teaching-policy.ts'

const root = resolve(import.meta.dirname, '..')
const agentSource = readFileSync(join(root, 'src/agent.ts'), 'utf8')
const skillRoot = join(root, 'preset/learning/skills/interactive-teaching')
const skillSource = readFileSync(join(skillRoot, 'SKILL.md'), 'utf8')

function expectPolicyToCover(...phrases: string[]): void {
  for (const phrase of phrases) expect(LEARNING_TEACHING_POLICY).toContain(phrase)
}

function skillDescription(): string {
  const match = /^---\nname: interactive-teaching\ndescription: (.+)\n---\n/.exec(skillSource)
  expect(match).not.toBeNull()
  return match![1]!
}

describe('authoritative compact Learning teaching policy', () => {
  it('is the single standing-prompt source, registered once by the agent entry', () => {
    expect(agentSource).toContain("import { LEARNING_TEACHING_POLICY } from './teaching-policy.ts'")
    expect(agentSource).toContain('text: LEARNING_TEACHING_POLICY')
    // The per-turn route lives in dynamic context, never in the stable section.
    expect(LEARNING_TEACHING_POLICY).toContain('Read the "Current turn route" note first')
    expect(LEARNING_TEACHING_POLICY).toContain('On a not-learn turn, ignore this policy')
  })

  it('teaches through one move, retrieval, specific feedback, and misconception repair', () => {
    expectPolicyToCover(
      'One move per reply: the smallest explanation that unlocks the next step',
      'work one example fully with the reason for each step, then hand over a similar case with one step left for the learner. Remove support as they succeed.',
      'have the learner produce something: predict, explain why, compare two cases, or apply the idea to a new case',
      'Don\'t ask "does that make sense?"',
      'Ask at most one question per reply, only when the answer will change your next move',
      'give enough to work with (a case, a choice, a first step)',
      'Feedback names what they actually wrote',
      'Partly right: keep the right part and name the missing piece',
      'name the misconception, show why it fails with a counterexample or contrast, then offer a similar retry',
      'Never agree with a wrong claim to be kind, and skip generic praise',
      'concept → the idea; procedure → a different parallel example; notation → decode the symbols; prerequisite → the missing rule first',
    )
  })

  it('changes representation instead of repeating a failed move', () => {
    expectPolicyToCover(
      'don\'t paraphrase: make the step smaller, switch representation',
      'After two failed attempts, work a parallel case all the way through',
      'Never reuse a hint, analogy, or question that already failed; the learner_state note lists your recent approaches',
    )
  })

  it('respects learners who want the answer and stops after demonstrated capability', () => {
    expectPolicyToCover(
      'If they ask for the answer, a full overview, or a study resource, give it directly and completely; assessed work is the one exception below',
      'Offer practice; don\'t impose it',
      'If they are impatient but haven\'t asked for the answer, speed up',
      'Stop asking questions when asked to. "I get it" alone is not evidence.',
      'End the segment once they have explained or applied the idea correctly on their own',
      'don\'t add another question. A plan is a tentative route, not a checklist.',
    )
  })

  it('keeps honesty and academic integrity explicit', () => {
    expectPolicyToCover(
      'Never invent facts, citations, source locations, or what the learner said',
      'Correct mistakes plainly, including your own',
      'For graded or submitted work, don\'t produce the answer or text to hand in',
      'Ask whether work is assessed only when it is unclear and would change your help',
    )
  })

  it('states the interactive-tool budget once and leaves mechanics to the tools and Skill', () => {
    expectPolicyToCover(
      'At most one per user turn: a visual (`visualize`)',
      'or a checkpoint (`learning_checkpoint`) when one short learner response will decide your next move',
      'Keep your prose self-sufficient; the learner may skip either',
      '`learning_state_update` notes are for you; never mention them to the learner',
      'Load the `interactive-teaching` skill',
    )
    // Host enforcement, wire protocols, and schema limits never reach the standing prompt.
    for (const leaked of [
      'compare-and-swap', 'revision', 'Host', 'protocol', 'dsh-learning/',
      'formula_steps', '2 to 48 nodes', 'Mermaid', 'learning_visual_select', 'learning_checkpoint_select',
      'calibrate', 'teach-minimum',
    ]) {
      expect(LEARNING_TEACHING_POLICY).not.toContain(leaked)
    }
  })

  it('keeps the standing policy within the compact prompt budget', () => {
    // A conservative chars/4 proxy, not a model-specific tokenizer claim. The
    // policy is resent on every step, so it must stay well under 1k tokens.
    expect(Math.ceil(LEARNING_TEACHING_POLICY.length / 4)).toBeLessThan(1_000)
  })
})

describe('interactive-teaching progressive-disclosure Skill', () => {
  it('has a trigger description that names when to load it, within the catalog bound', () => {
    const description = skillDescription()
    expect(description.length).toBeLessThanOrEqual(500)
    for (const trigger of ['level, goal, or time pressure is unclear', 'graded or submitted', 'supplies files', 'visualize']) {
      expect(description).toContain(trigger)
    }
  })

  it('routes to every reference file without restating the policy or leaking implementation paths', () => {
    expect(skillSource.length).toBeLessThan(8_000)
    for (const reference of [
      'references/diagnosis-and-pressure.md',
      'references/teaching-moves.md',
      'references/academic-integrity.md',
      'references/tone-and-failure-modes.md',
      'references/reference-materials.md',
      'references/visual-routing.md',
      'references/visual-protocol.md',
    ]) {
      expect(skillSource).toContain(reference)
      expect(() => readFileSync(join(skillRoot, reference), 'utf8')).not.toThrow()
    }
    expect(skillSource).toContain('never override it')
    expect(skillSource).not.toContain('src/')
    expect(skillSource).not.toContain('learning:policy')
    expect(skillSource).not.toContain('One move per reply')
  })
})
