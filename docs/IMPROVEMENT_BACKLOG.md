# Control Valve Lab — prioritized improvement backlog

Reviewed application: `8752422f0c453121baa9046d7ce04af40e877cd5`.
Review date: 2026-10-09, America/Chicago.
Status updated 2026-10-10 (third pass: guided-lab redesign; second pass: browser QA, chart readability, formatting): original findings below remain review evidence. Current implementation is the phone/PID pass (see handoff); statuses are:

| ID | Current status | Evidence / remaining work |
| --- | --- | --- |
| CVL-001 | Implemented | Fixed 0.05 s recording, 8,000-sample bound; complete slow-sweep DOM tests at 30/120 Hz. |
| CVL-002 | Implemented | Third pass: positioner edits run until settled and say so; lag-mode changes hold and settle; Run/Pause/Reset sit with the live view; status shows running/paused/settled. Device QA still pending. |
| CVL-003 | Partially verified | 2026-10-10 (`5331694`): headless Chromium (Playwright) at 320×640, 375×667, 390×844, 768×1024, 1280×800 and 844×390, source and dist: no page overflow or script errors; all seven demos complete; PID custom record/step/estimate/apply/Auto flow works. Fixed crowded compact charts and the off-screen active nav tab. Real iPhone Safari, Android Chrome, zoom/large text and touch remain untested. |
| CVL-004 | Partially implemented | Chart `<desc>` summaries (`5331694`). Third pass: axe-core finds no serious/critical WCAG A/AA issues on any page; valve SVG is a group of buttons; guide keeps focus. Actual screen-reader check still needed. |
| CVL-005 | Open | Detailed trim drawings unchanged. |
| CVL-006 | Open | Linked force/travel/Cv experiment still proposed. |
| CVL-007 | Implemented | Third pass: every lesson has four guided steps (Try it / Look for / Why it matters / Show me) whose quoted numbers come from the models and are re-checked by tests/guide.test.cjs. Explicit prediction prompts were not added. |
| CVL-008 | Open | Positioner characterization/configuration lessons unchanged. |
| CVL-009 | Implemented within current scope | FOPDT PID/step lab, A/B/C ideal form, OP/SP/manual/auto, load and valve defects; integrating processes and series PID remain future work. |
| CVL-010 | Partially implemented | Fixed-clock DOM tests, PID model and fit rejection tests. 2026-10-10 (`5331694`): UI pressure-balance assertion, compact-plot, chart-summary and history tests. Expanded visual tests remain. |
| CVL-011 | Implemented within current scope | Prettier formatting (`cd59d3a`); third pass replaces DOM relocation with one lesson template and moves lesson text to content.js. |
| CVL-012 | Open | Both targets are explicitly synchronized this pass; automated cross-host revision labeling still proposed. |
| CVL-013 | Partially implemented | Push-state module navigation supports history; re-clicking the active module no longer duplicates entries (`5331694`). PWA/offline/scenario sharing/export remain proposed. |

Application changes are authorized by the user's 2026-10-10 phone/PID request. See docs/AGENT_HANDOFF.md for tested behavior and limits.

Priority means work order: **P1** = next pass; **P2** = next quality/learning pass; **P3** = optional expansion. It does not mean every recommendation is a production defect. Evidence classes distinguish a reproduced behavior, a source observation, a validation gap, and a proposed feature.

## CVL-001 · P1 · Retain a complete hysteresis sweep

**Evidence: reproduced behavior.** `js/app.js` → `sampleF`, `sampleP`, `frame`, `updateFriction`. Each animation frame creates a sample; friction history is capped at 1,600 samples. At 60 Hz that retains roughly 26.7 seconds, regardless of selected sweep speed. A 10→90→10% sweep requires 32 seconds at the default 5 pp/s and 160 seconds at 1 pp/s.

**Review reproduction:** initialize the friction module, select 1 pp/s, run a sweep with a controlled 60 Hz animation clock for 161 seconds. The resulting state retained 1,600 samples spanning 26.65 seconds, with commands only from 10% to approximately 35.65%. The upper part of the completed loop was gone. This undermines the lesson about comparing slow-sweep branches. At higher refresh rates, the retained duration is shorter still.

