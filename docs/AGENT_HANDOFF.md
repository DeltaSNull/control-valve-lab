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

## Sixth pass (2026-10-10): every control shows its effect

Trigger: owner's phone screenshot. Selecting a part in lesson 01 did not visibly highlight it (a faint SVG drop-shadow that iOS barely renders), and phone labels were hidden while their leader lines still showed.

- **Part selection:** selected part outlined in orange, others faded to 45%, an orange name tag with a pointer line (positions per part in `CALLOUTS`, `js/diagrams.js`), and the status line under the drawing shows the part's name and role. The generic label for the tagged part is dropped; labels and leader lines share `.svg-label` and hide together on phones.
- **Tap targets:** every drawn part has invisible tap zones (≥44 viewBox units), ordered so nested parts win. On phones the cutaway uses a cropped viewBox and up to 35vh in the pinned view. Measured at 390×844: all 12 parts select by tap; areas grew 2–5× (packing 136→676 px²).
- **Control audit (Playwright, every control in every lesson, does the visible live view change?):** found trim pressure-profile pills and friction "Signature axes" changed only a hidden view. They now switch the view (`showView`). Diagnosis answers and PID stage buttons give feedback beside the button by design.
- **Charts as controls:** tapping the installed-flow or Cv chart sets travel at that x (hint stays visible on phones).
- **Focus not obscured:** `--pinned-offset` drives `scroll-padding-top` on phones so scrolled/focused controls stay below the pinned live view.
- Evidence: 75 tests pass; layout sweep (6 sizes × 9 pages, source and dist) clean; axe: only the documented `meta-viewport` zoom exception. Real-device touch remains unverified.

## Fifth pass (2026-10-10): no zoom, and build-out for management review

User request: remove any zoom functionality and build the app out for management review (it supports a case for continued Claude subscriptions).

- **Zoom removed:** viewport `maximum-scale=1,user-scalable=no`; `html { touch-action: pan-x pan-y }` (no pinch or double-tap zoom; rapid step-button taps no longer zoom on iPhone); 16 px form text (no iOS auto-zoom on fields); Safari `gesture*` and Ctrl+wheel/trackpad pinch prevented. Desktop keyboard/menu zoom is a browser function left in place. Touch tests in Chromium show page scroll, the horizontal lesson menu and slider drags unchanged. Headless Chromium does not apply pinch zoom even with protections off, so pinch blocking itself is **unverified on a real phone**. axe now reports one **critical `meta-viewport`** finding (WCAG 1.4.4) on every page: an owner-requested trade-off; everything else is clean.
- **Knowledge checks:** three questions per lesson (`C.quizzes`), feedback without giving the answer away on a miss, explanation on a hit, score; numbers quoted in explanations re-checked against the models in `tests/review.test.cjs`.
- **Progress:** browser-only localStorage (validated on load; corrupt/blocked storage starts fresh). A lesson is complete when all guided steps are done and all three answers are correct. Home shows a progress panel with Continue and a two-tap reset; lesson cards and role paths show status.
- **Managers & trainers page** (`#training`, in the nav): why valve performance matters (qualitative, no plant data), self-paced / 15-minute toolbox talk / 60-minute workshop plans, six team questions, printable training record with optional name, About with version 2.0.0 and a factual "built with Claude Code" note.
- **Print:** lessons print as handouts (chart, all guided steps, role notes, questions, expanded Go deeper); the training record prints on its own. Checked via Chromium PDF output.
- Evidence: 70 tests pass. Layout sweep at six sizes × 9 pages for source and dist: no overflow or script errors. dist ~254 KB.

## Fourth pass (2026-10-10): control-valve app icon

User request: make the app look like a control valve when saved as an app.

- Icon: the P&ID control-valve symbol (dome diaphragm actuator, stem, bow-tie globe body, pipe connections) in lime on the app's dark green. One drawing in `scripts/icons.mjs` produces `icons/icon.svg` (rounded tile, favicon/any), `maskable.svg` (full-bleed, 80% safe zone), `apple-touch.svg`, and PNGs 192/512 any, 192/512 maskable and 180 Apple (opaque). The in-app logo uses the same symbol.
- `manifest.webmanifest`: Control Valve Lab / Valve Lab, standalone, start_url and scope `./`, theme #143b32. iOS tags: apple-touch-icon, app title, capable, status bar black.
- Packaging: dist/index.html embeds the SVG favicon and Apple icon as data URIs; the manifest and its icons are copied into dist/ (the Sites preview serves dist/). CI now checks the whole dist folder is up to date.
- Evidence: 61 tests (new `tests/install.test.cjs` checks manifest fields, icon files and PNG sizes/opacity, page links, and the dist copies). Chromium DevTools `Page.getInstallabilityErrors` and `Page.getAppManifest` over local HTTP for repo root and dist: no installability or manifest errors; all icons 200 with correct types. Previewed under iOS rounded, Android circle/squircle and 16–64 px sizes.
- Not verified: actual Add to Home Screen on an iPhone or Android device, and desktop install UI. No service worker/offline cache was added.

