/**
 * Owner props for rendering `LearningToolView` outside the slot renderer.
 *
 * Harness 0.2 hands a keyed tool view one phase of its call
 * (`preparing` / `start` / `result`, see ui-tool `ToolCallViewProps`) plus the
 * shared owner callbacks; this package's registration adds the owning Session
 * id and a selector hook over the Learning waits the composer seat claims.
 */
import { PartialArguments } from '@deepseek-ai/dsh-util-values'
import type { ComponentType } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { LearningToolView } from '../src/client/LearningToolView.tsx'
import type { LearningQuestionWait } from '../src/client/learning-waits.ts'
import { en } from '../src/client/locales.ts'

/** Learning dictionary lookup; shared `common` keys (Markdown chrome) echo their key. */
export const t = ((key: string, params?: Record<string, string | number>) => {
  let value: string = (en as Record<string, string>)[key] ?? key
  for (const [name, replacement] of Object.entries(params ?? {})) {
    value = value.replace(`{${name}}`, String(replacement))
  }
  return value
}) as TranslateNS<'interactive-learning'>

export const ToolView = LearningToolView as unknown as ComponentType<Record<string, unknown>>

/** A dispatched call with complete arguments and no result yet. */
export function startedBlock(callId: string, name: string, argsRaw: string) {
  return {
    phase: 'start' as const,
    callId,
    name,
    turn: 1,
    step: 1,
    time: 1_000,
    subCalls: [],
    args: PartialArguments.fromText(argsRaw),
    argsRaw,
  }
}

/** A call whose arguments are still streaming: only the lazy reader exists. */
export function preparingBlock(callId: string, name: string, partialArgs: string) {
  return {
    phase: 'preparing' as const,
    callId,
    name,
    turn: 1,
    step: 1,
    time: 1_000,
    subCalls: [],
    args: PartialArguments.fromText(partialArgs),
  }
}

type AnyBlock = { callId: string; kind?: string; phase?: string; name?: string; call?: { name: string } | null }

/** Compose the full owner + injected props for one block. */
export function toolViewProps(
  block: AnyBlock,
  options: { sessionId?: string; waits?: readonly LearningQuestionWait[]; t?: TranslateNS<'interactive-learning'> } = {},
) {
  const phase = block.kind === 'tool-result' ? 'result' : block.phase === 'preparing' ? 'preparing' : 'start'
  const waits = options.waits ?? []
  return {
    phase,
    block,
    callId: block.callId,
    toolName: block.name ?? block.call?.name ?? 'learning_visual',
    useDisclosure: () => [false, () => {}],
    openFile: () => {},
    loadImage: async () => '',
    inspect: () => {},
    t: options.t ?? t,
    learningSessionId: options.sessionId ?? 'session_test',
    useLearningWaits: <S,>(selector: (value: readonly LearningQuestionWait[]) => S): S => selector(waits),
  }
}
