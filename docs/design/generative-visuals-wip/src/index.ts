/**
 * Host entry of `@dsh-portable/visual`: the host plugin that attaches
 * `read_visual_guide` and `show_visual` to each eligible agent (mounted by the
 * package's bundle patch), plus the package identity.
 *
 * Presets that offer visuals from their own scope use
 * `installVisualTools` from `@dsh-portable/visual/host` instead.
 */
export { apply, Config, inject, name } from './host/plugin.ts'
export type { Config as VisualPluginConfig } from './host/plugin.ts'
export {
  READ_VISUAL_GUIDE_TOOL,
  SHOW_VISUAL_TOOL,
  VISUAL_LOCALE_NAMESPACE,
  VISUAL_PACKAGE_NAME,
  VISUAL_VIEWS_SERVICE,
} from './identity.ts'
