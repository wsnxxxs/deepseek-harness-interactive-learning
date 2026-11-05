/**
 * Whether the model can still see a drawing guide in this session.
 *
 * `show_visual` requires a guide the model has read, and `read_visual_guide`
 * adds the core rules only to a session's first guide. Both read the session
 * log: a successful `read_visual_guide` result, as a top-level call or as a
 * code-mode sub-call, counts unless compaction has since shadowed it (a
 * summary replaced it, or the tool-result pruner cut it down). Calls earlier
 * in the same model step are not logged yet, so a successful read is also
 * remembered in memory until the next compaction.
 */
import type { Agent } from '@deepseek-ai/dsh-agent'
import { READ_VISUAL_GUIDE_TOOL } from '../identity.ts'

interface LoggedEvent {
  readonly type: string
  readonly seq: number
  readonly data: unknown
}

/** Session position (the next sequence number) at each agent's latest successful guide read. */
const recentReads = new WeakMap<Agent, number>()

/** Remember a successful guide read that the session has not logged yet. */
export function rememberGuideRead(agent: Agent): void {
  recentReads.set(agent, agent.session.seq)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whether a guide result is visible to the model in this agent's session. */
export function guideLoaded(agent: Agent): boolean {
  const events = agent.session.snapshotEvents() as readonly LoggedEvent[]
  const shadowed = new Set<number>()
  let lastCompaction = -1
  for (const event of events) {
    if (event.type !== 'compaction/summary' && event.type !== 'compaction/prune') continue
    lastCompaction = event.seq
    const seqs = isRecord(event.data) && Array.isArray(event.data.shadowedSeqs) ? event.data.shadowedSeqs : []
    for (const seq of seqs) if (typeof seq === 'number') shadowed.add(seq)
  }
  const guideCalls = new Set<string>()
  for (const event of events) {
    if (!isRecord(event.data)) continue
    if (event.type === 'tool/call') {
      if (event.data.name === READ_VISUAL_GUIDE_TOOL) guideCalls.add(String(event.data.callId))
    } else if (event.type === 'tool/result') {
      const message = isRecord(event.data.message) ? event.data.message : undefined
      const source = isRecord(message?.source) ? message.source : undefined
      const callId = String(message?.toolCallId ?? source?.callId)
      if (guideCalls.has(callId) && message?.isError !== true && !shadowed.has(event.seq)) return true
    } else if (event.type === 'tool/ptc-dispatch') {
      if (event.data.name === READ_VISUAL_GUIDE_TOOL && event.data.isError !== true && !shadowed.has(event.seq)) return true
    }
  }
  const recent = recentReads.get(agent)
  return recent !== undefined && recent > lastCompaction
}
