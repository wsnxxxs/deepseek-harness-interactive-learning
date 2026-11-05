# Building a visual

Each `visual_<kind>` tool takes that kind's fields directly, plus a `title`, an optional one-line `description` that says what to explore, optional `walkthrough` frames, and an optional `fallbackMarkdown` text equivalent. The format is closed and declarative. Never send HTML, SVG markup, Mermaid, Markdown diagrams, JavaScript, or executable code. Every id must be unique within the visual. Edges, cells, memberships, prerequisites, eras, and walkthrough focus ids must reference declared ids.

Keep titles concise, the description action-oriented, and `fallbackMarkdown` equivalent in meaning. Teaching belongs in your prose; the visual's text describes only the picture. A rejected call names the field to fix.

## Computed charts

Charts accept static points, polylines, bars, and computed curves. They may contain one to three bounded parameters and parameter-derived metrics.

Expressions are text, such as `sigmoid(b0 + b1*x)`: numbers, `x`, declared parameter ids, `+ - * / ^`, parentheses, and the functions `abs`, `sqrt`, `sin`, `cos`, `tan`, `atan`, `exp`, `log`, `sigmoid`, `relu`, `leaky_relu`, `step`, `normpdf`, `floor`, `ceil`, `min`, and `max`. `leaky_relu` has a 0.01 slope below zero, `step` switches from 0 to 1 at zero, and `normpdf` is the standard normal density, so a normal with mean `mu` and standard deviation `sigma` is `normpdf((x - mu)/sigma)/sigma`.

Curve expressions may use `x` and declared parameter ids. Metric expressions may use declared parameters but not `x`; for example, the P = 0.5 decision boundary of the logistic curve above is `-b0/b1`. Field expressions use `x` and `y`.

Use explicit, stable axis ranges. Distinguish compared series with dashed or dotted strokes as well as labels; never communicate only through color.

## Content integrity

- `graph`: every edge's `from` and `to` references a node; in a layered layout every node references a declared group.
- `geometry`: every coordinate and dimension is finite, and shapes stay inside an intelligible axis range.
- `comparison`, `matrix`, `sets`: cells reference declared subjects or axes; set membership references declared sets.
- `timeline`: events are in order; era endpoints reference declared events; positions are given for every event or for none.
- `derivation`: expressions are LaTeX display math without dollar delimiters, not executable code, and every transition stays pedagogically and algebraically valid.
- `document_map`: concepts reference a section and declared prerequisite concepts; anchors mirror the source.
- `flashcards`: answers and hints are source-grounded; tags are short and useful for mixing topics. A learner's self-rating on a card is not evidence of correctness or transfer.
- `table`: every cell references a declared column; chart, sort, and filter columns resolve inside the same table; outliers reference declared rows.
- `state_machine`: transitions reference declared states; steps reference a current state and, when present, the transition that produced it.
- `array`: slot ids and indices are unique; pointers, ranges, and step snapshots stay inside the declared slots.
- `sequence_diagram`: every message endpoint references a declared participant; message order is the interaction order.
- `code_trace`: current lines and stack line references resolve to declared source lines. The trace is replayed as data and never executed.
- `field`: sampled grid dimensions match their value arrays; expression fields use only `x` and `y`.
- `causal_loop`: signed links reference declared variables, and every loop references declared links.
