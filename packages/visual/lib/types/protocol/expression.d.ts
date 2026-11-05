/** Default AST depth bound (the deepest a standalone expression may nest). */
export declare const MAX_MATH_DEPTH = 8;
/** Node-count bound for any one expression. */
export declare const MAX_MATH_NODES = 64;
/** AST depth bound for expressions embedded in visual content. */
export declare const MAX_VISUAL_MATH_DEPTH = 4;
export declare const MATH_BINARY_OPERATORS: readonly ["add", "sub", "mul", "div", "pow", "min", "max"];
export declare const MATH_UNARY_OPERATORS: readonly ["neg", "abs", "sqrt", "sin", "cos", "tan", "atan", "exp", "log", "sigmoid", "relu", "leaky_relu", "step", "normpdf", "floor", "ceil"];
export type MathExpression = {
    op: 'constant';
    value: number;
} | {
    op: 'variable';
    name: string;
} | {
    op: typeof MATH_BINARY_OPERATORS[number];
    left: MathExpression;
    right: MathExpression;
} | {
    op: typeof MATH_UNARY_OPERATORS[number];
    value: MathExpression;
};
/**
 * Validate an untrusted expression AST: bounded depth and node count, known
 * operators, finite bounded constants, and variables limited to `x` (when
 * allowed) or a declared parameter id.
 */
export declare function validateMathExpression(value: unknown, parameterIds: ReadonlySet<string>, path: string, issues: string[], allowX?: boolean, maxDepth?: number): void;
/** Values available to a safe mathematical expression. */
export type MathBindings = Readonly<Record<string, number>>;
export type CompiledMathExpression = (bindings: MathBindings) => number;
/**
 * Compile a closed AST into a small closure tree once, so sampling a curve
 * does not repeatedly dispatch through every AST node. This intentionally
 * uses ordinary closures instead of `new Function`: the model payload remains
 * data-only while the hot render path still gets one function call per sample.
 */
export declare function compileMathExpression(expression: MathExpression): CompiledMathExpression;
/**
 * Evaluate the protocol's closed mathematical AST. The protocol validator
 * bounds its depth and node count; this evaluator never executes source text.
 */
export declare function evaluateMathExpression(expression: MathExpression, bindings: MathBindings): number;
//# sourceMappingURL=expression.d.ts.map