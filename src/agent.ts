/** Model-facing entry mounted only by the `learning` preset. */
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
import {
  defineTool,
  type ParameterPropertySpec,
  type ToolDefinition,
  type ToolRunContext,
  type ToolRuntime,
  type ValueSchemaSpec,
} from '@deepseek-ai/dsh-tools'
import type SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import {
  LEARNING_VISUAL_STATUSES,
  VISUAL_PROTOCOL_V4,
  VISUAL_RESULT_PROTOCOL_V4,
  MAX_VISUAL_MATH_DEPTH,
  MATH_BINARY_OPERATORS,
  MATH_UNARY_OPERATORS,
  LearningProtocolError,
  parseLearningCheckpointV1,
  parseLearningVisualV4,
  type LearningCheckpointResultV1,
  type LearningVisualResultV4,
} from './protocol.ts'
import type {
  LearningActivityBroker,
  LearningStateUpdateResult,
} from './broker.ts'
import { LEARNING_TEACHING_POLICY } from './teaching-policy.ts'
import {
  routeLearningTurn,
  type LearningRouteSession,
  type LearningTurnRouteDecision,
} from './teaching-route.ts'
import { routeContextText } from './agent/route-context.ts'
import {
  LEARNER_STATE_TOOL_NAME,
  learnerStateToolDescription,
  learnerStateToolParameters,
  learnerStateUpdateRequest,
  planLearnerStateToolCall,
  type LearnerStateToolArgs,
} from './agent/learner-state-tool.ts'
import {
  CHECKPOINT_TOOL_NAME,
  checkpointToolDescription,
  checkpointToolOutput,
  checkpointToolParameters,
} from './agent/checkpoint-tool.ts'

export const name = 'interactive-learning-agent'
export const inject = ['tools', 'systemPrompt', 'learningActivities']

type LearningAgentContext = Context & {
  tools: ToolRuntime
  systemPrompt: SystemPrompt
  learningActivities: LearningActivityBroker
}

function closeParameterRoot<T extends ToolDefinition>(tool: T): T {
  return { ...tool, parameters: { ...tool.parameters, additionalProperties: false } } as T
}

const parameter = { type: 'object', additionalProperties: false, properties: {
  id: {
    type: 'string',
    description: 'Identifier: 1 to 32 characters, start with a lowercase letter, then use only a-z, 0-9, _ or -. The id x is reserved for the chart axis.',
    required: true,
  },
  label: { type: 'string', required: true },
  min: { type: 'number', required: true },
  max: { type: 'number', required: true },
  step: { type: 'number', required: true },
  initial: { type: 'number', required: true },
} } as const

function mathExpressionSchema(depth: number): ValueSchemaSpec {
  const leaves: [ValueSchemaSpec, ValueSchemaSpec] = [
    { type: 'object', additionalProperties: false, properties: {
      op: { type: 'string', const: 'constant', required: true },
      value: { type: 'number', required: true },
    } },
    { type: 'object', additionalProperties: false, properties: {
      op: { type: 'string', const: 'variable', required: true },
      name: {
        type: 'string',
        description: 'Use x or one of this visual\'s parameter ids.',
        required: true,
      },
    } },
  ]
  if (depth <= 1) return { oneOf: leaves }
  const nested = mathExpressionSchema(depth - 1)
  return { oneOf: [
    ...leaves,
    { type: 'object', additionalProperties: false, properties: {
      op: {
        type: 'string',
        enum: MATH_UNARY_OPERATORS,
        required: true,
      },
      value: { ...nested, required: true },
    } },
    { type: 'object', additionalProperties: false, properties: {
      op: { type: 'string', enum: MATH_BINARY_OPERATORS, required: true },
      left: { ...nested, required: true },
      right: { ...nested, required: true },
    } },
  ] }
}

function required(schema: ValueSchemaSpec): ParameterPropertySpec {
  return { ...schema, required: true } as ParameterPropertySpec
}

// Shared with the runtime parser: expressive enough for common activation and
// statistics curves while remaining bounded by the visual AST depth.
const expression = mathExpressionSchema(MAX_VISUAL_MATH_DEPTH)
const requiredExpression = required(expression)
const mathExpressionDescription = 'Closed math AST. leaky_relu uses a 0.01 negative slope, step switches from 0 to 1 at zero, and normpdf is the standard normal density; compose normpdf with sub/div and an outer div for other means and standard deviations.'
const identifier = {
  type: 'string',
  description: 'Identifier: 1 to 32 characters, start with a lowercase letter, then use only a-z, 0-9, _ or -.',
} as const
const tone = { type: 'string', enum: ['blue', 'green', 'red', 'orange', 'purple', 'gray'] } as const
const stroke = { type: 'string', enum: ['solid', 'dashed', 'dotted'] } as const
const point = { type: 'object', additionalProperties: false, properties: {
  x: { type: 'number', required: true },
  y: { type: 'number', required: true },
  label: { type: 'string' },
} } as const
const coordinate = { type: 'object', additionalProperties: false, properties: {
  x: { type: 'number', required: true },
  y: { type: 'number', required: true },
} } as const
const axis = { type: 'object', additionalProperties: false, properties: {
  label: { type: 'string' },
  min: { type: 'number', required: true },
  max: { type: 'number', required: true },
} } as const
const curveSeries = { type: 'object', additionalProperties: false, properties: {
  type: { type: 'string', const: 'curve', required: true },
  id: { ...identifier, required: true },
  label: { type: 'string', required: true },
  expression: { ...requiredExpression, description: mathExpressionDescription },
  tone,
  stroke,
} } as const
const pointSeries = { type: 'object', additionalProperties: false, properties: {
  type: { type: 'string', const: 'points', required: true },
  id: { ...identifier, required: true },
  label: { type: 'string', required: true },
  points: { type: 'array', required: true, items: point, description: '1 to 256 points.' },
  tone,
} } as const
const lineSeries = { type: 'object', additionalProperties: false, properties: {
  type: { type: 'string', const: 'line', required: true },
  id: { ...identifier, required: true },
  label: { type: 'string', required: true },
  points: { type: 'array', required: true, items: point, description: '1 to 256 points.' },
  tone,
  stroke,
} } as const
const barSeries = { type: 'object', additionalProperties: false, properties: {
  type: { type: 'string', const: 'bars', required: true },
  id: { ...identifier, required: true },
  label: { type: 'string', required: true },
  points: { type: 'array', required: true, items: point, description: '1 to 64 bars.' },
  tone,
} } as const

const plotContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'plot', required: true,
    description: 'Functions, quantitative data, probability, distributions, or tangent/secant geometry on Cartesian axes.',
  },
  parameters: {
    type: 'array', items: parameter,
    description: 'Optional; omit for a static plot. Use at most three only when changing the value teaches the mechanism.',
  },
  xAxis: { ...axis, required: true, properties: {
    ...axis.properties,
    samples: { type: 'integer', description: 'Optional curve samples from 24 to 256.' },
  } },
  yAxis: required(axis),
  series: {
    type: 'array', required: true, items: { oneOf: [curveSeries, pointSeries, lineSeries, barSeries] },
    description: '1 to 8 series.',
  },
  metrics: { type: 'array', items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true },
      label: { type: 'string', required: true },
      expression: { ...requiredExpression, description: mathExpressionDescription },
      digits: { type: 'integer' },
      suffix: { type: 'string' },
    },
  }, description: 'Optional; at most 4 metrics.' },
} } as const

const nodeGroup = { type: 'object', additionalProperties: false, properties: {
  id: { ...identifier, required: true },
  label: { type: 'string', required: true },
} } as const
const node = { type: 'object', additionalProperties: false, properties: {
  id: { ...identifier, required: true },
  label: { type: 'string', required: true },
  detail: { type: 'string' },
  group: { type: 'string' },
  tone,
} } as const
const edge = { type: 'object', additionalProperties: false, properties: {
  id: { ...identifier, required: true },
  from: { type: 'string', required: true },
  to: { type: 'string', required: true },
  label: { type: 'string' },
  detail: { type: 'string' },
  tone,
  stroke,
  directed: { type: 'boolean' },
} } as const
const nodeLinkContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'node_link', required: true,
    description: 'Networks, fully connected layers, trees, causality, concept maps, state transitions, and dependency topology.',
  },
  layout: { type: 'string', enum: ['layered', 'hierarchy', 'radial'], required: true },
  groups: {
    type: 'array', items: nodeGroup,
    description: 'Optional 1 to 12 ordered layers for layered layout; every node must reference one group.',
  },
  nodes: { type: 'array', items: node, required: true, description: '2 to 48 nodes.' },
  edges: { type: 'array', items: edge, required: true, description: '1 to 160 edges; include every semantically required connection.' },
} } as const

const sceneBase = {
  id: { ...identifier, required: true },
  label: { type: 'string' },
  detail: { type: 'string' },
  tone,
} as const
const sceneElement = { oneOf: [
  { type: 'object', additionalProperties: false, properties: {
    type: { type: 'string', const: 'point', required: true }, ...sceneBase,
    x: { type: 'number', required: true }, y: { type: 'number', required: true }, size: { type: 'number' },
  } },
  { type: 'object', additionalProperties: false, properties: {
    type: { type: 'string', enum: ['segment', 'arrow'], required: true }, ...sceneBase,
    x1: { type: 'number', required: true }, y1: { type: 'number', required: true },
    x2: { type: 'number', required: true }, y2: { type: 'number', required: true }, stroke,
  } },
  { type: 'object', additionalProperties: false, properties: {
    type: { type: 'string', const: 'circle', required: true }, ...sceneBase,
    cx: { type: 'number', required: true }, cy: { type: 'number', required: true }, r: { type: 'number', required: true },
  } },
  { type: 'object', additionalProperties: false, properties: {
    type: { type: 'string', const: 'rect', required: true }, ...sceneBase,
    x: { type: 'number', required: true }, y: { type: 'number', required: true },
    width: { type: 'number', required: true }, height: { type: 'number', required: true },
  } },
  { type: 'object', additionalProperties: false, properties: {
    type: { type: 'string', const: 'polygon', required: true }, ...sceneBase,
    points: { type: 'array', required: true, items: coordinate, description: '3 to 24 polygon vertices.' },
  } },
  { type: 'object', additionalProperties: false, properties: {
    type: { type: 'string', const: 'label', required: true }, ...sceneBase,
    x: { type: 'number', required: true }, y: { type: 'number', required: true }, text: { type: 'string', required: true },
  } },
] } as const
const sceneContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'scene_2d', required: true,
    description: 'Geometry, vectors, forces, spatial relationships, and annotated scientific schematics.',
  },
  xAxis: required(axis),
  yAxis: required(axis),
  grid: { type: 'boolean' },
  elements: { type: 'array', items: sceneElement, required: true, description: '1 to 64 scene elements.' },
} } as const

