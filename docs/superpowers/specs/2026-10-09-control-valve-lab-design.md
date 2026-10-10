# Control Valve Lab — Design
Date: 2026-10-09
Status: Design for review; implementation has not started.

## Purpose and audience
Build a responsive interactive HTML learning application for process control engineers, instrument technicians, and operations. The primary learning goals are understanding the physical causes of stiction and hysteresis, and distinguishing valve command, actual travel, flow coefficient, flow, and process response. The starting example is a representative Fisher-style sliding-stem globe valve with spring-and-diaphragm actuator and digital positioner. It is an educational schematic, not an exact manufacturer's assembly drawing.

The user approved the proposed six-module scope and delegated additional content choices. Include force balance, fail action, cavitation/flashing, and diagnostic uncertainty as supporting topics. A photograph or model number may refine the example later and is not a prerequisite.

## Experience
An immediately usable lab opens with the valve cutaway, a command slider, actual-travel readout, and a short guided explanation. Navigation exposes six modules: Anatomy, Friction & Hysteresis, Cv & Flow, Trims & Styles, Positioners, and Troubleshooting.
Each module has a short explanation, a meaningful interactive demonstration, and expandable engineering detail. Define abbreviations at first use. Use readable typography, explicit units and axes, and consistent colors for command, travel, pressure, and flow. Charts must not rely on color alone.

Offer guided presets and reset buttons, with optional animation and reduced-motion support. Use keyboard-accessible controls and tap-friendly layouts; charts and diagrams scale to phone and desktop widths without requiring horizontal page scrolling. An optional glossary explains terminology. No authentication, backend, user tracking, plant connections, or paid APIs are required.

## 1. Valve anatomy and force balance
Create an original SVG cutaway showing the body, bonnet, packing, stem, plug, seat, cage, yoke, spring, diaphragm, and air chamber. Selecting a component highlights it and explains function, possible defects, and relevant evidence.

Animate stem/plug and diaphragm consistently with travel. Explain pneumatic force, spring load, friction, and process-fluid forces. Balanced trim reduces a pressure-force component but does not eliminate every force or friction source. Packing seals around the moving stem; tightening it increases sealing load and can increase friction. Stem damage, deposits, guide contact, misalignment, thermal effects, and actuator seals can also impair movement.

Fail-open/fail-closed examples clearly distinguish loss of air, loss of signal, configured positioner behavior, and mechanical actuator action. Do not imply actuator paint, signal direction, or one positioner setting establishes fail action.

## 2. Friction, hysteresis, and lost motion
Show a command-versus-travel plot and time trends with pause, reset, step, and automatic up/down sweep controls. Provide separate presets for ideal response, stiction, backlash, and pneumatic lag; combined effects are optional.

Stiction is modeled with a static breakaway threshold and lower sliding friction so pressure/force can build while the stem is stationary, followed by movement. Hysteresis describes direction-dependent input/output behavior; it is not presented as a unique root cause or a synonym for stiction. Backlash has a reversal lost-motion band. Lag is time dependent and must not masquerade as rate-independent hysteresis.

Display which input and output define each plot, sweep rate, and the model's simplified assumptions. Support pressure-versus-travel signatures as an educational view. Distinguish measured feedback location from true plug/ball motion, especially for rotary linkage and shaft effects. A positioner can improve positioning but cannot repair mechanical damage.

## 3. Cv and installed flow
Let users select linear, equal-percentage, and illustrative quick-opening inherent characteristics. Controls include maximum Cv, equal-percentage rangeability, travel, liquid specific gravity, total available differential pressure, and piping resistance. Provide two clearly separated modes: constant valve differential pressure and an installed liquid system with fixed available differential pressure and quadratic non-valve losses.

For turbulent, non-choked, single-phase liquid examples in US customary units:
Q [US gpm] = Cv(x) * sqrt(deltaP_valve [psi] / SG).
For the installed model with K in psi/(US gpm)^2:
deltaP_total = deltaP_valve + K*Q^2,
Q = sqrt(deltaP_total / (SG/Cv(x)^2 + K)).
Handle Cv=0 separately with Q=0.

Show inherent Cv/travel and installed flow/travel curves, a moving operating-point marker, valve differential pressure, and local gain. Define the normalization of every curve. Explain valve authority at a stated operating point, oversized valves, and why equal-percentage trim may improve installed linearity without guaranteeing it.

Use Cv=Cv_max*x for ideal linear travel fraction x. For equal percentage use Cv=Cv_max*R^(x-1) only within a stated controllable travel range; explicitly separate shutoff and the illustrative near-seat transition. Do not claim the ideal exponential reaches zero at x=0. Quick-opening is a labeled illustrative curve, not a vendor sizing curve.

Do not use the liquid equation for gas, steam, flashing, cavitating/choked, viscous, or two-phase sizing. Explain those limits and link to manufacturer sizing references. Distinguish rated Cv, actual operating Cv, body size, rangeability, and installed turndown.