**Suggested change:** separate numerical integration, history recording, and redraw cadence. Retain at least one complete sweep for the signature while using a bounded rolling time window for trends. Use time-based sampling/decimation with special preservation of breakaway events and reversals; avoid smoothing away the behavior being taught. Label any rolling window. Apply the same time-based history policy to the positioner trace where appropriate.

**Acceptance:** after a complete 1 pp/s sweep, both directions from 10–90% remain visible. Equivalent runs at 30, 60, and 120 Hz retain the same simulated time interval and materially equivalent paths. Memory remains bounded. Breakaway jumps survive decimation. Add a deterministic animation-clock regression test; current pause/navigation tests do not cover this failure.

## CVL-002 · P1 · Make simulation controls and paused changes explicit

**Evidence: reproduced behavior plus usability recommendation.** `js/app.js` → `onInput`, `action`, `sampleP`. Positioner controls are initially paused. Changing opposing load to 2 psi calls `sampleP(0.02)` and moves travel slightly, then leaves `running=false`. The text invites users to “try” a load, but the full correction only appears after they discover Run/resume. In the friction lab, −1/+1 steps pause the simulation; lag gets only one 0.1 s update until Hold & settle is chosen.

**Suggested change:** define one clear contract for input changes and pause. Prefer preserving an explicit pause with a prominent “Parameters changed — run to see the response” affordance, or label a preview/step mode clearly. Add configurable step size and meaningful start/restart/hold controls. Ensure Step to 70% is understandable when the request is already 70%.

**Acceptance:** a first-time user can demonstrate load correction and lag settling without guessing which button resumes dynamics. Paused changes do not silently imply a settled result. Running, paused, holding and sweeping states are visible and available to assistive technology. Verify slider changes, repeated step commands, reset and module changes with a fake clock.

## CVL-003 · P1 · Complete real browser and device QA

**Evidence: validation gap, not a proven remaining layout defect.** All existing tests are Node/jsdom or structural SVG checks. The previous fixed-viewBox chart issue was fixed, but real phone rendering remains unverified.

**Suggested pass:** test iPhone Safari, Android Chrome, and a desktop browser. Cover approximately 320/375/390/768/1280 px widths, landscape, browser zoom and larger text. Inspect all modules, long labels/units, signature controls, sidebar navigation, dialogs, chart bounds, diagrams and range sliders. Test reduced-motion settings, keyboard use, VoiceOver or another screen reader, and background/resume behavior.

**Acceptance:** preserve screenshots and an environment/result matrix with pass/fail/untested states. No page-wide horizontal overflow; all controls remain reachable; axes/units and selected-component explanations are readable. Diagram hit targets work by touch or have an equally clear button alternative. Verify the generated standalone app as well as the multi-file app. Only report platforms actually tested.

## CVL-004 · P1 · Expose selected state and useful chart descriptions

**Evidence: source observation and DOM probe.** The three positioner mode buttons use CSS `.selected` but have no `aria-pressed`. The same pattern appears in friction, style and pressure-profile choices. Component selection is primarily visual. Charts have generic image labels and visual traces; no accessible numerical summary of the plotted relationships is offered.

**Suggested change:** use coherent native radio groups or correctly managed toggle/tab semantics, with one selected choice announced. Give component controls an announced selection and clear focus behavior. Provide compact chart summaries or an optional data table. Check whether `role="img"` on the parent interactive SVG hides descendant controls in actual assistive technology. Keep status announcements at meaningful state transitions rather than continuous refreshes.

**Acceptance:** keyboard and screen-reader users can identify the chosen mode/component and read the main outcome without interpreting color. Dialog opening/closing restores logical focus; reset does not strand focus. Add semantic DOM assertions and record an actual assistive-technology check separately.

## CVL-005 · P1 · Draw the selected trim concept accurately

**Evidence: source observation / teaching gap.** `js/diagrams.js` → `trimSketch` only branches between a perforated pattern for noise/cavitation and a generic window pattern for the other choices. Balanced/unbalanced, reduced-capacity, and seat/material choices therefore show largely the same cage image. These diagrams do not yet show the distinguishing mechanism described by the text.

