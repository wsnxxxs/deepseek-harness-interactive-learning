//#region lib/types/protocol/model.js
/** Every content kind, in renderer-registry order. */
const VISUAL_CONTENT_KINDS = [
	"plot",
	"node_link",
	"scene_2d",
	"relation",
	"timeline",
	"formula_steps",
	"study_map",
	"recall_deck",
	"data_table",
	"state_transition",
	"sequence_buffer",
	"sequence_diagram",
	"code_trace",
	"field_2d",
	"causal_loop"
];
/** Semantic tones a mark may carry; renderers resolve them through the design tokens. */
const VISUAL_TONES = [
	"blue",
	"green",
	"red",
	"orange",
	"purple",
	"gray"
];
/** Line styles a stroked mark may carry. */
const VISUAL_STROKES = [
	"solid",
	"dashed",
	"dotted"
];
//#endregion
//#region lib/types/protocol/checks.js
/**
* Validation primitives shared by every closed payload family.
*
* Each check appends a path-qualified, actionable issue instead of throwing,
* so one validation pass reports every violation of a payload at once. The
* visual content validators use them, and so do presets that validate their
* own payload families with the same issue wording.
*/
/** Whether a value is a JSON object (never an array or `null`). */
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Report every key of `value` that `allowed` does not list. */
function validateOnlyKeys(value, allowed, path, issues) {
	for (const key of Object.keys(value)) if (!allowed.includes(key)) issues.push(`${path}.${key} is not supported`);
}
/** A non-blank string of at most `max` characters. */
function validateText(value, path, issues, max = 8e3) {
	if (typeof value !== "string" || value.trim() === "") {
		issues.push(`${path} must be a non-empty string`);
		return false;
	}
	if (value.length > max) issues.push(`${path} exceeds ${String(max)} characters`);
	return true;
}
/** A finite number. */
function validateFinite(value, path, issues) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		issues.push(`${path} must be a finite number`);
		return false;
	}
	return true;
}
/** An integer of at least `min`. */
function validateInteger(value, path, issues, min = 0) {
	if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
		issues.push(`${path} must be an integer >= ${String(min)}`);
		return false;
	}
	return true;
}
/** A short, lower-case, author-chosen identifier. */
function validateId(value, path, issues) {
	if (typeof value !== "string" || !/^[a-z][a-z0-9_-]{0,31}$/.test(value)) {
		issues.push(`${path} must match ^[a-z][a-z0-9_-]{0,31}$`);
		return false;
	}
	return true;
}
/** Report every entry whose string `id` repeats an earlier entry's. */
function validateUniqueIds(values, path, issues) {
	const seen = /* @__PURE__ */ new Set();
	for (const [index, value] of values.entries()) {
		if (typeof value.id !== "string") continue;
		if (seen.has(value.id)) issues.push(`${path}[${String(index)}].id duplicates ${value.id}`);
		seen.add(value.id);
	}
}
/** UTF-8 size of the JSON encoding, or `undefined` when the value is not serializable. */
function jsonByteLength(value) {
	try {
		return new TextEncoder().encode(JSON.stringify(value)).byteLength;
	} catch {
		return;
	}
}
//#endregion
//#region lib/types/protocol/expression.js
/**
* The bounded mathematical expression language: a closed AST, its validation
* bounds, and a compiler/evaluator that never executes source text.
*/
/** Default AST depth bound (the deepest a standalone expression may nest). */
const MAX_MATH_DEPTH = 8;
/** Node-count bound for any one expression. */
const MAX_MATH_NODES = 64;
/** AST depth bound for expressions embedded in visual content. */
const MAX_VISUAL_MATH_DEPTH = 4;
const MATH_BINARY_OPERATORS = [
	"add",
	"sub",
	"mul",
	"div",
	"pow",
	"min",
	"max"
];
const MATH_UNARY_OPERATORS = [
	"neg",
	"abs",
	"sqrt",
	"sin",
	"cos",
	"tan",
	"atan",
	"exp",
	"log",
	"sigmoid",
	"relu",
	"leaky_relu",
	"step",
	"normpdf",
	"floor",
	"ceil"
];
/**
* Validate an untrusted expression AST: bounded depth and node count, known
* operators, finite bounded constants, and variables limited to `x` (when
* allowed) or a declared parameter id.
*/
function validateMathExpression(value, parameterIds, path, issues, allowX = true, maxDepth = 8) {
	const binary = new Set(MATH_BINARY_OPERATORS);
	const unary = new Set(MATH_UNARY_OPERATORS);
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
		if (node.depth > maxDepth) {
			issues.push(`${node.path} exceeds AST depth ${String(maxDepth)}`);
			return;
		}
		if (!isRecord(node.value) || typeof node.value.op !== "string") {
			issues.push(`${node.path} must be a mathematical AST node`);
			continue;
		}
		const expression = node.value;
		const op = expression.op;
		if (op === "constant") {
			validateOnlyKeys(expression, ["op", "value"], node.path, issues);
			if (validateFinite(expression.value, `${node.path}.value`, issues) && Math.abs(expression.value) > 0xe8d4a51000) issues.push(`${node.path}.value exceeds the numeric limit`);
		} else if (op === "variable") {
			validateOnlyKeys(expression, ["op", "name"], node.path, issues);
			if (typeof expression.name !== "string" || !parameterIds.has(expression.name) && !(allowX && expression.name === "x")) issues.push(`${node.path}.name must be ${allowX ? "x or " : ""}a declared parameter id`);
		} else if (binary.has(op)) {
			validateOnlyKeys(expression, [
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
			validateOnlyKeys(expression, ["op", "value"], node.path, issues);
			stack.push({
				value: expression.value,
				path: `${node.path}.value`,
				depth: node.depth + 1
			});
		} else issues.push(`${node.path}.op is unknown`);
	}
}
/**
* Compile a closed AST into a small closure tree once, so sampling a curve
* does not repeatedly dispatch through every AST node. This intentionally
* uses ordinary closures instead of `new Function`: the model payload remains
* data-only while the hot render path still gets one function call per sample.
*/
function compileMathExpression(expression) {
	switch (expression.op) {
		case "constant": return () => expression.value;
		case "variable": return (bindings) => bindings[expression.name] ?? NaN;
		case "add": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) + right(bindings);
		}
		case "sub": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) - right(bindings);
		}
		case "mul": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) * right(bindings);
		}
		case "div": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) / right(bindings);
		}
		case "pow": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => left(bindings) ** right(bindings);
		}
		case "min": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => Math.min(left(bindings), right(bindings));
		}
		case "max": {
			const left = compileMathExpression(expression.left);
			const right = compileMathExpression(expression.right);
			return (bindings) => Math.max(left(bindings), right(bindings));
		}
		case "neg": {
			const value = compileMathExpression(expression.value);
			return (bindings) => -value(bindings);
		}
		case "abs": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.abs(value(bindings));
		}
		case "sqrt": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.sqrt(value(bindings));
		}
		case "sin": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.sin(value(bindings));
		}
		case "cos": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.cos(value(bindings));
		}
		case "tan": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.tan(value(bindings));
		}
		case "atan": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.atan(value(bindings));
		}
		case "exp": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.exp(value(bindings));
		}
		case "log": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.log(value(bindings));
		}
		case "sigmoid": {
			const value = compileMathExpression(expression.value);
			return (bindings) => {
				const result = value(bindings);
				if (result >= 0) return 1 / (1 + Math.exp(-result));
				const exponential = Math.exp(result);
				return exponential / (1 + exponential);
			};
		}
		case "relu": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.max(0, value(bindings));
		}
		case "leaky_relu": {
			const value = compileMathExpression(expression.value);
			return (bindings) => {
				const result = value(bindings);
				return result >= 0 ? result : result * .01;
			};
		}
		case "step": {
			const value = compileMathExpression(expression.value);
			return (bindings) => value(bindings) >= 0 ? 1 : 0;
		}
		case "normpdf": {
			const value = compileMathExpression(expression.value);
			return (bindings) => {
				const result = value(bindings);
				return Math.exp(-.5 * result * result) / Math.sqrt(2 * Math.PI);
			};
		}
		case "floor": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.floor(value(bindings));
		}
		case "ceil": {
			const value = compileMathExpression(expression.value);
			return (bindings) => Math.ceil(value(bindings));
		}
	}
}
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
		case "min": return Math.min(evaluateMathExpression(expression.left, bindings), evaluateMathExpression(expression.right, bindings));
		case "max": return Math.max(evaluateMathExpression(expression.left, bindings), evaluateMathExpression(expression.right, bindings));
		case "neg": return -evaluateMathExpression(expression.value, bindings);
		case "abs": return Math.abs(evaluateMathExpression(expression.value, bindings));
		case "sqrt": return Math.sqrt(evaluateMathExpression(expression.value, bindings));
		case "sin": return Math.sin(evaluateMathExpression(expression.value, bindings));
		case "cos": return Math.cos(evaluateMathExpression(expression.value, bindings));
		case "tan": return Math.tan(evaluateMathExpression(expression.value, bindings));
		case "atan": return Math.atan(evaluateMathExpression(expression.value, bindings));
		case "exp": return Math.exp(evaluateMathExpression(expression.value, bindings));
		case "log": return Math.log(evaluateMathExpression(expression.value, bindings));
		case "sigmoid": {
			const value = evaluateMathExpression(expression.value, bindings);
			if (value >= 0) return 1 / (1 + Math.exp(-value));
			const exponential = Math.exp(value);
			return exponential / (1 + exponential);
		}
		case "relu": return Math.max(0, evaluateMathExpression(expression.value, bindings));
		case "leaky_relu": {
			const value = evaluateMathExpression(expression.value, bindings);
			return value >= 0 ? value : value * .01;
		}
		case "step": return evaluateMathExpression(expression.value, bindings) >= 0 ? 1 : 0;
		case "normpdf": {
			const value = evaluateMathExpression(expression.value, bindings);
			return Math.exp(-.5 * value * value) / Math.sqrt(2 * Math.PI);
		}
		case "floor": return Math.floor(evaluateMathExpression(expression.value, bindings));
		case "ceil": return Math.ceil(evaluateMathExpression(expression.value, bindings));
	}
}
//#endregion
//#region lib/types/protocol/content.js
/**
* Strict validators for every content kind of the visual model.
*
* Each validator checks one kind's closed shape, bounds and internal
* references, appends actionable issues under `visual.content`, and returns
* the ids a sequence frame may focus.
*/
const TONES = new Set(VISUAL_TONES);
const STROKES = new Set(VISUAL_STROKES);
/** A plot or scene axis: an ordered, finite range with an optional label and sample count. */
function validateAxis(value, path, issues, samplesAllowed) {
	if (!isRecord(value)) {
		issues.push(`${path} must be an object`);
		return;
	}
	validateOnlyKeys(value, samplesAllowed ? [
		"label",
		"min",
		"max",
		"samples"
	] : [
		"label",
		"min",
		"max"
	], path, issues);
	if (value.label !== void 0) validateText(value.label, `${path}.label`, issues, 120);
	const minOk = validateFinite(value.min, `${path}.min`, issues);
	const maxOk = validateFinite(value.max, `${path}.max`, issues);
	if (minOk && maxOk && value.min >= value.max) issues.push(`${path}.min must be less than max`);
	if (samplesAllowed && value.samples !== void 0 && (!validateInteger(value.samples, `${path}.samples`, issues, 24) || value.samples > 256)) issues.push(`${path}.samples must be an integer from 24 to 256`);
}
function validateTone(value, path, issues) {
	if (value !== void 0 && !TONES.has(value)) issues.push(`${path} is unknown`);
}
function validateStroke(value, path, issues) {
	if (value !== void 0 && !STROKES.has(value)) issues.push(`${path} is unknown`);
}
function registerVisualId(ids, value, path, issues) {
	if (typeof value !== "string") return;
	if (ids.has(value)) issues.push(`${path} duplicates visual id ${value}`);
	else ids.add(value);
}
function validateParameters(value, issues) {
	const path = "visual.content.parameters";
	if (value === void 0) return [];
	if (!Array.isArray(value) || value.length > 3) {
		issues.push(`${path} must contain at most 3 parameters`);
		return [];
	}
	const parameters = value.filter(isRecord);
	if (parameters.length !== value.length) issues.push(`${path} entries must be objects`);
	validateUniqueIds(parameters, path, issues);
	for (const [index, parameter] of parameters.entries()) {
		const itemPath = `${path}[${String(index)}]`;
		validateOnlyKeys(parameter, [
			"id",
			"label",
			"min",
			"max",
			"step",
			"initial"
		], itemPath, issues);
		validateId(parameter.id, `${itemPath}.id`, issues);
		if (parameter.id === "x") issues.push(`${itemPath}.id must not use the reserved x-axis variable`);
		validateText(parameter.label, `${itemPath}.label`, issues, 120);
		const minOk = validateFinite(parameter.min, `${itemPath}.min`, issues);
		const maxOk = validateFinite(parameter.max, `${itemPath}.max`, issues);
		const stepOk = validateFinite(parameter.step, `${itemPath}.step`, issues);
		const initialOk = validateFinite(parameter.initial, `${itemPath}.initial`, issues);
		if (minOk && maxOk && parameter.min >= parameter.max) issues.push(`${itemPath}.min must be less than max`);
		if (stepOk && parameter.step <= 0) issues.push(`${itemPath}.step must be positive`);
		if (minOk && maxOk && stepOk && parameter.step > parameter.max - parameter.min) issues.push(`${itemPath}.step must not exceed the parameter range`);
		if (minOk && maxOk && initialOk && (parameter.initial < parameter.min || parameter.initial > parameter.max)) issues.push(`${itemPath}.initial must be inside the parameter range`);
	}
	return parameters;
}
function validatePoints(value, path, issues, maximum = 256) {
	if (!Array.isArray(value) || value.length < 1 || value.length > maximum) {
		issues.push(`${path} must contain 1 to ${String(maximum)} points`);
		return;
	}
	for (const [index, point] of value.entries()) {
		const pointPath = `${path}[${String(index)}]`;
		if (!isRecord(point)) {
			issues.push(`${pointPath} must be an object`);
			continue;
		}
		validateOnlyKeys(point, [
			"x",
			"y",
			"label"
		], pointPath, issues);
		validateFinite(point.x, `${pointPath}.x`, issues);
		validateFinite(point.y, `${pointPath}.y`, issues);
		if (point.label !== void 0) validateText(point.label, `${pointPath}.label`, issues, 160);
	}
}
function validateMetrics(value, parameterIds, issues) {
	if (value === void 0) return [];
	if (!Array.isArray(value) || value.length > 4) {
		issues.push("visual.content.metrics must contain at most 4 metrics");
		return [];
	}
	const metrics = value.filter(isRecord);
	if (metrics.length !== value.length) issues.push("visual.content.metrics entries must be objects");
	validateUniqueIds(metrics, "visual.content.metrics", issues);
	for (const [index, metric] of metrics.entries()) {
		const path = `visual.content.metrics[${String(index)}]`;
		validateOnlyKeys(metric, [
			"id",
			"label",
			"expression",
			"digits",
			"suffix"
		], path, issues);
		validateId(metric.id, `${path}.id`, issues);
		validateText(metric.label, `${path}.label`, issues, 160);
		validateMathExpression(metric.expression, parameterIds, `${path}.expression`, issues, false, 4);
		if (metric.digits !== void 0 && (!validateInteger(metric.digits, `${path}.digits`, issues) || metric.digits > 6)) issues.push(`${path}.digits must be an integer from 0 to 6`);
		if (metric.suffix !== void 0) validateText(metric.suffix, `${path}.suffix`, issues, 80);
	}
	return metrics;
}
function validatePlot(value, issues) {
	const ids = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"parameters",
		"xAxis",
		"yAxis",
		"series",
		"metrics"
	], "visual.content", issues);
	const parameters = validateParameters(value.parameters, issues);
	const parameterIds = new Set(parameters.flatMap((parameter) => typeof parameter.id === "string" ? [parameter.id] : []));
	for (const parameterId of parameterIds) registerVisualId(ids, parameterId, "visual.content.parameters", issues);
	validateAxis(value.xAxis, "visual.content.xAxis", issues, true);
	validateAxis(value.yAxis, "visual.content.yAxis", issues, false);
	if (!Array.isArray(value.series) || value.series.length < 1 || value.series.length > 8) issues.push("visual.content.series must contain 1 to 8 series");
	else {
		const series = value.series.filter(isRecord);
		if (series.length !== value.series.length) issues.push("visual.content.series entries must be objects");
		validateUniqueIds(series, "visual.content.series", issues);
		for (const [index, item] of series.entries()) {
			const path = `visual.content.series[${String(index)}]`;
			if (validateId(item.id, `${path}.id`, issues)) registerVisualId(ids, item.id, `${path}.id`, issues);
			validateText(item.label, `${path}.label`, issues, 160);
			validateTone(item.tone, `${path}.tone`, issues);
			if (item.type === "curve") {
				validateOnlyKeys(item, [
					"type",
					"id",
					"label",
					"expression",
					"tone",
					"stroke"
				], path, issues);
				validateStroke(item.stroke, `${path}.stroke`, issues);
				validateMathExpression(item.expression, parameterIds, `${path}.expression`, issues, true, 4);
			} else if (item.type === "points" || item.type === "bars") {
				validateOnlyKeys(item, [
					"type",
					"id",
					"label",
					"points",
					"tone"
				], path, issues);
				validatePoints(item.points, `${path}.points`, issues, item.type === "bars" ? 64 : 256);
			} else if (item.type === "line") {
				validateOnlyKeys(item, [
					"type",
					"id",
					"label",
					"points",
					"tone",
					"stroke"
				], path, issues);
				validateStroke(item.stroke, `${path}.stroke`, issues);
				validatePoints(item.points, `${path}.points`, issues);
			} else issues.push(`${path}.type must be curve, points, line, or bars`);
		}
	}
	const metrics = validateMetrics(value.metrics, parameterIds, issues);
	for (const [index, metric] of metrics.entries()) if (typeof metric.id === "string") registerVisualId(ids, metric.id, `visual.content.metrics[${String(index)}].id`, issues);
	return ids;
}
function validateNodeLink(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"layout",
		"groups",
		"nodes",
		"edges"
	], "visual.content", issues);
	if (![
		"layered",
		"hierarchy",
		"radial"
	].includes(value.layout)) issues.push("visual.content.layout must be layered, hierarchy, or radial");
	let groups = [];
	if (value.groups !== void 0) {
		if (!Array.isArray(value.groups) || value.groups.length < 1 || value.groups.length > 12) issues.push("visual.content.groups must contain 1 to 12 groups");
		else {
			groups = value.groups.filter(isRecord);
			if (groups.length !== value.groups.length) issues.push("visual.content.groups entries must be objects");
			validateUniqueIds(groups, "visual.content.groups", issues);
			for (const [index, group] of groups.entries()) {
				const path = `visual.content.groups[${String(index)}]`;
				validateOnlyKeys(group, ["id", "label"], path, issues);
				if (validateId(group.id, `${path}.id`, issues)) registerVisualId(focusIds, group.id, `${path}.id`, issues);
				validateText(group.label, `${path}.label`, issues, 120);
			}
		}
	}
	const groupIds = new Set(groups.flatMap((group) => typeof group.id === "string" ? [group.id] : []));
	let nodes = [];
	if (!Array.isArray(value.nodes) || value.nodes.length < 2 || value.nodes.length > 48) issues.push("visual.content.nodes must contain 2 to 48 nodes");
	else {
		nodes = value.nodes.filter(isRecord);
		if (nodes.length !== value.nodes.length) issues.push("visual.content.nodes entries must be objects");
		validateUniqueIds(nodes, "visual.content.nodes", issues);
		for (const [index, node] of nodes.entries()) {
			const path = `visual.content.nodes[${String(index)}]`;
			validateOnlyKeys(node, [
				"id",
				"label",
				"detail",
				"group",
				"tone"
			], path, issues);
			if (validateId(node.id, `${path}.id`, issues)) registerVisualId(focusIds, node.id, `${path}.id`, issues);
			validateText(node.label, `${path}.label`, issues, 120);
			if (node.detail !== void 0) validateText(node.detail, `${path}.detail`, issues, 1e3);
			if (node.group !== void 0 && (typeof node.group !== "string" || !groupIds.has(node.group))) issues.push(`${path}.group must reference a declared group`);
			validateTone(node.tone, `${path}.tone`, issues);
		}
	}
	if (value.layout === "layered" && (groups.length === 0 || nodes.some((node) => typeof node.group !== "string"))) issues.push("visual.content layered layouts require groups and a group on every node");
	const nodeIds = new Set(nodes.flatMap((node) => typeof node.id === "string" ? [node.id] : []));
	if (!Array.isArray(value.edges) || value.edges.length < 1 || value.edges.length > 160) issues.push("visual.content.edges must contain 1 to 160 edges");
	else {
		const edges = value.edges.filter(isRecord);
		if (edges.length !== value.edges.length) issues.push("visual.content.edges entries must be objects");
		validateUniqueIds(edges, "visual.content.edges", issues);
		for (const [index, edge] of edges.entries()) {
			const path = `visual.content.edges[${String(index)}]`;
			validateOnlyKeys(edge, [
				"id",
				"from",
				"to",
				"label",
				"detail",
				"tone",
				"stroke",
				"directed"
			], path, issues);
			if (validateId(edge.id, `${path}.id`, issues)) registerVisualId(focusIds, edge.id, `${path}.id`, issues);
			if (typeof edge.from !== "string" || !nodeIds.has(edge.from)) issues.push(`${path}.from must reference a declared node`);
			if (typeof edge.to !== "string" || !nodeIds.has(edge.to)) issues.push(`${path}.to must reference a declared node`);
			if (edge.label !== void 0) validateText(edge.label, `${path}.label`, issues, 120);
			if (edge.detail !== void 0) validateText(edge.detail, `${path}.detail`, issues, 1e3);
			validateTone(edge.tone, `${path}.tone`, issues);
			validateStroke(edge.stroke, `${path}.stroke`, issues);
			if (edge.directed !== void 0 && typeof edge.directed !== "boolean") issues.push(`${path}.directed must be a boolean`);
		}
	}
	return focusIds;
}
function validateSceneElementBase(element, path, allowed, issues) {
	validateOnlyKeys(element, [
		"type",
		"id",
		"label",
		"detail",
		"tone",
		...allowed
	], path, issues);
	validateId(element.id, `${path}.id`, issues);
	if (element.label !== void 0) validateText(element.label, `${path}.label`, issues, 120);
	if (element.detail !== void 0) validateText(element.detail, `${path}.detail`, issues, 1e3);
	validateTone(element.tone, `${path}.tone`, issues);
}
function validateScene2D(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"xAxis",
		"yAxis",
		"grid",
		"elements"
	], "visual.content", issues);
	validateAxis(value.xAxis, "visual.content.xAxis", issues, false);
	validateAxis(value.yAxis, "visual.content.yAxis", issues, false);
	if (value.grid !== void 0 && typeof value.grid !== "boolean") issues.push("visual.content.grid must be a boolean");
	if (!Array.isArray(value.elements) || value.elements.length < 1 || value.elements.length > 64) {
		issues.push("visual.content.elements must contain 1 to 64 elements");
		return focusIds;
	}
	const elements = value.elements.filter(isRecord);
	if (elements.length !== value.elements.length) issues.push("visual.content.elements entries must be objects");
	validateUniqueIds(elements, "visual.content.elements", issues);
	for (const [index, element] of elements.entries()) {
		const path = `visual.content.elements[${String(index)}]`;
		registerVisualId(focusIds, element.id, `${path}.id`, issues);
		if (element.type === "point") {
			validateSceneElementBase(element, path, [
				"x",
				"y",
				"size"
			], issues);
			validateFinite(element.x, `${path}.x`, issues);
			validateFinite(element.y, `${path}.y`, issues);
			if (element.size !== void 0 && validateFinite(element.size, `${path}.size`, issues) && (element.size <= 0 || element.size > 64)) issues.push(`${path}.size must be greater than 0 and at most 64`);
		} else if (element.type === "segment" || element.type === "arrow") {
			validateSceneElementBase(element, path, [
				"x1",
				"y1",
				"x2",
				"y2",
				"stroke"
			], issues);
			validateFinite(element.x1, `${path}.x1`, issues);
			validateFinite(element.y1, `${path}.y1`, issues);
			validateFinite(element.x2, `${path}.x2`, issues);
			validateFinite(element.y2, `${path}.y2`, issues);
			validateStroke(element.stroke, `${path}.stroke`, issues);
		} else if (element.type === "circle") {
			validateSceneElementBase(element, path, [
				"cx",
				"cy",
				"r"
			], issues);
			validateFinite(element.cx, `${path}.cx`, issues);
			validateFinite(element.cy, `${path}.cy`, issues);
			if (validateFinite(element.r, `${path}.r`, issues) && element.r <= 0) issues.push(`${path}.r must be positive`);
		} else if (element.type === "rect") {
			validateSceneElementBase(element, path, [
				"x",
				"y",
				"width",
				"height"
			], issues);
			validateFinite(element.x, `${path}.x`, issues);
			validateFinite(element.y, `${path}.y`, issues);
			if (validateFinite(element.width, `${path}.width`, issues) && element.width <= 0) issues.push(`${path}.width must be positive`);
			if (validateFinite(element.height, `${path}.height`, issues) && element.height <= 0) issues.push(`${path}.height must be positive`);
		} else if (element.type === "polygon") {
			validateSceneElementBase(element, path, ["points"], issues);
			if (!Array.isArray(element.points) || element.points.length < 3 || element.points.length > 24) issues.push(`${path}.points must contain 3 to 24 points`);
			else for (const [pointIndex, point] of element.points.entries()) {
				const pointPath = `${path}.points[${String(pointIndex)}]`;
				if (!isRecord(point)) {
					issues.push(`${pointPath} must be an object`);
					continue;
				}
				validateOnlyKeys(point, ["x", "y"], pointPath, issues);
				validateFinite(point.x, `${pointPath}.x`, issues);
				validateFinite(point.y, `${pointPath}.y`, issues);
			}
		} else if (element.type === "label") {
			validateSceneElementBase(element, path, [
				"x",
				"y",
				"text"
			], issues);
			validateFinite(element.x, `${path}.x`, issues);
			validateFinite(element.y, `${path}.y`, issues);
			validateText(element.text, `${path}.text`, issues, 240);
		} else issues.push(`${path}.type must be point, segment, arrow, circle, rect, polygon, or label`);
	}
	return focusIds;
}
function validateRelationSubjects(value, path, issues) {
	if (!Array.isArray(value) || value.length < 2 || value.length > 4) {
		issues.push(`${path} must contain 2 to 4 subjects`);
		return [];
	}
	const subjects = value.filter(isRecord);
	if (subjects.length !== value.length) issues.push(`${path} entries must be objects`);
	validateUniqueIds(subjects, path, issues);
	for (const [index, subject] of subjects.entries()) {
		const itemPath = `${path}[${String(index)}]`;
		validateOnlyKeys(subject, [
			"id",
			"label",
			"detail",
			"tone"
		], itemPath, issues);
		validateId(subject.id, `${itemPath}.id`, issues);
		validateText(subject.label, `${itemPath}.label`, issues, 120);
		if (subject.detail !== void 0) validateText(subject.detail, `${itemPath}.detail`, issues, 1e3);
		validateTone(subject.tone, `${itemPath}.tone`, issues);
	}
	return subjects;
}
function validateRelationAxis(value, path, issues) {
	if (!Array.isArray(value) || value.length < 1 || value.length > 10) {
		issues.push(`${path} must contain 1 to 10 items`);
		return [];
	}
	const items = value.filter(isRecord);
	if (items.length !== value.length) issues.push(`${path} entries must be objects`);
	validateUniqueIds(items, path, issues);
	for (const [index, item] of items.entries()) {
		const itemPath = `${path}[${String(index)}]`;
		validateOnlyKeys(item, ["id", "label"], itemPath, issues);
		validateId(item.id, `${itemPath}.id`, issues);
		validateText(item.label, `${itemPath}.label`, issues, 120);
	}
	return items;
}
function validateRelation(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	if (value.variant === "comparison") {
		validateOnlyKeys(value, [
			"kind",
			"variant",
			"subjects",
			"rows"
		], "visual.content", issues);
		const subjects = validateRelationSubjects(value.subjects, "visual.content.subjects", issues);
		const subjectIds = new Set(subjects.flatMap((subject) => typeof subject.id === "string" ? [subject.id] : []));
		for (const subjectId of subjectIds) registerVisualId(focusIds, subjectId, "visual.content.subjects", issues);
		if (!Array.isArray(value.rows) || value.rows.length < 1 || value.rows.length > 16) {
			issues.push("visual.content.rows must contain 1 to 16 comparison rows");
			return focusIds;
		}
		const rows = value.rows.filter(isRecord);
		if (rows.length !== value.rows.length) issues.push("visual.content.rows entries must be objects");
		validateUniqueIds(rows, "visual.content.rows", issues);
		for (const [index, row] of rows.entries()) {
			const path = `visual.content.rows[${String(index)}]`;
			validateOnlyKeys(row, [
				"id",
				"label",
				"cells",
				"detail"
			], path, issues);
			if (validateId(row.id, `${path}.id`, issues)) registerVisualId(focusIds, row.id, `${path}.id`, issues);
			validateText(row.label, `${path}.label`, issues, 120);
			if (row.detail !== void 0) validateText(row.detail, `${path}.detail`, issues, 1e3);
			if (!Array.isArray(row.cells) || row.cells.length < 1 || row.cells.length > 4) {
				issues.push(`${path}.cells must contain 1 to 4 cells`);
				continue;
			}
			const seenSubjects = /* @__PURE__ */ new Set();
			for (const [cellIndex, cell] of row.cells.entries()) {
				const cellPath = `${path}.cells[${String(cellIndex)}]`;
				if (!isRecord(cell)) {
					issues.push(`${cellPath} must be an object`);
					continue;
				}
				validateOnlyKeys(cell, [
					"subjectId",
					"value",
					"tone"
				], cellPath, issues);
				if (typeof cell.subjectId !== "string" || !subjectIds.has(cell.subjectId)) issues.push(`${cellPath}.subjectId must reference a declared subject`);
				else if (seenSubjects.has(cell.subjectId)) issues.push(`${cellPath}.subjectId duplicates ${cell.subjectId}`);
				else seenSubjects.add(cell.subjectId);
				validateText(cell.value, `${cellPath}.value`, issues, 500);
				validateTone(cell.tone, `${cellPath}.tone`, issues);
			}
		}
	} else if (value.variant === "matrix") {
		validateOnlyKeys(value, [
			"kind",
			"variant",
			"rows",
			"columns",
			"cells"
		], "visual.content", issues);
		const rows = validateRelationAxis(value.rows, "visual.content.rows", issues);
		const columns = validateRelationAxis(value.columns, "visual.content.columns", issues);
		const rowIds = new Set(rows.flatMap((row) => typeof row.id === "string" ? [row.id] : []));
		const columnIds = new Set(columns.flatMap((column) => typeof column.id === "string" ? [column.id] : []));
		for (const rowId of rowIds) registerVisualId(focusIds, rowId, "visual.content.rows", issues);
		for (const columnId of columnIds) registerVisualId(focusIds, columnId, "visual.content.columns", issues);
		if (!Array.isArray(value.cells) || value.cells.length < 1 || value.cells.length > 64) {
			issues.push("visual.content.cells must contain 1 to 64 matrix cells");
			return focusIds;
		}
		const cells = value.cells.filter(isRecord);
		if (cells.length !== value.cells.length) issues.push("visual.content.cells entries must be objects");
		validateUniqueIds(cells, "visual.content.cells", issues);
		const coordinates = /* @__PURE__ */ new Set();
		for (const [index, cell] of cells.entries()) {
			const path = `visual.content.cells[${String(index)}]`;
			validateOnlyKeys(cell, [
				"id",
				"rowId",
				"columnId",
				"label",
				"detail",
				"tone"
			], path, issues);
			if (validateId(cell.id, `${path}.id`, issues)) registerVisualId(focusIds, cell.id, `${path}.id`, issues);
			if (typeof cell.rowId !== "string" || !rowIds.has(cell.rowId)) issues.push(`${path}.rowId must reference a declared row`);
			if (typeof cell.columnId !== "string" || !columnIds.has(cell.columnId)) issues.push(`${path}.columnId must reference a declared column`);
			if (typeof cell.rowId === "string" && typeof cell.columnId === "string") {
				const coordinate = `${cell.rowId}\u0000${cell.columnId}`;
				if (coordinates.has(coordinate)) issues.push(`${path} duplicates a matrix coordinate`);
				coordinates.add(coordinate);
			}
			validateText(cell.label, `${path}.label`, issues, 240);
			if (cell.detail !== void 0) validateText(cell.detail, `${path}.detail`, issues, 1e3);
			validateTone(cell.tone, `${path}.tone`, issues);
		}
	} else if (value.variant === "sets") {
		validateOnlyKeys(value, [
			"kind",
			"variant",
			"sets",
			"items"
		], "visual.content", issues);
		const sets = validateRelationSubjects(value.sets, "visual.content.sets", issues);
		if (sets.length > 3) issues.push("visual.content.sets must contain at most 3 sets");
		const setIds = new Set(sets.flatMap((item) => typeof item.id === "string" ? [item.id] : []));
		for (const setId of setIds) registerVisualId(focusIds, setId, "visual.content.sets", issues);
		if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 24) {
			issues.push("visual.content.items must contain 1 to 24 set items");
			return focusIds;
		}
		const items = value.items.filter(isRecord);
		if (items.length !== value.items.length) issues.push("visual.content.items entries must be objects");
		validateUniqueIds(items, "visual.content.items", issues);
		for (const [index, item] of items.entries()) {
			const path = `visual.content.items[${String(index)}]`;
			validateOnlyKeys(item, [
				"id",
				"label",
				"setIds",
				"detail"
			], path, issues);
			if (validateId(item.id, `${path}.id`, issues)) registerVisualId(focusIds, item.id, `${path}.id`, issues);
			validateText(item.label, `${path}.label`, issues, 120);
			if (item.detail !== void 0) validateText(item.detail, `${path}.detail`, issues, 1e3);
			if (!Array.isArray(item.setIds) || item.setIds.length < 1 || item.setIds.length > 3) issues.push(`${path}.setIds must contain 1 to 3 set ids`);
			else {
				const memberships = /* @__PURE__ */ new Set();
				for (const setId of item.setIds) if (typeof setId !== "string" || !setIds.has(setId)) issues.push(`${path}.setIds must reference declared sets`);
				else if (memberships.has(setId)) issues.push(`${path}.setIds duplicates ${setId}`);
				else memberships.add(setId);
			}
		}
	} else issues.push("visual.content.variant must be comparison, matrix, or sets");
	return focusIds;
}
function validateTimeline(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"orientation",
		"events",
		"eras"
	], "visual.content", issues);
	if (value.orientation !== void 0 && value.orientation !== "horizontal" && value.orientation !== "vertical") issues.push("visual.content.orientation must be horizontal or vertical");
	let events = [];
	if (!Array.isArray(value.events) || value.events.length < 2 || value.events.length > 32) issues.push("visual.content.events must contain 2 to 32 events");
	else {
		events = value.events.filter(isRecord);
		if (events.length !== value.events.length) issues.push("visual.content.events entries must be objects");
		validateUniqueIds(events, "visual.content.events", issues);
		const hasPositions = events.filter((event) => event.position !== void 0).length;
		if (hasPositions !== 0 && hasPositions !== events.length) issues.push("visual.content.events.position must be provided for every event or omitted for every event");
		let previousPosition = -1;
		for (const [index, event] of events.entries()) {
			const path = `visual.content.events[${String(index)}]`;
			validateOnlyKeys(event, [
				"id",
				"time",
				"label",
				"detail",
				"position",
				"tone"
			], path, issues);
			if (validateId(event.id, `${path}.id`, issues)) registerVisualId(focusIds, event.id, `${path}.id`, issues);
			validateText(event.time, `${path}.time`, issues, 80);
			validateText(event.label, `${path}.label`, issues, 160);
			if (event.detail !== void 0) validateText(event.detail, `${path}.detail`, issues, 1500);
			if (event.position !== void 0 && validateFinite(event.position, `${path}.position`, issues)) {
				const position = event.position;
				if (position < 0 || position > 1) issues.push(`${path}.position must be from 0 to 1`);
				if (position <= previousPosition) issues.push(`${path}.position must be greater than the preceding event position`);
				previousPosition = position;
			}
			validateTone(event.tone, `${path}.tone`, issues);
		}
	}
	const eventIds = new Set(events.flatMap((event) => typeof event.id === "string" ? [event.id] : []));
	const eventIndexes = new Map(events.flatMap((event, index) => typeof event.id === "string" ? [[event.id, index]] : []));
	if (value.eras !== void 0) {
		if (!Array.isArray(value.eras) || value.eras.length < 1 || value.eras.length > 8) issues.push("visual.content.eras must contain 1 to 8 eras");
		else {
			const eras = value.eras.filter(isRecord);
			if (eras.length !== value.eras.length) issues.push("visual.content.eras entries must be objects");
			validateUniqueIds(eras, "visual.content.eras", issues);
			for (const [index, era] of eras.entries()) {
				const path = `visual.content.eras[${String(index)}]`;
				validateOnlyKeys(era, [
					"id",
					"label",
					"startEventId",
					"endEventId",
					"detail",
					"tone"
				], path, issues);
				if (validateId(era.id, `${path}.id`, issues)) registerVisualId(focusIds, era.id, `${path}.id`, issues);
				validateText(era.label, `${path}.label`, issues, 120);
				if (typeof era.startEventId !== "string" || !eventIds.has(era.startEventId)) issues.push(`${path}.startEventId must reference a declared event`);
				if (typeof era.endEventId !== "string" || !eventIds.has(era.endEventId)) issues.push(`${path}.endEventId must reference a declared event`);
				if (typeof era.startEventId === "string" && typeof era.endEventId === "string") {
					const startIndex = eventIndexes.get(era.startEventId);
					const endIndex = eventIndexes.get(era.endEventId);
					if (startIndex !== void 0 && endIndex !== void 0 && startIndex > endIndex) issues.push(`${path}.startEventId must not occur after endEventId`);
				}
				if (era.detail !== void 0) validateText(era.detail, `${path}.detail`, issues, 1e3);
				validateTone(era.tone, `${path}.tone`, issues);
			}
		}
	}
	return focusIds;
}
function validateFormulaSteps(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"notation",
		"steps",
		"conclusion"
	], "visual.content", issues);
	if (value.notation !== void 0) validateText(value.notation, "visual.content.notation", issues, 300);
	if (value.conclusion !== void 0) validateText(value.conclusion, "visual.content.conclusion", issues, 1e3);
	if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 16) {
		issues.push("visual.content.steps must contain 2 to 16 formula steps");
		return focusIds;
	}
	const steps = value.steps.filter(isRecord);
	if (steps.length !== value.steps.length) issues.push("visual.content.steps entries must be objects");
	validateUniqueIds(steps, "visual.content.steps", issues);
	for (const [index, step] of steps.entries()) {
		const path = `visual.content.steps[${String(index)}]`;
		validateOnlyKeys(step, [
			"id",
			"expression",
			"label",
			"rule",
			"detail",
			"tone"
		], path, issues);
		if (validateId(step.id, `${path}.id`, issues)) registerVisualId(focusIds, step.id, `${path}.id`, issues);
		validateText(step.expression, `${path}.expression`, issues, 500);
		if (step.label !== void 0) validateText(step.label, `${path}.label`, issues, 120);
		if (step.rule !== void 0) validateText(step.rule, `${path}.rule`, issues, 240);
		if (step.detail !== void 0) validateText(step.detail, `${path}.detail`, issues, 1500);
		validateTone(step.tone, `${path}.tone`, issues);
	}
	return focusIds;
}
function validateStudyMap(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"sourceLabel",
		"goal",
		"sections",
		"concepts"
	], "visual.content", issues);
	validateText(value.sourceLabel, "visual.content.sourceLabel", issues, 240);
	if (value.goal !== void 0) validateText(value.goal, "visual.content.goal", issues, 600);
	let sections = [];
	if (!Array.isArray(value.sections) || value.sections.length < 1 || value.sections.length > 16) issues.push("visual.content.sections must contain 1 to 16 sections");
	else {
		sections = value.sections.filter(isRecord);
		if (sections.length !== value.sections.length) issues.push("visual.content.sections entries must be objects");
		validateUniqueIds(sections, "visual.content.sections", issues);
		for (const [index, section] of sections.entries()) {
			const path = `visual.content.sections[${String(index)}]`;
			validateOnlyKeys(section, [
				"id",
				"label",
				"anchor",
				"summary"
			], path, issues);
			if (validateId(section.id, `${path}.id`, issues)) registerVisualId(focusIds, section.id, `${path}.id`, issues);
			validateText(section.label, `${path}.label`, issues, 160);
			if (section.anchor !== void 0) validateText(section.anchor, `${path}.anchor`, issues, 160);
			if (section.summary !== void 0) validateText(section.summary, `${path}.summary`, issues, 1e3);
		}
	}
	const sectionIds = new Set(sections.flatMap((section) => typeof section.id === "string" ? [section.id] : []));
	let concepts = [];
	if (!Array.isArray(value.concepts) || value.concepts.length < 1 || value.concepts.length > 48) issues.push("visual.content.concepts must contain 1 to 48 concepts");
	else {
		concepts = value.concepts.filter(isRecord);
		if (concepts.length !== value.concepts.length) issues.push("visual.content.concepts entries must be objects");
		validateUniqueIds(concepts, "visual.content.concepts", issues);
		for (const [index, concept] of concepts.entries()) {
			const path = `visual.content.concepts[${String(index)}]`;
			validateOnlyKeys(concept, [
				"id",
				"label",
				"sectionId",
				"detail",
				"prerequisiteIds",
				"role",
				"tone"
			], path, issues);
			if (validateId(concept.id, `${path}.id`, issues)) registerVisualId(focusIds, concept.id, `${path}.id`, issues);
			validateText(concept.label, `${path}.label`, issues, 160);
			if (typeof concept.sectionId !== "string" || !sectionIds.has(concept.sectionId)) issues.push(`${path}.sectionId must reference a declared section`);
			if (concept.detail !== void 0) validateText(concept.detail, `${path}.detail`, issues, 1500);
			if (concept.role !== void 0 && ![
				"foundation",
				"core",
				"extension",
				"practice"
			].includes(concept.role)) issues.push(`${path}.role must be foundation, core, extension, or practice`);
			validateTone(concept.tone, `${path}.tone`, issues);
		}
	}
	const conceptIds = new Set(concepts.flatMap((concept) => typeof concept.id === "string" ? [concept.id] : []));
	const prerequisiteGraph = /* @__PURE__ */ new Map();
	for (const [index, concept] of concepts.entries()) {
		if (concept.prerequisiteIds === void 0) continue;
		const path = `visual.content.concepts[${String(index)}].prerequisiteIds`;
		if (!Array.isArray(concept.prerequisiteIds) || concept.prerequisiteIds.length > 8) {
			issues.push(`${path} must contain at most 8 concept ids`);
			continue;
		}
		const seen = /* @__PURE__ */ new Set();
		for (const prerequisiteId of concept.prerequisiteIds) if (typeof prerequisiteId !== "string" || !conceptIds.has(prerequisiteId)) issues.push(`${path} must reference declared concepts`);
		else if (prerequisiteId === concept.id) issues.push(`${path} must not reference its own concept`);
		else if (seen.has(prerequisiteId)) issues.push(`${path} duplicates ${prerequisiteId}`);
		else seen.add(prerequisiteId);
		if (typeof concept.id === "string") prerequisiteGraph.set(concept.id, [...seen]);
	}
	const visited = /* @__PURE__ */ new Set();
	const visiting = /* @__PURE__ */ new Set();
	const visit = (conceptId) => {
		if (visiting.has(conceptId)) return true;
		if (visited.has(conceptId)) return false;
		visiting.add(conceptId);
		const cyclic = (prerequisiteGraph.get(conceptId) ?? []).some(visit);
		visiting.delete(conceptId);
		visited.add(conceptId);
		return cyclic;
	};
	if ([...conceptIds].some(visit)) issues.push("visual.content.concepts prerequisiteIds must not contain a cycle");
	return focusIds;
}
function validateRecallDeck(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"instructions",
		"cards"
	], "visual.content", issues);
	if (value.instructions !== void 0) validateText(value.instructions, "visual.content.instructions", issues, 600);
	if (!Array.isArray(value.cards) || value.cards.length < 2 || value.cards.length > 32) {
		issues.push("visual.content.cards must contain 2 to 32 cards");
		return focusIds;
	}
	const cards = value.cards.filter(isRecord);
	if (cards.length !== value.cards.length) issues.push("visual.content.cards entries must be objects");
	validateUniqueIds(cards, "visual.content.cards", issues);
	for (const [index, card] of cards.entries()) {
		const path = `visual.content.cards[${String(index)}]`;
		validateOnlyKeys(card, [
			"id",
			"prompt",
			"answer",
			"hint",
			"tags"
		], path, issues);
		if (validateId(card.id, `${path}.id`, issues)) registerVisualId(focusIds, card.id, `${path}.id`, issues);
		validateText(card.prompt, `${path}.prompt`, issues, 1e3);
		validateText(card.answer, `${path}.answer`, issues, 2e3);
		if (card.hint !== void 0) validateText(card.hint, `${path}.hint`, issues, 800);
		if (card.tags !== void 0) {
			if (!Array.isArray(card.tags) || card.tags.length > 6) issues.push(`${path}.tags must contain at most 6 labels`);
			else {
				const seen = /* @__PURE__ */ new Set();
				for (const [tagIndex, tag] of card.tags.entries()) if (validateText(tag, `${path}.tags[${String(tagIndex)}]`, issues, 80) && typeof tag === "string") {
					if (seen.has(tag)) issues.push(`${path}.tags duplicates ${tag}`);
					else seen.add(tag);
				}
			}
		}
	}
	return focusIds;
}
function validateTableValue(value, path, issues) {
	if (value === null || typeof value === "string" || typeof value === "boolean") return true;
	if (typeof value === "number" && Number.isFinite(value)) return true;
	issues.push(`${path} must be a string, number, boolean, or null`);
	return false;
}
function validateDataTable(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"columns",
		"rows",
		"outlierIds",
		"initialSort",
		"initialFilter",
		"chart"
	], "visual.content", issues);
	let columns = [];
	if (!Array.isArray(value.columns) || value.columns.length < 1 || value.columns.length > 24) issues.push("visual.content.columns must contain 1 to 24 columns");
	else {
		columns = value.columns.filter(isRecord);
		if (columns.length !== value.columns.length) issues.push("visual.content.columns entries must be objects");
		validateUniqueIds(columns, "visual.content.columns", issues);
		for (const [index, column] of columns.entries()) {
			const path = `visual.content.columns[${String(index)}]`;
			validateOnlyKeys(column, [
				"id",
				"label",
				"type",
				"unit"
			], path, issues);
			if (validateId(column.id, `${path}.id`, issues)) registerVisualId(focusIds, column.id, `${path}.id`, issues);
			validateText(column.label, `${path}.label`, issues, 160);
			if (![
				"string",
				"number",
				"boolean",
				"date"
			].includes(column.type)) issues.push(`${path}.type must be string, number, boolean, or date`);
			if (column.unit !== void 0) validateText(column.unit, `${path}.unit`, issues, 80);
		}
	}
	const columnIds = new Set(columns.flatMap((column) => typeof column.id === "string" ? [column.id] : []));
	const columnTypes = new Map(columns.flatMap((column) => typeof column.id === "string" && typeof column.type === "string" ? [[column.id, column.type]] : []));
	let rows = [];
	if (!Array.isArray(value.rows) || value.rows.length < 1 || value.rows.length > 128) issues.push("visual.content.rows must contain 1 to 128 rows");
	else {
		rows = value.rows.filter(isRecord);
		if (rows.length !== value.rows.length) issues.push("visual.content.rows entries must be objects");
		validateUniqueIds(rows, "visual.content.rows", issues);
		for (const [index, row] of rows.entries()) {
			const path = `visual.content.rows[${String(index)}]`;
			validateOnlyKeys(row, [
				"id",
				"cells",
				"detail"
			], path, issues);
			if (validateId(row.id, `${path}.id`, issues)) registerVisualId(focusIds, row.id, `${path}.id`, issues);
			if (row.detail !== void 0) validateText(row.detail, `${path}.detail`, issues, 1e3);
			if (!Array.isArray(row.cells) || row.cells.length < 1 || row.cells.length > 24) {
				issues.push(`${path}.cells must contain 1 to 24 cells`);
				continue;
			}
			const seen = /* @__PURE__ */ new Set();
			for (const [cellIndex, cell] of row.cells.entries()) {
				const cellPath = `${path}.cells[${String(cellIndex)}]`;
				if (!isRecord(cell)) {
					issues.push(`${cellPath} must be an object`);
					continue;
				}
				validateOnlyKeys(cell, ["columnId", "value"], cellPath, issues);
				if (typeof cell.columnId !== "string" || !columnIds.has(cell.columnId)) issues.push(`${cellPath}.columnId must reference a declared column`);
				else if (seen.has(cell.columnId)) issues.push(`${cellPath}.columnId duplicates ${cell.columnId}`);
				else seen.add(cell.columnId);
				const valueOk = validateTableValue(cell.value, `${cellPath}.value`, issues);
				const expected = typeof cell.columnId === "string" ? columnTypes.get(cell.columnId) : void 0;
				if (valueOk && cell.value !== null && expected !== void 0 && (expected === "number" && typeof cell.value !== "number" || expected === "boolean" && typeof cell.value !== "boolean" || (expected === "string" || expected === "date") && typeof cell.value !== "string")) issues.push(`${cellPath}.value does not match column type ${expected}`);
			}
		}
	}
	const rowIds = new Set(rows.flatMap((row) => typeof row.id === "string" ? [row.id] : []));
	if (value.outlierIds !== void 0) {
		if (!Array.isArray(value.outlierIds) || value.outlierIds.length > 32) issues.push("visual.content.outlierIds must contain at most 32 row ids");
		else {
			const seen = /* @__PURE__ */ new Set();
			for (const [index, rowId] of value.outlierIds.entries()) {
				const path = `visual.content.outlierIds[${String(index)}]`;
				if (typeof rowId !== "string" || !rowIds.has(rowId)) issues.push(`${path} must reference a declared row`);
				else if (seen.has(rowId)) issues.push(`${path} duplicates ${rowId}`);
				else seen.add(rowId);
			}
		}
	}
	const validateColumnRef = (candidate, path) => {
		if (typeof candidate !== "string" || !columnIds.has(candidate)) issues.push(`${path} must reference a declared column`);
	};
	if (value.initialSort !== void 0) {
		if (!isRecord(value.initialSort)) issues.push("visual.content.initialSort must be an object");
		else {
			validateOnlyKeys(value.initialSort, ["columnId", "direction"], "visual.content.initialSort", issues);
			validateColumnRef(value.initialSort.columnId, "visual.content.initialSort.columnId");
			if (value.initialSort.direction !== "asc" && value.initialSort.direction !== "desc") issues.push("visual.content.initialSort.direction must be asc or desc");
		}
	}
	if (value.initialFilter !== void 0) {
		if (!isRecord(value.initialFilter)) issues.push("visual.content.initialFilter must be an object");
		else {
			validateOnlyKeys(value.initialFilter, [
				"columnId",
				"operator",
				"value"
			], "visual.content.initialFilter", issues);
			validateColumnRef(value.initialFilter.columnId, "visual.content.initialFilter.columnId");
			if (![
				"equals",
				"not_equals",
				"contains",
				"gt",
				"gte",
				"lt",
				"lte"
			].includes(value.initialFilter.operator)) issues.push("visual.content.initialFilter.operator is unknown");
			validateTableValue(value.initialFilter.value, "visual.content.initialFilter.value", issues);
		}
	}
	if (value.chart !== void 0) {
		if (!isRecord(value.chart)) issues.push("visual.content.chart must be an object");
		else {
			validateOnlyKeys(value.chart, [
				"type",
				"xColumnId",
				"yColumnId",
				"seriesColumnId"
			], "visual.content.chart", issues);
			if (![
				"line",
				"bar",
				"scatter"
			].includes(value.chart.type)) issues.push("visual.content.chart.type is unknown");
			validateColumnRef(value.chart.xColumnId, "visual.content.chart.xColumnId");
			validateColumnRef(value.chart.yColumnId, "visual.content.chart.yColumnId");
			if (value.chart.seriesColumnId !== void 0) validateColumnRef(value.chart.seriesColumnId, "visual.content.chart.seriesColumnId");
		}
	}
	return focusIds;
}
function validateStateTransition(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"states",
		"transitions",
		"steps"
	], "visual.content", issues);
	let states = [];
	if (!Array.isArray(value.states) || value.states.length < 2 || value.states.length > 32) issues.push("visual.content.states must contain 2 to 32 states");
	else {
		states = value.states.filter(isRecord);
		if (states.length !== value.states.length) issues.push("visual.content.states entries must be objects");
		validateUniqueIds(states, "visual.content.states", issues);
		for (const [index, state] of states.entries()) {
			const path = `visual.content.states[${String(index)}]`;
			validateOnlyKeys(state, [
				"id",
				"label",
				"detail",
				"tone",
				"initial",
				"final"
			], path, issues);
			if (validateId(state.id, `${path}.id`, issues)) registerVisualId(focusIds, state.id, `${path}.id`, issues);
			validateText(state.label, `${path}.label`, issues, 160);
			if (state.detail !== void 0) validateText(state.detail, `${path}.detail`, issues, 1e3);
			validateTone(state.tone, `${path}.tone`, issues);
			if (state.initial !== void 0 && typeof state.initial !== "boolean") issues.push(`${path}.initial must be a boolean`);
			if (state.final !== void 0 && typeof state.final !== "boolean") issues.push(`${path}.final must be a boolean`);
		}
	}
	const stateIds = new Set(states.flatMap((state) => typeof state.id === "string" ? [state.id] : []));
	let transitions = [];
	if (!Array.isArray(value.transitions) || value.transitions.length < 1 || value.transitions.length > 96) issues.push("visual.content.transitions must contain 1 to 96 transitions");
	else {
		transitions = value.transitions.filter(isRecord);
		if (transitions.length !== value.transitions.length) issues.push("visual.content.transitions entries must be objects");
		validateUniqueIds(transitions, "visual.content.transitions", issues);
		for (const [index, transition] of transitions.entries()) {
			const path = `visual.content.transitions[${String(index)}]`;
			validateOnlyKeys(transition, [
				"id",
				"from",
				"to",
				"trigger",
				"guard",
				"action",
				"detail",
				"tone"
			], path, issues);
			if (validateId(transition.id, `${path}.id`, issues)) registerVisualId(focusIds, transition.id, `${path}.id`, issues);
			if (typeof transition.from !== "string" || !stateIds.has(transition.from)) issues.push(`${path}.from must reference a declared state`);
			if (typeof transition.to !== "string" || !stateIds.has(transition.to)) issues.push(`${path}.to must reference a declared state`);
			validateText(transition.trigger, `${path}.trigger`, issues, 240);
			if (transition.guard !== void 0) validateText(transition.guard, `${path}.guard`, issues, 500);
			if (transition.action !== void 0) validateText(transition.action, `${path}.action`, issues, 500);
			if (transition.detail !== void 0) validateText(transition.detail, `${path}.detail`, issues, 1e3);
			validateTone(transition.tone, `${path}.tone`, issues);
		}
	}
	const transitionIds = new Set(transitions.flatMap((transition) => typeof transition.id === "string" ? [transition.id] : []));
	if (value.steps !== void 0) {
		if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 16) issues.push("visual.content.steps must contain 2 to 16 steps");
		else {
			const steps = value.steps.filter(isRecord);
			if (steps.length !== value.steps.length) issues.push("visual.content.steps entries must be objects");
			validateUniqueIds(steps, "visual.content.steps", issues);
			for (const [index, step] of steps.entries()) {
				const path = `visual.content.steps[${String(index)}]`;
				validateOnlyKeys(step, [
					"id",
					"label",
					"currentStateId",
					"transitionId",
					"description"
				], path, issues);
				if (validateId(step.id, `${path}.id`, issues)) registerVisualId(focusIds, step.id, `${path}.id`, issues);
				validateText(step.label, `${path}.label`, issues, 160);
				if (typeof step.currentStateId !== "string" || !stateIds.has(step.currentStateId)) issues.push(`${path}.currentStateId must reference a declared state`);
				if (step.transitionId !== void 0 && (typeof step.transitionId !== "string" || !transitionIds.has(step.transitionId))) issues.push(`${path}.transitionId must reference a declared transition`);
				if (step.description !== void 0) validateText(step.description, `${path}.description`, issues, 1e3);
			}
		}
	}
	return focusIds;
}
function validateSequenceBuffer(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"slots",
		"pointers",
		"ranges",
		"steps"
	], "visual.content", issues);
	let slots = [];
	if (!Array.isArray(value.slots) || value.slots.length < 1 || value.slots.length > 128) issues.push("visual.content.slots must contain 1 to 128 slots");
	else {
		slots = value.slots.filter(isRecord);
		if (slots.length !== value.slots.length) issues.push("visual.content.slots entries must be objects");
		validateUniqueIds(slots, "visual.content.slots", issues);
		const indexes = /* @__PURE__ */ new Set();
		for (const [index, slot] of slots.entries()) {
			const path = `visual.content.slots[${String(index)}]`;
			validateOnlyKeys(slot, [
				"id",
				"index",
				"value",
				"label",
				"tone"
			], path, issues);
			if (validateId(slot.id, `${path}.id`, issues)) registerVisualId(focusIds, slot.id, `${path}.id`, issues);
			if (!validateInteger(slot.index, `${path}.index`, issues)) continue;
			if (indexes.has(slot.index)) issues.push(`${path}.index duplicates ${String(slot.index)}`);
			indexes.add(slot.index);
			validateTableValue(slot.value, `${path}.value`, issues);
			if (slot.label !== void 0) validateText(slot.label, `${path}.label`, issues, 120);
			validateTone(slot.tone, `${path}.tone`, issues);
		}
	}
	const slotIds = new Set(slots.flatMap((slot) => typeof slot.id === "string" ? [slot.id] : []));
	const slotIndexes = new Set(slots.flatMap((slot) => typeof slot.index === "number" && Number.isInteger(slot.index) ? [slot.index] : []));
	const maxIndex = slots.reduce((max, slot) => typeof slot.index === "number" ? Math.max(max, slot.index) : max, -1);
	let pointers = [];
	if (value.pointers !== void 0) {
		if (!Array.isArray(value.pointers) || value.pointers.length < 1 || value.pointers.length > 8) issues.push("visual.content.pointers must contain 1 to 8 pointers");
		else {
			pointers = value.pointers.filter(isRecord);
			if (pointers.length !== value.pointers.length) issues.push("visual.content.pointers entries must be objects");
			validateUniqueIds(pointers, "visual.content.pointers", issues);
			for (const [index, pointer] of pointers.entries()) {
				const path = `visual.content.pointers[${String(index)}]`;
				validateOnlyKeys(pointer, [
					"id",
					"label",
					"index",
					"tone"
				], path, issues);
				if (validateId(pointer.id, `${path}.id`, issues)) registerVisualId(focusIds, pointer.id, `${path}.id`, issues);
				validateText(pointer.label, `${path}.label`, issues, 120);
				if (validateInteger(pointer.index, `${path}.index`, issues) && pointer.index > maxIndex + 1) issues.push(`${path}.index must point within the buffer`);
				validateTone(pointer.tone, `${path}.tone`, issues);
			}
		}
	}
	const pointerIds = new Set(pointers.flatMap((pointer) => typeof pointer.id === "string" ? [pointer.id] : []));
	let ranges = [];
	if (value.ranges !== void 0) {
		if (!Array.isArray(value.ranges) || value.ranges.length < 1 || value.ranges.length > 8) issues.push("visual.content.ranges must contain 1 to 8 ranges");
		else {
			ranges = value.ranges.filter(isRecord);
			if (ranges.length !== value.ranges.length) issues.push("visual.content.ranges entries must be objects");
			validateUniqueIds(ranges, "visual.content.ranges", issues);
			for (const [index, range] of ranges.entries()) {
				const path = `visual.content.ranges[${String(index)}]`;
				validateOnlyKeys(range, [
					"id",
					"label",
					"start",
					"end",
					"tone"
				], path, issues);
				if (validateId(range.id, `${path}.id`, issues)) registerVisualId(focusIds, range.id, `${path}.id`, issues);
				validateText(range.label, `${path}.label`, issues, 120);
				const startOk = validateInteger(range.start, `${path}.start`, issues);
				const endOk = validateInteger(range.end, `${path}.end`, issues);
				if (startOk && !slotIndexes.has(range.start)) issues.push(`${path}.start must reference a declared slot index`);
				if (endOk && !slotIndexes.has(range.end)) issues.push(`${path}.end must reference a declared slot index`);
				if (startOk && endOk && range.start > range.end) issues.push(`${path}.start must not exceed end`);
				validateTone(range.tone, `${path}.tone`, issues);
			}
		}
	}
	const rangeIds = new Set(ranges.flatMap((range) => typeof range.id === "string" ? [range.id] : []));
	if (value.steps !== void 0) {
		if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 16) issues.push("visual.content.steps must contain 2 to 16 snapshots");
		else {
			const steps = value.steps.filter(isRecord);
			if (steps.length !== value.steps.length) issues.push("visual.content.steps entries must be objects");
			validateUniqueIds(steps, "visual.content.steps", issues);
			for (const [index, step] of steps.entries()) {
				const path = `visual.content.steps[${String(index)}]`;
				validateOnlyKeys(step, [
					"id",
					"label",
					"description",
					"slots",
					"pointers",
					"ranges"
				], path, issues);
				if (validateId(step.id, `${path}.id`, issues)) registerVisualId(focusIds, step.id, `${path}.id`, issues);
				validateText(step.label, `${path}.label`, issues, 160);
				if (step.description !== void 0) validateText(step.description, `${path}.description`, issues, 1e3);
				if (step.slots !== void 0) {
					if (!Array.isArray(step.slots) || step.slots.length > 128) issues.push(`${path}.slots must contain at most 128 snapshots`);
					else for (const [snapshotIndex, snapshot] of step.slots.entries()) {
						const snapshotPath = `${path}.slots[${String(snapshotIndex)}]`;
						if (!isRecord(snapshot)) {
							issues.push(`${snapshotPath} must be an object`);
							continue;
						}
						validateOnlyKeys(snapshot, ["slotId", "value"], snapshotPath, issues);
						if (typeof snapshot.slotId !== "string" || !slotIds.has(snapshot.slotId)) issues.push(`${snapshotPath}.slotId must reference a declared slot`);
						if (snapshot.value !== void 0) validateTableValue(snapshot.value, `${snapshotPath}.value`, issues);
					}
				}
				if (step.pointers !== void 0) {
					if (!Array.isArray(step.pointers) || step.pointers.length > 8) issues.push(`${path}.pointers must contain at most 8 snapshots`);
					else for (const [snapshotIndex, snapshot] of step.pointers.entries()) {
						const snapshotPath = `${path}.pointers[${String(snapshotIndex)}]`;
						if (!isRecord(snapshot)) {
							issues.push(`${snapshotPath} must be an object`);
							continue;
						}
						validateOnlyKeys(snapshot, ["pointerId", "index"], snapshotPath, issues);
						if (typeof snapshot.pointerId !== "string" || !pointerIds.has(snapshot.pointerId)) issues.push(`${snapshotPath}.pointerId must reference a declared pointer`);
						if (validateInteger(snapshot.index, `${snapshotPath}.index`, issues) && snapshot.index > maxIndex + 1) issues.push(`${snapshotPath}.index must point within the buffer`);
					}
				}
				if (step.ranges !== void 0) {
					if (!Array.isArray(step.ranges) || step.ranges.length > 8) issues.push(`${path}.ranges must contain at most 8 snapshots`);
					else for (const [snapshotIndex, snapshot] of step.ranges.entries()) {
						const snapshotPath = `${path}.ranges[${String(snapshotIndex)}]`;
						if (!isRecord(snapshot)) {
							issues.push(`${snapshotPath} must be an object`);
							continue;
						}
						validateOnlyKeys(snapshot, [
							"rangeId",
							"start",
							"end"
						], snapshotPath, issues);
						if (typeof snapshot.rangeId !== "string" || !rangeIds.has(snapshot.rangeId)) issues.push(`${snapshotPath}.rangeId must reference a declared range`);
						const startOk = validateInteger(snapshot.start, `${snapshotPath}.start`, issues);
						const endOk = validateInteger(snapshot.end, `${snapshotPath}.end`, issues);
						if (startOk && !slotIndexes.has(snapshot.start)) issues.push(`${snapshotPath}.start must reference a declared slot index`);
						if (endOk && !slotIndexes.has(snapshot.end)) issues.push(`${snapshotPath}.end must reference a declared slot index`);
						if (startOk && endOk && snapshot.start > snapshot.end) issues.push(`${snapshotPath}.start must not exceed end`);
					}
				}
			}
		}
	}
	return focusIds;
}
function validateSequenceDiagram(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"participants",
		"messages"
	], "visual.content", issues);
	let participants = [];
	if (!Array.isArray(value.participants) || value.participants.length < 2 || value.participants.length > 16) issues.push("visual.content.participants must contain 2 to 16 participants");
	else {
		participants = value.participants.filter(isRecord);
		if (participants.length !== value.participants.length) issues.push("visual.content.participants entries must be objects");
		validateUniqueIds(participants, "visual.content.participants", issues);
		for (const [index, participant] of participants.entries()) {
			const path = `visual.content.participants[${String(index)}]`;
			validateOnlyKeys(participant, [
				"id",
				"label",
				"detail",
				"tone"
			], path, issues);
			if (validateId(participant.id, `${path}.id`, issues)) registerVisualId(focusIds, participant.id, `${path}.id`, issues);
			validateText(participant.label, `${path}.label`, issues, 160);
			if (participant.detail !== void 0) validateText(participant.detail, `${path}.detail`, issues, 1e3);
			validateTone(participant.tone, `${path}.tone`, issues);
		}
	}
	const participantIds = new Set(participants.flatMap((participant) => typeof participant.id === "string" ? [participant.id] : []));
	if (!Array.isArray(value.messages) || value.messages.length < 1 || value.messages.length > 96) issues.push("visual.content.messages must contain 1 to 96 messages");
	else {
		const messages = value.messages.filter(isRecord);
		if (messages.length !== value.messages.length) issues.push("visual.content.messages entries must be objects");
		validateUniqueIds(messages, "visual.content.messages", issues);
		for (const [index, message] of messages.entries()) {
			const path = `visual.content.messages[${String(index)}]`;
			validateOnlyKeys(message, [
				"id",
				"from",
				"to",
				"label",
				"type",
				"detail",
				"tone"
			], path, issues);
			if (validateId(message.id, `${path}.id`, issues)) registerVisualId(focusIds, message.id, `${path}.id`, issues);
			if (typeof message.from !== "string" || !participantIds.has(message.from)) issues.push(`${path}.from must reference a declared participant`);
			if (typeof message.to !== "string" || !participantIds.has(message.to)) issues.push(`${path}.to must reference a declared participant`);
			validateText(message.label, `${path}.label`, issues, 240);
			if (![
				"sync",
				"async",
				"return",
				"self"
			].includes(message.type)) issues.push(`${path}.type must be sync, async, return, or self`);
			if (message.type === "self" && message.from !== message.to) issues.push(`${path}.self messages must have matching from and to participants`);
			if (message.detail !== void 0) validateText(message.detail, `${path}.detail`, issues, 1e3);
			validateTone(message.tone, `${path}.tone`, issues);
		}
	}
	return focusIds;
}
function validateCodeTrace(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"language",
		"code",
		"lines",
		"steps"
	], "visual.content", issues);
	validateText(value.language, "visual.content.language", issues, 40);
	validateText(value.code, "visual.content.code", issues, 24e3);
	const lineNumbers = /* @__PURE__ */ new Set();
	if (!Array.isArray(value.lines) || value.lines.length < 1 || value.lines.length > 256) issues.push("visual.content.lines must contain 1 to 256 lines");
	else {
		const lines = value.lines.filter(isRecord);
		if (lines.length !== value.lines.length) issues.push("visual.content.lines entries must be objects");
		let previousLine = -1;
		for (const [index, line] of lines.entries()) {
			const path = `visual.content.lines[${String(index)}]`;
			validateOnlyKeys(line, ["number", "text"], path, issues);
			if (validateInteger(line.number, `${path}.number`, issues)) {
				lineNumbers.add(line.number);
				if (line.number <= previousLine) issues.push(`${path}.number must increase in source order`);
				previousLine = line.number;
			}
			if (typeof line.text !== "string") issues.push(`${path}.text must be a string`);
			else if (line.text.length > 1e3) issues.push(`${path}.text exceeds 1000 characters`);
		}
	}
	if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 32) issues.push("visual.content.steps must contain 2 to 32 execution steps");
	else {
		const steps = value.steps.filter(isRecord);
		if (steps.length !== value.steps.length) issues.push("visual.content.steps entries must be objects");
		validateUniqueIds(steps, "visual.content.steps", issues);
		for (const [index, step] of steps.entries()) {
			const path = `visual.content.steps[${String(index)}]`;
			validateOnlyKeys(step, [
				"id",
				"label",
				"currentLine",
				"variables",
				"stack",
				"output",
				"description"
			], path, issues);
			if (validateId(step.id, `${path}.id`, issues)) registerVisualId(focusIds, step.id, `${path}.id`, issues);
			validateText(step.label, `${path}.label`, issues, 160);
			if (validateInteger(step.currentLine, `${path}.currentLine`, issues) && !lineNumbers.has(step.currentLine)) issues.push(`${path}.currentLine must reference a declared source line`);
			if (!Array.isArray(step.variables) || step.variables.length > 32) issues.push(`${path}.variables must contain at most 32 variables`);
			else {
				const variables = step.variables.filter(isRecord);
				if (variables.length !== step.variables.length) issues.push(`${path}.variables entries must be objects`);
				const names = /* @__PURE__ */ new Set();
				for (const [variableIndex, variable] of variables.entries()) {
					const variablePath = `${path}.variables[${String(variableIndex)}]`;
					validateOnlyKeys(variable, [
						"name",
						"value",
						"type"
					], variablePath, issues);
					if (typeof variable.name !== "string" || variable.name.trim() === "") issues.push(`${variablePath}.name must be a non-empty string`);
					else if (names.has(variable.name)) issues.push(`${variablePath}.name duplicates ${variable.name}`);
					else names.add(variable.name);
					validateTableValue(variable.value, `${variablePath}.value`, issues);
					if (variable.type !== void 0) validateText(variable.type, `${variablePath}.type`, issues, 80);
				}
			}
			if (!Array.isArray(step.stack) || step.stack.length > 16) issues.push(`${path}.stack must contain at most 16 frames`);
			else {
				const stack = step.stack.filter(isRecord);
				if (stack.length !== step.stack.length) issues.push(`${path}.stack entries must be objects`);
				validateUniqueIds(stack, `${path}.stack`, issues);
				for (const [frameIndex, frame] of stack.entries()) {
					const framePath = `${path}.stack[${String(frameIndex)}]`;
					validateOnlyKeys(frame, [
						"id",
						"function",
						"line"
					], framePath, issues);
					validateId(frame.id, `${framePath}.id`, issues);
					validateText(frame.function, `${framePath}.function`, issues, 160);
					if (frame.line !== void 0 && validateInteger(frame.line, `${framePath}.line`, issues) && !lineNumbers.has(frame.line)) issues.push(`${framePath}.line must reference a declared source line`);
				}
			}
			if (step.output !== void 0 && typeof step.output !== "string") issues.push(`${path}.output must be a string`);
			else if (step.output !== void 0 && step.output.length > 4e3) issues.push(`${path}.output exceeds 4000 characters`);
			if (step.description !== void 0) validateText(step.description, `${path}.description`, issues, 1e3);
		}
	}
	return focusIds;
}
function validateFieldGrid(value, path, issues, components) {
	if (!isRecord(value)) {
		issues.push(`${path} must be an object`);
		return;
	}
	validateOnlyKeys(value, components === "scalar" ? [
		"columns",
		"rows",
		"values"
	] : [
		"columns",
		"rows",
		"u",
		"v"
	], path, issues);
	const columnsOk = validateInteger(value.columns, `${path}.columns`, issues, 2) && value.columns <= 64;
	const rowsOk = validateInteger(value.rows, `${path}.rows`, issues, 2) && value.rows <= 64;
	const expected = columnsOk && rowsOk ? value.columns * value.rows : void 0;
	if (components === "scalar") {
		if (!Array.isArray(value.values) || value.values.length < 1 || value.values.length > 4096) issues.push(`${path}.values must contain sampled values`);
		else {
			if (expected !== void 0 && value.values.length !== expected) issues.push(`${path}.values length must equal rows * columns`);
			for (const [index, sample] of value.values.entries()) validateFinite(sample, `${path}.values[${String(index)}]`, issues);
		}
	} else for (const component of ["u", "v"]) {
		const samples = value[component];
		if (!Array.isArray(samples) || samples.length < 1 || samples.length > 4096) issues.push(`${path}.${component} must contain sampled values`);
		else {
			if (expected !== void 0 && samples.length !== expected) issues.push(`${path}.${component} length must equal rows * columns`);
			for (const [index, sample] of samples.entries()) validateFinite(sample, `${path}.${component}[${String(index)}]`, issues);
		}
	}
}
function validateFieldAxis(value, path, issues) {
	if (!isRecord(value)) {
		issues.push(`${path} must be an object`);
		return;
	}
	validateOnlyKeys(value, [
		"label",
		"min",
		"max",
		"samples"
	], path, issues);
	if (value.label !== void 0) validateText(value.label, `${path}.label`, issues, 120);
	const minOk = validateFinite(value.min, `${path}.min`, issues);
	const maxOk = validateFinite(value.max, `${path}.max`, issues);
	if (minOk && maxOk && value.min >= value.max) issues.push(`${path}.min must be less than max`);
	if (value.samples !== void 0 && (!validateInteger(value.samples, `${path}.samples`, issues, 2) || value.samples > 64)) issues.push(`${path}.samples must be an integer from 2 to 64`);
}
function validateField2D(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"xAxis",
		"yAxis",
		"scalar",
		"vector"
	], "visual.content", issues);
	validateFieldAxis(value.xAxis, "visual.content.xAxis", issues);
	validateFieldAxis(value.yAxis, "visual.content.yAxis", issues);
	if (value.scalar === void 0 && value.vector === void 0) issues.push("visual.content must provide scalar or vector data");
	const fieldVariables = /* @__PURE__ */ new Set(["y"]);
	if (value.scalar !== void 0) {
		if (!isRecord(value.scalar)) issues.push("visual.content.scalar must be an object");
		else {
			validateOnlyKeys(value.scalar, [
				"samples",
				"expression",
				"min",
				"max"
			], "visual.content.scalar", issues);
			if (value.scalar.samples === void 0 && value.scalar.expression === void 0) issues.push("visual.content.scalar must provide samples or expression");
			if (value.scalar.samples !== void 0) validateFieldGrid(value.scalar.samples, "visual.content.scalar.samples", issues, "scalar");
			if (value.scalar.expression !== void 0) validateMathExpression(value.scalar.expression, fieldVariables, "visual.content.scalar.expression", issues, true, 4);
			const minOk = value.scalar.min === void 0 ? false : validateFinite(value.scalar.min, "visual.content.scalar.min", issues);
			const maxOk = value.scalar.max === void 0 ? false : validateFinite(value.scalar.max, "visual.content.scalar.max", issues);
			if (minOk && maxOk && value.scalar.min >= value.scalar.max) issues.push("visual.content.scalar.min must be less than max");
		}
	}
	if (value.vector !== void 0) {
		if (!isRecord(value.vector)) issues.push("visual.content.vector must be an object");
		else {
			validateOnlyKeys(value.vector, ["samples", "expression"], "visual.content.vector", issues);
			if (value.vector.samples === void 0 && value.vector.expression === void 0) issues.push("visual.content.vector must provide samples or expression");
			if (value.vector.samples !== void 0) validateFieldGrid(value.vector.samples, "visual.content.vector.samples", issues, "vector");
			if (value.vector.expression !== void 0) {
				if (!isRecord(value.vector.expression)) issues.push("visual.content.vector.expression must be an object");
				else {
					validateOnlyKeys(value.vector.expression, ["u", "v"], "visual.content.vector.expression", issues);
					validateMathExpression(value.vector.expression.u, fieldVariables, "visual.content.vector.expression.u", issues, true, 4);
					validateMathExpression(value.vector.expression.v, fieldVariables, "visual.content.vector.expression.v", issues, true, 4);
				}
			}
		}
	}
	return focusIds;
}
function validateCausalLoop(value, issues) {
	const focusIds = /* @__PURE__ */ new Set();
	validateOnlyKeys(value, [
		"kind",
		"variables",
		"links",
		"loops"
	], "visual.content", issues);
	let variables = [];
	if (!Array.isArray(value.variables) || value.variables.length < 2 || value.variables.length > 32) issues.push("visual.content.variables must contain 2 to 32 variables");
	else {
		variables = value.variables.filter(isRecord);
		if (variables.length !== value.variables.length) issues.push("visual.content.variables entries must be objects");
		validateUniqueIds(variables, "visual.content.variables", issues);
		for (const [index, variable] of variables.entries()) {
			const path = `visual.content.variables[${String(index)}]`;
			validateOnlyKeys(variable, [
				"id",
				"label",
				"detail",
				"tone"
			], path, issues);
			if (validateId(variable.id, `${path}.id`, issues)) registerVisualId(focusIds, variable.id, `${path}.id`, issues);
			validateText(variable.label, `${path}.label`, issues, 160);
			if (variable.detail !== void 0) validateText(variable.detail, `${path}.detail`, issues, 1e3);
			validateTone(variable.tone, `${path}.tone`, issues);
		}
	}
	const variableIds = new Set(variables.flatMap((variable) => typeof variable.id === "string" ? [variable.id] : []));
	let links = [];
	if (!Array.isArray(value.links) || value.links.length < 1 || value.links.length > 96) issues.push("visual.content.links must contain 1 to 96 links");
	else {
		links = value.links.filter(isRecord);
		if (links.length !== value.links.length) issues.push("visual.content.links entries must be objects");
		validateUniqueIds(links, "visual.content.links", issues);
		for (const [index, link] of links.entries()) {
			const path = `visual.content.links[${String(index)}]`;
			validateOnlyKeys(link, [
				"id",
				"from",
				"to",
				"polarity",
				"delay",
				"label",
				"detail",
				"tone"
			], path, issues);
			if (validateId(link.id, `${path}.id`, issues)) registerVisualId(focusIds, link.id, `${path}.id`, issues);
			if (typeof link.from !== "string" || !variableIds.has(link.from)) issues.push(`${path}.from must reference a declared variable`);
			if (typeof link.to !== "string" || !variableIds.has(link.to)) issues.push(`${path}.to must reference a declared variable`);
			if (link.polarity !== "positive" && link.polarity !== "negative") issues.push(`${path}.polarity must be positive or negative`);
			if (link.delay !== void 0 && (typeof link.delay !== "number" || !Number.isFinite(link.delay) || link.delay < 0)) issues.push(`${path}.delay must be a non-negative finite number`);
			if (link.label !== void 0) validateText(link.label, `${path}.label`, issues, 160);
			if (link.detail !== void 0) validateText(link.detail, `${path}.detail`, issues, 1e3);
			validateTone(link.tone, `${path}.tone`, issues);
		}
	}
	const linkIds = new Set(links.flatMap((link) => typeof link.id === "string" ? [link.id] : []));
	if (value.loops !== void 0) {
		if (!Array.isArray(value.loops) || value.loops.length < 1 || value.loops.length > 12) issues.push("visual.content.loops must contain 1 to 12 loops");
		else {
			const loops = value.loops.filter(isRecord);
			if (loops.length !== value.loops.length) issues.push("visual.content.loops entries must be objects");
			validateUniqueIds(loops, "visual.content.loops", issues);
			for (const [index, loop] of loops.entries()) {
				const path = `visual.content.loops[${String(index)}]`;
				validateOnlyKeys(loop, [
					"id",
					"label",
					"type",
					"linkIds",
					"detail",
					"tone"
				], path, issues);
				if (validateId(loop.id, `${path}.id`, issues)) registerVisualId(focusIds, loop.id, `${path}.id`, issues);
				validateText(loop.label, `${path}.label`, issues, 160);
				if (loop.type !== "reinforcing" && loop.type !== "balancing") issues.push(`${path}.type must be reinforcing or balancing`);
				if (!Array.isArray(loop.linkIds) || loop.linkIds.length < 1 || loop.linkIds.length > 96) issues.push(`${path}.linkIds must contain 1 to 96 link ids`);
				else {
					const seen = /* @__PURE__ */ new Set();
					for (const [linkIndex, linkId] of loop.linkIds.entries()) {
						const linkPath = `${path}.linkIds[${String(linkIndex)}]`;
						if (typeof linkId !== "string" || !linkIds.has(linkId)) issues.push(`${linkPath} must reference a declared link`);
						else if (seen.has(linkId)) issues.push(`${linkPath} duplicates ${linkId}`);
						else seen.add(linkId);
					}
				}
				if (loop.detail !== void 0) validateText(loop.detail, `${path}.detail`, issues, 1e3);
				validateTone(loop.tone, `${path}.tone`, issues);
			}
		}
	}
	return focusIds;
}
const CONTENT_VALIDATORS = {
	plot: validatePlot,
	node_link: validateNodeLink,
	scene_2d: validateScene2D,
	relation: validateRelation,
	timeline: validateTimeline,
	formula_steps: validateFormulaSteps,
	study_map: validateStudyMap,
	recall_deck: validateRecallDeck,
	data_table: validateDataTable,
	state_transition: validateStateTransition,
	sequence_buffer: validateSequenceBuffer,
	sequence_diagram: validateSequenceDiagram,
	code_trace: validateCodeTrace,
	field_2d: validateField2D,
	causal_loop: validateCausalLoop
};
/**
* Validate one untrusted `visual.content` value against the kind it names.
* @returns the ids a sequence frame may focus; empty when the content is invalid.
*/
function validateVisualContent(value, issues) {
	if (!isRecord(value)) {
		issues.push("visual.content must be an object");
		return /* @__PURE__ */ new Set();
	}
	const kind = value.kind;
	if (typeof kind === "string" && Object.hasOwn(CONTENT_VALIDATORS, kind)) return CONTENT_VALIDATORS[kind](value, issues);
	issues.push(`visual.content.kind must be one of ${VISUAL_CONTENT_KINDS.join(", ")}`);
	return /* @__PURE__ */ new Set();
}
//#endregion
//#region lib/types/protocol/document.js
/**
* The visual document envelope: a titled content value, an optional frame
* sequence over its ids, and an optional text equivalent.
*
* `parseVisualDocument` validates a bare document. A preset that versions its
* own envelope (Learning's `dsh-learning/visual@4`) checks its extra fields
* itself and delegates everything else to `validateVisualDocumentFields`, so
* both report identical content issues.
*/
/** The largest JSON encoding a document may have. */
const MAX_VISUAL_DOCUMENT_BYTES = 65536;
/** Every top-level field a document may carry. */
const VISUAL_DOCUMENT_KEYS = [
	"title",
	"description",
	"content",
	"sequence",
	"fallbackMarkdown"
];
/** A stable, actionable rejection listing every violation found in one pass. */
var VisualProtocolError = class extends Error {
	issues;
	code = "INVALID_VISUAL";
	constructor(issues) {
		super(`Invalid visual: ${issues.join("; ")}`);
		this.issues = issues;
		this.name = "VisualProtocolError";
	}
};
/** Validate an optional frame sequence whose focus ids must name declared content ids. */
function validateVisualSequence(value, focusIds, issues) {
	if (value === void 0) return;
	if (!isRecord(value)) {
		issues.push("visual.sequence must be an object");
		return;
	}
	validateOnlyKeys(value, ["initialFrameId", "frames"], "visual.sequence", issues);
	if (!Array.isArray(value.frames) || value.frames.length < 2 || value.frames.length > 12) {
		issues.push("visual.sequence.frames must contain 2 to 12 frames");
		return;
	}
	const frames = value.frames.filter(isRecord);
	if (frames.length !== value.frames.length) issues.push("visual.sequence.frames entries must be objects");
	validateUniqueIds(frames, "visual.sequence.frames", issues);
	const frameIds = /* @__PURE__ */ new Set();
	for (const [index, frame] of frames.entries()) {
		const path = `visual.sequence.frames[${String(index)}]`;
		validateOnlyKeys(frame, [
			"id",
			"label",
			"description",
			"focusIds"
		], path, issues);
		if (validateId(frame.id, `${path}.id`, issues)) frameIds.add(frame.id);
		validateText(frame.label, `${path}.label`, issues, 120);
		if (frame.description !== void 0) validateText(frame.description, `${path}.description`, issues, 1e3);
		if (!Array.isArray(frame.focusIds) || frame.focusIds.length > 64) {
			issues.push(`${path}.focusIds must contain at most 64 ids`);
			continue;
		}
		const seen = /* @__PURE__ */ new Set();
		for (const [focusIndex, focusId] of frame.focusIds.entries()) if (typeof focusId !== "string" || !focusIds.has(focusId)) issues.push(`${path}.focusIds[${String(focusIndex)}] must reference visual content`);
		else if (seen.has(focusId)) issues.push(`${path}.focusIds duplicates ${focusId}`);
		else seen.add(focusId);
	}
	if (value.initialFrameId !== void 0 && (typeof value.initialFrameId !== "string" || !frameIds.has(value.initialFrameId))) issues.push("visual.sequence.initialFrameId must reference a declared frame");
}
/**
* Validate every document field (title, description, text equivalent, content
* and sequence) of an object whose own keys the caller has already checked.
*/
function validateVisualDocumentFields(value, issues) {
	validateText(value.title, "visual.title", issues, 200);
	if (value.description !== void 0) validateText(value.description, "visual.description", issues, 1e3);
	if (value.fallbackMarkdown !== void 0) validateText(value.fallbackMarkdown, "visual.fallbackMarkdown", issues, 8e3);
	const focusIds = validateVisualContent(value.content, issues);
	validateVisualSequence(value.sequence, focusIds, issues);
}
/**
* Validate and narrow an untrusted visual document.
* @throws {VisualProtocolError} listing every violation when the value is not a valid document.
*/
function parseVisualDocument(value) {
	const issues = [];
	const bytes = jsonByteLength(value);
	if (bytes === void 0) issues.push("visual must be serializable JSON");
	else if (bytes > 65536) issues.push(`visual exceeds ${String(MAX_VISUAL_DOCUMENT_BYTES)} bytes`);
	if (!isRecord(value)) throw new VisualProtocolError([...issues, "visual must be an object"]);
	validateOnlyKeys(value, VISUAL_DOCUMENT_KEYS, "visual", issues);
	validateVisualDocumentFields(value, issues);
	if (issues.length > 0) throw new VisualProtocolError(issues);
	return value;
}
//#endregion
export { MATH_BINARY_OPERATORS, MATH_UNARY_OPERATORS, MAX_MATH_DEPTH, MAX_MATH_NODES, MAX_VISUAL_DOCUMENT_BYTES, MAX_VISUAL_MATH_DEPTH, VISUAL_CONTENT_KINDS, VISUAL_DOCUMENT_KEYS, VISUAL_STROKES, VISUAL_TONES, VisualProtocolError, compileMathExpression, evaluateMathExpression, isRecord, jsonByteLength, parseVisualDocument, validateAxis, validateFinite, validateId, validateInteger, validateMathExpression, validateOnlyKeys, validateText, validateUniqueIds, validateVisualContent, validateVisualDocumentFields, validateVisualSequence };