const relationSubject = { type: 'object', additionalProperties: false, properties: {
  id: { ...identifier, required: true }, label: { type: 'string', required: true },
  detail: { type: 'string' }, tone,
} } as const
const relationAxisItem = { type: 'object', additionalProperties: false, properties: {
  id: { ...identifier, required: true }, label: { type: 'string', required: true },
} } as const
const comparisonContent = { type: 'object', additionalProperties: false, properties: {
  kind: { type: 'string', const: 'relation', required: true },
  variant: { type: 'string', const: 'comparison', required: true },
  subjects: { type: 'array', items: relationSubject, required: true, description: '2 to 4 subjects.' },
  rows: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true }, detail: { type: 'string' },
      cells: { type: 'array', required: true, items: {
        type: 'object', additionalProperties: false, properties: {
          subjectId: { type: 'string', required: true }, value: { type: 'string', required: true }, tone,
        },
      }, description: '1 to 4 cells; each subjectId must reference a declared subject.' },
    },
  }, description: '1 to 16 comparison rows.' },
} } as const
const matrixContent = { type: 'object', additionalProperties: false, properties: {
  kind: { type: 'string', const: 'relation', required: true },
  variant: { type: 'string', const: 'matrix', required: true },
  rows: { type: 'array', items: relationAxisItem, required: true, description: '1 to 10 matrix rows.' },
  columns: { type: 'array', items: relationAxisItem, required: true, description: '1 to 10 matrix columns.' },
  cells: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, rowId: { type: 'string', required: true },
      columnId: { type: 'string', required: true }, label: { type: 'string', required: true },
      detail: { type: 'string' }, tone,
    },
  }, description: '1 to 64 matrix cells; rowId and columnId must reference declared axes.' },
} } as const
const setsContent = { type: 'object', additionalProperties: false, properties: {
  kind: { type: 'string', const: 'relation', required: true },
  variant: { type: 'string', const: 'sets', required: true },
  sets: { type: 'array', items: relationSubject, required: true, description: '2 to 3 sets.' },
  items: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      setIds: {
        type: 'array', items: { type: 'string' }, required: true,
        description: '1 to 3 unique ids referencing declared sets.',
      }, detail: { type: 'string' },
    },
  }, description: '1 to 24 set items.' },
} } as const
const relationContent = { oneOf: [comparisonContent, matrixContent, setsContent] } as const

const timelineEvent = { type: 'object', additionalProperties: false, properties: {
  id: { ...identifier, required: true },
  time: { type: 'string', required: true },
  label: { type: 'string', required: true },
  detail: { type: 'string' },
  position: { type: 'number', description: 'Optional normalized position from 0 to 1. Provide it for every event or omit it for every event.' },
  tone,
} } as const
const timelineContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'timeline', required: true,
    description: 'Ordered historical events, scientific discoveries, biographies, eras, or other chronology where time order is the structure.',
  },
  orientation: { type: 'string', enum: ['horizontal', 'vertical'] },
  events: { type: 'array', items: timelineEvent, required: true, description: '2 to 32 events in chronological order.' },
  eras: { type: 'array', items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      startEventId: { type: 'string', required: true }, endEventId: { type: 'string', required: true },
      detail: { type: 'string' }, tone,
    },
  }, description: 'Optional 1 to 8 eras; startEventId and endEventId must reference declared events in order.' },
} } as const

const formulaStepsContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'formula_steps', required: true,
    description: 'A derivation, algebraic transformation, proof chain, or symbolic simplification where the rule between steps matters. Not for merely recalling one formula.',
  },
  notation: { type: 'string', description: 'Optional short notation key used across the derivation.' },
  steps: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true },
      expression: {
        type: 'string',
        required: true,
        description: 'One LaTeX display expression without dollar delimiters; use commands such as \\lim_{h \\to 0} and ^{\\prime}.',
      },
      label: { type: 'string' }, rule: { type: 'string' }, detail: { type: 'string' }, tone,
    },
  }, description: '2 to 16 formula steps.' },
  conclusion: { type: 'string' },
} } as const

const studyMapContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'study_map', required: true,
    description: 'A navigable overview of a supplied document, chapter, slide deck, or multi-concept learning source. Preserve source sections and anchors instead of flattening the material.',
  },
  sourceLabel: { type: 'string', required: true },
  goal: { type: 'string' },
  sections: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      anchor: { type: 'string', description: 'Human-readable source location, such as Chapter 2 or pp. 18–23.' },
      summary: { type: 'string' },
    },
  }, description: '1 to 16 source sections.' },
  concepts: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      sectionId: { type: 'string', required: true }, detail: { type: 'string' },
      prerequisiteIds: {
        type: 'array', items: { type: 'string' },
        description: 'Optional; at most 8 unique declared concept ids, excluding this concept, with no cycles.',
      },
      role: { type: 'string', enum: ['foundation', 'core', 'extension', 'practice'] },
      tone,
    },
  }, description: '1 to 48 concepts; every sectionId must reference a declared section.' },
} } as const

const recallDeckContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'recall_deck', required: true,
    description: 'A requested flashcard or active-recall set with hidden answers, hints, and local review state. Use only after the relevant material is known.',
  },
  instructions: { type: 'string' },
  cards: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, prompt: { type: 'string', required: true },
      answer: { type: 'string', required: true }, hint: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Optional; at most 6 unique labels.' },
    },
  }, description: '2 to 32 recall cards.' },
} } as const

