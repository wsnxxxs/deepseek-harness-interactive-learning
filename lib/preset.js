import { t as registerInteractiveLearningSessionCompatibility } from "./bootstrap-Blkj1cHT.js";
import { fileURLToPath } from "node:url";
//#region lib/types/preset.js
registerInteractiveLearningSessionCompatibility();
/** Packaged preset asset root. */
const interactiveLearningPresetRoot = fileURLToPath(new URL("../preset/", import.meta.url));
/**
* Packaged Learning preset assets. On harness 0.2 the preset itself is the
* `preset-learning` declaration row in this package's `cordis.patch.yml`;
* this directory only carries the assets that row resolves (its skills).
*/
const interactiveLearningPresetSource = fileURLToPath(new URL("../preset/learning/", import.meta.url));
/** Skill root mounted by the preset's `skill-filesystem` row. */
const interactiveLearningSkillsRoot = fileURLToPath(new URL("../preset/learning/skills/", import.meta.url));
/** Bundle patch that declares the Host broker row and the Learning preset row. */
const interactiveLearningBundlePatch = fileURLToPath(new URL("../cordis.patch.yml", import.meta.url));
//#endregion
export { interactiveLearningBundlePatch, interactiveLearningPresetRoot, interactiveLearningPresetSource, interactiveLearningSkillsRoot };
