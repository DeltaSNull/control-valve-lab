# Control Valve Lab Implementation Plan

> Execution: implement inline in this session, following the user's instruction to proceed and use best judgment. Do not add another approval pause.

**Goal:** Deliver six interactive control-valve learning modules and a complete GitHub source repository.

**Architecture:** Buildless HTML with classic deferred scripts so it also opens from a local folder. Pure mathematical models expose a browser global and CommonJS exports for Node tests. Original SVG diagrams and plots share the same state as numerical readouts.

**Tech Stack:** HTML, CSS, JavaScript, SVG, Node built-in test runner. No production dependencies.

**Spec:** ../specs/2026-10-09-control-valve-lab-design.md (approved by the user).

## Global constraints
- Six modules, mobile/desktop layout, keyboard controls, reduced motion, explicit chart labels and units.
- Distinguish command, travel, Cv, flow, pressure, and process response.
- Single-phase turbulent non-choked liquid flow only in the numerical flow lab.
- Clearly label idealized characteristics, near-seat transition, motion models, and simulated diagnostic data.
- Use primary references; no exact vendor drawings or unsupported device-specific guarantees.

## Review focus
- Zero and boundary inputs must yield finite outputs and a fully closed valve at zero travel.
- Equal-percentage shutoff must not silently change the exponential characteristic in its declared working range.
- Direction reversal must show lost motion; a time lag must settle rather than remain a fixed offset.
- Switching modules, resetting, and pausing must retain consistent state and a single animation loop.
- Small screens and keyboard-only users must be able to read plots and reach every control.

## Task 1: Engineering models
Files: js/models.js, tests/models.test.cjs, package.json.
Interfaces: cvAt(travelPct, characteristic, cvMax, rangeability); liquidFlow(cv, dp, sg, resistance); motionStep(state, command, options, dt); positionerStep(state, command, options, dt); caseData(caseId).
- [x] Write tests for reference flow, pressure balance, zero inputs, SG scaling, characteristic monotonicity and working-range ratios, reversal backlash, breakaway, lag settling, pressure saturation and feedback rejection of load.
- [x] Run npm test and observe missing implementation failure.
- [x] Implement models with invalid numeric input rejection and bounded travel.
- [x] Run npm test; confirm all numerical behavior.

## Task 2: Six-module application
Files: index.html, styles.css, js/content.js, js/diagrams.js, js/app.js.
Interfaces: content supplies component/style/trim/diagnostic/reference data; diagrams supplies SVG renderers; app owns state and one requestAnimationFrame loop.
- [x] Implement anatomy with component selection, travel, and air-fail examples.
- [x] Implement friction sweep, step buttons, time and input/output plots.
- [x] Implement Cv calculator, inherent/installed curves, pressure balance, local gain.
- [x] Implement style/trim exploration and cavitation/flashing pressure profiles.
- [x] Implement positioner comparison, live pressure/travel response, and configuration explanations.
- [x] Implement six diagnosis challenges, glossary and source drawer.
- [x] Check syntax and use a DOM integration test for navigation, sliders, resets, and diagnostics.

## Task 3: Verification and documentation
Files: tests/app.test.cjs, README.md, AGENTS.md, docs/model-notes.md, docs/sources.md, scripts/package.mjs.
- [x] Run numerical and DOM tests, syntax checks and standalone HTML packaging.
- [x] Review engineering wording and source mappings.
- [x] Obtain one independent whole-app review and fix substantive findings with regression coverage.
- [x] Record browser QA limitations if managed browser tooling is unavailable.

## Task 4: Source delivery and hosting
Files: .github/workflows/check.yml, .nojekyll, documentation and app files.
- [x] Commit complete source to DeltaSNull/control-valve-lab using GitHub Git-data operations and an expected-head lease.
- [x] Verify remote commit and file tree.
- [x] Publish a private live preview through Sites if available, retaining the user's GitHub repository as the maintainable source.
- [x] Document GitHub Pages enablement when repository-administration capability is unavailable.

## Execution record
- Authorized new repository and complete app; user approved the design and asked to proceed.
- Fresh isolated local checkout on build/control-valve-lab; remote repository initially contains only the approved design.
- GitHub connector supplies source writes but no Pages administration endpoint.
- Managed environment has no control-browser skill; per Sites instructions browser QA must be skipped. Node/DOM checks and an independent review will be used; disclose this limit.

## Final verification record
- Numerical and DOM checks: 23 tests pass, zero failures and zero skipped.
- Independent reviewer found three substantive diagram/readability issues: stem layering, a missing body partition at the seat, and phone chart scaling. Each was reproduced by a failing regression test, fixed, and verified with the full green suite.
- No critical numerical or animation-loop blocker was identified.
- Browser visual/touch QA remains unavailable; the owner should check the hosted app on an actual phone.
- Source write and private hosting finish through the connected GitHub/Sites workflows; public GitHub Pages enablement requires one owner settings step.