const tableValue = { oneOf: [
  { type: 'string' },
  { type: 'number' },
  { type: 'boolean' },
  { type: 'null' },
] } as const
const dataTableContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'data_table', required: true,
    description: 'A typed record table for inspecting real data, filtering rows, sorting values, marking outliers, or linking tabular values to a chart.',
  },
  columns: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      type: { type: 'string', enum: ['string', 'number', 'boolean', 'date'], required: true },
      unit: { type: 'string' },
    },
  }, description: '1 to 24 typed columns.' },
  rows: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, detail: { type: 'string' },
      cells: { type: 'array', required: true, items: {
        type: 'object', additionalProperties: false, properties: {
          columnId: { type: 'string', required: true }, value: { ...tableValue, required: true },
        },
      }, description: 'One cell per declared column; columnId must reference a declared column.' },
    },
  }, description: '1 to 128 records.' },
  outlierIds: { type: 'array', items: { type: 'string' }, description: 'Optional row ids to emphasize as anomalies.' },
  initialSort: { type: 'object', additionalProperties: false, properties: {
    columnId: { type: 'string', required: true }, direction: { type: 'string', enum: ['asc', 'desc'], required: true },
  } },
  initialFilter: { type: 'object', additionalProperties: false, properties: {
    columnId: { type: 'string', required: true },
    operator: { type: 'string', enum: ['equals', 'not_equals', 'contains', 'gt', 'gte', 'lt', 'lte'], required: true },
    value: { ...tableValue, required: true },
  } },
  chart: { type: 'object', additionalProperties: false, properties: {
    type: { type: 'string', enum: ['line', 'bar', 'scatter'], required: true },
    xColumnId: { type: 'string', required: true }, yColumnId: { type: 'string', required: true },
    seriesColumnId: { type: 'string' },
  } },
} } as const

const stateTransitionContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'state_transition', required: true,
    description: 'A state machine where an event triggers a transition from one explicit state to another, optionally with guard and action.',
  },
  states: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      detail: { type: 'string' }, tone, initial: { type: 'boolean' }, final: { type: 'boolean' },
    },
  }, description: '2 to 32 states; mark initial/final states when the lifecycle has them.' },
  transitions: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, from: { type: 'string', required: true }, to: { type: 'string', required: true },
      trigger: { type: 'string', required: true }, guard: { type: 'string' }, action: { type: 'string' },
      detail: { type: 'string' }, tone,
    },
  }, description: '1 to 96 transitions; from and to must reference declared states.' },
  steps: { type: 'array', items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      currentStateId: { type: 'string', required: true }, transitionId: { type: 'string' }, description: { type: 'string' },
    },
  }, description: 'Optional 2 to 16 execution steps; each names the current state and optional transition just taken.' },
} } as const

const sequenceBufferContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'sequence_buffer', required: true,
    description: 'Discrete indexed slots with moving pointers, highlighted intervals, and snapshots for array, window, parsing, or protocol algorithms.',
  },
  slots: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, index: { type: 'integer', required: true },
      value: { ...tableValue, required: true }, label: { type: 'string' }, tone,
    },
  }, description: '1 to 128 ordered slots; index values must be unique.' },
  pointers: { type: 'array', items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      index: { type: 'integer', required: true }, tone,
    },
  }, description: 'Optional 1 to 8 named pointers.' },
  ranges: { type: 'array', items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      start: { type: 'integer', required: true }, end: { type: 'integer', required: true }, tone,
    },
  }, description: 'Optional 1 to 8 inclusive index intervals.' },
  steps: { type: 'array', items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      description: { type: 'string' },
      slots: { type: 'array', items: {
        type: 'object', additionalProperties: false, properties: {
          slotId: { type: 'string', required: true }, value: { ...tableValue },
        },
      } },
      pointers: { type: 'array', items: {
        type: 'object', additionalProperties: false, properties: {
          pointerId: { type: 'string', required: true }, index: { type: 'integer', required: true },
        },
      } },
      ranges: { type: 'array', items: {
        type: 'object', additionalProperties: false, properties: {
          rangeId: { type: 'string', required: true }, start: { type: 'integer', required: true }, end: { type: 'integer', required: true },
        },
      } },
    },
  }, description: 'Optional 2 to 16 snapshots. Include only the collections that change in each snapshot.' },
} } as const

const sequenceDiagramContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'sequence_diagram', required: true,
    description: 'Ordered messages exchanged by API clients, services, protocols, cells, or collaborating roles.',
  },
  participants: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      detail: { type: 'string' }, tone,
    },
  }, description: '2 to 16 lifeline participants.' },
  messages: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, from: { type: 'string', required: true }, to: { type: 'string', required: true },
      label: { type: 'string', required: true }, type: { type: 'string', enum: ['sync', 'async', 'return', 'self'], required: true },
      detail: { type: 'string' }, tone,
    },
  }, description: '1 to 96 messages in top-to-bottom order; from and to must reference participants.' },
} } as const

const codeTraceContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'code_trace', required: true,
    description: 'Source lines paired with execution steps, current line, variable values, call stack, and output.',
  },
  language: { type: 'string', required: true },
  code: { type: 'string', required: true, description: 'Complete source text shown above or beside the trace.' },
  lines: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      number: { type: 'integer', required: true }, text: { type: 'string', required: true },
    },
  }, description: '1 to 256 numbered source lines.' },
  steps: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      currentLine: { type: 'integer', required: true },
      variables: { type: 'array', required: true, items: {
        type: 'object', additionalProperties: false, properties: {
          name: { type: 'string', required: true }, value: { ...tableValue, required: true }, type: { type: 'string' },
        },
      } },
      stack: { type: 'array', required: true, items: {
        type: 'object', additionalProperties: false, properties: {
          id: { ...identifier, required: true }, function: { type: 'string', required: true }, line: { type: 'integer' },
        },
      } },
      output: { type: 'string' }, description: { type: 'string' },
    },
  }, description: '2 to 32 execution snapshots.' },
} } as const

