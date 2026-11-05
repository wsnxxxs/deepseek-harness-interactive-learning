/**
 * Validation primitives shared by every closed payload family.
 *
 * Each check appends a path-qualified, actionable issue instead of throwing,
 * so one validation pass reports every violation of a payload at once. The
 * visual content validators use them, and so do presets that validate their
 * own payload families with the same issue wording.
 */
/** A JSON object: never an array or `null`. */
export type RecordValue = Record<string, unknown>;
/** Whether a value is a JSON object (never an array or `null`). */
export declare function isRecord(value: unknown): value is RecordValue;
/** Report every key of `value` that `allowed` does not list. */
export declare function validateOnlyKeys(value: RecordValue, allowed: readonly string[], path: string, issues: string[]): void;
/** A non-blank string of at most `max` characters. */
export declare function validateText(value: unknown, path: string, issues: string[], max?: number): value is string;
/** A finite number. */
export declare function validateFinite(value: unknown, path: string, issues: string[]): value is number;
/** An integer of at least `min`. */
export declare function validateInteger(value: unknown, path: string, issues: string[], min?: number): value is number;
/** A short, lower-case, author-chosen identifier. */
export declare function validateId(value: unknown, path: string, issues: string[]): value is string;
/** Report every entry whose string `id` repeats an earlier entry's. */
export declare function validateUniqueIds(values: readonly RecordValue[], path: string, issues: string[]): void;
/** UTF-8 size of the JSON encoding, or `undefined` when the value is not serializable. */
export declare function jsonByteLength(value: unknown): number | undefined;
//# sourceMappingURL=checks.d.ts.map