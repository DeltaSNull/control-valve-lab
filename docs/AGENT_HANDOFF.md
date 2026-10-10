# Control Valve Lab — agent handoff

Review date: 2026-10-09, America/Chicago.

## Purpose and latest request

The user wants a practical learning app for process control engineers, instrument technicians, and operations. The main learning difficulties are physical causes of stiction/hysteresis and the connection between Cv, travel, and installed flow. Fisher-style equipment is the familiar starting point; other constructions, trim choices, and digital positioners should also be explained.

The latest request was to review the app and put suggested improvements into GitHub documents for agent passdown. This pass changes documentation only. The improvement backlog is proposed work; none of its open items should be reported as implemented.

## Reviewed baseline

- Repository: `DeltaSNull/control-valve-lab`.
- Reviewed GitHub application commit: `8752422f0c453121baa9046d7ce04af40e877cd5`.
- Reviewed source tree: `7c74ef9055a5becf15c62c537065e6eaabe6705d`.
- The original build environment used local commit `ab22602a2521ff0f06b470d931ba3275f5ae681f` for the same source tree. Different commit IDs reflect separate GitHub/Sites histories, not different app contents.
- Six modules exist: anatomy; friction/hysteresis; Cv/flow; trims/styles; positioners; diagnostic cases.
- Production is buildless HTML/CSS/JavaScript with original SVG. `jsdom` is development-only.
- `index.html` plus assets is the maintained application; `dist/index.html` is generated, self-contained HTML.

The application baseline remains the commit above after this documentation-only pass. Fetch current `main` and check for later changes before implementing recommendations.

## Verification evidence from this review

| Check | Observed result | Limit |
| --- | --- | --- |
| `npm test` | 23 passing; zero failures; zero skipped | Does not prove browser rendering, touch behavior, or complete teaching accuracy |
| `npm run check` | All four application scripts pass syntax checks | Not an accessibility or visual check |
| GitHub CI for application baseline | [Run 38019667118](https://github.com/DeltaSNull/control-valve-lab/actions/runs/38019667118) completed successfully | Applies to the reviewed commit |
| Local source tree vs reviewed GitHub tree | Matching tree SHA | Subsequent branches/deployments must be checked independently |
| Controlled DOM/animation probe | Slow sweep loses most of the completed cycle; see CVL-001 | DOM simulation, not physical device or browser rendering |
| Paused positioner probe | Changing load to 2 psi advances 0.02 s then stays paused | Demonstrates a usability issue, not incorrect feedback mathematics |
| Selection accessibility probe | Three positioner-choice buttons; none exposes `aria-pressed` | Actual screen-reader behavior remains untested |

No browser-based visual, touch, or screen-reader check was available in this environment. The required managed browser-control capability was absent. Do not convert this limitation into a claim that mobile QA passed.

## Recommended next implementation pass

1. **CVL-001:** preserve a complete slow sweep and decouple recorded history from display refresh rate.
2. **CVL-002:** give paused/held/running/stepped simulations a clear, consistent user contract.
3. **CVL-003 and CVL-004:** verify real phone/desktop behavior and expose selection state to assistive technology.
4. **CVL-005:** replace generic trim drawings with illustrations of the actual selected concept.
5. **CVL-006 and CVL-007:** connect force, movement, and flow visually, then add guided experiments with expected observations.

The remaining backlog covers deeper positioner lessons, process-loop examples, testing, maintainability, and deployment traceability. Complete the foundational items before expanding scope substantially. Retain the original engineering model assumptions unless a reviewed change explicitly replaces them.

## Known baseline corrections already completed

The initial independent review found an obscured stem through the bonnet, an absent seat/body partition, and fixed-size charts that shrank axis text. Those were corrected before the application baseline was published and have regression checks. Do not list them as still-open defects. Real visual/device inspection is still needed: structural SVG checks do not prove all geometry, labels, and hit targets look correct.

## Navigation through the source

| File | Responsibility / useful entry points |
| --- | --- |
| `js/models.js` | `cvAt`, `liquidFlow`, `motionStep`, `positionerStep`, `caseData` |
| `js/app.js` | Module pages; `sampleF`, `sampleP`, `frame`, `pause`, `render`, `onInput`, `action` |
| `js/diagrams.js` | `plot`, `valve`, `styleIcon`, `trimSketch` |
| `js/content.js` | Component explanations, trim/style text, diagnostic cases, glossary, source links |
| `styles.css` | Desktop/mobile layout, control styling, reduced-motion CSS |
| `tests/` | Numerical, DOM and structural SVG checks |
| `scripts/package.mjs` | Builds the single-file distribution deterministically |
| `docs/model-notes.md` | Exact implemented model assumptions and equations |
| `docs/sources.md` | Manufacturer references and topic mapping |

## Engineering invariants to preserve

- Command, requested travel, sensor travel, closure-member travel, Cv, flow, and process variable are separate quantities.
- Stiction is a mechanism; hysteresis describes path-dependent response. The current backlash/hysteresis examples intentionally use the same play-operator mathematics with different explanations.
- The friction lab's pressure is a command proxy; it is not a prediction of a feedback positioner's output pressure.
- The Cv calculator is single-phase, turbulent, non-choked liquid service only. Its pressure balance must close.
- The equal-percentage exponential applies above the declared 5% travel threshold; the shutoff transition is illustrative.
- Conventional and digital positioners share model dynamics. Digital diagnostics do not automatically imply superior mechanics or faster response.
- Loss of air, loss of signal, actuator action, and accessories must not be collapsed into one universal fail response.
- A diagnostic pattern supports a hypothesis; it does not uniquely identify a field defect.

## Hosting and source synchronization

- GitHub is the maintained source. The initial private live deployment is [Control Valve Lab](https://control-valve-lab.jac0b.chatgpt.site); owner access is required.
- `.openai/hosting.json` identifies the Sites project. Use the current Sites workflow and preserve that identity when updating this deployment.
- A GitHub commit does **not** automatically update the separate Sites deployment. Record which application revision each deployment contains.
- The public GitHub Pages address is an expected target, not a verified deployment in this review. Check current Pages configuration/deployment before claiming it is live. README contains owner setup instructions.
- No deployment is necessary for this documentation-only handoff. Do not republish the app merely to synchronize these review notes.
- Never commit credentials, temporary access tokens, private plant records, or environment-specific authentication files.

## How to close a backlog item

Record the implementation commit, changed behavior, and the checks that actually ran. Use a reproducing regression test for confirmed code defects; use browser evidence for layout/touch claims. Run the project suite and syntax check after relevant application changes, regenerate the standalone distribution, and check that generated output matches its sources. Update the backlog status and this handoff's next-pass ordering. State any remaining validation limit explicitly.
