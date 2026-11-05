export declare const LEARNING_PACK_VERSION = "0.1.0";
export declare const LEARNING_MANIFEST_FILE = ".dsh-managed.json";
interface ManagedFile {
    path: string;
    ownedHash: string;
}
interface PreservedFile {
    path: string;
    observedHash: string;
    desiredHash: string;
    stagedPath: string;
}
export interface LearningInstallManifest {
    schema: 1;
    presetSchema: 1;
    package: '@dsh-portable/interactive-learning';
    packageVersion: string;
    preset: 'learning';
    source: 'package';
    installedAt: string;
    userModified: boolean;
    files: ManagedFile[];
    preservedFiles: PreservedFile[];
}
/** Outcome of the compatibility `install` command on harness >= 0.2. */
export interface LearningInstallResult {
    /** Bundle package whose `dsh.bundle.patch` declares the preset row. */
    bundle: typeof LEARNING_BUNDLE_PACKAGE;
    /** Preset id sessions select (`config.id` of the `preset-learning` row). */
    presetId: typeof LEARNING_PRESET_ID;
    /** Plugin-manager command that installs the bundle into a profile. */
    installCommand: string;
    /** Retirement of a legacy `$DSH_HOME/.agent-presets/learning` copy. */
    legacy: LearningUninstallResult;
}
export interface LearningUninstallResult {
    target: string;
    removed: string[];
    preserved: string[];
    manifestFound: boolean;
}
export interface LearningInstallerOptions {
    dshHome?: string;
}
/** Package that ships the preset declaration in its bundle patch. */
export declare const LEARNING_BUNDLE_PACKAGE = "@dsh-portable/interactive-learning";
/** Stable preset id recorded by sessions that select Learning. */
export declare const LEARNING_PRESET_ID = "learning";
/** Legacy (harness < 0.2) user-preset directory that earlier versions wrote. */
export declare function legacyLearningPresetTarget(dshHome?: string): string;
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
export declare function installLearningPreset(options?: Pick<LearningInstallerOptions, 'dshHome'>): Promise<LearningInstallResult>;
/** Uninstall only files whose current content still matches the package-owned hash. */
export declare function uninstallLearningPreset(options?: Pick<LearningInstallerOptions, 'dshHome'>): Promise<LearningUninstallResult>;
export {};
//# sourceMappingURL=installer.d.ts.map