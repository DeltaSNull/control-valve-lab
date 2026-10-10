# Control Valve Lab — agent handoff

Current pass: 2026-10-10, America/Chicago. User fully authorized app changes and pushing/publishing.

## Current implementation

The phone/PID pass supersedes the six-module application baseline reviewed on October 9. GitHub is the maintained source; read current main before changes. The spec/plan are `docs/superpowers/specs/2026-10-10-phone-pid-design.md` and `docs/superpowers/plans/2026-10-10-phone-pid.md`.

- Seven modules: anatomy, friction, Cv/flow, trims, positioners, diagnosis, PID/step testing.
- Shared phone workspace: persistent selected observation above separately scrolling Operate/Setup/Learn controls; adjacent panes on desktop. Short landscape allows page scrolling with a sticky observation.
- Run demo starts a narrated, reproducible example and ends automatically. Custom cancels automation. Observe changes plots without cancelling a demo. Navigation/backgrounding stops all simulation. No autostart.
- PID Step test stage: measured-record fit from a Manual OP step; baseline, endpoint and interpolated response crossings; SIMC PI starting point; explicit Use estimate transfer.
- Apply tuning stage: Manual/Auto, OP/SP nudges, load addition/removal, gain/Ti/Td numeric inputs, reverse/direct action, A/B/C ideal-form term placement, PI/aggressive/derivative presets.
- Defects can be selected in both stages: healthy, stiction, backlash, slow valve, travel limit, measured-PV noise.
- OP, actual travel, true PV, measured PV and SP are separate. This normalized FOPDT loop does not calculate Cv/flow and is not Honeywell firmware. Ti/Td are minutes in the UI; internal seconds. A/B are equivalent at Td=0.
- Fixed 0.05 s friction/positioner samples preserve slow sweeps across animation refresh rates; bounded 8,000-sample histories. PID records at 0.1 s with configurable acceleration and a 20,000-sample bound.
- Paused positioner input edits change parameters without advancing time. Run/resume applies dynamics. Friction manual steps remain explicitly sampled; Hold & settle evolves lag.

## Verification and review

Current checks: **41 tests pass, zero skipped/failing**; syntax checks on all six scripts pass; packaging generates a 145,131-byte standalone HTML and its PID workspace boot passes. Independent read-only review identified drifting baselines, large end travel mismatch and load-change contamination of step fits; these now have rejection/invalidation gates and regression tests. No further critical lifecycle issue was identified in that review.

Actual iPhone Safari, Android Chrome, desktop rendering, touch and screen-reader QA remain **unverified**. The managed browser-control capability was unavailable. Do not claim phone QA passed because jsdom tests or responsive CSS exist. Check compact screens, safe areas, numeric-input keyboard, plot labels and landscape first on a real device.

## Source map

| File | Responsibility |
| --- | --- |
| `js/models.js` | Existing Cv/liquid/motion/positioner numerical models |
| `js/pid.js` | Pure controller, process delay/lag, measured step identification and SIMC PI suggestion |
| `js/workspace.js` | Relocates live DOM into observation/control panels; panel/plot selection and toggle semantics |
| `js/app.js` | Seven module pages, state, fixed-clock integration, demo scripting and inputs |
| `js/content.js` | Educational explanations, cases, glossary, manufacturer/primary references |
| `js/diagrams.js` | Original SVG schematics and container-size-aware plots |
| `styles.css` | Persistent phone workspace, desktop panes and short-landscape fallback |
| `tests/` | Numerical, DOM, fake-clock, SVG and generated single-file boot tests |
| `scripts/package.mjs` | Embeds six scripts and CSS into `dist/index.html` |
| `docs/model-notes.md` | Exact models, units, recording policy and identification rejection heuristics |
| `docs/IMPROVEMENT_BACKLOG.md` | Per-ID statuses; historical evidence remains below the status table |

## Important invariants

1. Preserve command/travel/Cv/flow/PV distinctions and the single-phase liquid pressure balance.
2. Shared workspace moves nodes instead of cloning IDs. All required update targets must remain in the DOM even when their panel is hidden.
3. Keep one animation loop. Pause/background/navigation/custom must cancel automation. Opening a second module must never leave a hidden simulation running.
4. Fits come from recorded measured data, never the hidden process constants. Reject drifting baselines, no/small response, unsettled response, multiple OP moves and excessive end travel mismatch. Process/defect/load edits invalidate recordings and estimates. Defects/noise can still distort an accepted local fit; keep the caveat.
5. Bumpless transfer means initial output continuity; subsequent integral response to nonzero error is expected. Do not assert that OP remains fixed for a whole second after Auto.
6. A/B/C here refer to APM/Experion-style placement in **noninteractive/ideal** form. HC900 naming and series-form tuning are different. Do not silently convert or claim firmware equivalence.
7. Packing/backlash diagnostic pressure remains a command proxy; digital and conventional positioners retain the same teaching dynamics.
8. Original construction drawings and trim shapes remain conceptual. Detailed trim illustrations are still open work.

## Publishing

Repository: https://github.com/DeltaSNull/control-valve-lab . Existing owner-private Sites project is preserved by `.openai/hosting.json`: https://control-valve-lab.jac0b.chatgpt.site . GitHub and Sites have distinct commit histories; matching file trees matter. Source synchronization and publication are separate actions. The phone/PID pass is pushed to both targets; consult the pass's GitHub commit and Sites deployment result for provenance.

GitHub Pages settings/live address remain unverified in this environment. The expected Pages URL is https://deltasnull.github.io/control-valve-lab/ after owner configuration. No PWA manifest, service worker, offline cache, or native app installation has been added. Source and standalone HTML remain buildless. Never commit source repository credentials.

## Next pass

1. Real phone/device QA (CVL-003) and remaining screen-reader/chart-accessibility checks (CVL-004).
2. Detailed trim sketches (CVL-005), linked force/travel/Cv teaching experiment (CVL-006).
3. Format/extract the remaining compact app.js code (CVL-011), automate deployment revision labeling (CVL-012).
4. Optional integrating processes/series PID, scenario sharing/export and PWA/offline remain extensions, not completed features.

Historical application baseline was GitHub `8752422f0c453121baa9046d7ce04af40e877cd5`, tree `7c74ef9055a5becf15c62c537065e6eaabe6705d`, with 23 tests. The hidden stem, absent seat/body partition and fixed-width phone plot defects were fixed before that baseline. Do not re-open those as uncorrected findings.
