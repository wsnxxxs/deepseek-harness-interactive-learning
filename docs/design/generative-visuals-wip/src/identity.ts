/** The package name, which is also the plugin id its Client bundle stamps on its styles. */
export const VISUAL_PACKAGE_NAME = '@dsh-portable/visual'

/** The cordis service name of the Client view registry (see `@dsh-portable/visual/client`). */
export const VISUAL_VIEWS_SERVICE = 'dshVisualViews'

/** The locale namespace of the Client views. */
export const VISUAL_LOCALE_NAMESPACE = 'dsh-visual'

/** The tool that loads the drawing guide. */
export const READ_VISUAL_GUIDE_TOOL = 'read_visual_guide'

/** The tool that draws a visual. */
export const SHOW_VISUAL_TOOL = 'show_visual'

/** Both model-facing tools, in the order they are registered. */
export const VISUAL_TOOL_NAMES = Object.freeze([READ_VISUAL_GUIDE_TOOL, SHOW_VISUAL_TOOL] as const)

/** The guide modules `read_visual_guide` loads, in the order the tool lists them. */
export const VISUAL_GUIDE_MODULES = Object.freeze(['diagram', 'chart', 'interactive', 'ui', 'math'] as const)

export type VisualGuideModule = typeof VISUAL_GUIDE_MODULES[number]

/** Largest `show_visual` code, in UTF-8 bytes. */
export const MAX_VISUAL_CODE_BYTES = 256 * 1024

/** Longest `show_visual` title, in characters. */
export const MAX_VISUAL_TITLE_LENGTH = 120
