# Engineering models and limits

## Liquid flow

All calculated flows use US customary Cv units. Q is US gpm, ΔP is psi, and specific gravity SG is dimensionless. The reference case is Cv=10, ΔP=4 psi, SG=1 → Q=20 US gpm.

Constant valve differential pressure:

`Q = Cv × sqrt(ΔPvalve / SG)`

Installed model:

`ΔPtotal = ΔPvalve + KQ² = SG(Q/Cv)² + KQ²`

`Q = sqrt(ΔPtotal / (SG/Cv² + K))`

K has units psi/(US gpm)² and represents all non-valve quadratic losses. It is not a dimensionless elbow/fitting loss coefficient. Total pressure budget is held constant, not taken from a pump curve. At Cv=0, modeled flow is zero and the valve carries the available static differential pressure. At zero available differential pressure, flow is zero and operating authority is undefined.

This model excludes Reynolds-number corrections, reducers, pressure recovery/choking limits, vapor pressure effects, gas/steam compressibility, flashing and two-phase flow. It is not an IEC/ISA service-sizing calculation.

## Characteristics

Travel fraction x lies in [0,1].
- Linear: `Cv = Cvmax × x`.
- Equal percentage above 5% travel: `Cv = Cvmax × R^(x−1)`.
- Below 5%, an illustrative linear transition joins shutoff to the exponential value at 5%. The ideal exponential itself is nonzero at x=0.
- Illustrative quick opening: `Cv/Cvmax = (1−exp(−4x))/(1−exp(−4))`.

These are idealized curves, not product sizing tables. Rated rangeability does not establish installed turndown. Local gain is a finite difference across ±0.1 percentage point, with a one-sided difference at the mechanical stops. The near-seat transition has an intentional slope change.

## Anatomy

The single-acting example is air-to-open and spring-to-close. An illustrative unloaded 3–15 psi equilibrium across travel and 20 in² effective area produce 60–300 lbf. An illustrative full stroke is 0.75 in. Friction and process forces are explained but excluded from this ideal moving cutaway. Removing air forces the ideal model to its seated state. Real fail response depends on the complete valve/actuator/accessory assembly and the specified failure. No real shutoff leakage is computed.

## Friction lab

The force-equivalent command variable is represented by a 3–15 psi pressure proxy. The unloaded spring equivalent is `3 + 0.12 × travel[%]`. Friction thresholds are percentage points of the equivalent spring-force span; they are not measurements of deadband in a real assembly.

- Ideal: output equals input.
- Stiction: hold when `|command−travel| <= Fs`. Once breakaway occurs, move quasi-statically to `command−sign(command−travel)Fk`, with Fk≤Fs. This shows a breakaway jump but not inertial dynamics or exact friction physics.
- Hysteresis/backlash: a rate-independent play operator holds the previous output inside an input-centered band and moves at its boundary. Identical mathematics can illustrate different mechanisms; hysteresis is a response descriptor. For backlash, the input is an upstream drive and output is downstream closure-member motion. Its pressure trace is an upstream proxy, not a realistic positioner pressure prediction.
- Lag: exact first-order update `xnew = xold + (command−xold)(1−exp(−dt/τ))`. A slower sweep shrinks its dynamic loop and a held command settles.

The sweep has finite speed and reverses between 10% and 90%. Pressure signatures here have no process loading or real positioner loop. A pressure–travel signature from real equipment must account for spring, action, process force, temperature and pressure-sensor meaning.

## Positioner lab

State includes travel, actuator pressure, velocity, and an integral feedback contribution. I/P-only pressure demand is an illustrative linear command-pressure mapping. Conventional and digital positioners share the same feedback algorithm and plant dynamics; the comparison is feedback versus no feedback, not a claim that digital devices inherently have better dynamic performance.

Feedback adds proportional and integral correction to pressure demand. The output is limited to [0,supply], with conditional integration to prevent windup. A pneumatic first-order lag represents fill/exhaust restrictions. The mechanical model includes a spring-equivalent pressure, a constant opposing-load equivalent, small static/sliding friction, damping and inertia. Integration uses steps no larger than 0.005 s. Position is constrained by mechanical stops.

Normal and excessive gain/damping settings are selected to teach load correction and hunting, not to reproduce a DVC6200 tuning set. Supply limitation shows that feedback cannot manufacture additional actuator force. Some real devices expose pressure-control/fallback modes, different relay options and different diagnostic levels; these are explained but not replicated.

## Diagnostics

Each constructed case deliberately isolates a mechanism. Packing/backlash cases use the friction lab with an illustrative command-pressure proxy. Supply and tuning cases use the reduced-order positioner. The oversized case uses a Cv=400 linear valve at low travel. The process-disturbance case changes differential pressure at constant command and travel.

The separate PID lab below simulates a normalized process loop. These diagnostic cases remain independently constructed. No generated trace proves a unique field diagnosis. Full-stroke tests and small-step regulation assess different behaviors.

## Verification

Use `npm test` for numerical and DOM integration coverage, `npm run check` for JavaScript syntax, and `npm run package` for the standalone build. Browser visual/touch verification remains an explicitly reported limitation in this environment.