**Suggested change:** create original, labeled comparison drawings: balancing passages/seals and pressure areas; reduced versus full port; contoured plug versus characterized cage windows; soft versus metal seating; staged liquid pressure reduction versus aerodynamic noise attenuation. Keep construction-specific examples clearly identified. Inspect rotary diagrams at closed, intermediate and open positions before describing them as accurate cutaways.

**Acceptance:** a learner can point to the feature that changes for each selection. Every illustration agrees with its text and chosen example; pressure paths and motion do not imply impossible bypasses. Cross-check against primary manufacturer references and preserve attribution. Visual checks supplement structural SVG tests.

## CVL-006 · P2 · Link force, sticking, travel, Cv and flow in one experiment

**Evidence: proposed enhancement tied to the user's main difficulty.** Anatomy, friction, flow and positioner lessons currently use separate states. The friction module contains plots but no moving cutaway or flow calculation; `motionStep` already returns a spring-pressure/force-equivalent value that could support an explanation.

**Suggested change:** add a guided linked view with a restrained valve cutaway, requested movement, actual movement, pressure/force indicators, and downstream Cv/flow. Start with the existing simplified force-equivalent friction model. If physical forces are introduced, define effective area, spring preload/rate and process load explicitly. Keep proxy pressure labeled until a genuine pneumatic-feedback model supplies it.

**Acceptance:** the learner can observe drive force building while the stem stays still, then see motion change Cv and flow. Highlight packing/guide contact as possible causes without diagnosing every sticky valve as packing. Every displayed value uses the same model state and stated units; resetting returns all linked views together.

## CVL-007 · P2 · Add short guided experiments with expected observations

**Evidence: proposed learning enhancement.** Current hints describe actions, but there is no step-by-step learning sequence or comparison checkpoint.

**Suggested experiments:**
- Start at 50% with static threshold 5 and sliding resistance 1.5. Apply six +1 pp changes. Predict which step causes breakaway and compare with the model.
- Compare a fast and slow lag sweep, then hold the request. Explain why the dynamic loop shrinks and eventually settles.
- Hold pressure drop constant and compare linear/equal-percentage capacity. Add piping resistance and explain the changed installed curve.
- Apply the same opposing load to I/P-only and feedback cases with adequate supply, then reduce supply and explain the remaining error.

**Acceptance:** each exercise records its assumptions, resets all relevant parameters, asks for a prediction, and reveals the observed mechanism. Expected numeric values come from tested equations rather than hard-coded claims that drift. Include concise operational and engineering explanations without duplicating the whole app for each audience.

## CVL-008 · P2 · Deepen positioner, actuator and failure lessons

**Evidence: proposed extension.** Characterization, split range, cutoffs, pressure fallback and failure differences are currently explained mainly in text. The numeric positioner comparison covers one single-acting assembly.

**Suggested change:** introduce a command-mapping explorer showing DCS output → configured travel request → actual sensor travel → closure member. Make characterization and split range interactive before adding more hardware. Then add carefully sourced spring-to-open and double-acting examples, illustrating supply/output/exhaust paths, relay action, feedback location, and accessories such as a booster or lock-up device where relevant.

**Acceptance:** input characterization remains distinct from physical trim characteristic. Electrical signal loss and air loss are separate selectable failures with stated assembly assumptions. Advanced diagnostics and fallback behavior are attributed to the exact device/configuration, not all DVCs. Normal and digital positioners are not ranked by their labels alone. Obtain an actual valve/actuator/DVC model or photo before claiming a precise match to the user's equipment; generic examples can proceed without it.

## CVL-009 · P2 · Connect valve faults to process-control trends

**Evidence: proposed extension, not missing functionality in the approved baseline.** The app currently has no process PID simulation; diagnostic traces deliberately isolate causes.

**Suggested change:** add an optional simple flow/process model with selectable manual/automatic control and a documented PI/PID implementation. Show SP, PV, controller output, travel and actuator pressure together. Compare normal response, friction, backlash, aggressive position tuning, changing process ΔP, and measurement noise. Reuse existing mechanics where suitable instead of introducing conflicting models.

