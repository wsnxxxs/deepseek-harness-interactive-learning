import { fileURLToPath } from 'node:url'
import { registerInteractiveLearningSessionCompatibility } from './bootstrap.ts'

// Standalone Hosts should import this entry before boot. This is the
// load-order boundary that makes persisted learning/state events known before
// any session resume/load can validate them.
registerInteractiveLearningSessionCompatibility()

/** Packaged preset asset root. */
export const interactiveLearningPresetRoot = fileURLToPath(new URL('../preset/', import.meta.url))

/**
 * Packaged Learning preset assets. On harness 0.2 the preset itself is the
 * `preset-learning` declaration row in this package's `cordis.patch.yml`;
 * this directory only carries the assets that row resolves (its skills).
 */
export const interactiveLearningPresetSource = fileURLToPath(new URL('../preset/learning/', import.meta.url))

/** Skill root mounted by the preset's `skill-filesystem` row. */
export const interactiveLearningSkillsRoot = fileURLToPath(new URL('../preset/learning/skills/', import.meta.url))

/** Bundle patch that declares the Host broker row and the Learning preset row. */
export const interactiveLearningBundlePatch = fileURLToPath(new URL('../cordis.patch.yml', import.meta.url))
