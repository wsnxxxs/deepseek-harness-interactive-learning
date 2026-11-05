import { n as routeLearningTurn } from "./teaching-route-DwuRQ2rL.js";
import { D as parseLearningCheckpointV1, F as MATH_BINARY_OPERATORS, I as MATH_UNARY_OPERATORS, P as parseLearningVisualV4, S as VISUAL_RESULT_PROTOCOL_V4, b as VISUAL_PROTOCOL_V4, c as LEARNING_CHECKPOINT_KINDS, d as LearningProtocolError, i as CHECKPOINT_RESULT_PROTOCOL, r as CHECKPOINT_PROTOCOL, s as LEARNING_CHECKPOINT_EVIDENCE_KINDS, u as LEARNING_VISUAL_STATUSES } from "./protocol-CfLTsXIF.js";
import { defineTool } from "@deepseek-ai/dsh-tools";
//#region lib/types/teaching-policy.js
/**
* Compact standing policy for the Learning preset.
*
* This section stays byte-stable across turns so the provider's prompt prefix
* cache keeps hitting. Everything that changes per turn — learn intent, the
* opening shape, which interactive tools are usable — lives in the dynamic
* `learning:turn-route` context instead, and detailed diagnosis, integrity,
* source-study, and visual construction guidance lives in the
* progressive-disclosure `interactive-teaching` Skill.
*
* Each rule is stated once. Rules the Host enforces (one rich move per turn,
* mastery thresholds, schema limits) are not repeated here.
*/
const LEARNING_TEACHING_POLICY = [
	"# Learning mode",
	"Aim for durable capability: the learner should end up able to explain, predict, distinguish, or apply the idea without you. Reply in the learner's language (Chinese, English, …) and register, keeping their terms. Be warm, direct, and brief.",
	"Read the \"Current turn route\" note first: it says whether this is a learning turn, how to open, and which interactive tools this turn allows. On a not-learn turn, ignore this policy. If the note clearly misreads the learner, follow the learner.",
	"## Teaching loop",
	[
		"- One move per reply: the smallest explanation that unlocks the next step, anchored in one concrete example, contrast, or worked step. Don't survey what wasn't asked.",
		"- Procedures: work one example fully with the reason for each step, then hand over a similar case with one step left for the learner. Remove support as they succeed.",
		"- To check understanding, have the learner produce something: predict, explain why, compare two cases, or apply the idea to a new case. Don't ask \"does that make sense?\". Ask at most one question per reply, only when the answer will change your next move, and give enough to work with (a case, a choice, a first step) that a real attempt is possible.",
		"- Feedback names what they actually wrote. Correct: say briefly why it works, then make the next step slightly harder. Partly right: keep the right part and name the missing piece. Wrong: name the misconception, show why it fails with a counterexample or contrast, then offer a similar retry. Never agree with a wrong claim to be kind, and skip generic praise.",
		"- Match the gap: concept → the idea; procedure → a different parallel example; notation → decode the symbols; prerequisite → the missing rule first; misread task → restate what is asked.",
		"- If they don't understand (\"I don't get it\", \"没懂\"), repeat an error, or go quiet, don't paraphrase: make the step smaller, switch representation (rule/example, symbols/numbers, words/picture), or do the first step yourself. After two failed attempts, work a parallel case all the way through.",
		"- Never reuse a hint, analogy, or question that already failed; the learner_state note lists your recent approaches."
	].join("\n"),
	"## Respect the request",
	[
		"- If they ask for the answer, a full overview, or a study resource, give it directly and completely; assessed work is the one exception below. Offer practice; don't impose it.",
		"- If they are impatient but haven't asked for the answer, speed up: take the bigger step yourself and leave them only the last small inference.",
		"- Stop asking questions when asked to. \"I get it\" alone is not evidence.",
		"- End the segment once they have explained or applied the idea correctly on their own; applying it in a new situation is the strongest evidence. Say briefly what showed it, offer one optional next step, and don't add another question. A plan is a tentative route, not a checklist."
	].join("\n"),
	"## Honesty and assessed work",
	["- Never invent facts, citations, source locations, or what the learner said. Correct mistakes plainly, including your own.", "- For graded or submitted work, don't produce the answer or text to hand in. Teach the concept, work a parallel example, and point to the step in their attempt to revisit. Ask whether work is assessed only when it is unclear and would change your help."].join("\n"),
	"## Interactive tools",
	[
		"- At most one per user turn: a visual (`learning_visual_select`) when seeing or manipulating one relationship teaches better than prose, or a checkpoint (`learning_checkpoint`) when one short learner response will decide your next move. Keep your prose self-sufficient; the learner may skip either.",
		"- `learning_state_update` notes are for you; never mention them to the learner.",
		"- Load the `interactive-teaching` skill for unclear level or deadline pressure, assessed work, studying supplied files, or building a visual."
	].join("\n")
].join("\n\n");
//#endregion
//#region lib/types/agent/route-context.js
const HEADING = "## Current turn route";
/** The opening move for each route. Exactly one line is emitted per turn. */
function routeMove(decision) {
	switch (decision.route) {
		case "calibrate": return "Give one tiny useful foothold (a one-line intuition or example), then ask one question whose answer changes how you teach: their goal, their context, or what they already know. No overview and no list of questions.";
		case "teach-minimum": return "Teach the smallest useful idea now, with one concrete example. Ask a question only if the answer would change your next move.";
		case "overview": return "Give the requested structured explanation directly and completely. No calibration question, quiz, or checkpoint first.";
		case "direct": return decision.reason === "resource-creation" ? "Create the requested study resource directly. Build items that make the learner recall, explain, compare, or apply, not only definitions. Don't quiz them first." : "They are under time pressure: give the direct answer or fix first, briefly. Offer the underlying idea afterwards in one line.";
		case "continue": return "Read their reply against your last move. If that move didn't land, try a different one; if they have now done it on their own, close the segment.";
	}
}
/** One stable, parseable line naming the optional interactive tools this turn allows. */
function learningTurnToolsLine(tools) {
	if (!tools.richClient) return "Interactive tools this turn: none (this client shows text only).";
	const usable = [tools.visual ? "visual" : "", tools.checkpoint ? "checkpoint" : ""].filter(Boolean);
	return `Interactive tools this turn: ${usable.length === 0 ? "none" : usable.join(" or ")}.`;
}
/**
* Render the route note for one claimed user message.
* @param decision - the route resolved for this turn.
* @param tools - optional interactive tools the route and client allow.
* @returns the complete context text.
*/
function routeContextText(decision, tools) {
	if (decision.intent.intent === "not-learn") return [
		HEADING,
		"intent=not-learn; route=direct.",
		"Ordinary task: do it directly. The learning policy and the learning tools do not apply this turn."
	].join("\n");
	return [
		HEADING,
		`intent=learn; route=${decision.route}; reason=${decision.reason}.`,
		...decision.inherited ? ["This continues the current learning segment: read short replies, confusion, and pushback as answers to your last move."] : [],
		routeMove(decision),
		...decision.intent.trigger === "current-topic" ? ["Current or contested topic: use web_search before substantive claims, cite what you find, and mark open disagreements."] : [],
		learningTurnToolsLine(tools)
	].join("\n");
}
//#endregion
//#region lib/types/agent/learner-state-tool.js
const LEARNER_STATE_TOOL_NAME = "learning_state_update";
/**
* Moves the model can name. The reducer also accepts the legacy `example` and
* `question` values so older sessions keep folding, but new notes use the
* explicit move names the teaching references describe.
*/
const MODEL_TEACHING_MOVES = [
	"explanation",
	"worked_example",
	"guided_discovery",
	"reflective_pause",
	"resource",
	"repair",
	"transfer",
	"visual",
	"checkpoint"
];
const MODEL_NEXT_MOVES = [
	"calibrate",
	"direct",
	"explain",
	"worked_example",
	"guided_discovery",
	"reflective_pause",
	"resource",
	"repair",
	"transfer",
	"complete"
];
const REQUEST_KINDS = [
	"concept",
	"procedure",
	"topic",
	"source-study",
	"practice",
	"resource",
	"direct-task"
];
const approach = {
	type: "string",
	description: "Short label for the approach, e.g. \"analogy:water-pipes\" or \"worked:2x+3=7\", so it is not repeated."
};
const stringList = {
	type: "array",
	items: { type: "string" }
};
const learnerStateToolDescription = [
	"Save session-only notes that steer your later turns; the learner never sees them.",
	"Call at most once per turn, before your reply, and only when something you observed changes what you will do next; put everything from this turn in that one call.",
	"Base every field on what the learner actually said or did, or on the supplied material, never on guessed traits, emotions, or learning styles.",
	"Mastery and the next phase are worked out from the evidence you record, and visuals and checkpoints you use are recorded automatically."
].join(" ");
const learnerStateToolParameters = {
	action: {
		type: "string",
		enum: [
			"update",
			"correct",
			"reset"
		],
		required: true,
		description: "update records new observations; correct applies the learner's explicit correction of a note (for example \"I'm not a beginner\" or \"stop quizzing me\"); reset clears all notes when they start over or switch topic."
	},
	basis: {
		type: "string",
		description: "Required for update and correct: what the learner said or did (a quote or close paraphrase), or the source fact, that this call records."
	},
	learner: {
		type: "object",
		additionalProperties: false,
		description: "Facts about the learner observed this turn.",
		properties: {
			goal: {
				type: "string",
				description: "What they want to be able to do, in their words."
			},
			requestKind: {
				type: "string",
				enum: REQUEST_KINDS
			},
			level: {
				type: "string",
				enum: [
					"novice",
					"intermediate",
					"advanced"
				],
				description: "Only from what they said or showed, never from vocabulary alone."
			},
			knows: {
				...stringList,
				description: "Prior knowledge they showed or stated."
			},
			gap: {
				type: "string",
				enum: [
					"concept",
					"procedure",
					"notation",
					"task-model",
					"prerequisite"
				],
				description: "task-model means they misread what the question asks."
			},
			misconceptions: {
				...stringList,
				description: "Specific wrong beliefs observed, e.g. \"treats the index as the stored value\"."
			},
			readiness: {
				type: "string",
				enum: ["can-reason", "needs-foothold"]
			},
			progress: {
				type: "string",
				enum: [
					"progressing",
					"impatient",
					"stuck",
					"shutdown-risk"
				]
			},
			urgency: {
				type: "string",
				enum: [
					"none",
					"initial-blocker",
					"later-pressure"
				],
				description: "initial-blocker is a deadline stated in the opening request; later-pressure appears mid-lesson."
			},
			assessed: {
				type: "string",
				enum: ["self-study", "graded"],
				description: "Whether this work will be graded or submitted."
			}
		}
	},
	evidence: {
		type: "object",
		additionalProperties: false,
		description: "Your assessment of the learner's latest attempt; omit when there was none.",
		properties: {
			kind: {
				type: "string",
				enum: [
					"attempt",
					"prediction",
					"explanation",
					"contrast",
					"error",
					"transfer"
				],
				required: true
			},
			correctness: {
				type: "string",
				enum: [
					"correct",
					"partial",
					"incorrect"
				],
				required: true
			},
			independence: {
				type: "string",
				enum: ["independent", "guided"],
				required: true,
				description: "guided when your hint carried part of the reasoning."
			},
			confidence: {
				type: "string",
				enum: [
					"low",
					"medium",
					"high"
				],
				required: true,
				description: "How sure you are of this assessment."
			},
			freshContext: {
				type: "boolean",
				description: "For kind=transfer: true when the situation was new rather than a rerun of an example."
			}
		}
	},
	failedMove: {
		type: "object",
		additionalProperties: false,
		description: "Your previous move, when it did not work.",
		properties: {
			move: {
				type: "string",
				enum: MODEL_TEACHING_MOVES,
				required: true
			},
			approach: {
				...approach,
				required: true
			},
			reason: {
				type: "string",
				enum: [
					"not-understood",
					"repeated-misconception",
					"unhelpful-hint",
					"wrong-representation",
					"no-progress"
				],
				required: true
			}
		}
	},
	plan: {
		type: "object",
		additionalProperties: false,
		description: "Only for a multi-step goal: a tentative route, replaced whenever you revise it.",
		properties: {
			objective: {
				type: "string",
				required: true
			},
			steps: {
				type: "array",
				required: true,
				description: "1 to 6 steps.",
				items: {
					type: "object",
					additionalProperties: false,
					properties: {
						id: {
							type: "string",
							required: true
						},
						label: {
							type: "string",
							required: true
						}
					}
				}
			}
		}
	},
	planStepDone: {
		type: "string",
		description: "Id of a plan step the learner has now demonstrated."
	},
	sourceAnchors: {
		...stringList,
		description: "Section or page locations seen in the supplied material, e.g. \"Ch. 2 §3\" or \"pp. 18-23\"."
	},
	myMove: {
		type: "object",
		additionalProperties: false,
		description: "The move you are about to make; record it when you change approach or ask a question you will assess next turn.",
		properties: {
			move: {
				type: "string",
				enum: MODEL_TEACHING_MOVES,
				required: true
			},
			approach: {
				type: "string",
				description: "Short label for this approach, in the same style as failedMove.approach."
			},
			question: {
				type: "string",
				description: "The question you will ask, if any."
			},
			nextMove: {
				type: "string",
				enum: MODEL_NEXT_MOVES,
				description: "What you plan after their reply."
			}
		}
	},
	correction: {
		type: "object",
		additionalProperties: false,
		description: "For action=correct: only the notes the learner explicitly corrected.",
		properties: {
			goal: { oneOf: [{ type: "string" }, { type: "null" }] },
			level: {
				type: "string",
				enum: [
					"novice",
					"intermediate",
					"advanced",
					"unknown"
				]
			},
			knows: stringList,
			misconceptions: stringList,
			assessed: {
				type: "string",
				enum: [
					"self-study",
					"graded",
					"unknown"
				]
			},
			mastery: {
				type: "string",
				enum: [
					"unseen",
					"emerging",
					"transfer"
				],
				description: "Their own statement of how well they already know it."
			},
			stopQuestions: {
				type: "boolean",
				description: "true when they ask you to stop quizzing them; ends the segment without recording mastery."
			}
		}
	}
};
const ROOT_KEYS = new Set(Object.keys(learnerStateToolParameters));
const UPDATE_GROUPS = [
	"learner",
	"evidence",
	"failedMove",
	"plan",
	"planStepDone",
	"sourceAnchors",
	"myMove"
];
function present(value) {
	if (value === void 0) return false;
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === "object" && value !== null) return Object.values(value).some((item) => item !== void 0);
	return true;
}
function requireBasis(args) {
	const basis = typeof args.basis === "string" ? args.basis.trim() : "";
	if (basis === "") throw new TypeError(`action=${args.action} needs basis: what the learner said or did that this call records`);
	return basis;
}
function rejectGroups(args, groups, reason) {
	const extra = groups.filter((group) => present(args[group]));
	if (extra.length > 0) throw new TypeError(`${extra.join(", ")} ${extra.length === 1 ? "is" : "are"} not used with ${reason}`);
}
function nonEmptyText(value, field) {
	const text = value.trim();
	if (text === "") throw new TypeError(`${field} must not be empty`);
	return text;
}
/**
* Resolve one validated call into broker input.
*
* Observation ids derive from the model call id plus the field group, so a
* runtime replay of the same call is an exact, idempotent replay, while the
* same call id carrying different content is still a detectable conflict.
*
* @param args - schema-validated tool arguments.
* @param context - the call id and the current state (for actionable checks).
* @returns the reducer events, correction, or reset this call applies.
* @throws TypeError with a message naming the field to fix.
*/
function planLearnerStateToolCall(args, context) {
	const unknown = Object.keys(args).filter((key) => !ROOT_KEYS.has(key));
	if (unknown.length > 0) throw new TypeError(`unknown field ${unknown.join(", ")}`);
	const id = (group) => `${context.callId}#${group}`;
	if (args.action === "reset") {
		rejectGroups(args, [...UPDATE_GROUPS, "correction"], "action=reset");
		return { action: "reset" };
	}
	const basis = requireBasis(args);
	if (args.action === "correct") {
		rejectGroups(args, UPDATE_GROUPS, "action=correct; use action=update for new observations");
		const input = args.correction ?? {};
		const correction = {
			...Object.hasOwn(input, "goal") ? { goal: input.goal ?? null } : {},
			...input.level === void 0 ? {} : { level: input.level },
			...input.knows === void 0 ? {} : { priorKnowledge: input.knows },
			...input.misconceptions === void 0 ? {} : { misconceptions: input.misconceptions },
			...input.assessed === void 0 ? {} : { assessmentContext: input.assessed },
			...input.mastery === void 0 ? {} : { mastery: input.mastery },
			...input.stopQuestions === true ? {
				phase: "complete",
				nextMove: "complete"
			} : {}
		};
		if (Object.keys(correction).length === 0) throw new TypeError("action=correct needs at least one correction field the learner explicitly corrected");
		return {
			action: "correct",
			correction,
			observation: {
				id: id("correction"),
				source: "user-correction",
				summary: basis
			}
		};
	}
	rejectGroups(args, ["correction"], "action=update; correction is only for action=correct");
	if (!UPDATE_GROUPS.some((group) => present(args[group]))) throw new TypeError(`action=update needs at least one of ${UPDATE_GROUPS.join(", ")}`);
	const learnerObservation = (group) => ({
		id: id(group),
		source: "learner-message",
		summary: basis
	});
	const events = [];
	const learner = args.learner ?? {};
	if (learner.goal !== void 0) events.push({
		type: "goal_observed",
		goal: nonEmptyText(learner.goal, "learner.goal"),
		observation: learnerObservation("goal")
	});
	if (learner.requestKind !== void 0) events.push({
		type: "request_kind_observed",
		requestKind: learner.requestKind,
		observation: learnerObservation("request-kind")
	});
	if (learner.level !== void 0 || (learner.knows?.length ?? 0) > 0) events.push({
		type: "prior_knowledge_observed",
		...learner.level === void 0 ? {} : { level: learner.level },
		...(learner.knows?.length ?? 0) === 0 ? {} : { items: learner.knows },
		observation: learnerObservation("prior-knowledge")
	});
	if (learner.gap !== void 0 || (learner.misconceptions?.length ?? 0) > 0) events.push({
		type: "gap_observed",
		gap: learner.gap ?? context.state.gap,
		...(learner.misconceptions?.length ?? 0) === 0 ? {} : { misconceptions: learner.misconceptions },
		observation: learnerObservation("gap")
	});
	if (learner.readiness !== void 0) events.push({
		type: "readiness_observed",
		readiness: learner.readiness,
		observation: learnerObservation("readiness")
	});
	if (learner.progress !== void 0) events.push({
		type: "progress_observed",
		progressSignal: learner.progress,
		observation: learnerObservation("progress")
	});
	if (learner.urgency !== void 0) events.push({
		type: "urgency_observed",
		urgency: learner.urgency,
		observation: learnerObservation("urgency")
	});
	if (learner.assessed !== void 0) events.push({
		type: "assessment_context_observed",
		assessmentContext: learner.assessed,
		observation: learnerObservation("assessed")
	});
	if (args.failedMove !== void 0) events.push({
		type: "failed_move_observed",
		failedMove: {
			move: args.failedMove.move,
			fingerprint: nonEmptyText(args.failedMove.approach, "failedMove.approach"),
			failureReason: args.failedMove.reason,
			summary: basis
		},
		observation: learnerObservation("failed-move")
	});
	if (args.evidence !== void 0) {
		const { kind, correctness, independence, confidence, freshContext } = args.evidence;
		if (kind !== "transfer" && freshContext !== void 0) throw new TypeError("evidence.freshContext is only for kind=transfer");
		events.push({
			type: "learner_evidence_observed",
			evidence: kind === "transfer" ? {
				kind,
				transferContext: freshContext === void 0 ? "unknown" : freshContext ? "fresh" : "same",
				summary: basis,
				correctness,
				independence,
				confidence
			} : {
				kind,
				summary: basis,
				correctness,
				independence,
				confidence
			},
			observation: learnerObservation("evidence")
		});
	}
	if (args.plan !== void 0) events.push({
		type: "plan_observed",
		objective: args.plan.objective,
		steps: args.plan.steps,
		observation: learnerObservation("plan")
	});
	if (args.planStepDone !== void 0) {
		const stepId = args.planStepDone.trim();
		const steps = args.plan?.steps ?? context.state.plan?.steps ?? [];
		if (!steps.some((step) => step.id.trim() === stepId)) throw new TypeError(steps.length === 0 ? "planStepDone needs a plan; record one with plan first" : `planStepDone must be one of the plan step ids: ${steps.map((step) => step.id).join(", ")}`);
		events.push({
			type: "plan_step_evidenced",
			stepId,
			observation: learnerObservation("plan-step")
		});
	}
	if ((args.sourceAnchors?.length ?? 0) > 0) events.push({
		type: "source_anchors_observed",
		anchors: args.sourceAnchors,
		observation: {
			id: id("source-anchors"),
			source: "source-material",
			summary: basis
		}
	});
	if (args.myMove !== void 0) {
		const { move, question, nextMove } = args.myMove;
		const moveApproach = args.myMove.approach?.trim();
		if (moveApproach !== void 0 && moveApproach !== "" && moveApproach === context.state.moveFingerprint) throw new TypeError(`myMove.approach repeats your last approach "${moveApproach}"; choose a different approach or omit it`);
		const questionText = question?.trim();
		events.push({
			type: "assistant_move_observed",
			move,
			...moveApproach === void 0 || moveApproach === "" ? {} : { moveFingerprint: moveApproach },
			question: questionText === void 0 || questionText === "" ? null : questionText,
			...nextMove === void 0 ? {} : { nextMove },
			observation: {
				id: id("my-move"),
				source: "assistant-output",
				summary: questionText === void 0 || questionText === "" ? `Planned ${move}.` : `Planned ${move}: ${questionText}`
			}
		});
	}
	if (events.length === 0) throw new TypeError(`action=update needs at least one non-empty field among ${UPDATE_GROUPS.join(", ")}`);
	return {
		action: "update",
		events
	};
}
/** Attach the live agent and the revision the plan was computed against. */
function learnerStateUpdateRequest(plan, agent, expectedRevision) {
	switch (plan.action) {
		case "update": return {
			action: "update",
			agent,
			expectedRevision,
			events: plan.events
		};
		case "correct": return {
			action: "correct",
			agent,
			expectedRevision,
			correction: plan.correction,
			observation: plan.observation
		};
		case "reset": return {
			action: "reset",
			agent,
			expectedRevision
		};
	}
}
//#endregion
//#region lib/types/agent/checkpoint-tool.js
/**
* Model-facing `learning_checkpoint` tool: one static schema.
*
* The call arguments are exactly the `dsh-learning/checkpoint@1` record that
* the Client tool view and the persisted wait projection already read, so
* calls made by older two-step sessions (`learning_checkpoint_select` →
* dynamic `learning_checkpoint`) and calls made by this static tool replay
* identically. Option rules for `single_choice` are enforced by the closed
* protocol parser, which reports the exact field to fix.
*/
const CHECKPOINT_TOOL_NAME = "learning_checkpoint";
const checkpointToolDescription = [
	"Pause for one short learner response that decides your next move: a prediction, an explanation in their own words, a choice between contrasting options, a number, or a small code fragment.",
	"The learner answers in a response field that replaces their message box until they submit or skip.",
	"The call waits and returns their response, or skipped or cancelled; continue in conversation either way.",
	"Never include the answer, a giveaway hint, or a rubric.",
	"Write your explanation first, make this the only tool call in that step, and do not ask another question in prose."
].join(" ");
const checkpointToolParameters = {
	protocol: {
		type: "string",
		const: CHECKPOINT_PROTOCOL,
		required: true
	},
	kind: {
		type: "string",
		enum: LEARNING_CHECKPOINT_KINDS,
		required: true,
		description: "Response shape: free_text=a sentence or two; single_choice=one label from options; numeric=one number; prediction=what happens next; code_slot=a small code fragment."
	},
	prompt: {
		type: "string",
		required: true,
		description: "The question, self-contained and answer-free, in the learner's language."
	},
	context: {
		type: "string",
		description: "Optional short material the learner needs in view to answer, such as a code snippet or a data point."
	},
	expectedEvidence: {
		type: "string",
		enum: LEARNING_CHECKPOINT_EVIDENCE_KINDS,
		required: true,
		description: "What the response will show: attempt, prediction, explanation, contrast, or fresh transfer (applying the idea in a new situation)."
	},
	options: {
		type: "array",
		description: "single_choice only: 2 to 8 options, none marked correct.",
		items: {
			type: "object",
			additionalProperties: false,
			properties: {
				id: {
					type: "string",
					required: true,
					description: "Identifier: 1 to 32 characters, start with a lowercase letter, then use only a-z, 0-9, _ or -."
				},
				label: {
					type: "string",
					required: true
				}
			}
		}
	},
	fallbackMarkdown: {
		type: "string",
		required: true,
		description: "The same question as plain text for clients that cannot show the response field; never the answer."
	}
};
/** Result shapes returned to the model; matches `LearningCheckpointResultV1`. */
const checkpointToolOutput = { oneOf: [
	{
		type: "object",
		additionalProperties: false,
		properties: {
			protocol: {
				type: "string",
				const: CHECKPOINT_RESULT_PROTOCOL,
				required: true
			},
			checkpointId: {
				type: "string",
				required: true
			},
			status: {
				type: "string",
				const: "submitted",
				required: true
			},
			response: {
				oneOf: [
					{
						type: "object",
						additionalProperties: false,
						properties: { text: {
							type: "string",
							required: true
						} }
					},
					{
						type: "object",
						additionalProperties: false,
						properties: { optionId: {
							type: "string",
							required: true
						} }
					},
					{
						type: "object",
						additionalProperties: false,
						properties: { number: {
							type: "number",
							required: true
						} }
					}
				],
				required: true
			},
			receiptId: {
				type: "string",
				required: true
			}
		}
	},
	{
		type: "object",
		additionalProperties: false,
		properties: {
			protocol: {
				type: "string",
				const: CHECKPOINT_RESULT_PROTOCOL,
				required: true
			},
			checkpointId: {
				type: "string",
				required: true
			},
			status: {
				type: "string",
				const: "skipped",
				required: true
			},
			reason: {
				type: "string",
				enum: [
					"learner-skipped",
					"client-unavailable",
					"client-response-timeout",
					"host-unavailable",
					"provider-failure"
				]
			},
			receiptId: {
				type: "string",
				required: true
			}
		}
	},
	{
		type: "object",
		additionalProperties: false,
		properties: {
			protocol: {
				type: "string",
				const: CHECKPOINT_RESULT_PROTOCOL,
				required: true
			},
			checkpointId: {
				type: "string",
				required: true
			},
			status: {
				type: "string",
				const: "cancelled",
				required: true
			},
			reason: {
				type: "string",
				enum: [
					"learner-cancelled",
					"session-aborted",
					"plugin-disposed"
				]
			},
			receiptId: {
				type: "string",
				required: true
			}
		}
	}
] };
//#endregion
//#region lib/types/agent.js
const name = "interactive-learning-agent";
const inject = [
	"tools",
	"systemPrompt",
	"learningActivities"
];
function closeParameterRoot(tool) {
	return {
		...tool,
		parameters: {
			...tool.parameters,
			additionalProperties: false
		}
	};
}
const parameter = {
	type: "object",
	additionalProperties: false,
	properties: {
		id: {
			type: "string",
			description: "Identifier: 1 to 32 characters, start with a lowercase letter, then use only a-z, 0-9, _ or -. The id x is reserved for the chart axis.",
			required: true
		},
		label: {
			type: "string",
			required: true
		},
		min: {
			type: "number",
			required: true
		},
		max: {
			type: "number",
			required: true
		},
		step: {
			type: "number",
			required: true
		},
		initial: {
			type: "number",
			required: true
		}
	}
};
function mathExpressionSchema(depth) {
	const leaves = [{
		type: "object",
		additionalProperties: false,
		properties: {
			op: {
				type: "string",
				const: "constant",
				required: true
			},
			value: {
				type: "number",
				required: true
			}
		}
	}, {
		type: "object",
		additionalProperties: false,
		properties: {
			op: {
				type: "string",
				const: "variable",
				required: true
			},
			name: {
				type: "string",
				description: "Use x or one of this visual's parameter ids.",
				required: true
			}
		}
	}];
	if (depth <= 1) return { oneOf: leaves };
	const nested = mathExpressionSchema(depth - 1);
	return { oneOf: [
		...leaves,
		{
			type: "object",
			additionalProperties: false,
			properties: {
				op: {
					type: "string",
					enum: MATH_UNARY_OPERATORS,
					required: true
				},
				value: {
					...nested,
					required: true
				}
			}
		},
		{
			type: "object",
			additionalProperties: false,
			properties: {
				op: {
					type: "string",
					enum: MATH_BINARY_OPERATORS,
					required: true
				},
				left: {
					...nested,
					required: true
				},
				right: {
					...nested,
					required: true
				}
			}
		}
	] };
}
function required(schema) {
	return {
		...schema,
		required: true
	};
}
const expression = mathExpressionSchema(4);
const requiredExpression = required(expression);
const mathExpressionDescription = "Closed math AST. leaky_relu uses a 0.01 negative slope, step switches from 0 to 1 at zero, and normpdf is the standard normal density; compose normpdf with sub/div and an outer div for other means and standard deviations.";
const identifier = {
	type: "string",
	description: "Identifier: 1 to 32 characters, start with a lowercase letter, then use only a-z, 0-9, _ or -."
};
const tone = {
	type: "string",
	enum: [
		"blue",
		"green",
		"red",
		"orange",
		"purple",
		"gray"
	]
};
const stroke = {
	type: "string",
	enum: [
		"solid",
		"dashed",
		"dotted"
	]
};
const point = {
	type: "object",
	additionalProperties: false,
	properties: {
		x: {
			type: "number",
			required: true
		},
		y: {
			type: "number",
			required: true
		},
		label: { type: "string" }
	}
};
const coordinate = {
	type: "object",
	additionalProperties: false,
	properties: {
		x: {
			type: "number",
			required: true
		},
		y: {
			type: "number",
			required: true
		}
	}
};
const axis = {
	type: "object",
	additionalProperties: false,
	properties: {
		label: { type: "string" },
		min: {
			type: "number",
			required: true
		},
		max: {
			type: "number",
			required: true
		}
	}
};
const curveSeries = {
	type: "object",
	additionalProperties: false,
	properties: {
		type: {
			type: "string",
			const: "curve",
			required: true
		},
		id: {
			...identifier,
			required: true
		},
		label: {
			type: "string",
			required: true
		},
		expression: {
			...requiredExpression,
			description: mathExpressionDescription
		},
		tone,
		stroke
	}
};
const pointSeries = {
	type: "object",
	additionalProperties: false,
	properties: {
		type: {
			type: "string",
			const: "points",
			required: true
		},
		id: {
			...identifier,
			required: true
		},
		label: {
			type: "string",
			required: true
		},
		points: {
			type: "array",
			required: true,
			items: point,
			description: "1 to 256 points."
		},
		tone
	}
};
const lineSeries = {
	type: "object",
	additionalProperties: false,
	properties: {
		type: {
			type: "string",
			const: "line",
			required: true
		},
		id: {
			...identifier,
			required: true
		},
		label: {
			type: "string",
			required: true
		},
		points: {
			type: "array",
			required: true,
			items: point,
			description: "1 to 256 points."
		},
		tone,
		stroke
	}
};
const barSeries = {
	type: "object",
	additionalProperties: false,
	properties: {
		type: {
			type: "string",
			const: "bars",
			required: true
		},
		id: {
			...identifier,
			required: true
		},
		label: {
			type: "string",
			required: true
		},
		points: {
			type: "array",
			required: true,
			items: point,
			description: "1 to 64 bars."
		},
		tone
	}
};
const plotContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "plot",
			required: true,
			description: "Functions, quantitative data, probability, distributions, or tangent/secant geometry on Cartesian axes."
		},
		parameters: {
			type: "array",
			items: parameter,
			description: "Optional; omit for a static plot. Use at most three only when changing the value teaches the mechanism."
		},
		xAxis: {
			...axis,
			required: true,
			properties: {
				...axis.properties,
				samples: {
					type: "integer",
					description: "Optional curve samples from 24 to 256."
				}
			}
		},
		yAxis: required(axis),
		series: {
			type: "array",
			required: true,
			items: { oneOf: [
				curveSeries,
				pointSeries,
				lineSeries,
				barSeries
			] },
			description: "1 to 8 series."
		},
		metrics: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					expression: {
						...requiredExpression,
						description: mathExpressionDescription
					},
					digits: { type: "integer" },
					suffix: { type: "string" }
				}
			},
			description: "Optional; at most 4 metrics."
		}
	}
};
const nodeGroup = {
	type: "object",
	additionalProperties: false,
	properties: {
		id: {
			...identifier,
			required: true
		},
		label: {
			type: "string",
			required: true
		}
	}
};
const node = {
	type: "object",
	additionalProperties: false,
	properties: {
		id: {
			...identifier,
			required: true
		},
		label: {
			type: "string",
			required: true
		},
		detail: { type: "string" },
		group: { type: "string" },
		tone
	}
};
const edge = {
	type: "object",
	additionalProperties: false,
	properties: {
		id: {
			...identifier,
			required: true
		},
		from: {
			type: "string",
			required: true
		},
		to: {
			type: "string",
			required: true
		},
		label: { type: "string" },
		detail: { type: "string" },
		tone,
		stroke,
		directed: { type: "boolean" }
	}
};
const nodeLinkContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "node_link",
			required: true,
			description: "Networks, fully connected layers, trees, causality, concept maps, state transitions, and dependency topology."
		},
		layout: {
			type: "string",
			enum: [
				"layered",
				"hierarchy",
				"radial"
			],
			required: true
		},
		groups: {
			type: "array",
			items: nodeGroup,
			description: "Optional 1 to 12 ordered layers for layered layout; every node must reference one group."
		},
		nodes: {
			type: "array",
			items: node,
			required: true,
			description: "2 to 48 nodes."
		},
		edges: {
			type: "array",
			items: edge,
			required: true,
			description: "1 to 160 edges; include every semantically required connection."
		}
	}
};
const sceneBase = {
	id: {
		...identifier,
		required: true
	},
	label: { type: "string" },
	detail: { type: "string" },
	tone
};
const sceneElement = { oneOf: [
	{
		type: "object",
		additionalProperties: false,
		properties: {
			type: {
				type: "string",
				const: "point",
				required: true
			},
			...sceneBase,
			x: {
				type: "number",
				required: true
			},
			y: {
				type: "number",
				required: true
			},
			size: { type: "number" }
		}
	},
	{
		type: "object",
		additionalProperties: false,
		properties: {
			type: {
				type: "string",
				enum: ["segment", "arrow"],
				required: true
			},
			...sceneBase,
			x1: {
				type: "number",
				required: true
			},
			y1: {
				type: "number",
				required: true
			},
			x2: {
				type: "number",
				required: true
			},
			y2: {
				type: "number",
				required: true
			},
			stroke
		}
	},
	{
		type: "object",
		additionalProperties: false,
		properties: {
			type: {
				type: "string",
				const: "circle",
				required: true
			},
			...sceneBase,
			cx: {
				type: "number",
				required: true
			},
			cy: {
				type: "number",
				required: true
			},
			r: {
				type: "number",
				required: true
			}
		}
	},
	{
		type: "object",
		additionalProperties: false,
		properties: {
			type: {
				type: "string",
				const: "rect",
				required: true
			},
			...sceneBase,
			x: {
				type: "number",
				required: true
			},
			y: {
				type: "number",
				required: true
			},
			width: {
				type: "number",
				required: true
			},
			height: {
				type: "number",
				required: true
			}
		}
	},
	{
		type: "object",
		additionalProperties: false,
		properties: {
			type: {
				type: "string",
				const: "polygon",
				required: true
			},
			...sceneBase,
			points: {
				type: "array",
				required: true,
				items: coordinate,
				description: "3 to 24 polygon vertices."
			}
		}
	},
	{
		type: "object",
		additionalProperties: false,
		properties: {
			type: {
				type: "string",
				const: "label",
				required: true
			},
			...sceneBase,
			x: {
				type: "number",
				required: true
			},
			y: {
				type: "number",
				required: true
			},
			text: {
				type: "string",
				required: true
			}
		}
	}
] };
const sceneContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "scene_2d",
			required: true,
			description: "Geometry, vectors, forces, spatial relationships, and annotated scientific schematics."
		},
		xAxis: required(axis),
		yAxis: required(axis),
		grid: { type: "boolean" },
		elements: {
			type: "array",
			items: sceneElement,
			required: true,
			description: "1 to 64 scene elements."
		}
	}
};
const relationSubject = {
	type: "object",
	additionalProperties: false,
	properties: {
		id: {
			...identifier,
			required: true
		},
		label: {
			type: "string",
			required: true
		},
		detail: { type: "string" },
		tone
	}
};
const relationAxisItem = {
	type: "object",
	additionalProperties: false,
	properties: {
		id: {
			...identifier,
			required: true
		},
		label: {
			type: "string",
			required: true
		}
	}
};
const relationContent = { oneOf: [
	{
		type: "object",
		additionalProperties: false,
		properties: {
			kind: {
				type: "string",
				const: "relation",
				required: true
			},
			variant: {
				type: "string",
				const: "comparison",
				required: true
			},
			subjects: {
				type: "array",
				items: relationSubject,
				required: true,
				description: "2 to 4 subjects."
			},
			rows: {
				type: "array",
				required: true,
				items: {
					type: "object",
					additionalProperties: false,
					properties: {
						id: {
							...identifier,
							required: true
						},
						label: {
							type: "string",
							required: true
						},
						detail: { type: "string" },
						cells: {
							type: "array",
							required: true,
							items: {
								type: "object",
								additionalProperties: false,
								properties: {
									subjectId: {
										type: "string",
										required: true
									},
									value: {
										type: "string",
										required: true
									},
									tone
								}
							},
							description: "1 to 4 cells; each subjectId must reference a declared subject."
						}
					}
				},
				description: "1 to 16 comparison rows."
			}
		}
	},
	{
		type: "object",
		additionalProperties: false,
		properties: {
			kind: {
				type: "string",
				const: "relation",
				required: true
			},
			variant: {
				type: "string",
				const: "matrix",
				required: true
			},
			rows: {
				type: "array",
				items: relationAxisItem,
				required: true,
				description: "1 to 10 matrix rows."
			},
			columns: {
				type: "array",
				items: relationAxisItem,
				required: true,
				description: "1 to 10 matrix columns."
			},
			cells: {
				type: "array",
				required: true,
				items: {
					type: "object",
					additionalProperties: false,
					properties: {
						id: {
							...identifier,
							required: true
						},
						rowId: {
							type: "string",
							required: true
						},
						columnId: {
							type: "string",
							required: true
						},
						label: {
							type: "string",
							required: true
						},
						detail: { type: "string" },
						tone
					}
				},
				description: "1 to 64 matrix cells; rowId and columnId must reference declared axes."
			}
		}
	},
	{
		type: "object",
		additionalProperties: false,
		properties: {
			kind: {
				type: "string",
				const: "relation",
				required: true
			},
			variant: {
				type: "string",
				const: "sets",
				required: true
			},
			sets: {
				type: "array",
				items: relationSubject,
				required: true,
				description: "2 to 3 sets."
			},
			items: {
				type: "array",
				required: true,
				items: {
					type: "object",
					additionalProperties: false,
					properties: {
						id: {
							...identifier,
							required: true
						},
						label: {
							type: "string",
							required: true
						},
						setIds: {
							type: "array",
							items: { type: "string" },
							required: true,
							description: "1 to 3 unique ids referencing declared sets."
						},
						detail: { type: "string" }
					}
				},
				description: "1 to 24 set items."
			}
		}
	}
] };
const timelineContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "timeline",
			required: true,
			description: "Ordered historical events, scientific discoveries, biographies, eras, or other chronology where time order is the structure."
		},
		orientation: {
			type: "string",
			enum: ["horizontal", "vertical"]
		},
		events: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					time: {
						type: "string",
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					detail: { type: "string" },
					position: {
						type: "number",
						description: "Optional normalized position from 0 to 1. Provide it for every event or omit it for every event."
					},
					tone
				}
			},
			required: true,
			description: "2 to 32 events in chronological order."
		},
		eras: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					startEventId: {
						type: "string",
						required: true
					},
					endEventId: {
						type: "string",
						required: true
					},
					detail: { type: "string" },
					tone
				}
			},
			description: "Optional 1 to 8 eras; startEventId and endEventId must reference declared events in order."
		}
	}
};
const formulaStepsContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "formula_steps",
			required: true,
			description: "A derivation, algebraic transformation, proof chain, or symbolic simplification where the rule between steps matters. Not for merely recalling one formula."
		},
		notation: {
			type: "string",
			description: "Optional short notation key used across the derivation."
		},
		steps: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					expression: {
						type: "string",
						required: true,
						description: "One LaTeX display expression without dollar delimiters; use commands such as \\lim_{h \\to 0} and ^{\\prime}."
					},
					label: { type: "string" },
					rule: { type: "string" },
					detail: { type: "string" },
					tone
				}
			},
			description: "2 to 16 formula steps."
		},
		conclusion: { type: "string" }
	}
};
const studyMapContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "study_map",
			required: true,
			description: "A navigable overview of a supplied document, chapter, slide deck, or multi-concept learning source. Preserve source sections and anchors instead of flattening the material."
		},
		sourceLabel: {
			type: "string",
			required: true
		},
		goal: { type: "string" },
		sections: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					anchor: {
						type: "string",
						description: "Human-readable source location, such as Chapter 2 or pp. 18–23."
					},
					summary: { type: "string" }
				}
			},
			description: "1 to 16 source sections."
		},
		concepts: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					sectionId: {
						type: "string",
						required: true
					},
					detail: { type: "string" },
					prerequisiteIds: {
						type: "array",
						items: { type: "string" },
						description: "Optional; at most 8 unique declared concept ids, excluding this concept, with no cycles."
					},
					role: {
						type: "string",
						enum: [
							"foundation",
							"core",
							"extension",
							"practice"
						]
					},
					tone
				}
			},
			description: "1 to 48 concepts; every sectionId must reference a declared section."
		}
	}
};
const recallDeckContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "recall_deck",
			required: true,
			description: "A requested flashcard or active-recall set with hidden answers, hints, and local review state. Use only after the relevant material is known."
		},
		instructions: { type: "string" },
		cards: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					prompt: {
						type: "string",
						required: true
					},
					answer: {
						type: "string",
						required: true
					},
					hint: { type: "string" },
					tags: {
						type: "array",
						items: { type: "string" },
						description: "Optional; at most 6 unique labels."
					}
				}
			},
			description: "2 to 32 recall cards."
		}
	}
};
const tableValue = { oneOf: [
	{ type: "string" },
	{ type: "number" },
	{ type: "boolean" },
	{ type: "null" }
] };
const dataTableContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "data_table",
			required: true,
			description: "A typed record table for inspecting real data, filtering rows, sorting values, marking outliers, or linking tabular values to a chart."
		},
		columns: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					type: {
						type: "string",
						enum: [
							"string",
							"number",
							"boolean",
							"date"
						],
						required: true
					},
					unit: { type: "string" }
				}
			},
			description: "1 to 24 typed columns."
		},
		rows: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					detail: { type: "string" },
					cells: {
						type: "array",
						required: true,
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								columnId: {
									type: "string",
									required: true
								},
								value: {
									...tableValue,
									required: true
								}
							}
						},
						description: "One cell per declared column; columnId must reference a declared column."
					}
				}
			},
			description: "1 to 128 records."
		},
		outlierIds: {
			type: "array",
			items: { type: "string" },
			description: "Optional row ids to emphasize as anomalies."
		},
		initialSort: {
			type: "object",
			additionalProperties: false,
			properties: {
				columnId: {
					type: "string",
					required: true
				},
				direction: {
					type: "string",
					enum: ["asc", "desc"],
					required: true
				}
			}
		},
		initialFilter: {
			type: "object",
			additionalProperties: false,
			properties: {
				columnId: {
					type: "string",
					required: true
				},
				operator: {
					type: "string",
					enum: [
						"equals",
						"not_equals",
						"contains",
						"gt",
						"gte",
						"lt",
						"lte"
					],
					required: true
				},
				value: {
					...tableValue,
					required: true
				}
			}
		},
		chart: {
			type: "object",
			additionalProperties: false,
			properties: {
				type: {
					type: "string",
					enum: [
						"line",
						"bar",
						"scatter"
					],
					required: true
				},
				xColumnId: {
					type: "string",
					required: true
				},
				yColumnId: {
					type: "string",
					required: true
				},
				seriesColumnId: { type: "string" }
			}
		}
	}
};
const stateTransitionContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "state_transition",
			required: true,
			description: "A state machine where an event triggers a transition from one explicit state to another, optionally with guard and action."
		},
		states: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					detail: { type: "string" },
					tone,
					initial: { type: "boolean" },
					final: { type: "boolean" }
				}
			},
			description: "2 to 32 states; mark initial/final states when the lifecycle has them."
		},
		transitions: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					from: {
						type: "string",
						required: true
					},
					to: {
						type: "string",
						required: true
					},
					trigger: {
						type: "string",
						required: true
					},
					guard: { type: "string" },
					action: { type: "string" },
					detail: { type: "string" },
					tone
				}
			},
			description: "1 to 96 transitions; from and to must reference declared states."
		},
		steps: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					currentStateId: {
						type: "string",
						required: true
					},
					transitionId: { type: "string" },
					description: { type: "string" }
				}
			},
			description: "Optional 2 to 16 execution steps; each names the current state and optional transition just taken."
		}
	}
};
const sequenceBufferContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "sequence_buffer",
			required: true,
			description: "Discrete indexed slots with moving pointers, highlighted intervals, and snapshots for array, window, parsing, or protocol algorithms."
		},
		slots: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					index: {
						type: "integer",
						required: true
					},
					value: {
						...tableValue,
						required: true
					},
					label: { type: "string" },
					tone
				}
			},
			description: "1 to 128 ordered slots; index values must be unique."
		},
		pointers: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					index: {
						type: "integer",
						required: true
					},
					tone
				}
			},
			description: "Optional 1 to 8 named pointers."
		},
		ranges: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					start: {
						type: "integer",
						required: true
					},
					end: {
						type: "integer",
						required: true
					},
					tone
				}
			},
			description: "Optional 1 to 8 inclusive index intervals."
		},
		steps: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					description: { type: "string" },
					slots: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								slotId: {
									type: "string",
									required: true
								},
								value: { ...tableValue }
							}
						}
					},
					pointers: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								pointerId: {
									type: "string",
									required: true
								},
								index: {
									type: "integer",
									required: true
								}
							}
						}
					},
					ranges: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								rangeId: {
									type: "string",
									required: true
								},
								start: {
									type: "integer",
									required: true
								},
								end: {
									type: "integer",
									required: true
								}
							}
						}
					}
				}
			},
			description: "Optional 2 to 16 snapshots. Include only the collections that change in each snapshot."
		}
	}
};
const sequenceDiagramContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "sequence_diagram",
			required: true,
			description: "Ordered messages exchanged by API clients, services, protocols, cells, or collaborating roles."
		},
		participants: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					detail: { type: "string" },
					tone
				}
			},
			description: "2 to 16 lifeline participants."
		},
		messages: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					from: {
						type: "string",
						required: true
					},
					to: {
						type: "string",
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					type: {
						type: "string",
						enum: [
							"sync",
							"async",
							"return",
							"self"
						],
						required: true
					},
					detail: { type: "string" },
					tone
				}
			},
			description: "1 to 96 messages in top-to-bottom order; from and to must reference participants."
		}
	}
};
const codeTraceContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "code_trace",
			required: true,
			description: "Source lines paired with execution steps, current line, variable values, call stack, and output."
		},
		language: {
			type: "string",
			required: true
		},
		code: {
			type: "string",
			required: true,
			description: "Complete source text shown above or beside the trace."
		},
		lines: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					number: {
						type: "integer",
						required: true
					},
					text: {
						type: "string",
						required: true
					}
				}
			},
			description: "1 to 256 numbered source lines."
		},
		steps: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					currentLine: {
						type: "integer",
						required: true
					},
					variables: {
						type: "array",
						required: true,
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								name: {
									type: "string",
									required: true
								},
								value: {
									...tableValue,
									required: true
								},
								type: { type: "string" }
							}
						}
					},
					stack: {
						type: "array",
						required: true,
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								id: {
									...identifier,
									required: true
								},
								function: {
									type: "string",
									required: true
								},
								line: { type: "integer" }
							}
						}
					},
					output: { type: "string" },
					description: { type: "string" }
				}
			},
			description: "2 to 32 execution snapshots."
		}
	}
};
const fieldGrid = {
	type: "object",
	additionalProperties: false,
	properties: {
		columns: {
			type: "integer",
			required: true
		},
		rows: {
			type: "integer",
			required: true
		}
	}
};
const scalarFieldSamples = {
	type: "object",
	additionalProperties: false,
	properties: {
		...fieldGrid.properties,
		values: {
			type: "array",
			items: { type: "number" },
			required: true,
			description: "Flattened row-major values; length must equal rows * columns."
		}
	}
};
const vectorFieldSamples = {
	type: "object",
	additionalProperties: false,
	properties: {
		...fieldGrid.properties,
		u: {
			type: "array",
			items: { type: "number" },
			required: true,
			description: "Flattened horizontal components; length must equal rows * columns."
		},
		v: {
			type: "array",
			items: { type: "number" },
			required: true,
			description: "Flattened vertical components; length must equal rows * columns."
		}
	}
};
const field2DContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "field_2d",
			required: true,
			description: "A sampled or mathematically defined scalar heatmap, contour field, vector field, or gradient over two axes."
		},
		xAxis: {
			...axis,
			required: true,
			properties: {
				...axis.properties,
				samples: { type: "integer" }
			}
		},
		yAxis: {
			...axis,
			required: true,
			properties: {
				...axis.properties,
				samples: { type: "integer" }
			}
		},
		scalar: {
			type: "object",
			additionalProperties: false,
			properties: {
				samples: scalarFieldSamples,
				expression: {
					...expression,
					description: "Closed math AST using x and y variables."
				},
				min: { type: "number" },
				max: { type: "number" }
			}
		},
		vector: {
			type: "object",
			additionalProperties: false,
			properties: {
				samples: vectorFieldSamples,
				expression: {
					type: "object",
					additionalProperties: false,
					properties: {
						u: {
							...requiredExpression,
							description: "Horizontal component using x and y variables."
						},
						v: {
							...requiredExpression,
							description: "Vertical component using x and y variables."
						}
					}
				}
			}
		}
	}
};
const causalLoopContent = {
	type: "object",
	additionalProperties: false,
	properties: {
		kind: {
			type: "string",
			const: "causal_loop",
			required: true,
			description: "A causal feedback diagram with positive or negative polarity, optional delay, and named reinforcing or balancing loops."
		},
		variables: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					detail: { type: "string" },
					tone
				}
			},
			description: "2 to 32 causal variables."
		},
		links: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					from: {
						type: "string",
						required: true
					},
					to: {
						type: "string",
						required: true
					},
					polarity: {
						type: "string",
						enum: ["positive", "negative"],
						required: true
					},
					delay: { type: "number" },
					label: { type: "string" },
					detail: { type: "string" },
					tone
				}
			},
			description: "1 to 96 directed links; from and to must reference variables."
		},
		loops: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					type: {
						type: "string",
						enum: ["reinforcing", "balancing"],
						required: true
					},
					linkIds: {
						type: "array",
						items: { type: "string" },
						required: true
					},
					detail: { type: "string" },
					tone
				}
			},
			description: "Optional 1 to 12 named feedback loops; linkIds must reference declared links in cycle order."
		}
	}
};
const sequence = {
	type: "object",
	additionalProperties: false,
	properties: {
		initialFrameId: { type: "string" },
		frames: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					id: {
						...identifier,
						required: true
					},
					label: {
						type: "string",
						required: true
					},
					description: { type: "string" },
					focusIds: {
						type: "array",
						items: { type: "string" },
						required: true,
						description: "At most 64 unique ids already declared by content."
					}
				}
			},
			description: "2 to 12 sequence frames."
		}
	}
};
const learnerStateUpdateOutput = {
	type: "object",
	additionalProperties: false,
	properties: {
		status: {
			type: "string",
			enum: [
				"updated",
				"corrected",
				"reset"
			],
			required: true
		},
		revision: {
			type: "integer",
			required: true
		}
	}
};
const VISUAL_KINDS = [
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
const VISUAL_CONTENT_SCHEMAS = {
	plot: plotContent,
	node_link: nodeLinkContent,
	scene_2d: sceneContent,
	relation: relationContent,
	timeline: timelineContent,
	formula_steps: formulaStepsContent,
	study_map: studyMapContent,
	recall_deck: recallDeckContent,
	data_table: dataTableContent,
	state_transition: stateTransitionContent,
	sequence_buffer: sequenceBufferContent,
	sequence_diagram: sequenceDiagramContent,
	code_trace: codeTraceContent,
	field_2d: field2DContent,
	causal_loop: causalLoopContent
};
const LEARNING_TOOL_PREFIX = "learning_";
const GENERIC_USER_WAIT_TOOL = "ask_user_question";
const learningRoutes = /* @__PURE__ */ new WeakMap();
const richTeachingMoves = /* @__PURE__ */ new WeakMap();
function textFromUserMessage(message) {
	return message.content.filter((block) => block.type === "text").map((block) => block.text).join("\n").trim();
}
function richTeachingMoveForTool(name) {
	if (name === "learning_visual_select" || name === "learning_visual") return "visual";
	if (name === "learning_checkpoint") return "checkpoint";
}
function learningToolAvailable(decision, toolName, richClientAvailable) {
	if (decision?.intent.intent === "learn" && toolName === GENERIC_USER_WAIT_TOOL) return false;
	if (!toolName.startsWith(LEARNING_TOOL_PREFIX) || toolName === "learning_state_update") return true;
	if (decision === void 0) return true;
	if (decision.intent.intent !== "learn" || !richClientAvailable) return false;
	const richMove = richTeachingMoveForTool(toolName);
	if (richMove === "checkpoint") return decision.route === "teach-minimum" || decision.route === "continue";
	if (richMove === "visual") return decision.route === "teach-minimum" || decision.route === "continue" || decision.route === "overview" || decision.route === "direct" && decision.reason === "resource-creation";
	return true;
}
function learningSegmentComplete(services, agent) {
	const state = services.learningActivities.learnerState(agent);
	return state.phase === "complete" || state.nextMove === "complete";
}
function durableLearningSegmentActive(services, agent) {
	const state = services.learningActivities.learnerState(agent);
	return state.goal !== null && state.phase !== "complete" && state.nextMove !== "complete";
}
const visualSelectorOutput = {
	type: "object",
	additionalProperties: false,
	properties: {
		status: {
			type: "string",
			const: "selected",
			required: true
		},
		kind: {
			type: "string",
			enum: VISUAL_KINDS,
			required: true
		}
	}
};
const visualSelectorParameters = {
	kind: {
		type: "string",
		enum: VISUAL_KINDS,
		required: true,
		description: [
			"Choose by relationship:",
			"plot=quantitative axes or parameter sensitivity;",
			"node_link=topology; scene_2d=spatial construction; relation=comparison, mapping, or sets;",
			"timeline=chronology; formula_steps=derivation; study_map=source structure; recall_deck=active recall;",
			"data_table=records; state_transition=event-driven states; sequence_buffer=indexed slots;",
			"sequence_diagram=ordered messages; code_trace=execution; field_2d=scalar/vector field; causal_loop=signed feedback."
		].join(" ")
	},
	purpose: {
		type: "string",
		required: true,
		description: "One sentence naming the learner relationship this visual will make clearer."
	},
	learnerAction: {
		type: "string",
		description: "Use instead of pairedQuestion for the one observation or manipulation the learner should make."
	},
	pairedQuestion: {
		type: "string",
		description: "Use instead of learnerAction for the one focused question asked after the visual returns."
	}
};
function visualParameters(kind) {
	return {
		protocol: {
			type: "string",
			const: VISUAL_PROTOCOL_V4,
			required: true
		},
		title: {
			type: "string",
			description: "Concise visible and accessible visual title.",
			required: true
		},
		description: {
			type: "string",
			description: "Optional one-sentence exploration hint; do not repeat surrounding prose."
		},
		content: required(VISUAL_CONTENT_SCHEMAS[kind]),
		sequence,
		fallbackMarkdown: {
			type: "string",
			description: "Optional concise text equivalent for accessibility or an unavailable renderer."
		}
	};
}
const visualDescription = (selection) => [
	`Render one trusted, non-blocking semantic ${selection.kind} visual selected for the current teaching move.`,
	"The selection step already chose the representation; now provide exactly that content kind.",
	`Teaching purpose: ${selection.purpose}`,
	...selection.learnerAction === void 0 ? [] : [`Learner action: ${selection.learnerAction}`],
	...selection.pairedQuestion === void 0 ? [] : [`Paired question: ${selection.pairedQuestion}`],
	selection.pairedQuestion === void 0 ? "The call completes immediately. Continue with a self-sufficient ordinary-text interpretation of the selected learner action; do not add another question." : "The call completes immediately. Continue with a self-sufficient ordinary-text interpretation and ask only the selected paired question.",
	"Keep all teaching explanation and learner prompting outside the visual payload; its title, labels, description, and fallback carry only the picture and its text equivalent.",
	"Do not use a visual for a definition, short fact, or already-clear explanation. Keep labels in the learner's language and declare every relationship the learner needs to read.",
	"Hard limits and field-specific payload rules are encoded in this kind-specific schema. Never provide HTML, Markdown diagrams, SVG markup, or JavaScript."
].join(" ");
const dynamicVisualDisposers = /* @__PURE__ */ new WeakMap();
const GLOBAL_DYNAMIC_TOOL_KEY = {};
function disposeDynamicTeachingTools(key) {
	dynamicVisualDisposers.get(key)?.();
	dynamicVisualDisposers.delete(key);
}
function dynamicToolTarget(services, exec) {
	const candidate = exec.agent;
	return candidate?.ctx?.tools !== void 0 ? candidate.ctx.tools : services.tools;
}
function dynamicToolKey(_services, exec) {
	const candidate = exec.agent;
	return candidate?.ctx?.tools !== void 0 ? candidate : GLOBAL_DYNAMIC_TOOL_KEY;
}
/**
* Read the tool calls this Session attributes to model steps. The executor
* logs `tool/call` lazily as each call starts, so later siblings of an
* exclusive call are not logged yet; the committed `assistant/message` of the
* step carries the complete set of tool-call blocks the model emitted.
*/
function loggedToolCalls(agent) {
	const calls = [];
	for (const event of agent.session.snapshotEvents()) if (event.type === "tool/call") calls.push({
		turn: event.data.turn,
		step: event.data.step,
		callId: String(event.data.callId),
		name: event.data.name
	});
	else if (event.type === "assistant/message") for (const block of event.data.message.content) {
		if (block.type !== "tool-call") continue;
		calls.push({
			turn: event.data.turn,
			step: event.data.step,
			callId: String(block.id),
			name: block.name
		});
	}
	return calls;
}
function assertSingleCheckpointInModelStep(exec) {
	const agent = exec.agent;
	if (agent === void 0) throw new LearningProtocolError(["learning_checkpoint requires a live agent session"]);
	const calls = loggedToolCalls(agent);
	const ownCalls = calls.filter((call) => call.callId === String(exec.callId));
	if (ownCalls.length === 0) throw new LearningProtocolError(["learning_checkpoint callId is absent from the session tool/call log"]);
	if (new Set(ownCalls.map((call) => `${String(call.turn)}:${String(call.step)}`)).size !== 1 || ownCalls.some((call) => call.name !== "learning_checkpoint")) throw new LearningProtocolError(["learning_checkpoint callId does not identify one checkpoint model step"]);
	const own = ownCalls[ownCalls.length - 1];
	const sameStep = calls.filter((call) => call.turn === own.turn && call.step === own.step);
	if (new Set(sameStep.filter((call) => call.name === "learning_checkpoint").map((call) => call.callId)).size > 1) throw new LearningProtocolError(["a model step may contain at most one learning_checkpoint call"]);
	if (sameStep.some((call) => call.name !== "learning_checkpoint")) throw new LearningProtocolError(["learning_checkpoint must be the only tool call in its model step"]);
}
function boundedSelectionText(value, field, maxLength) {
	const normalized = value.trim();
	if (normalized === "") throw new TypeError(`${field} requires non-empty text`);
	if (normalized.length > maxLength) throw new TypeError(`${field} must not exceed ${String(maxLength)} characters`);
	return normalized;
}
function apply(ctx) {
	const services = ctx;
	ctx.on("agent/inbox/claimed", ({ agent, message }) => {
		if (message.source.kind !== "user") return;
		disposeDynamicTeachingTools(agent);
		richTeachingMoves.delete(agent);
		const text = textFromUserMessage(message);
		if (text === "") return;
		const previous = learningRoutes.get(agent);
		const session = previous === void 0 ? { active: durableLearningSegmentActive(services, agent) } : previous.segment === "closed" ? { active: false } : learningSegmentComplete(services, agent) ? { active: false } : {
			active: true,
			decision: previous
		};
		learningRoutes.set(agent, routeLearningTurn(text, session));
	});
	ctx.on("tools/pre-execute", (execution, next) => {
		const agent = execution.agent;
		const decision = agent === void 0 ? void 0 : learningRoutes.get(agent);
		if (decision?.intent.intent === "learn" && execution.name === GENERIC_USER_WAIT_TOOL) return Promise.resolve({
			kind: "deny",
			reason: "ask calibration questions in ordinary text; learning_checkpoint is the only deliberate Learning wait"
		});
		if (decision?.intent.intent === "not-learn" && execution.name.startsWith(LEARNING_TOOL_PREFIX)) return Promise.resolve({
			kind: "deny",
			reason: "learning tools are disabled for an ordinary turn"
		});
		if (!learningToolAvailable(decision, execution.name, services.learningActivities.richClientAvailable)) return Promise.resolve({
			kind: "deny",
			reason: "this rich learning tool is unavailable for the current route or client; continue in ordinary text"
		});
		const requestedRichMove = richTeachingMoveForTool(execution.name);
		const currentRichMove = agent === void 0 ? void 0 : richTeachingMoves.get(agent);
		if (requestedRichMove !== void 0 && currentRichMove !== void 0 && requestedRichMove !== currentRichMove) return Promise.resolve({
			kind: "deny",
			reason: `a user turn may use either a learning ${currentRichMove} or a learning ${requestedRichMove}, not both`
		});
		return next();
	});
	ctx.on("system-prompt/assemble", async (_assembly, context, next) => {
		const agent = context.agent;
		const decision = agent === void 0 ? void 0 : learningRoutes.get(agent);
		const assembly = await next();
		if (decision?.intent.intent !== "not-learn") return assembly;
		return {
			...assembly,
			contexts: assembly.contexts.filter((context) => context.name !== "learning:learner-state")
		};
	});
	services.tools.register(closeParameterRoot(defineTool({
		name: "learning_visual_select",
		description: "Use only when a visual will materially clarify one relationship. Make this tool call the only output of the selector step; wait until learning_visual returns before writing teaching prose. Select one native kind, state its teaching purpose, and bind it to exactly one learner action or paired question; the selected kind-specific learning_visual schema is exposed on the next model step. Do not select a visual for a definition, short fact, or already-clear explanation.",
		parameters: visualSelectorParameters,
		output: {
			schema: visualSelectorOutput,
			render: (_args, value) => [{
				type: "text",
				text: JSON.stringify(value)
			}]
		},
		isConcurrencySafe: () => false,
		async execute(args, exec) {
			const purpose = boundedSelectionText(args.purpose, "learning_visual_select.purpose", 500);
			const learnerAction = typeof args.learnerAction === "string" ? args.learnerAction.trim() : "";
			const pairedQuestion = typeof args.pairedQuestion === "string" ? args.pairedQuestion.trim() : "";
			if (learnerAction === "" === (pairedQuestion === "")) throw new TypeError("learning_visual_select requires exactly one of learnerAction or pairedQuestion");
			if (learnerAction !== "") boundedSelectionText(learnerAction, "learning_visual_select.learnerAction", 500);
			if (pairedQuestion !== "") boundedSelectionText(pairedQuestion, "learning_visual_select.pairedQuestion", 1e3);
			const selection = {
				kind: args.kind,
				purpose,
				...learnerAction === "" ? {} : { learnerAction },
				...pairedQuestion === "" ? {} : { pairedQuestion }
			};
			const target = dynamicToolTarget(services, exec);
			const existing = target.get("learning_visual");
			const targetKey = dynamicToolKey(services, exec);
			if (existing !== void 0) {
				dynamicVisualDisposers.get(targetKey)?.();
				dynamicVisualDisposers.delete(targetKey);
			}
			const definition = closeParameterRoot(defineTool({
				name: "learning_visual",
				description: visualDescription(selection),
				parameters: visualParameters(selection.kind),
				output: {
					schema: {
						type: "object",
						additionalProperties: false,
						properties: {
							protocol: {
								type: "string",
								const: VISUAL_RESULT_PROTOCOL_V4,
								required: true
							},
							status: {
								type: "string",
								enum: LEARNING_VISUAL_STATUSES,
								required: true
							}
						}
					},
					render: (_args, value) => [{
						type: "text",
						text: JSON.stringify(value)
					}]
				},
				isConcurrencySafe: () => true,
				async execute(payload, payloadExec) {
					parseLearningVisualV4(payload);
					try {
						return {
							protocol: VISUAL_RESULT_PROTOCOL_V4,
							status: services.learningActivities.recordVisual(payloadExec.agent, String(payloadExec.callId))
						};
					} finally {
						queueMicrotask(() => {
							const key = dynamicToolKey(services, payloadExec);
							const disposer = dynamicVisualDisposers.get(key);
							if (disposer !== void 0) {
								dynamicVisualDisposers.delete(key);
								disposer();
							}
						});
					}
				},
				presentCall: (payload) => ({
					card: "generic",
					title: typeof payload.title === "string" ? payload.title : "Interactive visual",
					kind: "other"
				})
			}));
			const disposer = target.register(definition);
			dynamicVisualDisposers.set(targetKey, disposer);
			if (exec.agent !== void 0) richTeachingMoves.set(exec.agent, "visual");
			return {
				status: "selected",
				kind: selection.kind
			};
		}
	})));
	services.tools.register(closeParameterRoot(defineTool({
		name: LEARNER_STATE_TOOL_NAME,
		description: learnerStateToolDescription,
		parameters: learnerStateToolParameters,
		output: {
			schema: learnerStateUpdateOutput,
			render: (_args, value) => [{
				type: "text",
				text: JSON.stringify(value)
			}]
		},
		isConcurrencySafe: () => false,
		async execute(args, exec) {
			const agent = exec.agent;
			if (agent === void 0) throw new Error("learning_state_update requires a live agent session");
			const state = services.learningActivities.learnerState(agent);
			const plan = planLearnerStateToolCall(args, {
				callId: String(exec.callId),
				state
			});
			return services.learningActivities.updateLearnerState(learnerStateUpdateRequest(plan, agent, state.revision));
		}
	})));
	services.tools.register(closeParameterRoot(defineTool({
		name: CHECKPOINT_TOOL_NAME,
		description: checkpointToolDescription,
		parameters: checkpointToolParameters,
		output: {
			schema: checkpointToolOutput,
			render: (_args, value) => [{
				type: "text",
				text: JSON.stringify(value)
			}]
		},
		isConcurrencySafe: () => false,
		async execute(payload, exec) {
			const checkpoint = parseLearningCheckpointV1(payload);
			assertSingleCheckpointInModelStep(exec);
			if (exec.agent !== void 0) richTeachingMoves.set(exec.agent, "checkpoint");
			return await services.learningActivities.presentCheckpoint({
				checkpoint,
				agent: exec.agent,
				signal: exec.signal,
				callId: String(exec.callId)
			});
		}
	})));
	services.systemPrompt.section({
		name: "learning:policy",
		order: 20,
		text: LEARNING_TEACHING_POLICY
	});
	services.systemPrompt.context({
		name: "learning:turn-route",
		order: 19,
		text: (context) => {
			const agent = context.agent;
			const decision = agent === void 0 ? void 0 : learningRoutes.get(agent);
			if (decision === void 0) return "";
			const richClient = services.learningActivities.richClientAvailable;
			return routeContextText(decision, {
				richClient,
				visual: learningToolAvailable(decision, "learning_visual_select", richClient),
				checkpoint: learningToolAvailable(decision, CHECKPOINT_TOOL_NAME, richClient)
			});
		}
	});
	services.systemPrompt.context({
		name: "learning:learner-state",
		order: 20,
		text: (context) => {
			const agent = context.agent;
			return agent === void 0 ? "" : services.learningActivities.learnerStateTranscript(agent, 300);
		}
	});
}
//#endregion
export { apply, inject, name };