const fieldGrid = { type: 'object', additionalProperties: false, properties: {
  columns: { type: 'integer', required: true }, rows: { type: 'integer', required: true },
} } as const
const scalarFieldSamples = { type: 'object', additionalProperties: false, properties: {
  ...fieldGrid.properties,
  values: { type: 'array', items: { type: 'number' }, required: true, description: 'Flattened row-major values; length must equal rows * columns.' },
} } as const
const vectorFieldSamples = { type: 'object', additionalProperties: false, properties: {
  ...fieldGrid.properties,
  u: { type: 'array', items: { type: 'number' }, required: true, description: 'Flattened horizontal components; length must equal rows * columns.' },
  v: { type: 'array', items: { type: 'number' }, required: true, description: 'Flattened vertical components; length must equal rows * columns.' },
} } as const
const field2DContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'field_2d', required: true,
    description: 'A sampled or mathematically defined scalar heatmap, contour field, vector field, or gradient over two axes.',
  },
  xAxis: { ...axis, required: true, properties: { ...axis.properties, samples: { type: 'integer' } } },
  yAxis: { ...axis, required: true, properties: { ...axis.properties, samples: { type: 'integer' } } },
  scalar: { type: 'object', additionalProperties: false, properties: {
    samples: scalarFieldSamples,
    expression: { ...expression, description: 'Closed math AST using x and y variables.' },
    min: { type: 'number' }, max: { type: 'number' },
  } },
  vector: { type: 'object', additionalProperties: false, properties: {
    samples: vectorFieldSamples,
    expression: { type: 'object', additionalProperties: false, properties: {
      u: { ...requiredExpression, description: 'Horizontal component using x and y variables.' },
      v: { ...requiredExpression, description: 'Vertical component using x and y variables.' },
    } },
  } },
} } as const

const causalLoopContent = { type: 'object', additionalProperties: false, properties: {
  kind: {
    type: 'string', const: 'causal_loop', required: true,
    description: 'A causal feedback diagram with positive or negative polarity, optional delay, and named reinforcing or balancing loops.',
  },
  variables: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      detail: { type: 'string' }, tone,
    },
  }, description: '2 to 32 causal variables.' },
  links: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, from: { type: 'string', required: true }, to: { type: 'string', required: true },
      polarity: { type: 'string', enum: ['positive', 'negative'], required: true }, delay: { type: 'number' },
      label: { type: 'string' }, detail: { type: 'string' }, tone,
    },
  }, description: '1 to 96 directed links; from and to must reference variables.' },
  loops: { type: 'array', items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      type: { type: 'string', enum: ['reinforcing', 'balancing'], required: true },
      linkIds: { type: 'array', items: { type: 'string' }, required: true },
      detail: { type: 'string' }, tone,
    },
  }, description: 'Optional 1 to 12 named feedback loops; linkIds must reference declared links in cycle order.' },
} } as const

const sequence = { type: 'object', additionalProperties: false, properties: {
  initialFrameId: { type: 'string' },
  frames: { type: 'array', required: true, items: {
    type: 'object', additionalProperties: false, properties: {
      id: { ...identifier, required: true }, label: { type: 'string', required: true },
      description: { type: 'string' },
      focusIds: {
        type: 'array', items: { type: 'string' }, required: true,
        description: 'At most 64 unique ids already declared by content.',
      },
    },
  }, description: '2 to 12 sequence frames.' },
} } as const

const learnerStateUpdateOutput = { type: 'object', additionalProperties: false, properties: {
  status: { type: 'string', enum: ['updated', 'corrected', 'reset'], required: true },
  revision: { type: 'integer', required: true },
} } as const

const VISUAL_KINDS = [
  'plot', 'node_link', 'scene_2d', 'relation', 'timeline', 'formula_steps', 'study_map', 'recall_deck',
  'data_table', 'state_transition', 'sequence_buffer', 'sequence_diagram', 'code_trace', 'field_2d', 'causal_loop',
] as const
type VisualKind = typeof VISUAL_KINDS[number]

const VISUAL_CONTENT_SCHEMAS: Record<VisualKind, ValueSchemaSpec> = {
  plot: plotContent,
  node_link: nodeLinkContent,
  scene_2d: sceneContent,
  relation: relationContent,
  timeline: timelineContent,
  formula_steps: formulaStepsContent,
  study_map: studyMapContent,
  recall_deck: recallDeckContent,
  data_table: dataTableContent,
  state_transition: stateTransitionContent,
  sequence_buffer: sequenceBufferContent,
  sequence_diagram: sequenceDiagramContent,
  code_trace: codeTraceContent,
  field_2d: field2DContent,
  causal_loop: causalLoopContent,
}

const LEARNING_TOOL_PREFIX = 'learning_'
const GENERIC_USER_WAIT_TOOL = 'ask_user_question'
const learningRoutes = new WeakMap<object, LearningTurnRouteDecision>()
type RichTeachingMove = 'visual' | 'checkpoint'
const richTeachingMoves = new WeakMap<object, RichTeachingMove>()

function textFromUserMessage(message: UserMessage): string {
  return message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim()
}

function richTeachingMoveForTool(name: string): RichTeachingMove | undefined {
  if (name === 'learning_visual_select' || name === 'learning_visual') return 'visual'
  if (name === CHECKPOINT_TOOL_NAME) return 'checkpoint'
  return undefined
}

function learningToolAvailable(
  decision: LearningTurnRouteDecision | undefined,
  toolName: string,
  richClientAvailable: boolean,
): boolean {
  if (decision?.intent.intent === 'learn' && toolName === GENERIC_USER_WAIT_TOOL) return false
  if (!toolName.startsWith(LEARNING_TOOL_PREFIX) || toolName === 'learning_state_update') return true
  if (decision === undefined) return true
  if (decision.intent.intent !== 'learn' || !richClientAvailable) return false
  const richMove = richTeachingMoveForTool(toolName)
  if (richMove === 'checkpoint') {
    return decision.route === 'teach-minimum' || decision.route === 'continue'
  }
  if (richMove === 'visual') {
    return decision.route === 'teach-minimum'
      || decision.route === 'continue'
      || decision.route === 'overview'
      || (decision.route === 'direct' && decision.reason === 'resource-creation')
  }
  return true
}

