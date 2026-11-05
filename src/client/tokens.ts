/**
 * Design-token scope for every learning surface.
 *
 * Learning surfaces (the checkpoint, the legacy activity replay and the tool
 * view) share the visual package's single token sheet: spreading
 * {@link learningScope} onto a root element marks it `data-visual-scope`,
 * which opts its subtree into the shared type ramp, spacing, tones, focus ring
 * and motion.
 */
export { visualScope as learningScope } from '@dsh-portable/visual/react'
