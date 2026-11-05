/** A plot or scene axis: an ordered, finite range with an optional label and sample count. */
export declare function validateAxis(value: unknown, path: string, issues: string[], samplesAllowed: boolean): void;
/**
 * Validate one untrusted `visual.content` value against the kind it names.
 * @returns the ids a sequence frame may focus; empty when the content is invalid.
 */
export declare function validateVisualContent(value: unknown, issues: string[]): Set<string>;
//# sourceMappingURL=content.d.ts.map