function learningSegmentComplete(services: LearningAgentContext, agent: Agent): boolean {
  const state = services.learningActivities.learnerState(agent)
  return state.phase === 'complete' || state.nextMove === 'complete'
}

function durableLearningSegmentActive(services: LearningAgentContext, agent: Agent): boolean {
  const state = services.learningActivities.learnerState(agent)
  return state.goal !== null && state.phase !== 'complete' && state.nextMove !== 'complete'
}

const visualSelectorOutput = { type: 'object', additionalProperties: false, properties: {
  status: { type: 'string', const: 'selected', required: true },
  kind: { type: 'string', enum: VISUAL_KINDS, required: true },
} } as const

const visualSelectorParameters = {
  kind: {
    type: 'string',
    enum: VISUAL_KINDS,
    required: true,
    description: [
      'Choose by relationship:',
      'plot=quantitative axes or parameter sensitivity;',
      'node_link=topology; scene_2d=spatial construction; relation=comparison, mapping, or sets;',
      'timeline=chronology; formula_steps=derivation; study_map=source structure; recall_deck=active recall;',
      'data_table=records; state_transition=event-driven states; sequence_buffer=indexed slots;',
      'sequence_diagram=ordered messages; code_trace=execution; field_2d=scalar/vector field; causal_loop=signed feedback.',
    ].join(' '),
  },
  purpose: {
    type: 'string',
    required: true,
    description: 'One sentence naming the learner relationship this visual will make clearer.',
  },
  learnerAction: {
    type: 'string',
    description: 'Use instead of pairedQuestion for the one observation or manipulation the learner should make.',
  },
  pairedQuestion: {
    type: 'string',
    description: 'Use instead of learnerAction for the one focused question asked after the visual returns.',
  },
} as const

interface VisualSelection {
  kind: VisualKind
  purpose: string
  learnerAction?: string
  pairedQuestion?: string
}

function visualParameters(kind: VisualKind): Record<string, ParameterPropertySpec> {
  return {
    protocol: { type: 'string', const: VISUAL_PROTOCOL_V4, required: true },
    title: { type: 'string', description: 'Concise visible and accessible visual title.', required: true },
    description: { type: 'string', description: 'Optional one-sentence exploration hint; do not repeat surrounding prose.' },
    content: required(VISUAL_CONTENT_SCHEMAS[kind]),
    sequence,
    fallbackMarkdown: {
      type: 'string',
      description: 'Optional concise text equivalent for accessibility or an unavailable renderer.',
    },
  }
}

const visualDescription = (selection: VisualSelection): string => [
  `Render one trusted, non-blocking semantic ${selection.kind} visual selected for the current teaching move.`,
  'The selection step already chose the representation; now provide exactly that content kind.',
  `Teaching purpose: ${selection.purpose}`,
  ...(selection.learnerAction === undefined ? [] : [`Learner action: ${selection.learnerAction}`]),
  ...(selection.pairedQuestion === undefined ? [] : [`Paired question: ${selection.pairedQuestion}`]),
  selection.pairedQuestion === undefined
    ? 'The call completes immediately. Continue with a self-sufficient ordinary-text interpretation of the selected learner action; do not add another question.'
    : 'The call completes immediately. Continue with a self-sufficient ordinary-text interpretation and ask only the selected paired question.',
  'Keep all teaching explanation and learner prompting outside the visual payload; its title, labels, description, and fallback carry only the picture and its text equivalent.',
  'Do not use a visual for a definition, short fact, or already-clear explanation. Keep labels in the learner\'s language and declare every relationship the learner needs to read.',
  'Hard limits and field-specific payload rules are encoded in this kind-specific schema. Never provide HTML, Markdown diagrams, SVG markup, or JavaScript.',
].join(' ')

type DynamicToolTarget = Pick<ToolRuntime, 'get' | 'register'>

const dynamicVisualDisposers = new WeakMap<object, () => void>()
const GLOBAL_DYNAMIC_TOOL_KEY = {}

function disposeDynamicTeachingTools(key: object): void {
  dynamicVisualDisposers.get(key)?.()
  dynamicVisualDisposers.delete(key)
}

function dynamicToolTarget(services: LearningAgentContext, exec: ToolRunContext): DynamicToolTarget {
  const candidate = exec.agent as (ToolRunContext['agent'] & { id?: unknown }) | undefined
  return candidate?.ctx?.tools !== undefined
    ? candidate.ctx.tools
    : services.tools
}

function dynamicToolKey(_services: LearningAgentContext, exec: ToolRunContext): object {
  const candidate = exec.agent as (ToolRunContext['agent'] & { id?: unknown }) | undefined
  return candidate?.ctx?.tools !== undefined
    ? candidate
    : GLOBAL_DYNAMIC_TOOL_KEY
}

interface LoggedToolCall {
  readonly turn: number
  readonly step: number
  readonly callId: string
  readonly name: string
}

/**
 * Read the tool calls this Session attributes to model steps. The executor
 * logs `tool/call` lazily as each call starts, so later siblings of an
 * exclusive call are not logged yet; the committed `assistant/message` of the
 * step carries the complete set of tool-call blocks the model emitted.
 */
function loggedToolCalls(agent: Agent): LoggedToolCall[] {
  const calls: LoggedToolCall[] = []
  // `snapshotEvents()` is the synchronous 0.2 log reader (`Session.events` was
  // removed); a session-projection unit would avoid the full snapshot.
  for (const event of agent.session.snapshotEvents()) {
    if (event.type === 'tool/call') {
      calls.push({
        turn: event.data.turn,
        step: event.data.step,
        callId: String(event.data.callId),
        name: event.data.name,
      })
    } else if (event.type === 'assistant/message') {
      for (const block of event.data.message.content) {
        if (block.type !== 'tool-call') continue
        calls.push({ turn: event.data.turn, step: event.data.step, callId: String(block.id), name: block.name })
      }
    }
  }
  return calls
}

