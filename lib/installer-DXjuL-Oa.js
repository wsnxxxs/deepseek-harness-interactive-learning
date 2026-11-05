import { createHash } from "node:crypto";
import { readFile, rmdir, unlink } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { homedir } from "node:os";
//#region lib/types/installer.js
/**
* Legacy preset-directory tooling kept for compatibility with harness 0.2.
*
* Harness 0.1 discovered user presets from `$DSH_HOME/.agent-presets/<id>/`
* (`preset.yml` + `agent.cordis.yml`), so this package once copied its preset
* there. Harness 0.2 reads only declaration rows; the Learning preset now
* ships as the `preset-learning` row of this package's bundle patch. This
* module retires copies written by earlier versions without touching edits.
*/
const LEARNING_PACK_VERSION = "0.1.0";
const LEARNING_MANIFEST_FILE = ".dsh-managed.json";
/** Package that ships the preset declaration in its bundle patch. */
const LEARNING_BUNDLE_PACKAGE = "@dsh-portable/interactive-learning";
/** Stable preset id recorded by sessions that select Learning. */
const LEARNING_PRESET_ID = "learning";
/** Legacy (harness < 0.2) user-preset directory that earlier versions wrote. */
function legacyLearningPresetTarget(dshHome) {
	return targetFor(dshHome);
}
function defaultDshHome() {
	const configured = process.env.DSH_HOME?.trim();
	return resolve(configured === void 0 || configured === "" ? join(homedir(), ".dsh") : configured);
}
function targetFor(dshHome) {
	return join(resolve(dshHome ?? defaultDshHome()), ".agent-presets", "learning");
}
function digest(value) {
	return createHash("sha256").update(value).digest("hex");
}
async function fileDigest(path) {
	try {
		return digest(await readFile(path));
	} catch (error) {
		if (error.code === "ENOENT") return void 0;
		throw error;
	}
}
function safePath(root, candidate) {
	if (candidate === "" || candidate.startsWith("/") || candidate.startsWith("\\")) return void 0;
	const destination = resolve(root, candidate);
	const resolvedRoot = resolve(root);
	if (destination !== resolvedRoot && !destination.startsWith(`${resolvedRoot}${sep}`)) return void 0;
	return destination;
}
async function readManifest(path) {
	try {
		const parsed = JSON.parse(await readFile(path, "utf8"));
		if (parsed.schema !== 1 || parsed.package !== "@dsh-portable/interactive-learning" || parsed.preset !== "learning" || !Array.isArray(parsed.files)) return void 0;
		return {
			...parsed,
			presetSchema: 1,
			userModified: parsed.userModified === true,
			preservedFiles: Array.isArray(parsed.preservedFiles) ? parsed.preservedFiles : []
		};
	} catch (error) {
		if (error.code === "ENOENT" || error instanceof SyntaxError) return void 0;
		throw error;
	}
}
/**
* Harness >= 0.2 compatibility entry for the former directory installer.
*
* The 0.2 agent-preset registry reads only `@deepseek-ai/dsh-agent-preset`
* declaration rows and no longer scans `$DSH_HOME/.agent-presets/<id>/`
* (upstream `packages/preset/agent-preset-registry/README.md`). The Learning
* preset is therefore declared by this package's own bundle patch
* (`cordis.patch.yml`), which the plugin manager layers into a profile when
* the package is installed as a bundle. Copying files into the legacy
* directory would create a preset nothing reads, so this function only
* retires a legacy copy written by an earlier version (removing files whose
* content still matches the package-owned hash and preserving user edits)
* and reports how to install the bundle.
*/
async function installLearningPreset(options = {}) {
	const legacy = await uninstallLearningPreset(options);
	return {
		bundle: LEARNING_BUNDLE_PACKAGE,
		presetId: LEARNING_PRESET_ID,
		installCommand: `dsh plugin --profile <profile> add ${LEARNING_BUNDLE_PACKAGE}`,
		legacy
	};
}
/** Uninstall only files whose current content still matches the package-owned hash. */
async function uninstallLearningPreset(options = {}) {
	const target = targetFor(options.dshHome);
	const manifestPath = join(target, LEARNING_MANIFEST_FILE);
	const manifest = await readManifest(manifestPath);
	if (manifest === void 0) return {
		target,
		removed: [],
		preserved: [],
		manifestFound: false
	};
	const removed = [];
	const preserved = manifest.preservedFiles.map((file) => file.path);
	for (const file of manifest.files) {
		const path = safePath(target, file.path);
		if (path === void 0) {
			preserved.push(file.path);
			continue;
		}
		const currentHash = await fileDigest(path);
		if (currentHash === void 0) continue;
		if (currentHash !== file.ownedHash) {
			preserved.push(file.path);
			continue;
		}
		await unlink(path);
		removed.push(file.path);
	}
	await unlink(manifestPath);
	const directories = [];
	for (const file of removed) {
		let directory = dirname(join(target, file));
		while (directory !== target && directory.startsWith(`${target}${sep}`)) {
			directories.push(directory);
			directory = dirname(directory);
		}
	}
	directories.sort((a, b) => b.length - a.length);
	for (const directory of new Set(directories)) {
		if (directory === target) continue;
		try {
			await rmdir(directory);
		} catch {}
	}
	try {
		await rmdir(target);
	} catch {}
	return {
		target,
		removed,
		preserved: [...new Set(preserved)],
		manifestFound: true
	};
}
//#endregion
export { installLearningPreset as a, LEARNING_PRESET_ID as i, LEARNING_MANIFEST_FILE as n, legacyLearningPresetTarget as o, LEARNING_PACK_VERSION as r, uninstallLearningPreset as s, LEARNING_BUNDLE_PACKAGE as t };
