#!/usr/bin/env node
import { a as installLearningPreset, s as uninstallLearningPreset } from "./installer-DXjuL-Oa.js";
//#region lib/types/installer-cli.js
function usage() {
	console.error([
		"Usage: dsh-learning-preset <install|uninstall> [--home <DSH_HOME>]",
		"",
		"Harness 0.2 no longer reads $DSH_HOME/.agent-presets. The Learning preset is",
		"declared by this package's bundle patch; install it as a profile bundle:",
		"  dsh plugin --profile <profile> add @dsh-portable/interactive-learning",
		"",
		"install    retire a legacy preset copy and print the bundle install command",
		"uninstall  remove a legacy preset copy, preserving user-edited files"
	].join("\n"));
	process.exit(2);
}
const args = process.argv.slice(2);
const command = args.shift();
let dshHome;
while (args.length > 0) {
	if (args.shift() !== "--home" || args.length === 0) usage();
	dshHome = args.shift();
}
if (command === "install") {
	const result = await installLearningPreset({ ...dshHome === void 0 ? {} : { dshHome } });
	console.log(JSON.stringify(result, null, 2));
	console.error(`The Learning preset is installed with the bundle: ${result.installCommand}`);
} else if (command === "uninstall") {
	const result = await uninstallLearningPreset({ ...dshHome === void 0 ? {} : { dshHome } });
	console.log(JSON.stringify(result, null, 2));
} else usage();
//#endregion
export {};
