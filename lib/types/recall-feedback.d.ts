/**
 * RecallDeck rating channel, shared by the Host broker and the Learning client.
 *
 * The client sends one rating with
 * `connection.rpc.call(RECALL_FEEDBACK_RPC_CHANNEL, RECALL_FEEDBACK_RPC_ENDPOINT, feedback)`;
 * the broker serves it as an exact Fetch route on the shared `/api` channel,
 * which Connection admits only for the owner Peer and which works on every
 * carrier that serves `/api`. This module has no Host or browser dependency.
 */
export declare const RECALL_FEEDBACK_RPC_CHANNEL = "/api";
export declare const RECALL_FEEDBACK_RPC_ENDPOINT = "interactive-learning/recall-feedback";
export declare const RECALL_FEEDBACK_ROUTE_PATH = "/api/interactive-learning/recall-feedback";
//# sourceMappingURL=recall-feedback.d.ts.map