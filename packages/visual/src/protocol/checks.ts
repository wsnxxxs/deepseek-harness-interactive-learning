/**
 * Validation primitives shared by every closed payload family.
 *
 * Each check appends a path-qualified, actionable issue instead of throwing,
 * so one validation pass reports every violation of a payload at once. The
 * visual content validators use them, and so do presets that validate their
 * own payload families with the same issue wording.
 */

/** A JSON object: never an array or `null`. */
export type RecordValue = Record<string, unknown>

/** Whether a value is a JSON object (never an array or `null`). */
export function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Report every key of `value` that `allowed` does not list. */
export function validateOnlyKeys(value: RecordValue, allowed: readonly string[], path: string, issues: string[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) issues.push(`${path}.${key} is not supported`)
  }
}

/** A non-blank string of at most `max` characters. */
export function validateText(value: unknown, path: string, issues: string[], max = 8_000): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    issues.push(`${path} must be a non-empty string`)
    return false
  }
  if (value.length > max) issues.push(`${path} exceeds ${String(max)} characters`)
  return true
}

/** A finite number. */
export function validateFinite(value: unknown, path: string, issues: string[]): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push(`${path} must be a finite number`)
    return false
  }
  return true
}

/** An integer of at least `min`. */
export function validateInteger(value: unknown, path: string, issues: string[], min = 0): value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min) {
    issues.push(`${path} must be an integer >= ${String(min)}`)
    return false
  }
  return true
}

/** A short, lower-case, author-chosen identifier. */
export function validateId(value: unknown, path: string, issues: string[]): value is string {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9_-]{0,31}$/.test(value)) {
    issues.push(`${path} must match ^[a-z][a-z0-9_-]{0,31}$`)
    return false
  }
  return true
}

/** Report every entry whose string `id` repeats an earlier entry's. */
export function validateUniqueIds(values: readonly RecordValue[], path: string, issues: string[]): void {
  const seen = new Set<string>()
  for (const [index, value] of values.entries()) {
    if (typeof value.id !== 'string') continue
    if (seen.has(value.id)) issues.push(`${path}[${String(index)}].id duplicates ${value.id}`)
    seen.add(value.id)
  }
}

/** UTF-8 size of the JSON encoding, or `undefined` when the value is not serializable. */
export function jsonByteLength(value: unknown): number | undefined {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength
  } catch {
    return undefined
  }
}