## Third pass (2026-10-10): guided-lab redesign for a broad industry audience

User request: make the app intuitive, simple and educational at management-level quality for everyone who deals with control valves daily.

- **Start here** home page (default route): signal-to-flow chain linked to lessons, role paths (operations, maintenance & instrumentation, process & control engineering, management & reliability), lesson cards, five essentials.
- **One lesson template** (`ValveWorkspace.lab` + `lessonPage`): question + key idea; live view with view buttons, key numbers, Run/Pause/Reset and status; guided activity (4 steps each: Try it / Look for / Why it matters, Show me, Back/Next, progress dots, then next lesson); controls with advanced options in **More settings**; **Why it matters on the job** for four roles; **Go deeper**; previous/next pager. Replaces the Operate/Setup/Learn tabs and the relocated-DOM workspace.
- Content in `content.js`: `modules`, `chain`, `roles`, `essentials`, `onTheJob`, `guides`, plus plain-language glossary terms. Audience-specific wording ("Fisher is the likely brand you mean") removed.
- Behavior: positioner edits run until settled (auto-stop after 2 s still; hunting keeps running); lag-mode manual changes hold and settle; the loop always draws its final frame (fixed a stale "running" status). PID page shows only the current stage's controls. Guide PID tuning step refuses to run without a measured estimate; its Show me restarts at a clean 50% operating point in Auto.
- Accessibility: axe-core 4.10.2 (WCAG 2 A/AA + best practice) in headless Chromium on all 8 pages at 1280×800 and 390×844: **zero serious/critical violations** after darkening secondary text, link, pressure-unit and tag colors and changing the interactive valve SVG from `role=img` to `role=group`. Remaining: moderate `skip-link` reports for hash-route links (`#flow` etc.), a false positive for this routing. Guide buttons keep keyboard focus.
- Evidence: 58 tests pass (new `tests/guide.test.cjs` re-checks every number quoted in guide text against the models and runs every Show me step). Headless Chromium at 320×640, 375×667, 390×844, 768×1024, 1280×800, 844×390 for source and dist: no page overflow or script errors. Pinned live view is 358–393 px on 390×844; short/landscape screens do not pin. dist is ~214 KB.
- Still unverified: real iPhone/Android devices, touch feel, large text, and an actual screen reader.

## Second pass (2026-10-10): browser QA, readability, formatting

- `5331694` fixes from real Chromium checks: compact charts (<220 px tall) use tighter margins and three y ticks; every chart has a numeric `<desc>`; the active module tab scrolls into view in the phone nav; re-clicking the active module no longer duplicates history; paused positioner/lag statuses name the control that evolves the response.
- `cd59d3a` Prettier-formats js/, tests/ and scripts/ (`.prettierrc.json`, `npm run format`, CI `format:check`). Babel ASTs are identical before/after. dist grows to ~168 KB from whitespace only.
- Evidence: 46 tests pass, zero skipped. Headless Chromium (Playwright 1.56.1 build) at 320×640, 375×667, 390×844, 768×1024, 1280×800 and 844×390, for both index.html and dist/index.html: no horizontal page overflow, no console/page errors, all seven demos complete, PID record→step→estimate→apply→Auto works (fit K 1.000, τ 20.0 s, θ 4.2 s against true 1/20/4), diagram parts keep focus after keyboard selection.
- Still unverified: real iPhone Safari / Android Chrome, touch, browser zoom and large text, VoiceOver/TalkBack. Headless Chromium is not device QA.

## Verification and review

First-pass checks: **41 tests pass, zero skipped/failing**; syntax checks on all six scripts pass; packaging generates a 145,131-byte standalone HTML and its PID workspace boot passes. Independent read-only review identified drifting baselines, large end travel mismatch and load-change contamination of step fits; these now have rejection/invalidation gates and regression tests. No further critical lifecycle issue was identified in that review.

