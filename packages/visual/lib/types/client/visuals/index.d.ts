import type { VisualDocument } from '../../protocol/model.ts';
import { type VisualLabels } from './core/labels.ts';
export interface VisualViewProps {
    visual: VisualDocument;
    /** Stable per-call key under which learner-owned view state survives a replay. */
    storageKey?: string;
    /** Localized strings; anything omitted falls back to {@link DEFAULT_VISUAL_LABELS}. */
    labels?: Partial<VisualLabels>;
    /** Optional sink for learner-owned recall ratings. */
    onRecallStatusChange?: (cardId: string, status: 'revealed' | 'mastered' | 'review') => void;
}
export declare function VisualView({ visual, storageKey, labels: suppliedLabels, onRecallStatusChange, }: VisualViewProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map