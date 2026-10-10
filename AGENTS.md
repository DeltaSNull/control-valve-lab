# Control Valve Lab maintenance

This is an educational engineering app, maintained in DeltaSNull/control-valve-lab.

## Start here for agent handoff
- Read [docs/AGENT_HANDOFF.md](docs/AGENT_HANDOFF.md) for the reviewed baseline, deployment status, verification evidence, and recommended next pass.
- Read [docs/IMPROVEMENT_BACKLOG.md](docs/IMPROVEMENT_BACKLOG.md) for prioritized findings and acceptance criteria. It distinguishes reproduced defects, source observations, validation gaps, and optional enhancements.
- Treat backlog entries as proposed work, not completed features or blanket authorization. Follow the current user's requested scope.
- When implementing an entry, preserve its ID, record the commit and verification evidence, and update its status. Keep unresolved browser/device checks visible.

## Architecture
- Buildless index.html loads four classic deferred scripts in order: models, content, diagrams, app.
- js/models.js contains pure numerical models and exports the same API to Node and the browser.
- js/content.js holds original educational explanations, glossary, cases, and primary references.
- js/diagrams.js renders original SVG schematics and plots.
- js/app.js owns controls, module state, and one animation loop; navigation pauses simulations.
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
2. npm test
3. npm run check
4. npm run package

Tests must fail on missing dependencies rather than silently skip DOM coverage. Add meaningful regression tests for model or interaction changes. For visual review, inspect both a phone and desktop where browser tooling is available; record unavailable checks honestly.

Keep all controls keyboard-accessible and touch-friendly. Respect reduced motion. Do not leave stale/duplicate animation loops after navigation, pause, or reset. Do not add plant connectivity, tracking, credentials, or a backend without an explicit request.

## Hosting
GitHub is the primary maintainable source. GitHub Pages can serve the root index.html and assets after the owner enables main / root in Settings → Pages. The self-contained dist/index.html is also a deployment target. A private Sites preview may use .openai/hosting.json; preserve its project ID if present.
