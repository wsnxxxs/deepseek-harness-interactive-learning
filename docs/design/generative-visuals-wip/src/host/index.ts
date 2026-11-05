/**
 * `@dsh-portable/visual/host`: the visual tools as a library, for presets that
 * offer visuals from their own scope instead of mounting the host plugin.
 */
export { installVisualTools, visualClientComposed, type InstallVisualToolsOptions } from './install.ts'
export {
  acceptVisual,
  createVisualTools,
  GUIDE_FIRST_ERROR,
  GUIDE_MODULES_DESCRIPTION,
  NORMALIZED_NOTE,
  READ_VISUAL_GUIDE_DESCRIPTION,
  SHOW_VISUAL_DESCRIPTION,
  SHOWN_TEXT,
  showVisualResultText,
  UNAVAILABLE_TEXT,
  VISUAL_CODE_DESCRIPTION,
  VISUAL_TITLE_DESCRIPTION,
  type ShownVisual,
  type ShowVisualStatus,
  type VisualTools,
  type VisualToolsOptions,
} from './tools.ts'
export { guideLoaded } from './guide-state.ts'
export {
  MAX_VISUAL_CODE_BYTES,
  MAX_VISUAL_TITLE_LENGTH,
  READ_VISUAL_GUIDE_TOOL,
  SHOW_VISUAL_TOOL,
  VISUAL_GUIDE_MODULES,
  VISUAL_PACKAGE_NAME,
  VISUAL_TOOL_NAMES,
  type VisualGuideModule,
} from '../identity.ts'
