/**
 * Model-facing `learning_checkpoint` tool: one static schema.
 *
 * The call arguments are exactly the `dsh-learning/checkpoint@1` record that
 * the Client tool view and the persisted wait projection already read, so
 * calls made by older two-step sessions (`learning_checkpoint_select` →
 * dynamic `learning_checkpoint`) and calls made by this static tool replay
 * identically. Option rules for `single_choice` are enforced by the closed
 * protocol parser, which reports the exact field to fix.
 */
import {
  CHECKPOINT_PROTOCOL,
  CHECKPOINT_RESULT_PROTOCOL,
  LEARNING_CHECKPOINT_EVIDENCE_KINDS,
  LEARNING_CHECKPOINT_KINDS,
} from '../protocol.ts'

export const CHECKPOINT_TOOL_NAME = 'learning_checkpoint'

export const checkpointToolDescription = [
  'Pause for one short learner response that decides your next move: a prediction, an explanation in their own words, a choice between contrasting options, a number, or a small code fragment.',
  'The learner answers in a response field that replaces their message box until they submit or skip.',
  'The call waits and returns their response, or skipped or cancelled; continue in conversation either way.',
  'Never include the answer, a giveaway hint, or a rubric.',
  'Write your explanation first, make this the only tool call in that step, and do not ask another question in prose.',
].join(' ')

const optionIdentifier = {
  type: 'string',
  required: true,
  description: 'Identifier: 1 to 32 characters, start with a lowercase letter, then use only a-z, 0-9, _ or -.',
} as const

export const checkpointToolParameters = {
  protocol: { type: 'string', const: CHECKPOINT_PROTOCOL, required: true },
  kind: {
    type: 'string',
    enum: LEARNING_CHECKPOINT_KINDS,
    required: true,
    description: 'Response shape: free_text=a sentence or two; single_choice=one label from options; numeric=one number; prediction=what happens next; code_slot=a small code fragment.',
  },
  prompt: {
    type: 'string',
    required: true,
    description: 'The question, self-contained and answer-free, in the learner\'s language.',
  },
  context: {
    type: 'string',
    description: 'Optional short material the learner needs in view to answer, such as a code snippet or a data point.',
  },
  expectedEvidence: {
    type: 'string',
    enum: LEARNING_CHECKPOINT_EVIDENCE_KINDS,
    required: true,
    description: 'What the response will show: attempt, prediction, explanation, contrast, or fresh transfer (applying the idea in a new situation).',
  },
  options: {
    type: 'array',
    description: 'single_choice only: 2 to 8 options, none marked correct.',
    items: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: optionIdentifier,
        label: { type: 'string', required: true },
      },
    },
  },
  fallbackMarkdown: {
    type: 'string',
    required: true,
    description: 'The same question as plain text for clients that cannot show the response field; never the answer.',
  },
} as const

const checkpointResponse = { oneOf: [
  { type: 'object', additionalProperties: false, properties: {
    text: { type: 'string', required: true },
  } },
  { type: 'object', additionalProperties: false, properties: {
    optionId: { type: 'string', required: true },
  } },
  { type: 'object', additionalProperties: false, properties: {
    number: { type: 'number', required: true },
  } },
] } as const

/** Result shapes returned to the model; matches `LearningCheckpointResultV1`. */
export const checkpointToolOutput = { oneOf: [
  { type: 'object', additionalProperties: false, properties: {
    protocol: { type: 'string', const: CHECKPOINT_RESULT_PROTOCOL, required: true },
    checkpointId: { type: 'string', required: true },
    status: { type: 'string', const: 'submitted', required: true },
    response: { ...checkpointResponse, required: true },
    receiptId: { type: 'string', required: true },
  } },
  { type: 'object', additionalProperties: false, properties: {
    protocol: { type: 'string', const: CHECKPOINT_RESULT_PROTOCOL, required: true },
    checkpointId: { type: 'string', required: true },
    status: { type: 'string', const: 'skipped', required: true },
    reason: {
      type: 'string',
      enum: ['learner-skipped', 'client-unavailable', 'client-response-timeout', 'host-unavailable', 'provider-failure'],
    },
    receiptId: { type: 'string', required: true },
  } },
  { type: 'object', additionalProperties: false, properties: {
    protocol: { type: 'string', const: CHECKPOINT_RESULT_PROTOCOL, required: true },
    checkpointId: { type: 'string', required: true },
    status: { type: 'string', const: 'cancelled', required: true },
    reason: {
      type: 'string',
      enum: ['learner-cancelled', 'session-aborted', 'plugin-disposed'],
    },
    receiptId: { type: 'string', required: true },
  } },
] } as const