function assertSingleCheckpointInModelStep(exec: ToolRunContext): void {
  const agent = exec.agent
  if (agent === undefined) {
    throw new LearningProtocolError(['learning_checkpoint requires a live agent session'])
  }
  const calls = loggedToolCalls(agent)
  const ownCalls = calls.filter(call => call.callId === String(exec.callId))
  if (ownCalls.length === 0) {
    throw new LearningProtocolError(['learning_checkpoint callId is absent from the session tool/call log'])
  }
  const locations = new Set(ownCalls.map(call => `${String(call.turn)}:${String(call.step)}`))
  if (locations.size !== 1 || ownCalls.some(call => call.name !== 'learning_checkpoint')) {
    throw new LearningProtocolError(['learning_checkpoint callId does not identify one checkpoint model step'])
  }
  const own = ownCalls[ownCalls.length - 1]!
  const sameStep = calls.filter(call => call.turn === own.turn && call.step === own.step)
  const checkpointCallIds = new Set(sameStep
    .filter(call => call.name === 'learning_checkpoint')
    .map(call => call.callId))
  if (checkpointCallIds.size > 1) {
    throw new LearningProtocolError(['a model step may contain at most one learning_checkpoint call'])
  }
  if (sameStep.some(call => call.name !== 'learning_checkpoint')) {
    throw new LearningProtocolError(['learning_checkpoint must be the only tool call in its model step'])
  }
}

function boundedSelectionText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim()
  if (normalized === '') throw new TypeError(`${field} requires non-empty text`)
  if (normalized.length > maxLength) throw new TypeError(`${field} must not exceed ${String(maxLength)} characters`)
  return normalized
}

