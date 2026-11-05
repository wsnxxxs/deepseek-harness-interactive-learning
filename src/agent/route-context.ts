/**
 * Per-turn `learning:turn-route` context text.
 *
 * This is the dynamic half of the Learning prompt: the standing policy stays
 * byte-stable for the provider's prompt cache, and everything that depends on
 * the claimed learner message — learn intent, the opening shape, and which
 * optional interactive tools this turn allows — is stated here. The tool
 * catalog itself never changes per turn; disallowed calls are denied at
 * dispatch, and this note tells the model in advance.
 */
import type { LearningTurnRouteDecision } from '../teaching-route.ts'

/** Which optional interactive tools the current route and client allow. */
export interface LearningTurnToolAvailability {
  /** Whether the composition has a client that renders visuals and checkpoints. */
  readonly richClient: boolean
  readonly visual: boolean
  readonly checkpoint: boolean
}

const HEADING = '## Current turn route'

/** The opening move for each route. Exactly one line is emitted per turn. */
function routeMove(decision: LearningTurnRouteDecision): string {
  switch (decision.route) {
    case 'calibrate':
      return 'Give one tiny useful foothold (a one-line intuition or example), then ask one question whose answer changes how you teach: their goal, their context, or what they already know. No overview and no list of questions.'
    case 'teach-minimum':
      return 'Teach the smallest useful idea now, with one concrete example. Ask a question only if the answer would change your next move.'
    case 'overview':
      return 'Give the requested structured explanation directly and completely. No calibration question, quiz, or checkpoint first.'
    case 'direct':
      return decision.reason === 'resource-creation'
        ? 'Create the requested study resource directly. Build items that make the learner recall, explain, compare, or apply, not only definitions. Don\'t quiz them first.'
        : 'They are under time pressure: give the direct answer or fix first, briefly. Offer the underlying idea afterwards in one line.'
    case 'continue':
      return 'Read their reply against your last move. If that move didn\'t land, try a different one; if they have now done it on their own, close the segment.'
  }
}

/** One stable, parseable line naming the optional interactive tools this turn allows. */
export function learningTurnToolsLine(tools: LearningTurnToolAvailability): string {
  if (!tools.richClient) return 'Interactive tools this turn: none (this client shows text only).'
  const usable = [tools.visual ? 'visual' : '', tools.checkpoint ? 'checkpoint' : ''].filter(Boolean)
  return `Interactive tools this turn: ${usable.length === 0 ? 'none' : usable.join(' or ')}.`
}

/**
 * Render the route note for one claimed user message.
 * @param decision - the route resolved for this turn.
 * @param tools - optional interactive tools the route and client allow.
 * @returns the complete context text.
 */
export function routeContextText(
  decision: LearningTurnRouteDecision,
  tools: LearningTurnToolAvailability,
): string {
  if (decision.intent.intent === 'not-learn') {
    return [
      HEADING,
      'intent=not-learn; route=direct.',
      'Ordinary task: do it directly. The learning policy and the learning tools do not apply this turn.',
    ].join('\n')
  }
  return [
    HEADING,
    `intent=learn; route=${decision.route}; reason=${decision.reason}.`,
    ...(decision.inherited
      ? ['This continues the current learning segment: read short replies, confusion, and pushback as answers to your last move.']
      : []),
    routeMove(decision),
    ...(decision.intent.trigger === 'current-topic'
      ? ['Current or contested topic: use web_search before substantive claims, cite what you find, and mark open disagreements.']
      : []),
    learningTurnToolsLine(tools),
  ].join('\n')
}
