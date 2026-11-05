/**
 * Design-token scope for every visual surface, and for any surface that
 * embeds one (Learning's checkpoint, legacy activities and tool view adopt it
 * too, so there is exactly one token sheet).
 *
 * Importing this module loads `tokens.module.css`, which declares the shared
 * type ramp, spacing, radii, tones, focus ring and motion on the unhashed
 * `[data-visual-scope]` selector. Spreading {@link visualScope} onto a root
 * element opts its whole subtree into that scale, across every CSS Module.
 */
import tokenSheet from './tokens.module.css'

export const visualScope = { 'data-visual-scope': '' } as const

// The sheet declares only attribute-scoped custom properties, so its class map
// is empty. This value use keeps the import, and with it the injected <style>,
// in every compiled output; a bare side-effect import would also be copied
// into the published declarations, which do not ship stylesheets.
void tokenSheet
