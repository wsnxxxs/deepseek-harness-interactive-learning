# Visual routing

Start with the relationship the learner needs to see, and choose the kind from that structure, not from topic keywords. Call `visualize` with the kind; it makes that kind's tool available (for example `visual_chart`), and you call that tool next.

## Kinds

### `chart` → `visual_chart`

A quantitative relationship on axes: functions, measurements, distributions, rates, secants and tangents, parameter sensitivity. Curves, points, polylines, and bars are available. Add a parameter slider only when changing the value is the lesson. Do not turn formula recall into an arbitrary exponent slider.

### `graph` → `visual_graph`

"What connects to what?": neural layers, trees, dependencies, generic processes, and concept topology. Declare every actual edge: a 3→4→2 fully connected network has 12 + 8 = 20 edges. Prefer `state_machine` when events move a current state, and `causal_loop` when signed feedback and delays are the lesson.

Pick the layout from the shape of the relation: `layered` for a left-to-right pipeline or a decision tree read as a flow (it requires declared groups, and every node must name one), `hierarchy` for a top-down tree with no natural grouping, `radial` for one hub with peers around it. Give groups real names — “根节点 / 内部节点 / 叶节点”, “输入层 / 隐藏层 / 输出层” — because they are drawn as the diagram's headings. Label the edges that represent a choice or a condition; a branch whose meaning lives only in its colour cannot be read. Keep that label to a few words — “取概率最高的词”, not “把新序列再喂回去猜下一个词” — because it is drawn on a chip in the gap between two columns; the sentence that explains the step belongs in the edge's `detail` or in your prose. Declare the edge that closes a loop like any other edge: an edge that runs back to an earlier group is drawn as a return arc around the diagram, so a generation loop or a state machine reads as a cycle instead of a line.

### `geometry` → `visual_geometry`

Spatial construction: geometry, individual vectors, forces, rays, coordinate proofs, and annotated scientific schematics, built from explicit points, segments, arrows, circles, rectangles, polygons, and labels. Prefer `chart` when the axes and sampled values carry the meaning, and `field` for a sampled scalar or vector field.

### `comparison`, `matrix`, `sets` → `visual_comparison`, `visual_matrix`, `visual_sets`

Side-by-side comparison along shared dimensions (`comparison`), pairwise row/column relations or classification (`matrix`), and two- or three-way membership (`sets`).

### `timeline` → `visual_timeline`

When chronology itself explains the topic: history, discoveries, life events, phases, or an evolution over time. Preserve event order and labels. Use normalized positions only when real temporal spacing matters; otherwise let events be evenly spaced. Use eras for meaningful periods, not decoration.

### `derivation` → `visual_derivation`

A derivation, proof chain, symbolic simplification, or algebraic transformation where the rule between expressions matters. Each step must be valid, and its named rule must explain the move from the step before. Do not use it to display one formula or to hand over a complete graded solution.

### `table` → `visual_table`

Real records whose rows must be inspected, sorted, filtered, compared, or connected to a small chart. Keep stable row ids and typed columns. Mark missing values and outliers explicitly. A two-item feature comparison is `comparison`, not a table.

### `state_machine` → `visual_state_machine`

Following a current state through events: software lifecycles, order or approval status, material phases, disease stages, or another finite-state process. Declare initial and final states, and put the trigger, guard, and action on transitions instead of compressing them into an unlabeled arrow.

### `array` → `visual_array`

Indexed slots with pointers or ranges: arrays, two-pointer algorithms, sliding windows, token spans, ring buffers, or TCP windows. Declare the slots once and use steps for value, pointer, or range changes. It is not a generic chronology.

### `sequence_diagram` → `visual_sequence_diagram`

When the central question is "who sends what to whom, and in what order?" Declare participants and ordered messages, distinguishing calls, asynchronous messages, and returns. Prefer `graph` when only stable topology matters and `timeline` when there are no interacting participants.

### `code_trace` → `visual_code_trace`

Replaying code execution through source lines, variable changes, call-stack frames, loop iterations, and output. The trace is data you supply; the code is never run. Keep each step focused on the one change the learner should notice.

### `field` → `visual_field`

A scalar or vector quantity over two coordinates: heatmaps, contour levels, gradients, probability surfaces, and vector fields. Prefer `geometry` for a handful of hand-placed arrows or shapes and `chart` for a one-dimensional relation.

### `causal_loop` → `visual_causal_loop`

Signed feedback systems where reinforcing or balancing loops and meaningful delays explain behaviour. Declare positive and negative influence, delays, and the links belonging to each loop. Prefer `graph` for ordinary causal chains without feedback.

### `document_map` → `visual_document_map`

A supplied multi-section document, chapter, slide deck, or collection. Preserve human-readable anchors such as chapter, heading, slide, or page. Show concepts within sections, prerequisite links, and roles (foundation, core, extension, practice). It is a navigable overview, not a substitute for teaching each concept.

### `flashcards` → `visual_flashcards`

When the learner asks for flashcards or active recall, or agrees to a review phase after the material is known. Prompts should require retrieval, answers stay concise, and hints cue without revealing. Mix conceptual contrasts and applications rather than copying headings into cards.

## Walkthrough frames

Frames are optional. A structure the learner should take in at once — a single comparison, one finished diagram, a short set map — is clearer without them, and frames added merely to produce another control make the figure worse.

Use two to twelve frames only when the idea genuinely has stages: a mechanism that runs, a proof that focuses different lines in turn, a path through a tree, a staged comparison. Every focused id must already be declared in the visual.

Each frame carries its own context:

- The **first** frame establishes the whole structure. Focus the layer, group, or branch the rest hangs from, not one isolated element.
- A **graph** step focuses the target node together with the edge that reaches it and the node that edge comes from. A leaf on its own, with no parent and no incoming edge, is not a readable step.
- A **matrix** cell focuses its row and column; a **derivation** step focuses the step before it; a **timeline** event focuses the era it belongs to.
- Frame labels and descriptions say what changed at that step in the learner's own terms. "步骤 2" is not a label.

The renderer keeps unfocused content readable rather than hiding it, so a frame never has to strip the diagram down to make its subject visible — but it also cannot supply structure the visual never declared.

## Selection checks

Before calling `visualize`, verify:

1. The visual answers the learner's actual gap.
2. Its kind matches the relationship, not merely the subject area.
3. Interaction changes what the learner can notice.
4. Labels carry meaning without relying on color.
5. The visual is one coherent picture, not a dashboard of unrelated facts.
