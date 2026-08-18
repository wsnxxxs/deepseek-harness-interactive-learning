window.__ModuleLoader__.load({
	id: "@dsh-portable/interactive-learning",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/protocol.ts
		/** Versioned, declarative protocol shared by the Host, Agent, and Client. */
		const ACTIVITY_PROTOCOL = "dsh-learning/activity@1";
		const RESPONSE_PROTOCOL = "dsh-learning/response@1";
		const TRANSPORT_PROTOCOL = "dsh-learning/transport@1";
		const ACTIVITY_PROTOCOL_V2 = "dsh-learning/activity@2";
		const RESPONSE_PROTOCOL_V2 = "dsh-learning/response@2";
		const TRANSPORT_PROTOCOL_V2 = "dsh-learning/wait@2";
		const LEARNING_ACTIVITY_KINDS = [
			"parameter_explorer",
			"process_stepper",
			"structure_compare"
		];
		const MAX_ACTIVITY_BYTES = 65536;
		const MAX_RESPONSE_BYTES = 32768;
		/** A stable, actionable protocol rejection surfaced to the tool call. */
		var LearningProtocolError = class extends Error {
			issues;
			code = "INVALID_LEARNING_ACTIVITY";
			constructor(issues) {
				super(`Invalid Learning Activity: ${issues.join("; ")}`);
				this.issues = issues;
				this.name = "LearningProtocolError";
			}
		};
		function record(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		function onlyKeys(value, allowed, path, issues) {
			for (const key of Object.keys(value)) if (!allowed.includes(key)) issues.push(`${path}.${key} is not supported`);
		}
		function text(value, path, issues, max = 8e3) {
			if (typeof value !== "string" || value.trim() === "") {
				issues.push(`${path} must be a non-empty string`);
				return false;
			}
			if (value.length > max) issues.push(`${path} exceeds ${String(max)} characters`);
			return true;
		}
		function finite(value, path, issues) {
			if (typeof value !== "number" || !Number.isFinite(value)) {
				issues.push(`${path} must be a finite number`);
				return false;
			}
			return true;
		}
		function id(value, path, issues) {
			if (typeof value !== "string" || !/^[a-z][a-z0-9_-]{0,31}$/.test(value)) {
				issues.push(`${path} must match ^[a-z][a-z0-9_-]{0,31}$`);
				return false;
			}
			return true;
		}
		function uniqueIds(values, path, issues) {
			const seen = /* @__PURE__ */ new Set();
			for (const [index, value] of values.entries()) {
				if (typeof value.id !== "string") continue;
				if (seen.has(value.id)) issues.push(`${path}[${String(index)}].id duplicates ${value.id}`);
				seen.add(value.id);
			}
		}
		function jsonBytes(value) {
			try {
				return new TextEncoder().encode(JSON.stringify(value)).byteLength;
			} catch {
				return;
			}
		}
		function validateJson(value, path, issues) {
			const stack = [{
				value,
				path,
				depth: 0
			}];
			let nodes = 0;
			while (stack.length > 0) {
				const current = stack.pop();
				nodes += 1;
				if (nodes > 512) {
					issues.push(`${path} exceeds 512 JSON nodes`);
					return false;
				}
				if (current.depth > 12) {
					issues.push(`${current.path} exceeds JSON depth 12`);
					return false;
				}
				const item = current.value;
				if (item === null || typeof item === "string" || typeof item === "boolean") continue;
				if (typeof item === "number") {
					if (!Number.isFinite(item)) issues.push(`${current.path} must contain finite numbers`);
					continue;
				}
				if (Array.isArray(item)) {
					for (let index = item.length - 1; index >= 0; index -= 1) stack.push({
						value: item[index],
						path: `${current.path}[${String(index)}]`,
						depth: current.depth + 1
					});
					continue;
				}
				if (record(item)) {
					for (const [key, child] of Object.entries(item)) stack.push({
						value: child,
						path: `${current.path}.${key}`,
						depth: current.depth + 1
					});
					continue;
				}
				issues.push(`${current.path} must be lossless JSON`);
			}
			return issues.length === 0;
		}
		function validateMath(value, parameterIds, path, issues) {
			const binary = /* @__PURE__ */ new Set([
				"add",
				"sub",
				"mul",
				"div",
				"pow"
			]);
			const unary = /* @__PURE__ */ new Set([
				"neg",
				"abs",
				"sqrt",
				"sin",
				"cos",
				"exp",
				"log"
			]);
			const stack = [{
				value,
				path,
				depth: 1
			}];
			let nodes = 0;
			while (stack.length > 0) {
				const node = stack.pop();
				nodes += 1;
				if (nodes > 64) {
					issues.push(`${path} exceeds ${String(64)} AST nodes`);
					return;
				}
				if (node.depth > 8) {
					issues.push(`${node.path} exceeds AST depth ${String(8)}`);
					return;
				}
				if (!record(node.value) || typeof node.value.op !== "string") {
					issues.push(`${node.path} must be a mathematical AST node`);
					continue;
				}
				const expression = node.value;
				const op = expression.op;
				if (op === "constant") {
					onlyKeys(expression, ["op", "value"], node.path, issues);
					if (finite(expression.value, `${node.path}.value`, issues) && Math.abs(expression.value) > 0xe8d4a51000) issues.push(`${node.path}.value exceeds the numeric limit`);
				} else if (op === "variable") {
					onlyKeys(expression, ["op", "name"], node.path, issues);
					if (typeof expression.name !== "string" || expression.name !== "x" && !parameterIds.has(expression.name)) issues.push(`${node.path}.name must be x or a declared parameter id`);
				} else if (binary.has(op)) {
					onlyKeys(expression, [
						"op",
						"left",
						"right"
					], node.path, issues);
					stack.push({
						value: expression.right,
						path: `${node.path}.right`,
						depth: node.depth + 1
					}, {
						value: expression.left,
						path: `${node.path}.left`,
						depth: node.depth + 1
					});
				} else if (unary.has(op)) {
					onlyKeys(expression, ["op", "value"], node.path, issues);
					stack.push({
						value: expression.value,
						path: `${node.path}.value`,
						depth: node.depth + 1
					});
				} else issues.push(`${node.path}.op is unknown`);
			}
		}
		function validateParameterExplorer(payload, issues) {
			if (!record(payload)) {
				issues.push("activity.payload must be an object");
				return;
			}
			onlyKeys(payload, [
				"parameters",
				"xAxis",
				"curves",
				"question"
			], "activity.payload", issues);
			if (!Array.isArray(payload.parameters) || payload.parameters.length < 1 || payload.parameters.length > 2) {
				issues.push("activity.payload.parameters must contain 1 or 2 parameters");
				return;
			}
			const parameters = payload.parameters.filter(record);
			if (parameters.length !== payload.parameters.length) issues.push("activity.payload.parameters entries must be objects");
			uniqueIds(parameters, "activity.payload.parameters", issues);
			for (const [index, parameter] of parameters.entries()) {
				const path = `activity.payload.parameters[${String(index)}]`;
				onlyKeys(parameter, [
					"id",
					"label",
					"min",
					"max",
					"step",
					"initial"
				], path, issues);
				id(parameter.id, `${path}.id`, issues);
				text(parameter.label, `${path}.label`, issues, 120);
				const min = parameter.min;
				const max = parameter.max;
				const step = parameter.step;
				const initial = parameter.initial;
				const minOk = finite(min, `${path}.min`, issues);
				const maxOk = finite(max, `${path}.max`, issues);
				const stepOk = finite(step, `${path}.step`, issues);
				const initialOk = finite(initial, `${path}.initial`, issues);
				if (minOk && maxOk && min >= max) issues.push(`${path}.min must be less than max`);
				if (stepOk && step <= 0) issues.push(`${path}.step must be positive`);
				if (minOk && maxOk && stepOk && step > max - min) issues.push(`${path}.step must not exceed the parameter range`);
				if (minOk && maxOk && initialOk && (initial < min || initial > max)) issues.push(`${path}.initial must be inside the parameter range`);
			}
			if (!record(payload.xAxis)) issues.push("activity.payload.xAxis must be an object");
			else {
				onlyKeys(payload.xAxis, [
					"label",
					"min",
					"max",
					"samples"
				], "activity.payload.xAxis", issues);
				if (payload.xAxis.label !== void 0) text(payload.xAxis.label, "activity.payload.xAxis.label", issues, 120);
				const xMin = payload.xAxis.min;
				const xMax = payload.xAxis.max;
				const samples = payload.xAxis.samples;
				const minOk = finite(xMin, "activity.payload.xAxis.min", issues);
				const maxOk = finite(xMax, "activity.payload.xAxis.max", issues);
				if (minOk && maxOk && xMin >= xMax) issues.push("activity.payload.xAxis.min must be less than max");
				if (samples !== void 0 && (typeof samples !== "number" || !Number.isInteger(samples) || samples < 16 || samples > 256)) issues.push("activity.payload.xAxis.samples must be an integer from 16 to 256");
			}
			if (!Array.isArray(payload.curves) || payload.curves.length < 1 || payload.curves.length > 3) issues.push("activity.payload.curves must contain 1 to 3 curves");
			else {
				const curves = payload.curves.filter(record);
				if (curves.length !== payload.curves.length) issues.push("activity.payload.curves entries must be objects");
				uniqueIds(curves, "activity.payload.curves", issues);
				const parameterIds = new Set(parameters.map((item) => typeof item.id === "string" ? item.id : ""));
				for (const [index, curve] of curves.entries()) {
					const path = `activity.payload.curves[${String(index)}]`;
					onlyKeys(curve, [
						"id",
						"label",
						"expression"
					], path, issues);
					id(curve.id, `${path}.id`, issues);
					text(curve.label, `${path}.label`, issues, 120);
					validateMath(curve.expression, parameterIds, `${path}.expression`, issues);
				}
			}
			if (payload.question !== void 0) text(payload.question, "activity.payload.question", issues, 2e3);
		}
		function validateProcessStepper(payload, issues) {
			if (!record(payload)) {
				issues.push("activity.payload must be an object");
				return;
			}
			onlyKeys(payload, ["steps", "question"], "activity.payload", issues);
			if (!Array.isArray(payload.steps) || payload.steps.length < 2 || payload.steps.length > 12) {
				issues.push("activity.payload.steps must contain 2 to 12 steps");
				return;
			}
			const steps = payload.steps.filter(record);
			if (steps.length !== payload.steps.length) issues.push("activity.payload.steps entries must be objects");
			uniqueIds(steps, "activity.payload.steps", issues);
			for (const [index, step] of steps.entries()) {
				const path = `activity.payload.steps[${String(index)}]`;
				onlyKeys(step, [
					"id",
					"title",
					"content",
					"checkpoint"
				], path, issues);
				id(step.id, `${path}.id`, issues);
				text(step.title, `${path}.title`, issues, 200);
				text(step.content, `${path}.content`, issues, 4e3);
				if (step.checkpoint !== void 0) {
					if (!record(step.checkpoint)) issues.push(`${path}.checkpoint must be an object`);
					else {
						onlyKeys(step.checkpoint, ["question", "options"], `${path}.checkpoint`, issues);
						text(step.checkpoint.question, `${path}.checkpoint.question`, issues, 2e3);
						if (step.checkpoint.options !== void 0) {
							if (!Array.isArray(step.checkpoint.options) || step.checkpoint.options.length < 2 || step.checkpoint.options.length > 6 || !step.checkpoint.options.every((option) => typeof option === "string" && option.trim() !== "")) issues.push(`${path}.checkpoint.options must contain 2 to 6 non-empty strings`);
						}
					}
				}
			}
			if (payload.question !== void 0) text(payload.question, "activity.payload.question", issues, 2e3);
		}
		function validateStructureSide(value, path, issues) {
			if (!record(value)) {
				issues.push(`${path} must be an object`);
				return [];
			}
			onlyKeys(value, ["title", "items"], path, issues);
			text(value.title, `${path}.title`, issues, 200);
			if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 20) {
				issues.push(`${path}.items must contain 1 to 20 items`);
				return [];
			}
			const items = value.items.filter(record);
			if (items.length !== value.items.length) issues.push(`${path}.items entries must be objects`);
			uniqueIds(items, `${path}.items`, issues);
			for (const [index, item] of items.entries()) {
				const itemPath = `${path}.items[${String(index)}]`;
				onlyKeys(item, [
					"id",
					"label",
					"detail"
				], itemPath, issues);
				id(item.id, `${itemPath}.id`, issues);
				text(item.label, `${itemPath}.label`, issues, 500);
				if (item.detail !== void 0) text(item.detail, `${itemPath}.detail`, issues, 2e3);
			}
			return items;
		}
		function validateStructureCompare(payload, issues) {
			if (!record(payload)) {
				issues.push("activity.payload must be an object");
				return;
			}
			onlyKeys(payload, [
				"left",
				"right",
				"alignments",
				"question"
			], "activity.payload", issues);
			const left = validateStructureSide(payload.left, "activity.payload.left", issues);
			const right = validateStructureSide(payload.right, "activity.payload.right", issues);
			const leftIds = new Set(left.map((item) => typeof item.id === "string" ? item.id : ""));
			const rightIds = new Set(right.map((item) => typeof item.id === "string" ? item.id : ""));
			if (!Array.isArray(payload.alignments) || payload.alignments.length < 1 || payload.alignments.length > 24) issues.push("activity.payload.alignments must contain 1 to 24 rows");
			else {
				const alignments = payload.alignments.filter(record);
				if (alignments.length !== payload.alignments.length) issues.push("activity.payload.alignments entries must be objects");
				uniqueIds(alignments, "activity.payload.alignments", issues);
				for (const [index, alignment] of alignments.entries()) {
					const path = `activity.payload.alignments[${String(index)}]`;
					onlyKeys(alignment, [
						"id",
						"leftId",
						"rightId",
						"prompt"
					], path, issues);
					id(alignment.id, `${path}.id`, issues);
					if (alignment.leftId === void 0 && alignment.rightId === void 0) issues.push(`${path} must reference at least one side`);
					if (alignment.leftId !== void 0 && (typeof alignment.leftId !== "string" || !leftIds.has(alignment.leftId))) issues.push(`${path}.leftId must reference a left item`);
					if (alignment.rightId !== void 0 && (typeof alignment.rightId !== "string" || !rightIds.has(alignment.rightId))) issues.push(`${path}.rightId must reference a right item`);
					if (alignment.prompt !== void 0) text(alignment.prompt, `${path}.prompt`, issues, 1e3);
				}
			}
			if (payload.question !== void 0) text(payload.question, "activity.payload.question", issues, 2e3);
		}
		/** Validate and narrow an untrusted model-provided activity. */
		function parseLearningActivity(value) {
			const issues = [];
			const bytes = jsonBytes(value);
			if (bytes === void 0) issues.push("activity must be serializable JSON");
			else if (bytes > 65536) issues.push(`activity exceeds ${String(MAX_ACTIVITY_BYTES)} bytes`);
			if (!record(value)) throw new LearningProtocolError([...issues, "activity must be an object"]);
			onlyKeys(value, [
				"protocol",
				"kind",
				"title",
				"objective",
				"prompt",
				"scaffold",
				"payload",
				"fallbackMarkdown"
			], "activity", issues);
			if (value.protocol !== "dsh-learning/activity@1") issues.push(`activity.protocol must be ${ACTIVITY_PROTOCOL}`);
			if (!LEARNING_ACTIVITY_KINDS.includes(value.kind)) issues.push("activity.kind is unknown");
			text(value.title, "activity.title", issues, 200);
			text(value.objective, "activity.objective", issues, 1e3);
			text(value.prompt, "activity.prompt", issues, 2e3);
			if (value.scaffold !== void 0) text(value.scaffold, "activity.scaffold", issues, 4e3);
			text(value.fallbackMarkdown, "activity.fallbackMarkdown", issues, 16e3);
			if (value.kind === "parameter_explorer") validateParameterExplorer(value.payload, issues);
			else if (value.kind === "process_stepper") validateProcessStepper(value.payload, issues);
			else if (value.kind === "structure_compare") validateStructureCompare(value.payload, issues);
			if (issues.length > 0) throw new LearningProtocolError(issues);
			return value;
		}
		/** Validate and narrow a Client response before it returns to the model. */
		function parseLearningResponse(value, expectedActivityId) {
			const issues = [];
			const bytes = jsonBytes(value);
			if (bytes === void 0) issues.push("response must be serializable JSON");
			else if (bytes > 32768) issues.push(`response exceeds ${String(MAX_RESPONSE_BYTES)} bytes`);
			if (!record(value)) throw new LearningProtocolError([...issues, "response must be an object"]);
			onlyKeys(value, [
				"protocol",
				"activityId",
				"action",
				"answer",
				"interactionState"
			], "response", issues);
			if (value.protocol !== "dsh-learning/response@1") issues.push(`response.protocol must be ${RESPONSE_PROTOCOL}`);
			if (typeof value.activityId !== "string" || value.activityId === "") issues.push("response.activityId must be a non-empty string");
			if (expectedActivityId !== void 0 && value.activityId !== expectedActivityId) issues.push("response.activityId does not match the pending activity");
			if (value.action !== "submit" && value.action !== "skip" && value.action !== "cancel") issues.push("response.action is unknown");
			if (value.answer !== void 0) validateJson(value.answer, "response.answer", issues);
			if (value.interactionState !== void 0) validateJson(value.interactionState, "response.interactionState", issues);
			if (issues.length > 0) throw new LearningProtocolError(issues);
			return value;
		}
		function integer(value, path, issues, min = 0) {
			if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
				issues.push(`${path} must be an integer >= ${String(min)}`);
				return false;
			}
			return true;
		}
		function token(value, path, issues) {
			if (typeof value !== "string" || value.length < 1 || value.length > 128 || !/^[A-Za-z0-9_-]+$/.test(value)) {
				issues.push(`${path} must be an opaque token of 1 to 128 URL-safe characters`);
				return false;
			}
			return true;
		}
		function validateFocusV2(value, path, issues) {
			if (!record(value)) {
				issues.push(`${path} must be an object`);
				return;
			}
			onlyKeys(value, ["title", "progress"], path, issues);
			text(value.title, `${path}.title`, issues, 200);
			if (value.progress !== void 0) {
				if (!record(value.progress)) issues.push(`${path}.progress must be an object`);
				else {
					onlyKeys(value.progress, ["current", "total"], `${path}.progress`, issues);
					const currentOk = integer(value.progress.current, `${path}.progress.current`, issues, 1);
					const totalOk = value.progress.total === void 0 ? false : integer(value.progress.total, `${path}.progress.total`, issues, 1);
					if (currentOk && totalOk && value.progress.current > value.progress.total) issues.push(`${path}.progress.current must not exceed total`);
				}
			}
		}
		function validateInputV2(value, issues) {
			const path = "activity.input";
			if (!record(value)) {
				issues.push(`${path} must be an object`);
				return;
			}
			if (value.kind === "single_choice") {
				onlyKeys(value, ["kind", "options"], path, issues);
				if (!Array.isArray(value.options) || value.options.length < 2 || value.options.length > 8) {
					issues.push(`${path}.options must contain 2 to 8 options`);
					return;
				}
				const options = value.options.filter(record);
				if (options.length !== value.options.length) issues.push(`${path}.options entries must be objects`);
				uniqueIds(options, `${path}.options`, issues);
				for (const [index, option] of options.entries()) {
					const optionPath = `${path}.options[${String(index)}]`;
					onlyKeys(option, ["id", "label"], optionPath, issues);
					id(option.id, `${optionPath}.id`, issues);
					text(option.label, `${optionPath}.label`, issues, 500);
				}
			} else if (value.kind === "short_text") {
				onlyKeys(value, [
					"kind",
					"placeholder",
					"maxLength"
				], path, issues);
				if (value.placeholder !== void 0) text(value.placeholder, `${path}.placeholder`, issues, 500);
				if (value.maxLength !== void 0 && (!integer(value.maxLength, `${path}.maxLength`, issues, 1) || value.maxLength > 8e3)) issues.push(`${path}.maxLength must not exceed 8000`);
			} else if (value.kind === "number") {
				onlyKeys(value, [
					"kind",
					"min",
					"max",
					"step"
				], path, issues);
				const minOk = value.min === void 0 ? false : finite(value.min, `${path}.min`, issues);
				const maxOk = value.max === void 0 ? false : finite(value.max, `${path}.max`, issues);
				const stepOk = value.step === void 0 ? false : finite(value.step, `${path}.step`, issues);
				if (minOk && maxOk && value.min >= value.max) issues.push(`${path}.min must be less than max`);
				if (stepOk && value.step <= 0) issues.push(`${path}.step must be positive`);
			} else issues.push(`${path}.kind is unknown`);
		}
		function validateFrameV2(value, path, issues) {
			if (!record(value)) {
				issues.push(`${path} must be an object`);
				return;
			}
			onlyKeys(value, [
				"id",
				"title",
				"content"
			], path, issues);
			id(value.id, `${path}.id`, issues);
			text(value.title, `${path}.title`, issues, 200);
			if (value.content !== void 0) text(value.content, `${path}.content`, issues, 4e3);
		}
		function validateParameterVisualV2(value, path, issues, reveal) {
			onlyKeys(value, reveal ? [
				"kind",
				"parameters",
				"xAxis",
				"curves",
				"emphasis"
			] : [
				"kind",
				"parameters",
				"xAxis",
				"curves"
			], path, issues);
			validateParameterExplorer({
				parameters: value.parameters,
				xAxis: value.xAxis,
				curves: value.curves
			}, issues);
			if (reveal && value.emphasis !== void 0) text(value.emphasis, `${path}.emphasis`, issues, 2e3);
		}
		function validateStructureVisualV2(value, path, issues, reveal) {
			onlyKeys(value, reveal ? [
				"kind",
				"left",
				"right",
				"alignments",
				"emphasisAlignmentIds"
			] : [
				"kind",
				"left",
				"right",
				"alignments"
			], path, issues);
			validateStructureCompare({
				left: value.left,
				right: value.right,
				alignments: value.alignments
			}, issues);
			if (reveal && value.emphasisAlignmentIds !== void 0) {
				if (!Array.isArray(value.emphasisAlignmentIds) || !value.emphasisAlignmentIds.every((item) => typeof item === "string")) issues.push(`${path}.emphasisAlignmentIds must be an array of ids`);
			}
		}
		function validateVisualV2(value, phase, issues) {
			const path = "activity.visual";
			if (!record(value)) {
				issues.push(`${path} must be an object`);
				return;
			}
			if (value.kind === "process") {
				if (phase === "question") {
					onlyKeys(value, ["kind", "frame"], path, issues);
					validateFrameV2(value.frame, `${path}.frame`, issues);
				} else {
					onlyKeys(value, [
						"kind",
						"before",
						"after"
					], path, issues);
					validateFrameV2(value.before, `${path}.before`, issues);
					validateFrameV2(value.after, `${path}.after`, issues);
				}
			} else if (value.kind === "parameter") validateParameterVisualV2(value, path, issues, phase === "reveal");
			else if (value.kind === "structure") validateStructureVisualV2(value, path, issues, phase === "reveal");
			else issues.push(`${path}.kind is unknown`);
		}
		/** Strict live protocol. V1 is intentionally parsed separately for legacy replay only. */
		function parseLearningActivityV2(value) {
			const issues = [];
			const bytes = jsonBytes(value);
			if (bytes === void 0) issues.push("activity must be serializable JSON");
			else if (bytes > 65536) issues.push(`activity exceeds ${String(MAX_ACTIVITY_BYTES)} bytes`);
			if (!record(value)) throw new LearningProtocolError([...issues, "activity must be an object"]);
			if (value.protocol !== "dsh-learning/activity@2") issues.push(`activity.protocol must be ${ACTIVITY_PROTOCOL_V2}`);
			if (value.phase === "question") {
				onlyKeys(value, [
					"protocol",
					"phase",
					"lessonToken",
					"seq",
					"focus",
					"prompt",
					"scaffold",
					"input",
					"visual",
					"fallbackMarkdown"
				], "activity", issues);
				if (value.lessonToken !== void 0) token(value.lessonToken, "activity.lessonToken", issues);
				integer(value.seq, "activity.seq", issues);
				validateFocusV2(value.focus, "activity.focus", issues);
				text(value.prompt, "activity.prompt", issues, 2e3);
				if (value.scaffold !== void 0) text(value.scaffold, "activity.scaffold", issues, 4e3);
				validateInputV2(value.input, issues);
				if (value.visual !== void 0) validateVisualV2(value.visual, "question", issues);
				text(value.fallbackMarkdown, "activity.fallbackMarkdown", issues, 16e3);
			} else if (value.phase === "reveal") {
				onlyKeys(value, [
					"protocol",
					"phase",
					"lessonToken",
					"roundToken",
					"seq",
					"focus",
					"feedback",
					"visual",
					"animation",
					"advance",
					"fallbackMarkdown"
				], "activity", issues);
				token(value.lessonToken, "activity.lessonToken", issues);
				token(value.roundToken, "activity.roundToken", issues);
				integer(value.seq, "activity.seq", issues);
				validateFocusV2(value.focus, "activity.focus", issues);
				if (!record(value.feedback)) issues.push("activity.feedback must be an object");
				else {
					onlyKeys(value.feedback, [
						"verdict",
						"learnerEcho",
						"explanation",
						"answer"
					], "activity.feedback", issues);
					if (value.feedback.verdict !== void 0 && ![
						"correct",
						"partial",
						"misconception",
						"neutral"
					].includes(value.feedback.verdict)) issues.push("activity.feedback.verdict is unknown");
					if (value.feedback.learnerEcho !== void 0) text(value.feedback.learnerEcho, "activity.feedback.learnerEcho", issues, 2e3);
					text(value.feedback.explanation, "activity.feedback.explanation", issues, 8e3);
					if (value.feedback.answer !== void 0) text(value.feedback.answer, "activity.feedback.answer", issues, 4e3);
				}
				if (value.visual !== void 0) validateVisualV2(value.visual, "reveal", issues);
				if (!record(value.animation)) issues.push("activity.animation must be an object");
				else {
					onlyKeys(value.animation, [
						"kind",
						"preferredDurationMs",
						"reducedMotion"
					], "activity.animation", issues);
					if (![
						"draw",
						"morph",
						"highlight",
						"step_complete"
					].includes(value.animation.kind)) issues.push("activity.animation.kind is unknown");
					if (value.animation.preferredDurationMs !== void 0 && (!integer(value.animation.preferredDurationMs, "activity.animation.preferredDurationMs", issues, 0) || value.animation.preferredDurationMs > 1e4)) issues.push("activity.animation.preferredDurationMs must not exceed 10000");
					if (value.animation.reducedMotion !== "commit-final-state") issues.push("activity.animation.reducedMotion must be commit-final-state");
				}
				if (!record(value.advance)) issues.push("activity.advance must be an object");
				else {
					onlyKeys(value.advance, ["mode", "label"], "activity.advance", issues);
					if (value.advance.mode !== "user-after-animation") issues.push("activity.advance.mode must be user-after-animation");
					if (value.advance.label !== void 0) text(value.advance.label, "activity.advance.label", issues, 120);
				}
				text(value.fallbackMarkdown, "activity.fallbackMarkdown", issues, 16e3);
			} else issues.push("activity.phase must be question or reveal");
			if (issues.length > 0) throw new LearningProtocolError(issues);
			return value;
		}
		/** Validate a phase-bound Client receipt before the Broker changes lesson state. */
		function parseLearningResponseV2(value, expected = {}) {
			const issues = [];
			const bytes = jsonBytes(value);
			if (bytes === void 0) issues.push("response must be serializable JSON");
			else if (bytes > 32768) issues.push(`response exceeds ${String(MAX_RESPONSE_BYTES)} bytes`);
			if (!record(value)) throw new LearningProtocolError([...issues, "response must be an object"]);
			if (value.phase === "question") {
				onlyKeys(value, [
					"protocol",
					"phase",
					"activityId",
					"lessonToken",
					"roundToken",
					"seq",
					"action",
					"answer",
					"receiptId",
					"interactionState"
				], "response", issues);
				if (![
					"submit",
					"skip",
					"cancel"
				].includes(value.action)) issues.push("response.action is unknown");
				if (value.answer !== void 0) validateJson(value.answer, "response.answer", issues);
			} else if (value.phase === "reveal") {
				onlyKeys(value, [
					"protocol",
					"phase",
					"activityId",
					"lessonToken",
					"roundToken",
					"seq",
					"action",
					"animation",
					"receiptId",
					"interactionState"
				], "response", issues);
				if (![
					"continue",
					"skip",
					"cancel"
				].includes(value.action)) issues.push("response.action is unknown");
				if (!record(value.animation)) issues.push("response.animation must be an object");
				else {
					onlyKeys(value.animation, [
						"completed",
						"skipped",
						"reducedMotion",
						"error"
					], "response.animation", issues);
					if (typeof value.animation.completed !== "boolean") issues.push("response.animation.completed must be boolean");
					if (value.animation.skipped !== void 0 && typeof value.animation.skipped !== "boolean") issues.push("response.animation.skipped must be boolean");
					if (value.animation.reducedMotion !== void 0 && typeof value.animation.reducedMotion !== "boolean") issues.push("response.animation.reducedMotion must be boolean");
					if (value.animation.error !== void 0 && typeof value.animation.error !== "string") issues.push("response.animation.error must be a string");
					if (value.action === "continue" && value.animation.completed !== true) issues.push("response.animation.completed must be true before continue");
				}
			} else issues.push("response.phase must be question or reveal");
			if (value.protocol !== "dsh-learning/response@2") issues.push(`response.protocol must be ${RESPONSE_PROTOCOL_V2}`);
			token(value.activityId, "response.activityId", issues);
			token(value.lessonToken, "response.lessonToken", issues);
			token(value.roundToken, "response.roundToken", issues);
			integer(value.seq, "response.seq", issues);
			token(value.receiptId, "response.receiptId", issues);
			if (value.interactionState !== void 0) validateJson(value.interactionState, "response.interactionState", issues);
			for (const [key, expectedValue] of Object.entries(expected)) if (expectedValue !== void 0 && value[key] !== expectedValue) issues.push(`response.${key} does not match the pending activity`);
			if (issues.length > 0) throw new LearningProtocolError(issues);
			return value;
		}
		//#endregion
		//#region src/transport.ts
		const MARKER_PREFIX = "<!--dsh-learning/transport@1:";
		const MARKER_SUFFIX = "-->";
		const WAIT_MARKER_PREFIX = "<!--dsh-learning/wait@2:";
		const WAIT_QUESTION_ID_PREFIX = "dsh-learning/wait@2:";
		const BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
		function decodeBase64Url(value) {
			if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) return void 0;
			const bytes = [];
			for (let index = 0; index < value.length; index += 4) {
				const a = BASE64URL.indexOf(value[index]);
				const b = BASE64URL.indexOf(value[index + 1]);
				const c = value[index + 2] === void 0 ? 0 : BASE64URL.indexOf(value[index + 2]);
				const d = value[index + 3] === void 0 ? 0 : BASE64URL.indexOf(value[index + 3]);
				if (a < 0 || b < 0 || c < 0 || d < 0) return void 0;
				const triple = a << 18 | b << 12 | c << 6 | d;
				bytes.push(triple >> 16 & 255);
				if (value[index + 2] !== void 0) bytes.push(triple >> 8 & 255);
				if (value[index + 3] !== void 0) bytes.push(triple & 255);
			}
			try {
				return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
			} catch {
				return;
			}
		}
		/** Decode and revalidate a package-owned question detail; ordinary questions return undefined. */
		function decodeLearningDetail(detail) {
			if (typeof detail !== "string" || !detail.startsWith(MARKER_PREFIX)) return void 0;
			const end = detail.indexOf(MARKER_SUFFIX, 29);
			if (end < 0) return void 0;
			const json = decodeBase64Url(detail.slice(29, end));
			if (json === void 0) return void 0;
			try {
				const parsed = JSON.parse(json);
				if (parsed.transport !== "dsh-learning/transport@1" || typeof parsed.activityId !== "string" || parsed.activityId === "") return void 0;
				return {
					transport: TRANSPORT_PROTOCOL,
					activityId: parsed.activityId,
					activity: parseLearningActivity(parsed.activity)
				};
			} catch {
				return;
			}
		}
		/** The question id is an opaque reference; it never serializes a learning payload. */
		function learningWaitQuestionId(waitId) {
			if (!/^[A-Za-z0-9_-]{1,128}$/.test(waitId)) throw new Error("waitId must be a URL-safe opaque token");
			return `${WAIT_QUESTION_ID_PREFIX}${waitId}`;
		}
		function decodeLearningWaitQuestionId(value) {
			if (typeof value !== "string" || !value.startsWith(WAIT_QUESTION_ID_PREFIX)) return void 0;
			const waitId = value.slice(20);
			return /^[A-Za-z0-9_-]{1,128}$/.test(waitId) ? waitId : void 0;
		}
		function decodeLearningWaitDetail(detail) {
			if (typeof detail !== "string" || !detail.startsWith(WAIT_MARKER_PREFIX)) return void 0;
			const end = detail.indexOf(MARKER_SUFFIX, 24);
			if (end < 0) return void 0;
			const json = decodeBase64Url(detail.slice(24, end));
			if (json === void 0) return void 0;
			try {
				const parsed = JSON.parse(json);
				if (parsed.transport !== "dsh-learning/wait@2" || typeof parsed.waitId !== "string" || decodeLearningWaitQuestionId(learningWaitQuestionId(parsed.waitId)) === void 0 || typeof parsed.activityId !== "string" || parsed.activityId === "" || parsed.callId !== void 0 && (typeof parsed.callId !== "string" || parsed.callId === "") || typeof parsed.lessonToken !== "string" || parsed.lessonToken === "" || typeof parsed.roundToken !== "string" || parsed.roundToken === "" || typeof parsed.seq !== "number" || !Number.isInteger(parsed.seq) || parsed.seq < 0 || parsed.phase !== "question" && parsed.phase !== "reveal") return void 0;
				const activity = parseLearningActivityV2(parsed.activity);
				if (activity.phase !== parsed.phase || activity.seq !== parsed.seq) return void 0;
				if (activity.phase === "reveal" && (activity.lessonToken !== parsed.lessonToken || activity.roundToken !== parsed.roundToken)) return void 0;
				if (activity.phase === "question" && activity.lessonToken !== void 0 && activity.lessonToken !== parsed.lessonToken) return void 0;
				return {
					transport: TRANSPORT_PROTOCOL_V2,
					waitId: parsed.waitId,
					activityId: parsed.activityId,
					...parsed.callId === void 0 ? {} : { callId: parsed.callId },
					lessonToken: parsed.lessonToken,
					roundToken: parsed.roundToken,
					seq: parsed.seq,
					phase: parsed.phase,
					activity
				};
			} catch {
				return;
			}
		}
		//#endregion
		//#region \0dsh-css:C:\Users\Ryan\Desktop\deepseek-harness-interactive-learning\src\client\LearningActivity.module.css.mjs
		const css = ".wn1t3W_frame{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);width:min(920px,100% - 24px);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-shadow-l2,0 8px 30px #00000014);border-radius:16px;margin:0 auto 12px;overflow:hidden}.wn1t3W_header{border-bottom:1px solid var(--dsw-alias-border-l2);background:linear-gradient(135deg, var(--dsw-alias-bg-module-platform), transparent 70%);padding:18px 20px 14px}.wn1t3W_eyebrow{color:var(--dsw-alias-brand-primary);letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px;font-size:11px;font-weight:700;display:block}.wn1t3W_title{margin:0;font-size:20px;line-height:1.35}.wn1t3W_objective{color:var(--dsw-alias-label-secondary);gap:8px;margin-top:8px;font-size:13px;line-height:1.55;display:flex}.wn1t3W_objective strong{color:var(--dsw-alias-label-primary);flex:none}.wn1t3W_scaffold{color:var(--dsw-alias-label-secondary);margin-top:10px;font-size:13px}.wn1t3W_scaffold summary,.wn1t3W_replay summary{cursor:pointer}.wn1t3W_body{padding:18px 20px}.wn1t3W_footer{border-top:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:10px 20px 14px;display:flex}.wn1t3W_footerSpacer{flex:1}.wn1t3W_error{color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px}.wn1t3W_activityContent,.wn1t3W_controls,.wn1t3W_answerField,.wn1t3W_stepCard,.wn1t3W_prediction,.wn1t3W_predictionGate{flex-direction:column;display:flex}.wn1t3W_activityContent{gap:16px}.wn1t3W_predictionGate{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;gap:10px;padding:14px}.wn1t3W_predictionStatus{color:var(--dsw-alias-label-success,var(--dsw-alias-brand-primary));margin:0;font-size:12px}.wn1t3W_prompt{color:var(--dsw-alias-label-primary);margin:0;font-size:15px;font-weight:550;line-height:1.55}.wn1t3W_explorerGrid{grid-template-columns:minmax(190px,.75fr) minmax(320px,1.5fr);align-items:stretch;gap:18px;display:grid}.wn1t3W_controls{justify-content:center;gap:16px}.wn1t3W_rangeField{color:var(--dsw-alias-label-secondary);gap:6px;font-size:13px;display:grid}.wn1t3W_rangeField input{width:100%;accent-color:var(--dsw-alias-brand-primary)}.wn1t3W_rangeField input:focus-visible,.wn1t3W_compareRow input:focus-visible,.wn1t3W_option input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.wn1t3W_rangeEnds{color:var(--dsw-alias-label-tertiary);justify-content:space-between;font-size:11px;display:flex}.wn1t3W_chart{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;width:100%;min-height:220px}.wn1t3W_axis{stroke:var(--dsw-alias-border-l1);stroke-width:1px}.wn1t3W_curve{fill:none;stroke:var(--dsw-alias-brand-primary);stroke-width:3px;vector-effect:non-scaling-stroke}.wn1t3W_curve[data-curve=\"1\"]{stroke:var(--dsw-alias-label-success,var(--dsw-alias-label-secondary))}.wn1t3W_curve[data-curve=\"2\"]{stroke:var(--dsw-alias-label-warning,var(--dsw-alias-label-tertiary))}.wn1t3W_legend{color:var(--dsw-alias-label-secondary);flex-wrap:wrap;gap:8px 14px;margin:0;padding:0;font-size:12px;list-style:none;display:flex}.wn1t3W_legend li:before{content:\"\";background:var(--dsw-alias-brand-primary);border-radius:50%;width:9px;height:9px;margin-right:5px;display:inline-block}.wn1t3W_answerField{color:var(--dsw-alias-label-secondary);gap:6px;font-size:13px}.wn1t3W_answerField textarea,.wn1t3W_prediction textarea{box-sizing:border-box;resize:vertical;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);min-height:76px;color:var(--dsw-alias-label-primary);font:inherit;border-radius:10px;padding:9px 11px;line-height:1.5}.wn1t3W_answerField textarea:focus-visible,.wn1t3W_prediction textarea:focus-visible,.wn1t3W_frame button:focus-visible,.wn1t3W_toolRow:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.wn1t3W_primaryRow,.wn1t3W_navigation{justify-content:flex-end;gap:8px;display:flex}.wn1t3W_primaryButton,.wn1t3W_ghostButton,.wn1t3W_revealButton,.wn1t3W_textButton{appearance:none;font:inherit;cursor:pointer;border-radius:9px;padding:7px 13px;font-size:13px}.wn1t3W_primaryButton,.wn1t3W_revealButton{border:1px solid var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-primary,white)}.wn1t3W_ghostButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}.wn1t3W_textButton{color:var(--dsw-alias-brand-primary);background:0 0;border:0}.wn1t3W_primaryButton:disabled,.wn1t3W_ghostButton:disabled,.wn1t3W_revealButton:disabled,.wn1t3W_textButton:disabled{cursor:default;opacity:.45}.wn1t3W_stepMeta{color:var(--dsw-alias-label-tertiary);justify-content:space-between;align-items:center;font-size:12px;display:flex}.wn1t3W_progress{gap:6px;margin:0;padding:0;list-style:none;display:flex}.wn1t3W_progress li{background:var(--dsw-alias-border-l1);border-radius:999px;flex:1;height:4px}.wn1t3W_progress li[data-active],.wn1t3W_progress li[data-done]{background:var(--dsw-alias-brand-primary)}.wn1t3W_stepCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;gap:14px;min-height:180px;padding:16px}.wn1t3W_stepCard h3,.wn1t3W_prediction p{margin:0}.wn1t3W_prediction{border:0;gap:9px;margin:0;padding:0}.wn1t3W_prediction legend{color:var(--dsw-alias-brand-primary);margin-bottom:8px;font-size:12px;font-weight:700}.wn1t3W_option{border:1px solid var(--dsw-alias-border-l2);cursor:pointer;border-radius:9px;align-items:flex-start;gap:8px;padding:8px 10px;display:flex}.wn1t3W_option input{accent-color:var(--dsw-alias-brand-primary);margin-top:3px}.wn1t3W_revealed{color:var(--dsw-alias-label-secondary);line-height:1.6}.wn1t3W_compareHeader,.wn1t3W_compareRow{grid-template-columns:28px minmax(0,1fr) minmax(0,1fr);gap:10px;display:grid}.wn1t3W_compareHeader{color:var(--dsw-alias-label-secondary);padding:0 10px;font-size:13px}.wn1t3W_compareRows{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;overflow:hidden}.wn1t3W_compareRow{background:var(--dsw-alias-bg-layer-3);cursor:pointer;align-items:stretch;padding:10px;position:relative}.wn1t3W_compareRow+.wn1t3W_compareRow{border-top:1px solid var(--dsw-alias-border-l2)}.wn1t3W_compareRow>input{accent-color:var(--dsw-alias-brand-primary);margin:7px 0 0}.wn1t3W_compareItem{background:var(--dsw-alias-bg-layer-2);border-radius:8px;min-width:0;padding:7px 9px;font-size:13px;line-height:1.5}.wn1t3W_compareItem p{color:var(--dsw-alias-label-tertiary);margin:4px 0 0}.wn1t3W_emptyCell{color:var(--dsw-alias-label-tertiary);padding:7px 9px}.wn1t3W_rowPrompt{color:var(--dsw-alias-label-tertiary);grid-column:2/4;font-size:11px}.wn1t3W_toolRow{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);width:100%;color:var(--dsw-alias-label-primary);text-align:left;font:inherit;border-radius:10px;justify-content:space-between;align-items:center;gap:10px;padding:9px 11px;display:flex}button.wn1t3W_toolRow{cursor:pointer}.wn1t3W_toolRow>span:first-child,.wn1t3W_replay summary>span{flex-direction:column;gap:2px;min-width:0;display:flex}.wn1t3W_toolRow small,.wn1t3W_replay small{color:var(--dsw-alias-label-tertiary);font-size:11px}.wn1t3W_runningDot{background:var(--dsw-alias-brand-primary);border-radius:50%;flex:none;width:8px;height:8px;animation:1.2s ease-in-out infinite wn1t3W_pulse}.wn1t3W_replay{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px}.wn1t3W_replay>summary{padding:9px 11px;list-style-position:inside}.wn1t3W_replayBody{color:var(--dsw-alias-label-secondary);gap:14px;padding:0 14px 14px;font-size:13px;display:grid}.wn1t3W_replayOutline,.wn1t3W_replayCompare{grid-template-columns:1fr 1fr;gap:12px;display:grid}.wn1t3W_replaySteps{gap:10px;display:grid}.wn1t3W_replayCompare section{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:9px}.wn1t3W_response{min-width:0}.wn1t3W_response pre{background:var(--dsw-alias-bg-layer-2);white-space:pre-wrap;word-break:break-word;border-radius:8px;max-height:220px;padding:9px;overflow:auto}.wn1t3W_round{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:12px;flex-direction:column;gap:14px;min-width:0;padding:16px;display:flex}.wn1t3W_roundHeader{flex-direction:column;gap:3px;display:flex}.wn1t3W_roundHeader span{color:var(--dsw-alias-label-tertiary);font-size:12px}.wn1t3W_roundHeader h2,.wn1t3W_roundProcess h3,.wn1t3W_roundStructure h3,.wn1t3W_roundFeedback p{margin:0}.wn1t3W_roundHeader h2{font-size:18px}.wn1t3W_roundProcess{border-left:2px solid var(--dsw-alias-brand-primary);grid-template-columns:30px minmax(0,1fr);gap:10px;padding:10px 0 10px 12px;display:grid}.wn1t3W_roundNode{border:1px solid var(--dsw-alias-brand-primary);width:28px;height:28px;color:var(--dsw-alias-brand-primary);border-radius:50%;place-items:center;font-size:12px;display:grid}.wn1t3W_roundProcess[data-final] .wn1t3W_roundNode{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-primary,white)}.wn1t3W_roundParameter,.wn1t3W_roundParameterValues,.wn1t3W_roundCurveList{flex-wrap:wrap;gap:8px;display:flex}.wn1t3W_roundParameter{flex-direction:column}.wn1t3W_roundParameterValues span,.wn1t3W_roundCurveList span{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:5px 9px;font-size:12px}.wn1t3W_roundStructure{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;display:grid}.wn1t3W_roundStructure>div{border:1px solid var(--dsw-alias-border-l2);border-radius:9px;padding:10px}.wn1t3W_roundFeedback{color:var(--dsw-alias-label-secondary);gap:8px;display:grid}.wn1t3W_revealTransition{animation:.7s both wn1t3W_revealCurrentFrame}.wn1t3W_round[data-round-state=completed] .wn1t3W_revealTransition,.wn1t3W_round[data-round-state=ready_to_continue] .wn1t3W_revealTransition,.wn1t3W_round[data-round-state=ack_submitting] .wn1t3W_revealTransition{animation:none}@keyframes wn1t3W_revealCurrentFrame{0%{opacity:.45;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes wn1t3W_pulse{0%,to{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}@media (width<=720px){.wn1t3W_explorerGrid{grid-template-columns:1fr}.wn1t3W_frame{width:calc(100% - 16px)}.wn1t3W_header,.wn1t3W_body{padding-left:14px;padding-right:14px}.wn1t3W_footer{flex-wrap:wrap;padding-left:14px;padding-right:14px}}@media (prefers-reduced-motion:reduce){.wn1t3W_runningDot,.wn1t3W_revealTransition{animation:none}}";
		const tagId = "@dsh-portable/interactive-learning/LearningActivity.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-portable/interactive-learning";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var LearningActivity_module_css_default = {
			"frame": "wn1t3W_frame",
			"title": "wn1t3W_title",
			"stepCard": "wn1t3W_stepCard",
			"replayCompare": "wn1t3W_replayCompare",
			"replay": "wn1t3W_replay",
			"response": "wn1t3W_response",
			"roundProcess": "wn1t3W_roundProcess",
			"roundParameterValues": "wn1t3W_roundParameterValues",
			"replaySteps": "wn1t3W_replaySteps",
			"body": "wn1t3W_body",
			"toolRow": "wn1t3W_toolRow",
			"compareItem": "wn1t3W_compareItem",
			"primaryButton": "wn1t3W_primaryButton",
			"stepMeta": "wn1t3W_stepMeta",
			"header": "wn1t3W_header",
			"objective": "wn1t3W_objective",
			"round": "wn1t3W_round",
			"roundParameter": "wn1t3W_roundParameter",
			"footer": "wn1t3W_footer",
			"roundCurveList": "wn1t3W_roundCurveList",
			"replayBody": "wn1t3W_replayBody",
			"rangeEnds": "wn1t3W_rangeEnds",
			"replayOutline": "wn1t3W_replayOutline",
			"option": "wn1t3W_option",
			"rowPrompt": "wn1t3W_rowPrompt",
			"chart": "wn1t3W_chart",
			"roundNode": "wn1t3W_roundNode",
			"curve": "wn1t3W_curve",
			"rangeField": "wn1t3W_rangeField",
			"revealed": "wn1t3W_revealed",
			"footerSpacer": "wn1t3W_footerSpacer",
			"runningDot": "wn1t3W_runningDot",
			"emptyCell": "wn1t3W_emptyCell",
			"axis": "wn1t3W_axis",
			"pulse": "wn1t3W_pulse",
			"compareHeader": "wn1t3W_compareHeader",
			"navigation": "wn1t3W_navigation",
			"progress": "wn1t3W_progress",
			"controls": "wn1t3W_controls",
			"roundHeader": "wn1t3W_roundHeader",
			"prediction": "wn1t3W_prediction",
			"scaffold": "wn1t3W_scaffold",
			"activityContent": "wn1t3W_activityContent",
			"predictionGate": "wn1t3W_predictionGate",
			"error": "wn1t3W_error",
			"legend": "wn1t3W_legend",
			"ghostButton": "wn1t3W_ghostButton",
			"compareRows": "wn1t3W_compareRows",
			"compareRow": "wn1t3W_compareRow",
			"roundStructure": "wn1t3W_roundStructure",
			"prompt": "wn1t3W_prompt",
			"predictionStatus": "wn1t3W_predictionStatus",
			"textButton": "wn1t3W_textButton",
			"roundFeedback": "wn1t3W_roundFeedback",
			"revealTransition": "wn1t3W_revealTransition",
			"eyebrow": "wn1t3W_eyebrow",
			"explorerGrid": "wn1t3W_explorerGrid",
			"primaryRow": "wn1t3W_primaryRow",
			"revealCurrentFrame": "wn1t3W_revealCurrentFrame",
			"revealButton": "wn1t3W_revealButton",
			"answerField": "wn1t3W_answerField"
		};
		//#endregion
		//#region src/client/ActivityFrame.tsx
		function ActivityFrame({ activity, busy, error, children, onSkip, onCancel, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: LearningActivity_module_css_default.frame,
				"aria-labelledby": "learning-activity-title",
				"data-learning-activity": activity.kind,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: LearningActivity_module_css_default.header,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: LearningActivity_module_css_default.eyebrow,
								children: t("activity")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								id: "learning-activity-title",
								className: LearningActivity_module_css_default.title,
								children: activity.title
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: LearningActivity_module_css_default.objective,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("objective") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: activity.objective })]
							}),
							activity.scaffold === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								className: LearningActivity_module_css_default.scaffold,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("scaffold") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: activity.scaffold })]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: LearningActivity_module_css_default.body,
						children
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: LearningActivity_module_css_default.footer,
						children: [
							error === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: LearningActivity_module_css_default.footerSpacer }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: LearningActivity_module_css_default.error,
								role: "alert",
								children: error
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: LearningActivity_module_css_default.ghostButton,
								type: "button",
								disabled: busy,
								onClick: onCancel,
								children: t("cancel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: LearningActivity_module_css_default.ghostButton,
								type: "button",
								disabled: busy,
								onClick: onSkip,
								children: t("skip")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/math-expression.ts
		/**
		* Evaluate the protocol's closed mathematical AST. The protocol validator
		* bounds its depth and node count; this evaluator never executes source text.
		*/
		function evaluateMathExpression(expression, bindings) {
			switch (expression.op) {
				case "constant": return expression.value;
				case "variable": return bindings[expression.name] ?? NaN;
				case "add": return evaluateMathExpression(expression.left, bindings) + evaluateMathExpression(expression.right, bindings);
				case "sub": return evaluateMathExpression(expression.left, bindings) - evaluateMathExpression(expression.right, bindings);
				case "mul": return evaluateMathExpression(expression.left, bindings) * evaluateMathExpression(expression.right, bindings);
				case "div": return evaluateMathExpression(expression.left, bindings) / evaluateMathExpression(expression.right, bindings);
				case "pow": return evaluateMathExpression(expression.left, bindings) ** evaluateMathExpression(expression.right, bindings);
				case "neg": return -evaluateMathExpression(expression.value, bindings);
				case "abs": return Math.abs(evaluateMathExpression(expression.value, bindings));
				case "sqrt": return Math.sqrt(evaluateMathExpression(expression.value, bindings));
				case "sin": return Math.sin(evaluateMathExpression(expression.value, bindings));
				case "cos": return Math.cos(evaluateMathExpression(expression.value, bindings));
				case "exp": return Math.exp(evaluateMathExpression(expression.value, bindings));
				case "log": return Math.log(evaluateMathExpression(expression.value, bindings));
			}
		}
		//#endregion
		//#region src/client/ParameterExplorer.tsx
		function formatNumber(value) {
			return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(6)));
		}
		function pathsFor(payload, values) {
			const samples = payload.xAxis.samples ?? 96;
			const series = payload.curves.map(() => []);
			const finiteY = [];
			for (let index = 0; index < samples; index += 1) {
				const x = payload.xAxis.min + (payload.xAxis.max - payload.xAxis.min) * index / (samples - 1);
				for (const [curveIndex, curve] of payload.curves.entries()) {
					const y = evaluateMathExpression(curve.expression, {
						...values,
						x
					});
					series[curveIndex]?.push({
						x,
						y
					});
					if (Number.isFinite(y) && Math.abs(y) <= 0xe8d4a51000) finiteY.push(y);
				}
			}
			if (finiteY.length === 0) return series.map(() => "");
			let minY = Math.min(...finiteY);
			let maxY = Math.max(...finiteY);
			if (minY === maxY) {
				minY -= 1;
				maxY += 1;
			}
			const width = 640;
			const height = 220;
			return series.map((points) => {
				let open = false;
				return points.map((point) => {
					if (!Number.isFinite(point.y) || Math.abs(point.y) > 0xe8d4a51000) {
						open = false;
						return "";
					}
					const px = (point.x - payload.xAxis.min) / (payload.xAxis.max - payload.xAxis.min) * width;
					const py = height - (point.y - minY) / (maxY - minY) * height;
					const command = open ? "L" : "M";
					open = true;
					return `${command}${px.toFixed(2)},${py.toFixed(2)}`;
				}).filter(Boolean).join(" ");
			});
		}
		function ParameterExplorer({ activity, busy, onSubmit, t }) {
			const payload = activity.payload;
			const [values, setValues] = (0, react.useState)(() => Object.fromEntries(payload.parameters.map((parameter) => [parameter.id, parameter.initial])));
			const [answer, setAnswer] = (0, react.useState)("");
			const [prediction, setPrediction] = (0, react.useState)("");
			const [predictionCommitted, setPredictionCommitted] = (0, react.useState)(false);
			const paths = (0, react.useMemo)(() => pathsFor(payload, values), [payload, values]);
			const submit = () => {
				const parameters = { ...values };
				onSubmit({
					answer: {
						prediction: prediction.trim(),
						parameters,
						explanation: answer.trim()
					},
					interactionState: {
						prediction: prediction.trim(),
						predictionCommitted,
						parameters
					}
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: LearningActivity_module_css_default.activityContent,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: LearningActivity_module_css_default.prompt,
						children: payload.question ?? activity.prompt
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: LearningActivity_module_css_default.predictionGate,
						"aria-labelledby": "parameter-prediction-title",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: LearningActivity_module_css_default.answerField,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
									id: "parameter-prediction-title",
									children: t("predict")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("parameterPredictionPrompt") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									value: prediction,
									disabled: busy || predictionCommitted,
									placeholder: t("parameterPredictionPlaceholder"),
									onChange: (event) => setPrediction(event.target.value)
								})
							]
						}), predictionCommitted ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: LearningActivity_module_css_default.predictionStatus,
							role: "status",
							children: t("predictionCommitted")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: LearningActivity_module_css_default.primaryRow,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: LearningActivity_module_css_default.primaryButton,
								type: "button",
								disabled: busy || prediction.trim() === "",
								onClick: () => setPredictionCommitted(true),
								children: t("commitPrediction")
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: LearningActivity_module_css_default.explorerGrid,
						"aria-disabled": !predictionCommitted,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: LearningActivity_module_css_default.controls,
							children: [payload.parameters.map((parameter) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: LearningActivity_module_css_default.rangeField,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("rangeValue", {
										label: parameter.label,
										value: formatNumber(values[parameter.id] ?? parameter.initial)
									}) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "range",
										min: parameter.min,
										max: parameter.max,
										step: parameter.step,
										value: values[parameter.id] ?? parameter.initial,
										disabled: busy || !predictionCommitted,
										"aria-valuetext": formatNumber(values[parameter.id] ?? parameter.initial),
										onChange: (event) => setValues((current) => ({
											...current,
											[parameter.id]: Number(event.target.value)
										}))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: LearningActivity_module_css_default.rangeEnds,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: formatNumber(parameter.min) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: formatNumber(parameter.max) })]
									})
								]
							}, parameter.id)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
								className: LearningActivity_module_css_default.legend,
								children: payload.curves.map((curve, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
									"data-curve": index,
									children: curve.label
								}, curve.id))
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							className: LearningActivity_module_css_default.chart,
							viewBox: "0 0 640 220",
							role: "img",
							"aria-label": t("chartLabel"),
							"aria-hidden": !predictionCommitted,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
									className: LearningActivity_module_css_default.axis,
									x1: "0",
									x2: "640",
									y1: "110",
									y2: "110"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
									className: LearningActivity_module_css_default.axis,
									x1: "320",
									x2: "320",
									y1: "0",
									y2: "220"
								}),
								paths.map((path, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									className: LearningActivity_module_css_default.curve,
									"data-curve": index,
									d: path
								}, payload.curves[index]?.id))
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: LearningActivity_module_css_default.answerField,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("answer") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							value: answer,
							disabled: busy || !predictionCommitted,
							placeholder: t("answerPlaceholder"),
							onChange: (event) => setAnswer(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: LearningActivity_module_css_default.primaryRow,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: LearningActivity_module_css_default.primaryButton,
							type: "button",
							disabled: busy || !predictionCommitted || answer.trim() === "",
							onClick: submit,
							children: busy ? t("submitting") : t("submit")
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/ProcessStepper.tsx
		function ProcessStepper({ activity, busy, onSubmit, t }) {
			const { steps } = activity.payload;
			const [index, setIndex] = (0, react.useState)(0);
			const [answers, setAnswers] = (0, react.useState)({});
			const [revealed, setRevealed] = (0, react.useState)(() => new Set(steps.filter((step) => step.checkpoint === void 0).map((step) => step.id)));
			const step = steps[index];
			const isRevealed = revealed.has(step.id);
			const prediction = answers[step.id] ?? "";
			const canReveal = step.checkpoint === void 0 || prediction.trim() !== "";
			const reveal = () => setRevealed((current) => /* @__PURE__ */ new Set([...current, step.id]));
			const restart = () => {
				setIndex(0);
				setAnswers({});
				setRevealed(new Set(steps.filter((item) => item.checkpoint === void 0).map((item) => item.id)));
			};
			const submit = () => {
				onSubmit({
					answer: { checkpoints: steps.filter((item) => item.checkpoint !== void 0).map((item) => ({
						stepId: item.id,
						answer: answers[item.id] ?? ""
					})) },
					interactionState: {
						currentStep: index,
						revealed: [...revealed]
					}
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: LearningActivity_module_css_default.activityContent,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: LearningActivity_module_css_default.stepMeta,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("step", {
							current: index + 1,
							total: steps.length
						}) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: LearningActivity_module_css_default.textButton,
							type: "button",
							disabled: busy,
							onClick: restart,
							children: t("restart")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
						className: LearningActivity_module_css_default.progress,
						"aria-label": t("step", {
							current: index + 1,
							total: steps.length
						}),
						children: steps.map((item, itemIndex) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
							"data-active": itemIndex === index || void 0,
							"data-done": itemIndex < index || void 0
						}, item.id))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: LearningActivity_module_css_default.stepCard,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: step.title }),
							step.checkpoint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
								className: LearningActivity_module_css_default.prediction,
								disabled: busy || isRevealed,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("predict") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: step.checkpoint.question }),
									step.checkpoint.options === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										value: prediction,
										onChange: (event) => setAnswers((current) => ({
											...current,
											[step.id]: event.target.value
										}))
									}) : step.checkpoint.options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: LearningActivity_module_css_default.option,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "radio",
											name: `prediction-${step.id}`,
											value: option,
											checked: prediction === option,
											onChange: () => setAnswers((current) => ({
												...current,
												[step.id]: option
											}))
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: option })]
									}, option))
								]
							}),
							!isRevealed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: LearningActivity_module_css_default.revealButton,
								type: "button",
								disabled: busy || !canReveal,
								onClick: reveal,
								children: t("reveal")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: LearningActivity_module_css_default.revealed,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: step.content })
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: LearningActivity_module_css_default.navigation,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: LearningActivity_module_css_default.ghostButton,
							type: "button",
							disabled: busy || index === 0,
							onClick: () => setIndex((current) => current - 1),
							children: t("previous")
						}), index < steps.length - 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: LearningActivity_module_css_default.primaryButton,
							type: "button",
							disabled: busy || !isRevealed,
							onClick: () => setIndex((current) => current + 1),
							children: t("next")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: LearningActivity_module_css_default.primaryButton,
							type: "button",
							disabled: busy || !isRevealed,
							onClick: submit,
							children: busy ? t("submitting") : t("submit")
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/StructureCompare.tsx
		function Item({ item }) {
			if (item === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: LearningActivity_module_css_default.emptyCell,
				children: "—"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: LearningActivity_module_css_default.compareItem,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: item.label }), item.detail === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: item.detail })]
			});
		}
		function StructureCompare({ activity, busy, onSubmit, t }) {
			const payload = activity.payload;
			const [selected, setSelected] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [answer, setAnswer] = (0, react.useState)("");
			const left = new Map(payload.left.items.map((item) => [item.id, item]));
			const right = new Map(payload.right.items.map((item) => [item.id, item]));
			const toggle = (id) => setSelected((current) => {
				const next = new Set(current);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			});
			const submit = () => {
				const selectedDifferences = [...selected];
				onSubmit({
					answer: {
						selectedDifferences,
						explanation: answer.trim()
					},
					interactionState: { selectedDifferences }
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: LearningActivity_module_css_default.activityContent,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: LearningActivity_module_css_default.prompt,
						children: payload.question ?? activity.prompt
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: LearningActivity_module_css_default.compareHeader,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: payload.left.title }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: payload.right.title })
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: LearningActivity_module_css_default.compareRows,
						children: payload.alignments.map((alignment) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: LearningActivity_module_css_default.compareRow,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: selected.has(alignment.id),
									disabled: busy,
									"aria-label": alignment.prompt ?? alignment.id,
									onChange: () => toggle(alignment.id)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Item, { item: alignment.leftId === void 0 ? void 0 : left.get(alignment.leftId) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Item, { item: alignment.rightId === void 0 ? void 0 : right.get(alignment.rightId) }),
								alignment.prompt === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: LearningActivity_module_css_default.rowPrompt,
									children: alignment.prompt
								})
							]
						}, alignment.id))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: LearningActivity_module_css_default.answerField,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("answer") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							value: answer,
							disabled: busy,
							placeholder: t("answerPlaceholder"),
							onChange: (event) => setAnswer(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: LearningActivity_module_css_default.primaryRow,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: LearningActivity_module_css_default.primaryButton,
							type: "button",
							disabled: busy || selected.size === 0 || answer.trim() === "",
							onClick: submit,
							children: busy ? t("submitting") : t("submit")
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/ActivityRenderer.tsx
		/**
		* Dispatch table for trusted, package-supplied React components. Extending the
		* protocol means registering another compiled component here, never accepting
		* model-provided HTML or JavaScript.
		*/
		var ActivityRendererRegistry = class {
			#renderers = /* @__PURE__ */ new Map();
			register(kind, renderer) {
				if (this.#renderers.has(kind)) throw new Error(`learning renderer already registered: ${kind}`);
				this.#renderers.set(kind, renderer);
				return () => {
					if (this.#renderers.get(kind) === renderer) this.#renderers.delete(kind);
				};
			}
			resolve(kind) {
				return this.#renderers.get(kind);
			}
			kinds() {
				return [...this.#renderers.keys()];
			}
		};
		const activityRendererRegistry = new ActivityRendererRegistry();
		activityRendererRegistry.register("parameter_explorer", ParameterExplorer);
		activityRendererRegistry.register("process_stepper", ProcessStepper);
		activityRendererRegistry.register("structure_compare", StructureCompare);
		function ActivityRenderer(props) {
			const Renderer = activityRendererRegistry.resolve(props.activity.kind);
			return Renderer === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Renderer, { ...props });
		}
		//#endregion
		//#region src/client/roundState.ts
		function initialRoundState(phase, completed = false) {
			if (completed) return {
				status: "completed",
				error: null
			};
			return {
				status: phase === "question" ? "awaiting_input" : "animating",
				error: null
			};
		}
		/**
		* The round lifecycle is deliberately explicit. UI animation events may move a
		* reveal to `ready_to_continue`, but only the Host response acknowledgement can
		* mark it completed.
		*/
		function roundReducer(state, event) {
			switch (event.type) {
				case "SUBMIT_ANSWER": return state.status === "awaiting_input" ? {
					status: "submitting_answer",
					error: null
				} : state;
				case "ANSWER_ACCEPTED": return state.status === "submitting_answer" ? {
					status: "answer_accepted",
					error: null
				} : state;
				case "WAIT_FOR_REVEAL": return state.status === "answer_accepted" ? {
					status: "awaiting_model_reveal",
					error: null
				} : state;
				case "START_REVEAL": return state.status === "awaiting_model_reveal" ? {
					status: "animating",
					error: null
				} : state;
				case "ANIMATION_FINISHED": return state.status === "animating" ? {
					status: "ready_to_continue",
					error: null
				} : state;
				case "SUBMIT_CONTINUE": return state.status === "ready_to_continue" ? {
					status: "ack_submitting",
					error: null
				} : state;
				case "ACK_ACCEPTED": return state.status === "ack_submitting" ? {
					status: "completed",
					error: null
				} : state;
				case "SUBMISSION_FAILED":
					if (state.status === "submitting_answer") return {
						status: "awaiting_input",
						error: event.message
					};
					if (state.status === "ack_submitting") return {
						status: "ready_to_continue",
						error: event.message
					};
					return state;
			}
		}
		//#endregion
		//#region src/client/lifecycle.ts
		const listeners = /* @__PURE__ */ new Set();
		const emittedCallEvents = /* @__PURE__ */ new Set();
		function subscribeLearningUiLifecycle(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		}
		function emitLearningUiLifecycle(event) {
			const projected = {
				...event,
				at: Date.now()
			};
			for (const listener of listeners) listener(projected);
		}
		function emitLearningCallLifecycle(name, projection) {
			if (projection.callId === void 0) return;
			const key = `${name}:${projection.callId}`;
			if (emittedCallEvents.has(key)) return;
			emittedCallEvents.add(key);
			emitLearningUiLifecycle({
				name,
				...projection
			});
		}
		//#endregion
		//#region src/client/RoundActivity.tsx
		function readStoredRound(storageKey) {
			if (storageKey === void 0 || typeof sessionStorage === "undefined") return {};
			try {
				return JSON.parse(sessionStorage.getItem(`dsh-learning/round@2:${storageKey}`) ?? "{}");
			} catch {
				return {};
			}
		}
		function writeStoredRound(storageKey, update) {
			if (storageKey === void 0 || typeof sessionStorage === "undefined") return;
			const key = `dsh-learning/round@2:${storageKey}`;
			sessionStorage.setItem(key, JSON.stringify({
				...readStoredRound(storageKey),
				...update
			}));
		}
		function ProcessVisual({ activity, final }) {
			if (activity.visual?.kind !== "process") return null;
			const frame = activity.phase === "question" ? activity.visual.frame : final ? activity.visual.after : activity.visual.before;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: LearningActivity_module_css_default.roundProcess,
				"data-final": final || void 0,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: LearningActivity_module_css_default.roundNode,
					children: activity.seq + 1
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: frame.title }), frame.content === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: frame.content })] })]
			});
		}
		function ParameterVisual({ activity }) {
			if (activity.visual?.kind !== "parameter") return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: LearningActivity_module_css_default.roundParameter,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: LearningActivity_module_css_default.roundParameterValues,
					children: activity.visual.parameters.map((parameter) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: parameter.label }),
						" ",
						parameter.initial
					] }, parameter.id))
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: LearningActivity_module_css_default.roundCurveList,
					children: activity.visual.curves.map((curve) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: curve.label }, curve.id))
				})]
			});
		}
		function StructureVisual({ activity }) {
			if (activity.visual?.kind !== "structure") return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
				className: LearningActivity_module_css_default.roundStructure,
				children: [activity.visual.left, activity.visual.right].map((side) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: side.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: side.items.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: item.label }, item.id)) })] }, side.title))
			});
		}
		function CurrentVisual({ activity, final }) {
			if (activity.visual === void 0) return null;
			if (activity.visual.kind === "process") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProcessVisual, {
				activity,
				final
			});
			if (activity.visual.kind === "parameter") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ParameterVisual, { activity });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StructureVisual, { activity });
		}
		function QuestionInput({ activity, disabled, answer, setAnswer }) {
			if (activity.input.kind === "single_choice") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
				className: LearningActivity_module_css_default.prediction,
				disabled,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: activity.prompt }), activity.input.options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: LearningActivity_module_css_default.option,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "radio",
						name: `learning-round-${activity.seq}`,
						value: option.id,
						checked: answer === option.id,
						onChange: () => setAnswer(option.id)
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: option.label })]
				}, option.id))]
			});
			if (activity.input.kind === "number") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: LearningActivity_module_css_default.answerField,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: activity.prompt }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "number",
					value: answer,
					min: activity.input.min,
					max: activity.input.max,
					step: activity.input.step,
					disabled,
					onChange: (event) => setAnswer(event.target.value)
				})]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: LearningActivity_module_css_default.answerField,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: activity.prompt }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
					value: answer,
					placeholder: activity.input.placeholder,
					maxLength: activity.input.maxLength,
					disabled,
					onChange: (event) => setAnswer(event.target.value)
				})]
			});
		}
		function RoundActivity({ activity, completed = false, initialAnswer, storageKey, t, onSubmitAnswer, onContinue, onCancel }) {
			const stored = (0, react.useRef)(readStoredRound(storageKey)).current;
			const [state, dispatch] = (0, react.useReducer)(roundReducer, void 0, () => {
				if (completed || stored.completed === true) return initialRoundState(activity.phase, true);
				if (activity.phase === "reveal" && stored.animationComplete === true) return {
					status: "ready_to_continue",
					error: null
				};
				return initialRoundState(activity.phase);
			});
			const [answer, setAnswer] = (0, react.useState)(() => stored.draft ?? (typeof initialAnswer === "string" || typeof initialAnswer === "number" ? String(initialAnswer) : ""));
			const ackStarted = (0, react.useRef)(false);
			const cancelStarted = (0, react.useRef)(false);
			const lifecycleStarted = (0, react.useRef)(false);
			const revealElement = (0, react.useRef)(null);
			const reducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			(0, react.useEffect)(() => {
				emitLearningUiLifecycle({
					name: "learning.ui.presented",
					phase: activity.phase,
					seq: activity.seq,
					storageKey
				});
			}, [
				activity.phase,
				activity.seq,
				storageKey
			]);
			(0, react.useEffect)(() => {
				if (activity.phase === "reveal" && state.status === "animating" && !lifecycleStarted.current) {
					lifecycleStarted.current = true;
					emitLearningUiLifecycle({
						name: "learning.animation.started",
						phase: activity.phase,
						seq: activity.seq,
						storageKey
					});
				}
			}, [
				activity.phase,
				activity.seq,
				state.status,
				storageKey
			]);
			(0, react.useEffect)(() => {
				if (activity.phase === "reveal" && state.status === "animating" && reducedMotion) {
					emitLearningUiLifecycle({
						name: "learning.animation.finished",
						phase: activity.phase,
						seq: activity.seq,
						storageKey
					});
					writeStoredRound(storageKey, { animationComplete: true });
					dispatch({ type: "ANIMATION_FINISHED" });
				}
			}, [
				activity.phase,
				activity.seq,
				reducedMotion,
				state.status,
				storageKey
			]);
			(0, react.useEffect)(() => {
				if (activity.phase === "question" && state.status === "awaiting_input") writeStoredRound(storageKey, { draft: answer });
			}, [
				activity.phase,
				answer,
				state.status,
				storageKey
			]);
			(0, react.useEffect)(() => {
				if (activity.phase === "reveal" && state.status === "ready_to_continue") writeStoredRound(storageKey, { animationComplete: true });
				if (state.status === "completed") writeStoredRound(storageKey, { completed: true });
			}, [
				activity.phase,
				state.status,
				storageKey
			]);
			const finishAnimation = () => {
				if (state.status === "animating") {
					emitLearningUiLifecycle({
						name: "learning.animation.finished",
						phase: activity.phase,
						seq: activity.seq,
						storageKey
					});
					writeStoredRound(storageKey, { animationComplete: true });
					dispatch({ type: "ANIMATION_FINISHED" });
				}
			};
			(0, react.useEffect)(() => {
				const element = revealElement.current;
				if (element === null || activity.phase !== "reveal" || state.status !== "animating") return;
				element.addEventListener("animationend", finishAnimation);
				return () => element.removeEventListener("animationend", finishAnimation);
			}, [
				activity.phase,
				state.status,
				storageKey
			]);
			const submitAnswer = () => {
				if (activity.phase !== "question" || onSubmitAnswer === void 0 || answer.trim() === "") return;
				dispatch({ type: "SUBMIT_ANSWER" });
				const value = activity.input.kind === "number" ? Number(answer) : answer;
				onSubmitAnswer(value, { answer: value }).then(() => {
					dispatch({ type: "ANSWER_ACCEPTED" });
					dispatch({ type: "WAIT_FOR_REVEAL" });
				}).catch((cause) => dispatch({
					type: "SUBMISSION_FAILED",
					message: cause instanceof Error ? cause.message : String(cause)
				}));
			};
			const submitContinue = () => {
				if (activity.phase !== "reveal" || onContinue === void 0 || state.status !== "ready_to_continue" || ackStarted.current) return;
				ackStarted.current = true;
				dispatch({ type: "SUBMIT_CONTINUE" });
				onContinue({
					completed: true,
					reducedMotion: reducedMotion || void 0
				}).then(() => {
					dispatch({ type: "ACK_ACCEPTED" });
					emitLearningUiLifecycle({
						name: "learning.continue.accepted",
						phase: activity.phase,
						seq: activity.seq,
						storageKey
					});
				}).catch((cause) => dispatch({
					type: "SUBMISSION_FAILED",
					message: cause instanceof Error ? cause.message : String(cause)
				})).finally(() => {
					ackStarted.current = false;
				});
			};
			const final = activity.phase === "reveal" && state.status !== "animating";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: LearningActivity_module_css_default.round,
				"data-round-state": state.status,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: LearningActivity_module_css_default.roundHeader,
						children: [activity.focus.progress === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("roundProgress", {
							current: activity.focus.progress.current,
							total: activity.focus.progress.total ?? "?"
						}) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: activity.focus.title })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						ref: revealElement,
						className: activity.phase === "reveal" ? LearningActivity_module_css_default.revealTransition : void 0,
						"data-reveal-transition": activity.phase === "reveal" || void 0,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CurrentVisual, {
							activity,
							final
						})
					}),
					activity.phase === "question" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(QuestionInput, {
							activity,
							disabled: state.status !== "awaiting_input",
							answer,
							setAnswer
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: LearningActivity_module_css_default.primaryButton,
							type: "button",
							disabled: state.status !== "awaiting_input" || answer.trim() === "",
							onClick: submitAnswer,
							children: state.status === "submitting_answer" ? t("submitting") : t("submitAnswer")
						}),
						state.status === "awaiting_model_reveal" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							role: "status",
							children: t("awaitingReveal")
						}) : null
					] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: LearningActivity_module_css_default.roundFeedback,
						"data-verdict": activity.feedback.verdict,
						children: [
							activity.feedback.learnerEcho === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: activity.feedback.learnerEcho }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: activity.feedback.explanation }),
							activity.feedback.answer === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: activity.feedback.answer })
						]
					}), state.status === "completed" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: LearningActivity_module_css_default.primaryButton,
						type: "button",
						disabled: state.status !== "ready_to_continue",
						onClick: submitContinue,
						children: activity.advance.label ?? t("continue")
					})] }),
					state.error === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: LearningActivity_module_css_default.error,
						role: "alert",
						children: state.error
					}),
					state.status === "completed" || onCancel === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: LearningActivity_module_css_default.textButton,
						type: "button",
						disabled: cancelStarted.current || state.status === "submitting_answer" || state.status === "ack_submitting",
						onClick: () => {
							if (cancelStarted.current) return;
							cancelStarted.current = true;
							onCancel().catch((cause) => dispatch({
								type: "SUBMISSION_FAILED",
								message: cause instanceof Error ? cause.message : String(cause)
							})).finally(() => {
								cancelStarted.current = false;
							});
						},
						children: t("cancel")
					})
				]
			});
		}
		//#endregion
		//#region src/client/LearningComposer.tsx
		function envelopeOf(wait) {
			if (wait.payload.questions.length !== 1) return void 0;
			const question = wait.payload.questions[0];
			const v2 = decodeLearningWaitDetail(question?.detail);
			if (v2 !== void 0 && decodeLearningWaitQuestionId(question?.id) === v2.waitId) return v2;
			const v1 = decodeLearningDetail(question?.detail);
			if (v1 === void 0 || question?.id !== `learning:${v1.activityId}`) return void 0;
			return v1;
		}
		/** Pure composer-chain selector: only package-owned question envelopes are claimed. */
		function selectLearningActivity({ interactions, session }) {
			const currentSessionId = session === void 0 ? void 0 : String(session.sessionId ?? session.id ?? "");
			for (const interaction of interactions) {
				if (interaction.kind !== "question") continue;
				const wait = interaction;
				if (currentSessionId === void 0 || String(wait.sessionId) !== String(currentSessionId)) continue;
				if (envelopeOf(wait) !== void 0) return wait;
			}
			return null;
		}
		function LearningComposer({ matched, t }) {
			const envelope = (0, react.useMemo)(() => envelopeOf(matched), [matched]);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			if (envelope === void 0) return null;
			const send = async (response) => {
				const question = matched.payload.questions[0];
				if (question === void 0) return;
				setBusy(true);
				setError(null);
				try {
					const accepted = await matched.respond({
						ok: true,
						value: {
							sessionId: matched.sessionId,
							answer: { answers: [{
								id: question.id,
								selected: [],
								custom: JSON.stringify(response)
							}] }
						}
					});
					if (!accepted.accepted) throw new Error(accepted.reason);
				} catch (cause) {
					setBusy(false);
					const message = t("error", { message: cause instanceof Error ? cause.message : String(cause) });
					setError(message);
					throw cause;
				}
			};
			if ("waitId" in envelope) {
				const stableReceiptId = `receipt_${envelope.waitId}`;
				const common = {
					protocol: RESPONSE_PROTOCOL_V2,
					activityId: envelope.activityId,
					lessonToken: envelope.lessonToken,
					roundToken: envelope.roundToken,
					seq: envelope.seq
				};
				const storageKey = `${envelope.waitId}:${envelope.activityId}:${envelope.phase}:${envelope.seq}`;
				const submitAnswer = async (answer, interactionState) => {
					await send({
						...common,
						phase: "question",
						action: "submit",
						answer,
						interactionState,
						receiptId: stableReceiptId
					});
				};
				const continueReveal = async (animation) => {
					await send({
						...common,
						phase: "reveal",
						action: "continue",
						animation,
						receiptId: stableReceiptId
					});
				};
				const cancelRound = async () => {
					await send(envelope.phase === "question" ? {
						...common,
						phase: "question",
						action: "cancel",
						receiptId: stableReceiptId
					} : {
						...common,
						phase: "reveal",
						action: "cancel",
						animation: { completed: false },
						receiptId: stableReceiptId
					});
				};
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RoundActivity, {
					activity: envelope.activity,
					storageKey,
					onSubmitAnswer: envelope.phase === "question" ? submitAnswer : void 0,
					onContinue: envelope.phase === "reveal" ? continueReveal : void 0,
					onCancel: cancelRound,
					t
				});
			}
			const respond = (response) => {
				if (matched.payload.questions[0] === void 0) return;
				setBusy(true);
				setError(null);
				send(response).catch(() => {});
			};
			const submit = ({ answer, interactionState }) => respond({
				protocol: RESPONSE_PROTOCOL,
				activityId: envelope.activityId,
				action: "submit",
				answer,
				interactionState
			});
			const skip = () => respond({
				protocol: RESPONSE_PROTOCOL,
				activityId: envelope.activityId,
				action: "skip"
			});
			const cancel = () => {
				setBusy(true);
				setError(null);
				matched.respond({
					ok: false,
					error: {
						code: "cancelled",
						message: "the learner cancelled this activity",
						details: {}
					}
				}).then((receipt) => {
					if (!receipt.accepted) throw new Error(receipt.reason);
				}).catch((cause) => {
					setBusy(false);
					setError(t("error", { message: cause instanceof Error ? cause.message : String(cause) }));
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActivityFrame, {
				activity: envelope.activity,
				busy,
				error,
				onSkip: skip,
				onCancel: cancel,
				t,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActivityRenderer, {
					activity: envelope.activity,
					busy,
					onSubmit: submit,
					t
				})
			}, matched.key);
		}
		//#endregion
		//#region src/client/LearningToolView.tsx
		function activityOf(block) {
			const raw = "kind" in block ? block.call?.argsRaw : block.argsRaw;
			if (raw === void 0 || raw === "") return void 0;
			try {
				const parsed = JSON.parse(raw);
				return parsed.protocol === "dsh-learning/activity@2" ? parseLearningActivityV2(parsed) : parseLearningActivity(parsed);
			} catch {
				return;
			}
		}
		function responseOf(block) {
			if (!("kind" in block)) return void 0;
			const text = block.content.filter((item) => item.type === "text").map((item) => item.text).join("");
			if (text === "") return void 0;
			try {
				const parsed = JSON.parse(text);
				return parsed.protocol === "dsh-learning/response@2" ? parseLearningResponseV2(parsed) : parseLearningResponse(parsed);
			} catch {
				return;
			}
		}
		function ActivityOutline({ activity }) {
			switch (activity.kind) {
				case "parameter_explorer": return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: LearningActivity_module_css_default.replayOutline,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: activity.payload.parameters.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [
						item.label,
						": ",
						item.min,
						"–",
						item.max
					] }, item.id)) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: activity.payload.curves.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: item.label }, item.id)) })]
				});
				case "process_stepper": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
					className: LearningActivity_module_css_default.replaySteps,
					children: activity.payload.steps.map((step) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: step.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: step.content })] }, step.id))
				});
				case "structure_compare": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: LearningActivity_module_css_default.replayCompare,
					children: [activity.payload.left, activity.payload.right].map((side) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: side.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: side.items.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: item.label }, item.id)) })] }, side.title))
				});
			}
		}
		function LearningToolView({ block, inspect, t }) {
			const activity = activityOf(block);
			const done = "kind" in block;
			const response = responseOf(block);
			const callId = block.callId;
			const raw = "kind" in block ? block.call?.argsRaw : block.argsRaw;
			(0, react.useEffect)(() => {
				if (done || raw === void 0 || raw === "") return;
				if (activity === void 0) emitLearningCallLifecycle("learning.call.stream_started", { callId });
				else emitLearningCallLifecycle("learning.call.args_completed", {
					callId,
					phase: activity.protocol === "dsh-learning/activity@2" ? activity.phase : void 0,
					seq: activity.protocol === "dsh-learning/activity@2" ? activity.seq : void 0
				});
			}, [
				activity,
				callId,
				done,
				raw
			]);
			if (activity === void 0) {
				if (!done) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: LearningActivity_module_css_default.toolRow,
					"data-state": "running",
					role: "status",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("waiting") }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: LearningActivity_module_css_default.runningDot,
						"aria-hidden": "true"
					})]
				});
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: LearningActivity_module_css_default.toolRow,
					"data-state": done ? "done" : "running",
					children: t("invalidActivity")
				});
			}
			if (activity.protocol === "dsh-learning/activity@2") {
				if (!done) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					className: LearningActivity_module_css_default.toolRow,
					"data-state": "running",
					type: "button",
					onClick: inspect,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: activity.focus.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("waiting") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: LearningActivity_module_css_default.runningDot,
						"aria-hidden": "true"
					})]
				});
				const v2Response = response?.protocol === "dsh-learning/response@2" ? response : void 0;
				const initialAnswer = v2Response?.phase === "question" ? v2Response.answer : void 0;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: LearningActivity_module_css_default.completedRound,
					"data-learning-result": v2Response?.action ?? "unknown",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RoundActivity, {
						activity,
						completed: true,
						initialAnswer,
						t
					})
				});
			}
			if (!done) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				className: LearningActivity_module_css_default.toolRow,
				"data-state": "running",
				type: "button",
				onClick: inspect,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: activity.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("waiting") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: LearningActivity_module_css_default.runningDot,
					"aria-hidden": "true"
				})]
			});
			const status = response?.action === "submit" ? t("completed") : response?.action === "skip" ? t("skipped") : response?.action === "cancel" ? t("cancelled") : t("noResponse");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
				className: LearningActivity_module_css_default.replay,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: activity.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: status })] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: LearningActivity_module_css_default.replayBody,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: activity.objective }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActivityOutline, { activity }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("fallback") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: activity.fallbackMarkdown })] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: LearningActivity_module_css_default.response,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("response") }), response === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("noResponse") }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", { children: JSON.stringify(response, null, 2) })]
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const zh = {
			activity: "互动学习活动",
			objective: "学习目标",
			scaffold: "提示",
			submit: "提交回答",
			skip: "跳过活动",
			cancel: "取消活动",
			submitting: "正在提交…",
			waiting: "等待你完成活动",
			completed: "已完成互动活动",
			skipped: "已跳过互动活动",
			cancelled: "已取消互动活动",
			answer: "你的解释",
			answerPlaceholder: "用一两句话解释你观察到的关系…",
			response: "学习者回应",
			selected: "已选择的关键差异",
			predict: "先预测",
			parameterPredictionPrompt: "在移动参数前，先写下你预计曲线会怎样变化。",
			parameterPredictionPlaceholder: "例如：参数变为负数时，曲线方向会反转。",
			commitPrediction: "锁定预测并开始探索",
			predictionCommitted: "预测已锁定。现在可以用键盘方向键或鼠标调整参数。",
			reveal: "揭示这一步",
			previous: "上一步",
			next: "下一步",
			restart: "重新开始",
			step: "第 {current} / {total} 步",
			rangeValue: "{label}：{value}",
			chartLabel: "参数变化曲线",
			invalidActivity: "该互动活动无法安全显示，已保留 Markdown 降级内容。",
			error: "提交失败：{message}",
			noResponse: "未记录结构化回应。",
			fallback: "Markdown 降级内容",
			submitAnswer: "提交回答",
			awaitingReveal: "回答已提交，正在等待讲解…",
			continue: "继续",
			roundProgress: "第 {current} / {total} 轮"
		};
		const en = {
			activity: "Interactive learning activity",
			objective: "Learning objective",
			scaffold: "Hint",
			submit: "Submit response",
			skip: "Skip activity",
			cancel: "Cancel activity",
			submitting: "Submitting…",
			waiting: "Waiting for you to complete the activity",
			completed: "Interactive activity completed",
			skipped: "Interactive activity skipped",
			cancelled: "Interactive activity cancelled",
			answer: "Your explanation",
			answerPlaceholder: "Explain the relationship you noticed in one or two sentences…",
			response: "Learner response",
			selected: "Selected key differences",
			predict: "Predict first",
			parameterPredictionPrompt: "Before moving a parameter, write down how you expect the curve to change.",
			parameterPredictionPlaceholder: "For example: a negative value will reverse the direction of the curve.",
			commitPrediction: "Lock prediction and explore",
			predictionCommitted: "Prediction locked. You can now adjust parameters with arrow keys or a pointer.",
			reveal: "Reveal this step",
			previous: "Previous",
			next: "Next",
			restart: "Restart",
			step: "Step {current} / {total}",
			rangeValue: "{label}: {value}",
			chartLabel: "Parameter relationship chart",
			invalidActivity: "This activity could not be displayed safely. Its Markdown fallback is preserved.",
			error: "Submission failed: {message}",
			noResponse: "No structured response was recorded.",
			fallback: "Markdown fallback",
			submitAnswer: "Submit answer",
			awaitingReveal: "Answer submitted. Waiting for the reveal…",
			continue: "Continue",
			roundProgress: "Round {current} / {total}"
		};
		//#endregion
		//#region src/client/index.ts
		const NS = "interactive-learning";
		const LEARNING_TOOL_VIEW_KEYS = [
			"learning_activity",
			"learning_question",
			"learning_reveal"
		];
		const name = "interactive-learning-client";
		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "interactive-learning: dictionaries");
			ctx.slots.inject("conversation.composer", () => ctx.slots.register({
				name: "conversation.composer",
				select: selectLearningActivity,
				priority: -100,
				locale: NS
			}, LearningComposer));
			for (const key of LEARNING_TOOL_VIEW_KEYS) ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
				name: "tool.call.toolview",
				key,
				locale: NS
			}, LearningToolView));
		}
		//#endregion
		exports.ActivityRendererRegistry = ActivityRendererRegistry;
		exports.LEARNING_TOOL_VIEW_KEYS = LEARNING_TOOL_VIEW_KEYS;
		exports.activityRendererRegistry = activityRendererRegistry;
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		exports.subscribeLearningUiLifecycle = subscribeLearningUiLifecycle;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map