## 4. Trims and styles
Compare sliding-stem globe, segmented-ball, butterfly, and eccentric-plug designs using original schematics and concise tradeoffs. Avoid universal claims that a body style always has one inherent characteristic.

Cover plug-contoured versus cage-characterized trim, balanced/unbalanced designs, reduced-capacity trim, metal/soft seats, shutoff versus throttling, and multistage anti-cavitation/noise-reduction approaches. Distinguish characteristic from trim material, leakage rating, and pressure-recovery behavior.

Include a pressure-profile illustration: cavitation involves vapor formation followed by bubble collapse when pressure recovers; flashing persists when downstream conditions keep the fluid vaporized. Explain that anti-cavitation trim is not a universal cure for flashing. Introduce choked flow, erosion, and noise without presenting the training model as a selection tool.

## 5. Positioners and digital valve controllers
Provide a linked diagram of DCS command, I/P, pneumatic relay, actuator, travel sensor, and position feedback loop. A conventional 4–20 mA example is labeled as an example, not the only supported signal type.
Compare:
- I/P alone: electrical command converted to pressure without a travel-control loop.
- Conventional positioner: adjusts actuator pressure using position feedback.
- Digital valve controller: digital position control/configuration and available diagnostics.

Explain setpoint versus actual travel, output pressure versus supply pressure, positioner tuning versus process PID tuning, input characterization versus inherent trim characteristic, travel limits/cutoffs, and split-ranging. Avoid implying all DVC models or license levels expose identical diagnostics. Use FIELDVUE/DVC6200 as a referenced example, without reproducing its software interface.

Demonstrate low supply/limited pneumatic capacity and excessive positioner aggressiveness with clearly labeled simplified scenarios. Describe signatures, step response, travel deviation, and friction estimates as evidence to interpret alongside service conditions, not definitive diagnoses.

## 6. Troubleshooting
Supply at least six selectable cases: packing friction, mechanical lost motion, restricted air supply, oversized trim, aggressive positioner tuning, and process-side disturbance.
Each case offers command/travel/pressure/flow trends, a question, a revealable explanation, alternative causes, and observations that help discriminate them. Include why a cycling PV alone cannot prove stiction and why full-stroke speed does not establish small-signal performance.

Use simulated data only. Explain that live stroke tests, calibration, fail tests, and disassembly require the site's isolation and operating procedures; avoid casually directing users to stroke an online process valve.

## Architecture and repository
Repository: DeltaSNull/control-valve-lab.
Buildless static HTML/CSS/JavaScript with no runtime dependencies. Keep mathematical models independent from DOM code.
Planned boundaries:
- index.html: application shell and semantic navigation.
- styles.css: responsive layout and visual system.
- js/models.js: pure flow and motion models.
- js/diagrams.js: SVG diagrams and plots.
- js/content.js: lessons, cases, glossary, references.
- js/app.js: interaction state and rendering.
- tests/: numerical and interaction checks.
- README.md: usage, model limits, validation, and hosting instructions.
- AGENTS.md: maintenance rules, correctness constraints, and verification commands.
- docs/: design, implementation plan, and source notes.

Use a runnable index.html with local assets; avoid fetch-dependent lesson loading so local-file operation remains possible. GitHub Pages is the preferred public hosting target for this public repository. Do not claim a live deployment until hosting is enabled and verified; if repository administration is unavailable, provide precise owner setup instructions and the complete committed app.

## Evidence and references
Base technical explanations on primary manufacturer documentation. Preserve references in the app and document the source-to-topic mapping. Initial references:
- Emerson, Control Valve Handbook, sixth edition:
  https://www.emerson.com/en/final-control/catalog/products-and-software/valves/control-valves/control-valve-handbook
- Emerson, Fisher FIELDVUE DVC6200:
  https://www.emerson.com/en/final-control/products/fisher-dvc6200
- Emerson, Control Valve Diagnostics:
  https://www.emerson.com/en/final-control/catalog/products-and-software/valve-software/control-valve-diagnostics
- Emerson, Control Valve Flashing:
  https://www.emerson.com/en/final-control/catalog/products-and-software/valves/control-valves/severe-service-control-valves/valve-flashing

Verify detailed device-specific claims against applicable instruction manuals during implementation. Use original explanatory text and drawings. Clearly label model assumptions and distinguish conceptual examples from equipment-specific behavior.

## Acceptance criteria
1. All six modules contain working interactions and explanatory content.
2. Valve animation, numeric readouts, and plotted state agree.
3. Numerical checks cover zero travel/shutoff, full travel, zero differential pressure, SG scaling, installed pressure balance, monotonic characteristics, and invalid inputs.
4. Motion checks demonstrate sticking before breakaway, directional reversal lost motion, and lag that varies with time rather than being mislabeled hysteresis.
5. Reset and module navigation do not leave duplicate animation loops or stale state.
6. Phone/desktop layout, keyboard operation, reduced motion, and readable chart labels are checked where browser tooling permits; any verification limitation is disclosed.
7. Repository includes complete source, references, model limits, maintenance instructions, and reproducible tests.
8. Commit and verify repository contents; separately report deployment status.