export function apply(ctx: Context): void {
  const services = ctx as LearningAgentContext

  // The route is resolved at the exact boundary where the claimed user input
  // is known. The 0.2 loop claims the inbox before it resolves the step's tool
  // set and assembles the prompt, so the dispatch gate and the prompt
  // listeners below observe this turn's decision. A pre-step listener is too
  // late to change the step, and rejecting a non-learning turn would
  // incorrectly close it as `blocked`.
  ctx.on('agent/inbox/claimed', ({ agent, message }) => {
    if (message.source.kind !== 'user') return
    // A payload schema belongs only to the selector/model loop that exposed it.
    // A new learner message starts a new decision and retires unfinished work.
    disposeDynamicTeachingTools(agent)
    richTeachingMoves.delete(agent)
    const text = textFromUserMessage(message)
    if (text === '') return
    const previous = learningRoutes.get(agent)
    const session: LearningRouteSession = previous === undefined
      ? { active: durableLearningSegmentActive(services, agent) }
      : previous.segment === 'closed'
        ? { active: false }
      : learningSegmentComplete(services, agent)
        ? { active: false }
        : { active: true, decision: previous }
    learningRoutes.set(agent, routeLearningTurn(text, session))
  })

  // The learning tool catalog stays registered and stable across turns: in
  // 0.2 the `system-prompt/assemble` waterfall no longer carries tools, and
  // changing declarations per request would invalidate the provider's
  // request-prefix KV cache. Routing is enforced here, at dispatch, and the
  // dynamic `learning:turn-route` context tells the model which learning
  // tools are usable this turn.
  ctx.on('tools/pre-execute', (execution, next) => {
    const agent = execution.agent
    const decision = agent === undefined ? undefined : learningRoutes.get(agent)
    if (decision?.intent.intent === 'learn' && execution.name === GENERIC_USER_WAIT_TOOL) {
      return Promise.resolve({
        kind: 'deny' as const,
        reason: 'ask calibration questions in ordinary text; learning_checkpoint is the only deliberate Learning wait',
      })
    }
    if (decision?.intent.intent === 'not-learn' && execution.name.startsWith(LEARNING_TOOL_PREFIX)) {
      return Promise.resolve({ kind: 'deny' as const, reason: 'learning tools are disabled for an ordinary turn' })
    }
    if (!learningToolAvailable(decision, execution.name, services.learningActivities.richClientAvailable)) {
      return Promise.resolve({
        kind: 'deny' as const,
        reason: 'this rich learning tool is unavailable for the current route or client; continue in ordinary text',
      })
    }
    const requestedRichMove = richTeachingMoveForTool(execution.name)
    const currentRichMove = agent === undefined ? undefined : richTeachingMoves.get(agent)
    if (requestedRichMove !== undefined && currentRichMove !== undefined && requestedRichMove !== currentRichMove) {
      return Promise.resolve({
        kind: 'deny' as const,
        reason: `a user turn may use either a learning ${currentRichMove} or a learning ${requestedRichMove}, not both`,
      })
    }
    return next()
  })

  // A Learning agent can receive an ordinary task after a teaching turn. Keep
  // the session, its durable learner state, the policy section, and the tool
  // catalog stable (prefix-cache friendly); only drop the dynamic learner-state
  // context from that individual ordinary request. The turn-route context
  // already tells the model the turn is ordinary.
  ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
    const agent = context.agent
    const decision = agent === undefined ? undefined : learningRoutes.get(agent)
    const assembly = await next()
    if (decision?.intent.intent !== 'not-learn') return assembly
    return {
      ...assembly,
      contexts: assembly.contexts.filter(context => context.name !== 'learning:learner-state'),
    }
  })

  services.tools.register(closeParameterRoot(defineTool({
    name: 'learning_visual_select',
    description: 'Use only when a visual will materially clarify one relationship. Make this tool call the only output of the selector step; wait until learning_visual returns before writing teaching prose. Select one native kind, state its teaching purpose, and bind it to exactly one learner action or paired question; the selected kind-specific learning_visual schema is exposed on the next model step. Do not select a visual for a definition, short fact, or already-clear explanation.',
    parameters: visualSelectorParameters,
    output: {
      schema: visualSelectorOutput,
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const purpose = boundedSelectionText(args.purpose, 'learning_visual_select.purpose', 500)
      const learnerAction = typeof args.learnerAction === 'string' ? args.learnerAction.trim() : ''
      const pairedQuestion = typeof args.pairedQuestion === 'string' ? args.pairedQuestion.trim() : ''
      if ((learnerAction === '') === (pairedQuestion === '')) {
        throw new TypeError('learning_visual_select requires exactly one of learnerAction or pairedQuestion')
      }
      if (learnerAction !== '') boundedSelectionText(learnerAction, 'learning_visual_select.learnerAction', 500)
      if (pairedQuestion !== '') boundedSelectionText(pairedQuestion, 'learning_visual_select.pairedQuestion', 1_000)
      const selection: VisualSelection = {
        kind: args.kind,
        purpose,
        ...(learnerAction === '' ? {} : { learnerAction }),
        ...(pairedQuestion === '' ? {} : { pairedQuestion }),
      }
      const target = dynamicToolTarget(services, exec)
      const existing = target.get('learning_visual')
      const targetKey = dynamicToolKey(services, exec)
      if (existing !== undefined) {
        // A prior selector may have left a payload tool visible after a model
        // retry. Re-registering the selected kind must replace it, not collide.
        dynamicVisualDisposers.get(targetKey)?.()
        dynamicVisualDisposers.delete(targetKey)
      }
      const definition = closeParameterRoot(defineTool({
        name: 'learning_visual',
        description: visualDescription(selection),
        parameters: visualParameters(selection.kind),
        output: {
          schema: { type: 'object', additionalProperties: false, properties: {
            protocol: { type: 'string', const: VISUAL_RESULT_PROTOCOL_V4, required: true },
            status: { type: 'string', enum: LEARNING_VISUAL_STATUSES, required: true },
          } },
          render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
        },
        isConcurrencySafe: () => true,
        async execute(payload, payloadExec) {
          parseLearningVisualV4(payload)
          try {
            return {
              protocol: VISUAL_RESULT_PROTOCOL_V4,
              status: services.learningActivities.recordVisual(payloadExec.agent, String(payloadExec.callId)),
            } satisfies LearningVisualResultV4
          } finally {
            queueMicrotask(() => {
              const key = dynamicToolKey(services, payloadExec)
              const disposer = dynamicVisualDisposers.get(key)
              if (disposer !== undefined) {
                dynamicVisualDisposers.delete(key)
                disposer()
              }
            })
          }
        },
        presentCall: payload => ({
          card: 'generic',
          title: typeof payload.title === 'string' ? payload.title : 'Interactive visual',
          kind: 'other',
        }),
      }))
      const disposer = target.register(definition)
      dynamicVisualDisposers.set(targetKey, disposer)
      if (exec.agent !== undefined) richTeachingMoves.set(exec.agent, 'visual')
      return { status: 'selected' as const, kind: selection.kind }
    },
  })))

  services.tools.register(closeParameterRoot(defineTool({
    name: LEARNER_STATE_TOOL_NAME,
    description: learnerStateToolDescription,
    parameters: learnerStateToolParameters,
    output: {
      schema: learnerStateUpdateOutput,
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const agent = exec.agent
      if (agent === undefined) throw new Error('learning_state_update requires a live agent session')
      // The plan and the compare-and-swap revision come from one synchronous
      // read, so a batched call applies atomically against the state it saw.
      const state = services.learningActivities.learnerState(agent)
      const plan = planLearnerStateToolCall(args as LearnerStateToolArgs, {
        callId: String(exec.callId),
        state,
      })
      return services.learningActivities.updateLearnerState(
        learnerStateUpdateRequest(plan, agent, state.revision),
      ) satisfies LearningStateUpdateResult
    },
  })))

  services.tools.register(closeParameterRoot(defineTool({
    name: CHECKPOINT_TOOL_NAME,
    description: checkpointToolDescription,
    parameters: checkpointToolParameters,
    output: {
      schema: checkpointToolOutput,
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    isConcurrencySafe: () => false,
    async execute(payload, exec) {
      const checkpoint = parseLearningCheckpointV1(payload)
      assertSingleCheckpointInModelStep(exec)
      // The wait is this turn's rich move; a visual requested afterwards in
      // the same user turn is denied at dispatch.
      if (exec.agent !== undefined) richTeachingMoves.set(exec.agent, 'checkpoint')
      return await services.learningActivities.presentCheckpoint({
        checkpoint,
        agent: exec.agent,
        signal: exec.signal,
        callId: String(exec.callId),
      }) satisfies LearningCheckpointResultV1
    },
  })))

  services.systemPrompt.section({
    name: 'learning:policy',
    order: 20,
    text: LEARNING_TEACHING_POLICY,
  })
  services.systemPrompt.context({
    name: 'learning:turn-route',
    order: 19,
    text: context => {
      const agent = context.agent
      const decision = agent === undefined ? undefined : learningRoutes.get(agent)
      if (decision === undefined) return ''
      const richClient = services.learningActivities.richClientAvailable
      return routeContextText(decision, {
        richClient,
        visual: learningToolAvailable(decision, 'learning_visual_select', richClient),
        checkpoint: learningToolAvailable(decision, CHECKPOINT_TOOL_NAME, richClient),
      })
    },
  })
  services.systemPrompt.context({
    name: 'learning:learner-state',
    order: 20,
    text: context => {
      const agent = context.agent
      return agent === undefined
        ? ''
        : services.learningActivities.learnerStateTranscript(agent, 300)
    },
  })
}
