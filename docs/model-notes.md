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

No process PID loop is simulated. No generated trace proves a unique field diagnosis. Full-stroke tests and small-step regulation assess different behaviors.

## Verification

Use `npm test` for numerical and DOM integration coverage, `npm run check` for JavaScript syntax, and `npm run package` for the standalone build. Browser visual/touch verification remains an explicitly reported limitation in this environment.