Actual iPhone Safari, Android Chrome, desktop rendering, touch and screen-reader QA remain **unverified**. The managed browser-control capability was unavailable. Do not claim phone QA passed because jsdom tests or responsive CSS exist. Check compact screens, safe areas, numeric-input keyboard, plot labels and landscape first on a real device.

## Source map

| File | Responsibility |
| --- | --- |
| `js/models.js` | Existing Cv/liquid/motion/positioner numerical models |
| `js/pid.js` | Pure controller, process delay/lag, measured step identification and SIMC PI suggestion |
| `js/workspace.js` | Shared lesson layout (live view, guide card, controls, More settings), guide step markup, view and demo state |
| `js/app.js` | Seven module pages, state, fixed-clock integration, demo scripting and inputs |
| `js/content.js` | Educational explanations, cases, glossary, manufacturer/primary references |
| `js/diagrams.js` | Original SVG schematics and container-size-aware plots |
| `styles.css` | Formatted design system: frame, lesson template, guide, home page, responsive pinning rules |
| `tests/` | Numerical, DOM, fake-clock, SVG and generated single-file boot tests |
| `scripts/package.mjs` | Embeds six scripts and CSS into `dist/index.html` |
| `docs/model-notes.md` | Exact models, units, recording policy and identification rejection heuristics |
| `docs/IMPROVEMENT_BACKLOG.md` | Per-ID statuses; historical evidence remains below the status table |

## Important invariants

1. Preserve command/travel/Cv/flow/PV distinctions and the single-phase liquid pressure balance.
2. Each control ID exists once. All update targets stay in the DOM even when their view or More settings is hidden. Numbers quoted in guide text must stay covered by `tests/guide.test.cjs`.
3. Keep one animation loop. Pause/background/navigation/Stop demo must cancel automation. Opening a second module must never leave a hidden simulation running.
4. Fits come from recorded measured data, never the hidden process constants. Reject drifting baselines, no/small response, unsettled response, multiple OP moves and excessive end travel mismatch. Process/defect/load edits invalidate recordings and estimates. Defects/noise can still distort an accepted local fit; keep the caveat.
5. Bumpless transfer means initial output continuity; subsequent integral response to nonzero error is expected. Do not assert that OP remains fixed for a whole second after Auto.
6. A/B/C here refer to APM/Experion-style placement in **noninteractive/ideal** form. HC900 naming and series-form tuning are different. Do not silently convert or claim firmware equivalence.
7. Packing/backlash diagnostic pressure remains a command proxy; digital and conventional positioners retain the same teaching dynamics.
8. Original construction drawings and trim shapes remain conceptual. Detailed trim illustrations are still open work.

## Publishing

Repository: https://github.com/DeltaSNull/control-valve-lab . Existing owner-private Sites project is preserved by `.openai/hosting.json`: https://control-valve-lab.jac0b.chatgpt.site . GitHub and Sites have distinct commit histories; matching file trees matter. Source synchronization and publication are separate actions. The phone/PID pass is pushed to both targets; consult the pass's GitHub commit and Sites deployment result for provenance.

GitHub Pages is enabled: the "pages build and deployment" workflow succeeds on pushes to main. The expected URL is https://deltasnull.github.io/control-valve-lab/; it has not been opened from this environment. An installable web app manifest and icons exist; there is no service worker, offline cache, or native app. Source and standalone HTML remain buildless. Never commit source repository credentials.

## Next pass

1. Real phone/device QA (CVL-003; headless Chromium layout already checked) and an actual screen-reader check of the chart `<desc>` summaries (CVL-004).
2. Detailed trim sketches (CVL-005), linked force/travel/Cv teaching experiment (CVL-006).
3. Optional module extraction of the now-formatted app.js (CVL-011), automate deployment revision labeling (CVL-012). Sites mirror has not been republished with this pass.
4. Optional integrating processes/series PID, scenario sharing/export and offline caching remain extensions. Installable manifest and icons exist (fourth pass); there is no service worker.

Historical application baseline was GitHub `8752422f0c453121baa9046d7ce04af40e877cd5`, tree `7c74ef9055a5becf15c62c537065e6eaabe6705d`, with 23 tests. The hidden stem, absent seat/body partition and fixed-width phone plot defects were fixed before that baseline. Do not re-open those as uncorrected findings.
