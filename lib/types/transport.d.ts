import { type LearningActivityEnvelopeV1, type LearningActivityEnvelopeInputV1, type LearningWaitEnvelopeInputV2, type LearningWaitEnvelopeV2 } from './protocol.ts';
/** Hide the structured activity envelope in a Markdown comment before the readable fallback. */
export declare function encodeLearningDetail(input: LearningActivityEnvelopeInputV1): string;
/** Decode and revalidate a package-owned question detail; ordinary questions return undefined. */
export declare function decodeLearningDetail(detail: unknown): LearningActivityEnvelopeV1 | undefined;
/** The question id is an opaque reference; it never serializes a learning payload. */
export declare function learningWaitQuestionId(waitId: string): string;
export declare function decodeLearningWaitQuestionId(value: unknown): string | undefined;
/**
 * Persist only the current, already validated V2 gate in detail so a refreshed
 * Client can recover it. The opaque question id remains free of projection data.
 */
export declare function encodeLearningWaitDetail(input: LearningWaitEnvelopeInputV2): string;
export declare function decodeLearningWaitDetail(detail: unknown): LearningWaitEnvelopeV2 | undefined;
//# sourceMappingURL=transport.d.ts.map