# Control Valve Lab

An interactive control-valve field guide for process control engineers, instrument technicians, and operations. Original schematics and simulated trends connect **command → actual travel → Cv → flow → process response**.

## Explore

1. **Inside the valve:** selectable globe-valve cutaway; actuator, spring, diaphragm, packing, stem, cage, plug, seat, and failure action.
2. **Stiction & hysteresis:** breakaway/sliding friction, direction-dependent response, backlash, and time lag; step/sweep/hold controls and response signatures.
3. **Cv & installed flow:** linear, equal-percentage and illustrative quick-opening curves; pressure budget, specific gravity, piping resistance, operating authority and local flow gain.
4. **Trims & styles:** globe, segmented-ball, butterfly and eccentric-plug schematics; capacity, balance, seats, noise, and cavitation/flashing.
5. **Positioners & DVCs:** I/P-only versus travel feedback; load, air limits, restricted delivery, hunting, configuration and diagnostics.
6. **Read the symptoms:** six simulated cases with hypotheses, explanations, alternatives and discriminating evidence.
7. **PID & step testing:** manual OP step recording, measured FOPDT fit, SIMC PI starting point, Honeywell-style A/B/C in ideal form, manual/auto, SP/load changes, tuning presets and six defect choices.

On phones, one selected plot stays above a separately scrolling **Operate / Setup / Learn** panel. **Run demo** starts a scripted, self-ending example; **Custom** stops automation. The **Observe** selector changes plots without stopping the demonstration. In dynamic Custom mode, press Run/resume or a step action to evolve the simulation.

PID workflow: **Step test → Run demo → Use estimate → Apply tuning**. Choose a defect in either stage. In Apply tuning, use Auto and move SP, or run the SP/load demo. Kc is %OP/%PV; Ti and Td are minutes. With Td=0, A and B are PI-equivalent; the derivative preset exposes their SP-response difference.

## Open it

- Open `index.html` from the complete repository folder. No server or runtime dependencies are required.
- For a single-file version, use `dist/index.html`; its CSS and JavaScript are embedded.
- For an ordinary phone/browser link, enable GitHub Pages using the instructions below. Mobile file viewers may not execute JavaScript; use a hosted link for the intended experience.

## GitHub Pages

The repository source is fully ready for Pages. Enabling hosting requires repository settings access, which is not exposed by the connected source-editing tool.

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/ (root)**, then **Save**.
4. GitHub will provide the deployment URL after its build completes. The expected address is `https://deltasnull.github.io/control-valve-lab/`; it is not live until Pages is enabled and deployment succeeds.

`.nojekyll` is included. A GitHub Actions check verifies tests and regenerates the self-contained package on pushes and pull requests; it does not turn Pages on.

## Development and verification

Node 20 or later is recommended. Production has zero dependencies; jsdom is a development-only dependency for DOM integration tests.

```sh
npm ci
npm test
npm run check
npm run package
```

The tests cover liquid pressure balance and units, characteristic boundaries and monotonicity, the equal-percentage ratio, breakaway friction, reversal backlash, lag settling, load rejection, pneumatic saturation, module navigation, control readouts, reset, dialogs, and simulation lifecycle.

Numerical and DOM tests include controller term placement, tracked transfers, anti-windup, measured step identification/rejection, defect motion, demo cancellation, workspace controls and slow sweeps at different refresh rates. Actual phone rendering/touch QA remains unverified.

Files are intentionally separated by responsibility. Change the source files and regenerate `dist/index.html`; do not hand-edit generated HTML.

For continued agent development, begin with [the agent handoff](docs/AGENT_HANDOFF.md) and [the prioritized improvement backlog](docs/IMPROVEMENT_BACKLOG.md). These contain review findings and proposed work, including items that are not covered by the current passing tests.

## Model limits

This app teaches mechanisms; it is not a valve sizing or diagnostic certification tool. Diagrams are representative, not exact Fisher assembly drawings. Signals and pressures are examples, not universal equipment settings.

See [model notes](docs/model-notes.md) for equations and assumptions and [source notes](docs/sources.md) for manufacturer references. Tests, signatures and trend examples are simulated. Real online movement, calibration, fail tests and maintenance require the site's operating and isolation procedures.

## Validation record

Numerical and DOM integration tests are automated. Browser-based visual/touch QA could not be performed in the managed build environment because its required browser-control capability was unavailable. Verify appearance and touch interaction on an actual phone before adopting it for a formal training session.
