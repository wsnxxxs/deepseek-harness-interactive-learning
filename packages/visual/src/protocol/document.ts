/**
 * The visual document envelope: a titled content value, an optional frame
 * sequence over its ids, and an optional text equivalent.
 *
 * `parseVisualDocument` validates a bare document. A preset that versions its
 * own envelope (Learning's `dsh-learning/visual@4`) checks its extra fields
 * itself and delegates everything else to `validateVisualDocumentFields`, so
 * both report identical content issues.
 */
import {
  isRecord as record,
  jsonByteLength as jsonBytes,
  validateId as id,
  validateOnlyKeys as onlyKeys,
  validateText as text,
  validateUniqueIds as uniqueIds,
  type RecordValue,
} from './checks.ts'
import { validateVisualContent } from './content.ts'
import type { VisualDocument } from './model.ts'

/** The largest JSON encoding a document may have. */
export const MAX_VISUAL_DOCUMENT_BYTES = 64 * 1024

/** Every top-level field a document may carry. */
export const VISUAL_DOCUMENT_KEYS = ['title', 'description', 'content', 'sequence', 'fallbackMarkdown'] as const

/** A stable, actionable rejection listing every violation found in one pass. */
export class VisualProtocolError extends Error {
  readonly code = 'INVALID_VISUAL'

  constructor(readonly issues: readonly string[]) {
    super(`Invalid visual: ${issues.join('; ')}`)
    this.name = 'VisualProtocolError'
  }
}

/** Validate an optional frame sequence whose focus ids must name declared content ids. */
export function validateVisualSequence(value: unknown, focusIds: ReadonlySet<string>, issues: string[]): void {
  if (value === undefined) return
  if (!record(value)) {
    issues.push('visual.sequence must be an object')
    return
  }
  onlyKeys(value, ['initialFrameId', 'frames'], 'visual.sequence', issues)
  if (!Array.isArray(value.frames) || value.frames.length < 2 || value.frames.length > 12) {
    issues.push('visual.sequence.frames must contain 2 to 12 frames')
    return
  }
  const frames = value.frames.filter(record)
  if (frames.length !== value.frames.length) issues.push('visual.sequence.frames entries must be objects')
  uniqueIds(frames, 'visual.sequence.frames', issues)
  const frameIds = new Set<string>()
  for (const [index, frame] of frames.entries()) {
    const path = `visual.sequence.frames[${String(index)}]`
    onlyKeys(frame, ['id', 'label', 'description', 'focusIds'], path, issues)
    if (id(frame.id, `${path}.id`, issues)) frameIds.add(frame.id)
    text(frame.label, `${path}.label`, issues, 120)
    if (frame.description !== undefined) text(frame.description, `${path}.description`, issues, 1_000)
    if (!Array.isArray(frame.focusIds) || frame.focusIds.length > 64) {
      issues.push(`${path}.focusIds must contain at most 64 ids`)
      continue
    }
    const seen = new Set<string>()
    for (const [focusIndex, focusId] of frame.focusIds.entries()) {
      if (typeof focusId !== 'string' || !focusIds.has(focusId)) {
        issues.push(`${path}.focusIds[${String(focusIndex)}] must reference visual content`)
      } else if (seen.has(focusId)) {
        issues.push(`${path}.focusIds duplicates ${focusId}`)
      } else seen.add(focusId)
    }
  }
  if (value.initialFrameId !== undefined
    && (typeof value.initialFrameId !== 'string' || !frameIds.has(value.initialFrameId))) {
    issues.push('visual.sequence.initialFrameId must reference a declared frame')
  }
}

/**
 * Validate every document field (title, description, text equivalent, content
 * and sequence) of an object whose own keys the caller has already checked.
 */
export function validateVisualDocumentFields(value: RecordValue, issues: string[]): void {
  text(value.title, 'visual.title', issues, 200)
  if (value.description !== undefined) text(value.description, 'visual.description', issues, 1_000)
  if (value.fallbackMarkdown !== undefined) text(value.fallbackMarkdown, 'visual.fallbackMarkdown', issues, 8_000)
  const focusIds = validateVisualContent(value.content, issues)
  validateVisualSequence(value.sequence, focusIds, issues)
}

/**
 * Validate and narrow an untrusted visual document.
 * @throws {VisualProtocolError} listing every violation when the value is not a valid document.
 */
export function parseVisualDocument(value: unknown): VisualDocument {
  const issues: string[] = []
  const bytes = jsonBytes(value)
  if (bytes === undefined) issues.push('visual must be serializable JSON')
  else if (bytes > MAX_VISUAL_DOCUMENT_BYTES) issues.push(`visual exceeds ${String(MAX_VISUAL_DOCUMENT_BYTES)} bytes`)
  if (!record(value)) throw new VisualProtocolError([...issues, 'visual must be an object'])
  onlyKeys(value, VISUAL_DOCUMENT_KEYS, 'visual', issues)
  validateVisualDocumentFields(value, issues)
  if (issues.length > 0) throw new VisualProtocolError(issues)
  return value as unknown as VisualDocument
}
