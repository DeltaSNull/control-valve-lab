# Control Valve Lab maintenance

This is an educational engineering app, maintained in DeltaSNull/control-valve-lab.

## Start here for agent handoff
- Read [docs/AGENT_HANDOFF.md](docs/AGENT_HANDOFF.md) for the reviewed baseline, deployment status, verification evidence, and recommended next pass.
- Read [docs/IMPROVEMENT_BACKLOG.md](docs/IMPROVEMENT_BACKLOG.md) for prioritized findings and acceptance criteria. It distinguishes reproduced defects, source observations, validation gaps, and optional enhancements.
- Treat backlog entries as proposed work, not completed features or blanket authorization. Follow the current user's requested scope.
- When implementing an entry, preserve its ID, record the commit and verification evidence, and update its status. Keep unresolved browser/device checks visible.

## Architecture
- Buildless index.html loads six classic deferred scripts in order: models, pid, content, diagrams, workspace, app.
- js/models.js contains pure numerical models and exports the same API to Node and the browser.
- js/pid.js contains pure controller, process, recorded-step identification and SIMC PI models; UI time parameters are minutes.
- js/workspace.js renders the shared lesson layout (live view, guided activity, controls, More settings) and view/demo state.
- Every lesson follows the same template: question + key idea, live view, guided steps (Try it / Look for / Why it matters / Show me), controls, role notes for operations/maintenance/engineering/management, a three-question knowledge check, Go deeper, pager. Keep it that way; a new lesson needs guide steps, role notes, quiz questions and tests that re-check any numbers quoted in its guide or quiz explanations.
- Progress (guided steps done, quiz answers, optional learner name) is stored only in this browser's localStorage under `control-valve-lab:progress:v1`, validated on load. Nothing is sent anywhere. The Managers & trainers page (`#training`) holds session plans, team questions, the printable training record and About/version.
- Zoom is disabled at the owner's request (viewport `user-scalable=no`, `touch-action: pan-x pan-y`, 16 px form text, blocked pinch/Ctrl+wheel). axe reports this as a critical `meta-viewport` (WCAG 1.4.4) finding; keep it documented, and do not re-enable or remove it without the owner. Keyboard/menu browser zoom still works on desktop.
- Release label: `C.release` in content.js must match package.json version (tested).
- js/content.js holds original educational explanations, glossary, cases, and primary references.
- js/diagrams.js renders original SVG schematics and plots.
- js/app.js owns controls, seven module states, scripted demos and one fixed-step animation loop; navigation/background/custom pauses or cancels demos.
- scripts/package.mjs produces dist/index.html as a self-contained downloadable/hostable app. Do not edit generated dist directly.

## Engineering correctness
- Distinguish command, mapped travel request, actual sensor travel, closure-member motion, Cv, flow, and process variable.
- Stiction is a mechanism; hysteresis is path-dependent response; backlash is mechanical clearance; lag is time-dependent.
- State every chart's inputs, outputs, units, and relevant assumptions.
- Use the liquid equation only for the explicitly labeled single-phase, turbulent, non-choked teaching model.
- Equal-percentage exponential does not reach zero at zero travel. Preserve the declared 5% near-seat transition.
- Preserve pressure balance: total available ΔP = valve ΔP + non-valve losses.
- Do not infer exact valve construction or fail action from brand/color. Do not imply every positioner has the same diagnostics.
- Link manufacturer documents for device-specific claims. Original schematics must remain labeled as conceptual.

## Verification
1. npm ci
2. npm run format:check (run npm run format after edits)
3. npm test
4. npm run check
5. npm run package (also copies manifest.webmanifest and its icons into dist/)

Tests must fail on missing dependencies rather than silently skip DOM coverage. Add meaningful regression tests for model or interaction changes. For visual review, inspect both a phone and desktop where browser tooling is available; record unavailable checks honestly.

Keep all controls keyboard-accessible and touch-friendly. Every control must visibly change the live view where the learner is looking: a control that affects only one view switches the live view to it; selecting a drawn part outlines it, names it with a pointer tag and states its role under the drawing. Drawn parts that act as controls need tap zones of at least 44 viewBox units, layered so nested small parts win. On phones, scroll padding keeps focused controls clear of the pinned live view. Respect reduced motion. Do not leave stale/duplicate animation loops after navigation, pause, or reset. Do not add plant connectivity, tracking, credentials, or a backend without an explicit request.

## Hosting
GitHub is the primary maintainable source. GitHub Pages can serve the root index.html and assets after the owner enables main / root in Settings → Pages. The self-contained dist/index.html is also a deployment target; it embeds the tab and iPhone icons and ships manifest.webmanifest plus icons/ beside it so a hosted dist folder can be saved as an app. App icons are the P&ID control-valve symbol generated by scripts/icons.mjs (npm run icons); edit the drawing there, not the PNGs. No service worker or offline cache exists; add one only on request. A private Sites preview may use .openai/hosting.json; preserve its project ID if present.

## Phone/PID pass (2026-10-10)
Run demo is deterministic and ends automatically. Stop demo (data-action=custom) cancels automation; preserve user control changes and keep the view buttons independent of automation. Each control ID exists exactly once. All dynamic simulations must use fixed simulated intervals, not animation frame count. PID fits must come from recorded measured PV and OP, not hidden process constants. Process/defect/load changes invalidate the fit. Reject drifting baselines, insufficient settling, multiple OP changes and large end travel mismatch. A/B/C refer to Honeywell term placement in the explicitly declared noninteractive/ideal teaching form. Do not present these settings as a firmware emulator or series-form conversion.