**Acceptance:** users can explain a limit cycle as a possible interaction between loop action and valve nonlinearity, without treating a waveform as unique proof of stiction. Define process time constants, gains, saturation and anti-windup. Establish stable baseline and controlled counterexamples in tests. Keep process tuning separate from positioner tuning.

## CVL-010 · P2 · Close gaps in regression and distribution testing

**Evidence: source observation.** The 23 tests cover useful basics, but the DOM suite checks the presence of SVGs rather than full chart correctness. The test named “flow controls change numbers, preserve pressure balance, and reset” does not actually assert UI pressure balance. The seat-partition test checks coordinate strings; it does not establish closed topology visually. CI regenerates the single-file distribution and checks for a diff, but does not boot that generated file as part of its suite. A one-off generated-file boot was performed during the initial build, not preserved as a test.

**Suggested change:** add deterministic clock coverage for CVL-001/002, assert actual displayed calculations, test every diagnostic reveal and reset, test extreme positions and zero ΔP, and execute generated HTML through the same interaction contract. Use topology or rendering evidence for drawings rather than only string coordinates. Align test names with assertions. Validate non-finite model state/options if these APIs are expanded beyond bounded UI controls.

**Acceptance:** targeted defects are shown to fail before fixes, then the full suite passes. CI builds before testing the generated deliverable and still checks determinism. Avoid counts or brittle markup assertions as substitutes for behavior. Retain separate browser/device verification; jsdom does not replace it.

## CVL-011 · P2 · Make the source easier for the next agent to change safely

**Evidence: source observation.** `js/app.js` packs large templates, rendering, event handlers and state transitions into a small number of very long lines. Much teaching text remains embedded in page functions even though `js/content.js` exists. This makes review and targeted changes harder.

**Suggested change:** format source without behavioral changes first, then extract module rendering/interaction responsibilities where useful. Move reusable lesson content into a consistent data structure. Retain classic-script/local-file compatibility and the shared pure model API. Prefer named actions and clear state transitions over increasingly long condition chains.

**Acceptance:** each module's state, rendering and controls are easy to locate; formatting and structural changes are isolated from physics changes. Existing tests and generated build remain consistent. Add modules only where the maintenance benefit exceeds the extra indirection. No framework migration is needed for this work.

## CVL-012 · P2 · Track exactly which app revision is live

**Evidence: operational observation.** GitHub and the private Sites deployment have separate commit histories. The initial deployment used identical source trees, but a later GitHub push alone will not update Sites. GitHub Pages was not verified during this review.

**Suggested change:** document one explicit source-to-deployment process and record the source revision/build label in a small About or model-notes surface. Prefer GitHub Pages as the public distribution if the owner enables it. Keep any private Sites mirror's release state clear. Record deployment results rather than inferring success from a push or expected URL.

**Acceptance:** a future agent can identify the application commit represented by each live link and reproduce the standalone build. Docs-only changes do not trigger unnecessary app republishing. Access changes follow the user's intent; credentials never enter the repository.

## CVL-013 · P3 · Improve navigation, reuse and sharing

**Evidence: proposed convenience enhancements.** Module clicks currently use `history.replaceState`, so they do not build normal Back/Forward navigation history. Controls do not persist or encode a complete experiment in a link.

**Suggested change:** support sensible module Back/Forward behavior, optional saved scenarios or URL parameters, a “copy this experiment” action, and optional CSV export with units and model assumptions. Add an accessible numeric input alongside precision sliders where it helps. Consider offline installation only after the core interaction and update path are stable.

**Acceptance:** restoring a scenario produces the same stated model settings and clearly resets dynamic state. Validate unknown/out-of-range URL parameters. Browser history works without extra simulation loops. Exported data identifies whether pressure is a proxy or actual model output, includes units, and does not imply real plant measurements.

## Completion record

When an item is implemented, append: item ID; implementation commit; test/browser evidence; remaining limitation; completion date. Preserve the original finding and mark it closed rather than silently deleting the handoff history.
