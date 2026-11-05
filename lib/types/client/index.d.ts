/** Client entry: one composer takeover and one replayable keyed tool renderer. */
import type { Context } from '@deepseek-ai/cordis';
import type { SlotCore, SlotMap } from '@deepseek-ai/dsh-client-ui-slots';
export { ActivityRendererRegistry, activityRendererRegistry } from './ActivityRenderer.tsx';
export { subscribeLearningUiLifecycle, type LearningUiLifecycleEvent } from './lifecycle.ts';
export declare const LEARNING_TOOL_VIEW_KEYS: readonly ["learning_visual", "learning_checkpoint", "learning_state_update", "learning_activity", "learning_question", "learning_reveal"];
/** Learner-state writes are internal bookkeeping and never produce a card. */
export declare function LearningStateUpdateToolView(): null;
/** One synchronous effect installed while an injected slot declaration is live. */
type SlotInjectionEffect = (() => void) | Iterable<() => void, void, void>;
/**
 * The slot-registry face this plugin uses: the renderer-owned `ctx.slots`
 * service (`packages/client/ui-renderer/src/client/registry.ts`), whose
 * `register` is exactly {@link SlotCore.register}. Named structurally so the
 * Client compiles without a type edge to the renderer implementation package.
 */
interface LearningSlots {
    register: SlotCore['register'];
    inject(key: keyof SlotMap & string, callback: () => SlotInjectionEffect): () => void;
}
/** Root Client Context with the services this plugin injects. */
type LearningClientContext = Context & {
    slots: LearningSlots;
};
export declare const name = "interactive-learning-client";
export declare const inject: string[];
export declare function apply(ctx: LearningClientContext): void;
//# sourceMappingURL=index.d.ts.map