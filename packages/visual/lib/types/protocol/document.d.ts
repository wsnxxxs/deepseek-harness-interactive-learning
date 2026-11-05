/**
 * The visual document envelope: a titled content value, an optional frame
 * sequence over its ids, and an optional text equivalent.
 *
 * `parseVisualDocument` validates a bare document. A preset that versions its
 * own envelope (Learning's `dsh-learning/visual@4`) checks its extra fields
 * itself and delegates everything else to `validateVisualDocumentFields`, so
 * both report identical content issues.
 */
import { type RecordValue } from './checks.ts';
import type { VisualDocument } from './model.ts';
/** The largest JSON encoding a document may have. */
export declare const MAX_VISUAL_DOCUMENT_BYTES: number;
/** Every top-level field a document may carry. */
export declare const VISUAL_DOCUMENT_KEYS: readonly ["title", "description", "content", "sequence", "fallbackMarkdown"];
/** A stable, actionable rejection listing every violation found in one pass. */
export declare class VisualProtocolError extends Error {
    readonly issues: readonly string[];
    readonly code = "INVALID_VISUAL";
    constructor(issues: readonly string[]);
}
/** Validate an optional frame sequence whose focus ids must name declared content ids. */
export declare function validateVisualSequence(value: unknown, focusIds: ReadonlySet<string>, issues: string[]): void;
/**
 * Validate every document field (title, description, text equivalent, content
 * and sequence) of an object whose own keys the caller has already checked.
 */
export declare function validateVisualDocumentFields(value: RecordValue, issues: string[]): void;
/**
 * Validate and narrow an untrusted visual document.
 * @throws {VisualProtocolError} listing every violation when the value is not a valid document.
 */
export declare function parseVisualDocument(value: unknown): VisualDocument;
//# sourceMappingURL=document.d.ts.map