## Lesson layout, guided steps, demos and recording

Every lesson is rendered from one template (`ValveWorkspace.lab`): live view (view buttons, plot, key numbers, run controls, status), guided activity, controls with folded **More settings**, role notes and **Go deeper**. Each control exists once in the DOM; hidden views keep their update targets. Tall phones pin the live view; short and landscape screens scroll it. Headless Chromium checks are recorded in the handoff; real devices are not yet verified.

Guided steps (text in `content.js`, actions in `app.js` `guideActions`) put the lab into the state each step describes. Numbers quoted in the guides come from the app's own models at the stated settings and are re-checked by `tests/guide.test.cjs`. The PID tuning step refuses to run without a measured step-test estimate; its Show me restarts the process at a clean 50% operating point in Auto before the SP change (SP still does not track PV in Manual).

Scripted demos run only after the user presses Watch the full demo. They reset an example, narrate its stages and stop. The PID demo preserves process settings, selected defect and (in Tune & test) controller tuning. Navigation, backgrounding, Pause, Stop demo and any control change cancel automation. View selection does not cancel it. Static examples animate illustrative input changes; diagnosis reveals a selected constructed case.

Friction and positioner integrate/record every 0.05 simulated seconds, with 8,000-sample histories (~400 seconds), independent of animation refresh rate. A full 160-second slow sweep is retained. Plot redraw is throttled to roughly 150 ms. PID samples every 0.1 simulated seconds and permits 1/4/8/16× acceleration; its 20,000-sample history is bounded at ~2,000 simulated seconds. Positioner parameter changes start the simulation (without jumping simulated time) and it stops by itself after 2 s with negligible velocity and pressure change; a hunting loop keeps running until paused. Friction manual steps remain explicit 0.1-second model samples; in the lag model a manual change also holds the command until travel settles, and Hold & settle runs the same continuing dynamics.

## PID controller and process

`js/pid.js` implements a reduced noninteractive/ideal controller with Honeywell-style A/B/C term placement, not vendor firmware. For reverse action, error = SP−measured PV, P input = beta×SP−PV, D input = gamma×SP−PV. A uses beta=gamma=1; B beta=1,gamma=0; C beta=gamma=0. Direct action reverses these signs. OP = bias + Kc×P + integral + Kc×filtered-D. Kc is %OP/%PV. Integral increments Kc×error×dt/Ti. Ti/Td enter in minutes and are multiplied by 60 internally; zero disables the term.

The derivative uses backward Euler: Dnew = [(Td/16)×Dold + Td×(Dinput−previous-Dinput)]/(Td/16+dt). Conditional integration blocks outward integral increments at the 0/100% OP limits. Manual tracking resets derivative history and integral, setting bias so the initial Auto output equals the current Manual output even at nonzero error. Subsequent integration continues responding to that error. Equation/tuning changes similarly track the current output. SP does not track PV in Manual.

The self-regulating process has normalized span, true PV and measured PV. Target true PV = 50 + K×(delayed actual travel−50) + additive load. PV follows an exact exponential first-order update with tau. A time queue delays actual travel by theta. Healthy valve lag is 0.4 s; slow-valve lag 6 s; stiction uses 4 pp static/1.2 pp sliding thresholds; backlash uses a 6 pp play band; limited travel is capped at 55%. Deterministic summed sine noise affects measured PV only. OP, travel and PV are separate. This process does not calculate Cv or liquid flow and does not model integrating, inverse-response, runaway or multivariable processes.

## Recorded step fit and starting-point tuning

Identification consumes recorded measured PV, OP, time and (when available) travel. It uses the preceding 5 seconds for baseline, final 5 seconds for endpoint, signed gain delta-PV/delta-OP, and interpolated 28.3/63.2% crossings. Tau = 1.5×(t63−t28); delay = max(0,t28−tau/3). The small normal valve lag is consequently included in the effective OP-to-PV model.

Rejection gates: step <0.5 pp; fewer than 5 baseline/30 response samples; multiple post-step OP values; response <0.3 pp; baseline split-window drift >max(0.2 pp,2% of response); end travel error >max(2 pp,40% of OP step); invalid crossing order; final/prior-five-second mean difference >1.2% of response; or less than delay+4×tau of response. These are declared teaching heuristics, not a statistical identification package. Process/defect/load changes invalidate an existing test/estimate. Stiction, backlash and noise can still distort an accepted fit, so a defect caveat remains visible.

SIMC PI recommendation: lambdaEff=max(user lambda, fitted delay,0.1 s); Kc=tau/[abs(K)×(lambdaEff+delay)], Ti=min[tau,4×(lambdaEff+delay)]/60 minutes, Td=0. Positive fitted gain selects Reverse; negative selects Direct. The user deliberately transfers the estimate. Tuning presets are illustrative: PI Kc2/Ti20s/Td0; aggressive Kc8/Ti4.8s/Td0; derivative comparison Kc2/Ti20s/Td3s. They are starting experiments, not field recommendations.
