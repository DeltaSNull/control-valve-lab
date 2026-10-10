(function (root) {
  'use strict';
  const P = root.ValvePID,
    W = root.ValveWorkspace,
    M = root.ValveModels,
    C = root.ValveContent,
    D = root.ValveDiagrams,
    $ = id => document.getElementById(id),
    e = D.esc;
  const titles = {
    pid: [
      '07',
      'Tune the whole loop.',
      'Measure a step response, choose Honeywell-style A/B/C, and separate tuning from valve defects.'
    ],
    anatomy: [
      '01',
      'Inside the valve.',
      'See how air becomes motion, and how motion opens a flow path. Start with a representative Fisher-style globe valve.'
    ],
    friction: [
      '02',
      'Why a valve sticks.',
      'Separate breakaway friction, hysteresis, mechanical lost motion, and slow response. Watch the mechanism and its signature together.'
    ],
    flow: [
      '03',
      'Travel is not flow.',
      'Follow the chain from actual travel to Cv to flow. Then add the piping and see the characteristic change.'
    ],
    trim: [
      '04',
      'The geometry matters.',
      'Compare valve styles and the trim choices that shape capacity, pressure forces, shutoff, and service performance.'
    ],
    positioner: [
      '05',
      'The loop inside the loop.',
      'A positioner controls travel by adjusting air pressure. The process controller works one level above it.'
    ],
    diagnosis: [
      '06',
      'Read the symptoms.',
      'Use several measurements to build a diagnosis. These six simulated cases isolate mechanisms that often look alike in a process trend.'
    ]
  };
  const defaultF = () => ({
    mode: 'stiction',
    command: 50,
    motion: { position: 50 },
    staticFriction: 5,
    slidingFriction: 1.5,
    backlash: 6,
    hysteresis: 4,
    tau: 2,
    speed: 5,
    view: 'command',
    running: false,
    sweep: false,
    direction: 1,
    time: 0,
    history: []
  });
  const defaultP = () => ({
    type: 'dvc',
    command: 50,
    motion: { position: 50, pressure: 9, integral: 0, velocity: 0 },
    supply: 22,
    load: 0,
    aggressive: false,
    restricted: false,
    running: false,
    time: 0,
    history: []
  });
  const state = {
    module: 'anatomy',
    demo: null,
    pid: defaultL(),
    anatomy: { command: 40, component: 'packing', airLost: false },
    friction: defaultF(),
    flow: {
      travel: 50,
      characteristic: 'equal',
      cvMax: 80,
      rangeability: 50,
      dp: 25,
      sg: 1,
      resistance: 0.003,
      mode: 'installed'
    },
    trim: { style: 'globe', travel: 50, trim: 'characterized', profile: 'cavitation' },
    positioner: defaultP(),
    diagnosis: { case: 'packing', answered: null, revealed: false }
  };
  let frameId = null,
    lastFrame = 0,
    lastDraw = 0,
    clock = 0;
  function defaultL() {
    return {
      stage: 'step',
      mode: 'manual',
      op: 50,
      sp: 50,
      plant: P.initial(),
      controller: { op: 50, bias: 50, integral: 0, prevD: 0, derivative: 0 },
      cfg: { equation: 'B', action: 'reverse', kc: 2, ti: 20 / 60, td: 0 },
      gain: 1,
      tau: 20,
      delay: 4,
      defect: 'none',
      load: 0,
      speed: 8,
      lambda: 10,
      running: false,
      history: [],
      test: null,
      estimate: null,
      clock: 0
    };
  }
  function number(id, label, val, min, max, step, unit = '') {
    return `<div class="control"><label for="${id}">${label} <span>${unit}</span></label><input type="number" id="${id}" value="${Number(val.toFixed(4))}" min="${min}" max="${max}" step="${step}" inputmode="decimal"></div>`;
  }
  function pidPage() {
    const l = state.pid;
    return (
      header('pid') +
      `<div class="grid-main"><section class="card"><h2>The process loop</h2><div id="pid-trend"></div>${legend([
        ['SP', 'command', 'dashed'],
        ['Measured PV', 'travel']
      ])}<div id="pid-valve-chart"></div>${legend([
        ['Controller OP', 'command'],
        ['Actual travel', 'pressure']
      ])}<div class="kpi-grid">${kpi('pid-pv', 'Measured PV', 'travel', '%')}${kpi('pid-sp-value', 'Setpoint', 'command', '%')}${kpi('pid-op-value', 'Controller OP', 'command', '%')}${kpi('pid-travel-value', 'Valve travel', 'pressure', '%')}</div><div id="pid-stage-controls" class="btn-row"><button data-action="pid-stage-step" aria-pressed="${l.stage === 'step'}">1 · Step test</button><button data-action="pid-stage-tune" aria-pressed="${l.stage === 'tune'}">2 · Apply tuning</button></div>${select(
        'pid-defect',
        'Include a defect',
        l.defect,
        [
          ['none', 'Healthy valve'],
          ['stiction', 'Stiction · 4 pp breakaway'],
          ['backlash', 'Backlash · 6 pp reversal band'],
          ['slow', 'Slow valve · 6 s lag'],
          ['limited', 'Travel limited to 55%'],
          ['noise', 'Measurement noise']
        ]
      )}<div class="btn-row"><button data-action="pid-manual">Manual</button><button data-action="pid-auto">Auto</button><button class="primary" data-action="pid-run">Run / resume</button><button data-action="pause">Pause</button>${resetButton()}</div><div id="pid-status" class="status"></div>${range('pid-op', 'Manual output OP', l.op, 0, 100, 1, '%')}${range('pid-sp', 'Setpoint SP', l.sp, 0, 100, 1, '%')}<div class="btn-row"><button data-action="pid-op-down">OP −1 pp</button><button data-action="pid-op-up">OP +1 pp</button><button data-action="pid-sp-down">SP −5 pp</button><button data-action="pid-sp-up">SP +5 pp</button><button data-action="pid-load">Add load +5 pp</button><button data-action="pid-load-clear">Clear load</button></div><div class="btn-row"><button data-action="pid-record">New step recording</button><button data-action="pid-step">OP step +10 pp</button><button data-action="pid-estimate">Estimate from record</button><button data-action="pid-apply">Use estimate → tuning</button></div><div id="pid-results"></div></section><section class="card"><h2>Model and controller setup</h2>${select(
        'pid-equation',
        'Honeywell-style equation',
        l.cfg.equation,
        [
          ['A', 'A · P/I/D on error'],
          ['B', 'B · P/I on error; D on PV'],
          ['C', 'C · I on error; P/D on PV']
        ]
      )}<div class="btn-row"><button data-action="pid-preset-pi">PI starting point</button><button data-action="pid-preset-aggressive">Aggressive tuning</button><button data-action="pid-preset-derivative">Compare A/B/C with D</button></div><p id="pid-equation-note" class="plot-caption">A and B behave identically when Td = 0. Enable derivative to see A's SP kick; C has no proportional SP kick.</p>${select(
        'pid-action',
        'Controller action',
        l.cfg.action,
        [
          ['reverse', 'Reverse · rising PV lowers OP'],
          ['direct', 'Direct · rising PV raises OP']
        ]
      )}${number('pid-kc', 'Controller gain Kc', l.cfg.kc, 0.01, 20, 0.05, '%OP / %PV')}${number('pid-ti', 'Integral time Ti', l.cfg.ti, 0, 10, 0.01, 'min · 0 disables I')}${number('pid-td', 'Derivative time Td', l.cfg.td, 0, 2, 0.01, 'min · 0 disables D')}${number('pid-lambda', 'Desired response λ', l.lambda, 0.1, 120, 1, 's')}${number('pid-gain', 'Process gain', l.gain, -3, 3, 0.1, '%PV / %travel')}${number('pid-tau', 'Process time constant', l.tau, 2, 120, 1, 's')}${number('pid-delay', 'Transport delay', l.delay, 0, 30, 1, 's')}${select(
        'pid-speed',
        'Simulation speed',
        String(l.speed),
        [
          ['1', '1× real time'],
          ['4', '4×'],
          ['8', '8×'],
          ['16', '16×']
        ]
      )}<div class="hint">Setup values take effect immediately. Restart a step recording after changing the process or defect. In Auto, OP belongs to the controller; in Manual, you move OP yourself.</div></section></div>` +
      detail(
        'How to use the two stages',
        `<p><strong>Step test:</strong> Run demo gives a steady baseline, steps OP from 50 to 60%, waits for settling, and estimates the response. Custom: start a new recording, wait for a steady baseline, step OP once, then estimate when settled. SP has no influence in Manual.</p><p><strong>Apply tuning:</strong> Use estimate copies a SIMC PI starting point to the controller. Choose A/B/C, change Kc/Ti/Td, switch Auto, then move SP or add a load. Run demo in this stage resets the process, preserves your tuning and defect, and tests SP then load.</p><p>Choose the defect independently in either stage. A defect can corrupt an OP-to-PV fit. Compare against a healthy valve and distinguish controller OP from actual travel. Tuning does not repair stiction.</p>`
      ) +
      detail(
        'Controller mathematics and limits',
        `<p><strong>Noninteractive (ideal) teaching form:</strong> OP = bias + Kc[βSP − PV + integral(SP − PV)/Ti + filtered derivative(γSP − PV)]. Reverse action is shown; Direct reverses the action sign. A: β=1, γ=1. B: β=1, γ=0. C: β=0, γ=0. Derivative filter time is Td/16. Ti and Td are entered in minutes and converted to seconds.</p><p>Output is limited to 0–100% with conditional integral anti-windup. Manual→Auto tracks bias for a bumpless initial transfer. SP does not track PV in Manual. Changes to equation/tuning track the current OP; subsequent SP changes reveal the A/B/C behavior. This is a reduced teaching model, not Honeywell firmware, an interactive/series controller, or a full cascade implementation.</p><p>PV is % of a normalized span. The process is self-regulating: target PV = 50 + process gain × (delayed actual travel − 50) + load; lag time constant τ. True PV can exceed the nominal span. Noise affects measured PV only. The valve and transport delay are separate.</p><p><a href="https://skoge.folk.ntnu.no/puublications_others/apc-papers/honeywell3000-AP09-600.pdf" target="_blank" rel="noopener">Honeywell AP09-600 §8.14.1 ↗</a></p>`
      ) +
      detail(
        'What the step estimate means',
        `<p>The app reads the measured baseline, final PV and 28.3%/63.2% crossing times. K = ΔPV/ΔOP, τ ≈ 1.5(t63 − t28), θ ≈ t28 − τ/3. Settling and single-step checks gate the estimate. Valve dynamics are included in the fitted OP-to-PV response; this is an effective local model, not the hidden process settings.</p><p>SIMC PI starting point: Kc = τ/[|K|(λ+θ)], Ti = min[τ, 4(λ+θ)], Td = 0. λ is held at least as large as the estimated delay. Negative gain selects Direct action. Noise, travel clipping and stiction can produce a misleading fit; the app reports caveats rather than claiming a unique plant model.</p><p><a href="https://skoge.folk.ntnu.no/publications/2003/tuningPID/mic-version/mic.pdf" target="_blank" rel="noopener">Skogestad SIMC tuning paper ↗</a></p><p>These are simulated experiments. Field step tests and tuning changes follow the site's operating procedures and process constraints.</p>`
      )
    );
  }
  function sampleL(dt) {
    const l = state.pid;
    if (l.mode === 'auto') {
      l.controller = P.controllerStep(l.controller, l.sp, l.plant.measured, l.cfg, dt);
      l.op = l.controller.op;
    } else {
      l.controller = P.trackController({ ...l.controller, op: l.op }, l.sp, l.plant.measured, l.cfg);
    }
    l.plant = P.plantStep(
      l.plant,
      l.op,
      { gain: l.gain, tau: l.tau, delay: l.delay, defect: l.defect, load: l.load },
      dt
    );
    l.history.push({ t: l.plant.t, pv: l.plant.measured, sp: l.sp, op: l.op, travel: l.plant.travel });
    if (l.history.length > 20000) l.history.shift();
  }
  function updatePID() {
    const l = state.pid,
      rows = l.history.length
        ? l.history
        : [{ t: 0, pv: l.plant.measured, sp: l.sp, op: l.op, travel: l.plant.travel }],
      end = Math.max(20, rows.at(-1).t),
      begin = rows[0].t;
    const values = rows.flatMap(r => [r.sp, r.pv]),
      low = Math.min(0, ...values),
      high = Math.max(100, ...values);
    $('pid-trend').innerHTML = plot(
      'pid-trend',
      [
        { name: 'SP', color: D.colors.command, dash: '6 4', points: rows.map(r => ({ x: r.t, y: r.sp })) },
        { name: 'Measured PV', color: D.colors.travel, points: rows.map(r => ({ x: r.t, y: r.pv })) }
      ],
      {
        xDomain: [begin, end],
        yDomain: [Math.floor(low / 10) * 10, Math.ceil(high / 10) * 10],
        xLabel: 'Simulated time (s)',
        yLabel: 'SP / measured PV (% span)',
        title: 'Process setpoint and measured variable'
      }
    );
    $('pid-valve-chart').innerHTML = plot(
      'pid-valve-chart',
      [
        { name: 'OP', color: D.colors.command, points: rows.map(r => ({ x: r.t, y: r.op })) },
        { name: 'Actual travel', color: D.colors.pressure, points: rows.map(r => ({ x: r.t, y: r.travel })) }
      ],
      {
        xDomain: [begin, end],
        xLabel: 'Simulated time (s)',
        yLabel: 'OP / travel (%)',
        title: 'Controller output versus actual valve travel'
      }
    );
    value('pid-pv', l.plant.measured, 1, '%');
    value('pid-sp-value', l.sp, 1, '%');
    value('pid-op-value', l.op, 1, '%');
    value('pid-travel-value', l.plant.travel, 1, '%');
    $('pid-status').textContent =
      `${l.mode.toUpperCase()} · ${l.running ? 'running' : 'paused'} · ${l.plant.t.toFixed(1)} s · ${l.speed}× · load ${l.load} pp · ${l.defect === 'none' ? 'healthy valve' : l.defect}`;
    for (const id of ['op', 'sp']) {
      const el = $('pid-' + id);
      el.value = l[id];
      output('pid-' + id, l[id].toFixed(1) + ' %');
    }
    $('pid-op').disabled = l.mode !== 'manual';
    document.querySelector('[data-action="pid-auto"]').disabled = l.stage === 'step';
    for (const name of ['op-down', 'op-up', 'step'])
      document.querySelector(`[data-action="pid-${name}"]`).disabled = l.mode !== 'manual';
    document.querySelector('[data-action="pid-manual"]').setAttribute('aria-pressed', String(l.mode === 'manual'));
    document.querySelector('[data-action="pid-auto"]').setAttribute('aria-pressed', String(l.mode === 'auto'));
    document.querySelector('[data-action="pid-apply"]').disabled = !l.estimate?.ok;
    const est = l.estimate;
    $('pid-results').innerHTML = est
      ? est.ok
        ? `<div class="hint"><strong>Measured effective model</strong><br>K ${est.gain.toFixed(3)} %PV/%OP · τ ${est.tau.toFixed(1)} s · θ ${est.delay.toFixed(1)} s<br>SIMC PI: Kc ${P.suggestPI(est, l.lambda).kc.toFixed(2)} · Ti ${P.suggestPI(est, l.lambda).ti.toFixed(3)} min · Td 0 min</div>${l.defect !== 'none' ? '<div class="hint warning-note">Defect included: this fit can absorb valve dynamics, lost motion, clipping or measurement noise. Compare a healthy test before treating it as process tuning.</div>' : ''}`
        : `<div class="hint warning-note">${e(est.reason)}</div>`
      : `<p class="plot-caption">${l.test ? 'Recording one OP step. Wait for a steady response, then estimate.' : 'Run a default demo or start a custom step recording. Estimates appear here.'}</p>`;
  }
  function pidAction(name) {
    const l = state.pid;
    if (name.startsWith('pid-preset-')) {
      const preset = name.slice(11);
      l.cfg = {
        ...l.cfg,
        kc: preset === 'aggressive' ? 8 : 2,
        ti: preset === 'aggressive' ? 0.08 : 20 / 60,
        td: preset === 'derivative' ? 0.05 : 0
      };
      l.controller = P.trackController({ ...l.controller, op: l.op }, l.sp, l.plant.measured, l.cfg);
      pause();
      render('pid');
      return;
    }
    if (name === 'pid-stage-step' || name === 'pid-stage-tune') {
      pause();
      state.demo = null;
      l.stage = name.endsWith('step') ? 'step' : 'tune';
      if (l.stage === 'step') l.mode = 'manual';
      render('pid');
      return;
    }
    if (name === 'pid-manual') {
      if (l.mode === 'auto') l.op = l.controller.op;
      l.mode = 'manual';
    }
    if (name === 'pid-auto' && l.stage === 'tune') {
      l.controller = P.trackController({ ...l.controller, op: l.op }, l.sp, l.plant.measured, l.cfg);
      l.mode = 'auto';
      l.running = true;
      start();
    }
    if (name === 'pid-run') {
      l.running = true;
      start();
    }
    if (name === 'pid-record') {
      pause();
      l.plant = P.initial();
      l.op = 50;
      l.sp = 50;
      l.load = 0;
      l.mode = 'manual';
      l.history = [];
      l.test = null;
      l.estimate = null;
      l.running = true;
      sampleL(0.1);
      start();
    }
    if (name === 'pid-step' && l.mode === 'manual') {
      l.estimate = null;
      l.test = { time: l.plant.t + 0.1, before: l.op, after: M.clamp(l.op + 10) };
      l.op = l.test.after;
      l.running = true;
      start();
    }
    if (name === 'pid-estimate') {
      l.estimate = l.test
        ? P.identifyStep(l.history, l.test.time, l.test.before, l.test.after)
        : { ok: false, reason: 'Start a recording and make one OP step first.' };
    }
    if (name === 'pid-apply' && l.estimate?.ok) {
      const tune = P.suggestPI(l.estimate, l.lambda);
      l.cfg = { ...l.cfg, ...tune };
      l.stage = 'tune';
      pause();
      render('pid');
      return;
    }
    const changes = {
      'pid-op-down': ['op', -1],
      'pid-op-up': ['op', 1],
      'pid-sp-down': ['sp', -5],
      'pid-sp-up': ['sp', 5]
    };
    if (changes[name]) {
      const [key, delta] = changes[name];
      if (key !== 'op' || l.mode === 'manual') {
        l[key] = M.clamp(l[key] + delta);
        l.running = true;
        start();
      }
    }
    if (name === 'pid-load' || name === 'pid-load-clear') {
      l.load = name === 'pid-load' ? l.load + 5 : 0;
      l.test = null;
      l.estimate = null;
      l.running = true;
      start();
    }
    updatePID();
  }
  function pidInput(el) {
    const l = state.pid,
      id = el.id.slice(4);
    if (['defect', 'equation', 'action'].includes(id)) {
      if (id === 'defect') {
        l.defect = el.value;
        l.estimate = null;
        l.test = null;
      } else l.cfg[id] = el.value;
    } else {
      const n = Number(el.value);
      if (!Number.isFinite(n) || el.value === '' || n < Number(el.min || -Infinity) || n > Number(el.max || Infinity)) {
        el.setAttribute('aria-invalid', 'true');
        return;
      }
      el.removeAttribute('aria-invalid');
      if (['kc', 'ti', 'td'].includes(id)) l.cfg[id] = n;
      else if (id !== 'op' || l.mode === 'manual') l[id] = n;
      if (['gain', 'tau', 'delay'].includes(id)) {
        l.estimate = null;
        l.test = null;
      }
    }
    if (['equation', 'action', 'kc', 'ti', 'td'].includes(id))
      l.controller = P.trackController({ ...l.controller, op: l.op }, l.sp, l.plant.measured, l.cfg);
    updatePID();
  }
  function beginDemo() {
    const mod = state.module;
    pause();
    state.demo = { module: mod, time: 0, phase: -1 };
    if (mod === 'friction') {
      const mode = state.friction.mode;
      state.friction = defaultF();
      state.friction.mode = mode;
      state.friction.command = 10;
      state.friction.motion = { position: 10 };
      state.friction.running = true;
      state.friction.sweep = true;
    }
    if (mod === 'positioner') {
      const selected = state.positioner;
      state.positioner = {
        ...defaultP(),
        type: selected.type,
        restricted: selected.restricted,
        aggressive: selected.aggressive,
        load: 2,
        running: true
      };
    }
    if (mod === 'anatomy') state.anatomy.airLost = false;
    if (mod === 'pid') {
      const prev = state.pid;
      state.pid = {
        ...defaultL(),
        stage: prev.stage,
        cfg: { ...prev.cfg },
        gain: prev.gain,
        tau: prev.tau,
        delay: prev.delay,
        defect: prev.defect,
        lambda: prev.lambda,
        speed: prev.speed,
        estimate: prev.estimate,
        running: true,
        mode: prev.stage === 'tune' ? 'auto' : 'manual'
      };
      state.pid.controller = P.trackController(state.pid.controller, 50, 50, state.pid.cfg);
    }
    const demo = state.demo;
    render(mod);
    state.demo = demo;
    if (mod === 'friction') {
      state.friction.running = true;
      state.friction.sweep = true;
    }
    if (mod === 'positioner') state.positioner.running = true;
    if (mod === 'pid') state.pid.running = true;
    W.setPanel('operate');
    W.mode(true, 'Demo running · changes are automatic. Custom stops the demonstration.');
    start();
  }
  function demoStep(dt) {
    const demo = state.demo;
    if (!demo) return;
    demo.time += dt;
    const mod = demo.module,
      t = mod === 'pid' ? state.pid.plant.t : demo.time;
    let message = '',
      done = false;
    if (mod === 'anatomy') {
      state.anatomy.command = 20 + 60 * Math.min(t / 4, 1);
      state.anatomy.airLost = t >= 5 && t < 8;
      updateAnatomy();
      message =
        t < 5
          ? 'Increasing air lifts stem and plug.'
          : t < 8
            ? 'Air removed: spring closes the valve.'
            : 'Air restored: requested travel returns.';
      done = t >= 10;
    }
    if (mod === 'flow') {
      const x = t < 8 ? 10 + t * 10 : 90 - (t - 8) * 10;
      state.flow.travel = M.clamp(x);
      $('flow-travel').value = state.flow.travel;
      output('flow-travel', state.flow.travel.toFixed(1) + ' %');
      updateFlow();
      message = 'Sweeping travel: compare installed flow with constant-ΔP flow. Switch Observe to see inherent Cv.';
      done = t >= 16;
    }
    if (mod === 'trim') {
      const names = ['normal', 'cavitation', 'flashing', 'staged'],
        phase = Math.min(3, Math.floor(t / 4));
      state.trim.profile = names[phase];
      state.trim.travel = 50 + 35 * Math.sin(t);
      updateTrim();
      $('trim-travel').value = state.trim.travel;
      output('trim-travel', state.trim.travel.toFixed(1) + ' %');
      message = [
        'Pressure stays above vapor pressure.',
        'Local pressure falls below vapor pressure, then recovers: cavitation.',
        'Downstream pressure remains below vapor pressure: flashing.',
        'Staging keeps local minima above vapor pressure in this illustration.'
      ][phase];
      done = t >= 16;
    }
    if (mod === 'friction') {
      message =
        t < 16
          ? 'Opening sweep: compare drive command with actual travel.'
          : 'Reversing sweep: watch lost motion and the signature loop.';
      done = t >= 32.1;
    }
    if (mod === 'positioner') {
      const p = state.positioner;
      p.command = t < 3 ? 50 : t < 8 ? 70 : 30;
      $('position-command').value = p.command;
      output('position-command', p.command + ' %');
      message =
        t < 3
          ? 'Apply 2 psi opposing load: feedback must raise pressure to hold travel.'
          : t < 8
            ? 'Step travel request to 70% and watch the air response.'
            : 'Reverse to 30%: inspect settling, restriction or hunting.';
      done = t >= 14;
    }
    if (mod === 'diagnosis') {
      if (t >= 5) {
        state.diagnosis.revealed = true;
        updateDiagnosis();
      }
      message =
        t < 5
          ? 'Compare command, actual travel, pressure and flow. Change Observe for each trace.'
          : 'Explanation revealed in Operate. A pattern supports a hypothesis, not a unique diagnosis.';
      done = t >= 8;
    }
    if (mod === 'pid') {
      const l = state.pid;
      if (l.stage === 'step') {
        if (t >= 10 && !l.test) {
          l.test = { time: l.plant.t + 0.1, before: 50, after: 60 };
          l.op = 60;
        }
        message =
          t < 10
            ? 'Manual baseline: OP and travel are steady at 50%.'
            : 'OP stepped to 60%: wait for measured PV to settle, then estimate.';
        done = t >= 10 + l.delay + 7 * l.tau;
        if (done) {
          l.estimate = P.identifyStep(l.history, l.test.time, l.test.before, l.test.after);
          message = l.estimate.ok
            ? 'Step test complete. Inspect the measured fit; Use estimate transfers PI tuning.'
            : l.estimate.reason;
        }
      } else {
        l.sp = t < 10 ? 50 : 60;
        l.load = t >= 80 ? 5 : 0;
        message =
          t < 10
            ? 'Auto at the initial operating point.'
            : t < 80
              ? 'SP stepped to 60%: compare A/B/C term placement and your tuning.'
              : 'Load +5 pp: observe disturbance rejection with the selected defect.';
        done = t >= 160;
      }
    }
    W.mode(true, message);
    if (done) {
      pause();
      state.demo = null;
      W.mode(false, 'Demo complete · ' + message);
      refresh();
    }
  }
  function refresh() {
    if (state.module === 'anatomy') updateAnatomy();
    if (state.module === 'friction') updateFriction();
    if (state.module === 'flow') updateFlow();
    if (state.module === 'trim') updateTrim();
    if (state.module === 'positioner') updatePositioner();
    if (state.module === 'diagnosis') updateDiagnosis();
    if (state.module === 'pid') updatePID();
    W.syncSelections();
  }

  function header(id) {
    const [num, title, sub] = titles[id];
    return `<div class="page-head"><div><p class="eyebrow">MODULE ${num} / THE CONTROL VALVE LAB</p><h1>${title}</h1><p>${sub}</p></div><span class="page-number" aria-hidden="true">${num}</span></div><div class="btn-row" style="justify-content:flex-end;margin:-6px 0 18px"><button class="pill" data-action="glossary" style="flex:0 0 auto">Glossary</button><button class="pill" data-action="references" style="flex:0 0 auto">Sources & assumptions</button></div>`;
  }
  function range(id, label, value, min, max, step = 1, unit = '', ends = true) {
    return `<div class="control"><label for="${id}">${label}<output for="${id}" id="${id}-out">${e(value)} ${unit}</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">${ends ? `<div class="range-ends"><span>${min} ${unit}</span><span>${max} ${unit}</span></div>` : ''}</div>`;
  }
  function select(id, label, value, opts) {
    return `<div class="control"><label for="${id}">${label}</label><select id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`;
  }
  function kpi(id, label, color, unit = '') {
    return `<div class="kpi"><small>${label}</small><strong id="${id}" class="${color}">—<em>${unit}</em></strong></div>`;
  }
  function legend(items) {
    return `<div class="legend">${items.map(([name, color, dash]) => `<span class="${dash ?? ''}" style="--color:${D.colors[color] ?? color}">${name}</span>`).join('')}</div>`;
  }
  function detail(title, body) {
    return `<details class="detail"><summary>${title}</summary>${body}</details>`;
  }
  function resetButton() {
    return '<button data-action="reset">Reset lab ↺</button>';
  }
  function lessons(rows) {
    return `<div class="lesson-strip">${rows.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>`;
  }
  function sourceLink(index) {
    const s = C.sources[index];
    return `<a class="source-link" href="${s.url}" target="_blank" rel="noopener">Reference: ${s.title} ↗</a>`;
  }
  function anatomyPage() {
    const a = state.anatomy;
    return (
      header('anatomy') +
      `<div class="grid-main"><section class="card"><div class="card-top"><h2>A moving cutaway</h2><span class="badge">AIR-TO-OPEN EXAMPLE</span></div><div class="diagram-stage" id="valve-diagram"></div><p class="diagram-note">Tap a part to inspect it. Flow path: left inlet → seat → right outlet. Original schematic; dimensions and forces are illustrative.</p><div class="kpi-grid">${kpi('anatomy-travel', 'Actual travel', 'travel', '%')}${kpi('anatomy-pressure', 'Chamber pressure', 'pressure', 'psi')}${kpi('anatomy-force', 'Air force', 'pressure', 'lbf')}${kpi('anatomy-lift', 'Plug lift', 'travel', 'in')}</div>${range('anatomy-command', 'Travel command', a.command, 0, 100, 1, '%')}<div class="btn-row"><button class="primary" data-action="air-fail">Remove air</button>${resetButton()}</div><div class="hint" id="anatomy-status">Air lifts the diaphragm, stem, and plug. The spring opposes motion.</div></section><div class="stack"><section class="card"><div class="card-top"><h2>Inspect the parts</h2><span class="badge">12 COMPONENTS</span></div><div class="component-grid">${Object.entries(
        C.components
      )
        .map(
          ([id, p]) =>
            `<button data-component="${id}" class="${id === a.component ? 'selected' : ''}">${p.name.split(' / ')[0]}</button>`
        )
        .join(
          ''
        )}</div><div id="component-detail" class="component-detail"></div></section><section class="card"><h2>What actually moves the stem?</h2><div class="formula">Air force − spring force<br>− opposing process force<br>− friction = net moving force<small>Direction signs depend on actuator and valve construction.</small></div><p>Pressure acts on an effective diaphragm area. In this example, a 20 in² area and a 3–15 psi unloaded spring range give 60–300 lbf across the stroke. Real assemblies have their own area, spring, loading, and friction.</p><p><strong>At rest, forces balance.</strong> Increasing command does not guarantee movement: force may first have to overcome static friction.</p>${sourceLink(0)}</section></div></div>` +
      lessons([
        [
          'Signal ≠ position',
          'The command is a request. Actual stem travel is the mechanical result. A positioner helps make the two agree.'
        ],
        [
          'Position ≠ flow',
          'The plug exposes an opening. Actual flow also depends on process pressure drop and fluid properties.'
        ],
        [
          'Color ≠ construction',
          'Fisher is the likely brand you mean. The nameplate and trim records identify the actual design; the green paint does not.'
        ]
      ]) +
      detail(
        'Fail action: loss of air and loss of signal are different',
        `<p>This example is spring-to-close: removing actuator air lets the spring seat the plug. Other assemblies are spring-to-open, double-acting, or use accessories that affect failure behavior.</p><p>Loss of electrical signal can cause the positioner to exhaust, fill, hold, or follow another configured response. A lock-up valve, solenoid, accumulator, or failed supply can change the result. Confirm the complete assembly and the specified failure.</p><p>The model uses an unloaded equilibrium and ideal shutoff. Actual flow forces, trapped air, friction, and seat leakage are not modeled here.</p>`
      )
    );
  }
  function updateAnatomy() {
    const a = state.anatomy,
      x = a.airLost ? 0 : a.command;
    $('valve-diagram').innerHTML = D.valve(x, a.component);
    value('anatomy-travel', x, 1, '%');
    value('anatomy-pressure', a.airLost ? 0 : 3 + 0.12 * x, 1, 'psi');
    value('anatomy-force', a.airLost ? 0 : (3 + 0.12 * x) * 20, 0, 'lbf');
    value('anatomy-lift', (x * 0.75) / 100, 2, 'in');
    const c = C.components[a.component];
    $('component-detail').innerHTML =
      `<p class="tag-line">SELECTED COMPONENT</p><h3>${c.name}</h3><p>${c.role}</p><div class="facts"><div class="fact"><b>What can go wrong</b><p>${c.cause}</p></div><div class="fact"><b>What would you look for?</b><p>${c.evidence}</p></div></div><div class="hint">${c.takeaway}</div>`;
    document
      .querySelectorAll('button[data-component]')
      .forEach(b => b.classList.toggle('selected', b.dataset.component === a.component));
    $('anatomy-status').textContent = a.airLost
      ? 'Air removed: this idealized spring-to-close assembly returns to 0% travel. Real failure behavior depends on the full assembly.'
      : 'Air lifts the diaphragm, stem, and plug. The spring opposes motion.';
    $('anatomy-command').disabled = a.airLost;
    document.querySelector('[data-action="air-fail"]').textContent = a.airLost ? 'Restore air' : 'Remove air';
  }
  function frictionPage() {
    const f = state.friction;
    return (
      header('friction') +
      `<div class="grid-main"><div class="stack"><section class="card"><div class="card-top"><h2>Command → actual travel</h2><span class="badge">SIMULATED ASSEMBLY</span></div><div class="tabs">${Object.entries(
        C.friction
      )
        .map(
          ([k, v]) =>
            `<button class="pill ${k === f.mode ? 'selected' : ''}" data-friction="${k}">${v.title.split(' / ')[0]}</button>`
        )
        .join('')}</div><div id="friction-time"></div>${legend([
        ['Command', 'command', 'dashed'],
        ['Actual travel', 'travel']
      ])}<p class="plot-caption">Both traces use % of travel span. Manual changes are sampled at 0.1 s; running traces use simulated elapsed time.</p><div class="kpi-grid">${kpi('friction-command-value', 'Command', 'command', '%')}${kpi('friction-travel', 'Actual travel', 'travel', '%')}${kpi('friction-pressure', 'Pressure proxy', 'pressure', 'psi')}${kpi('friction-error', 'Cmd − travel', 'command', 'pp')}</div><div id="friction-status" class="status" aria-live="polite"></div>${range('friction-command', 'Drive command', f.command, 0, 100, 1, '%')}<div class="btn-row"><button data-action="step-down">−1% step</button><button data-action="step-up">+1% step</button><button class="primary" data-action="sweep">Run sweep</button><button data-action="settle">Hold & settle</button><button data-action="pause">Pause</button>${resetButton()}</div></section><section class="card"><div class="card-top"><h2>A signature of the response</h2><select id="friction-view" aria-label="Signature view"><option value="command" ${f.view === 'command' ? 'selected' : ''}>Travel vs command</option><option value="pressure" ${f.view === 'pressure' ? 'selected' : ''}>Pressure vs travel</option></select></div><div id="friction-signature"></div><p class="plot-caption" id="signature-note"></p></section></div><div class="stack"><section class="card"><h2 id="friction-title"></h2><p id="friction-explain"></p><div class="hint" id="friction-observe"></div><div id="friction-controls"></div>${range('friction-speed', 'Sweep speed', f.speed, 1, 15, 1, 'pp/s')}<p class="plot-caption">Sweep reverses at 10% and 90%. A percentage point (pp) is an absolute increment of travel span.</p><details class="detail"><summary>What is this model assuming?</summary><p id="friction-model"></p><p>For force-based views, a traditional 3–15 psi drive proxy maps to an unloaded spring span. No process-fluid forces are included. A real positioner changes output pressure using feedback; explore that in Module 05.</p></details></section><section class="card"><h2>Separate the terms</h2><div class="facts"><div class="fact"><b>Stiction: a mechanism</b><p>Static resistance and lower sliding resistance can produce stick–slip.</p></div><div class="fact"><b>Hysteresis: a response</b><p>Different output at the same input, depending on the path taken.</p></div><div class="fact"><b>Deadband: a measured interval</b><p>An input change after reversal that produces no observable output change. State which input and output.</p></div><div class="fact"><b>Lag: a time effect</b><p>A delayed response can create a loop during a fast sweep, even without static lost motion.</p></div></div>${sourceLink(8)}</section></div></div>` +
      lessons([
        [
          'Packing is one candidate',
          'Also consider stem damage, deposits, plug/cage contact, alignment, bearings, actuator seals, and thermal interference.'
        ],
        [
          'Watch the pressure',
          'Pressure changing while travel stays flat can show force building. Interpret it with supply, spring/load, and sensor location.'
        ],
        [
          'A DVC is not a mechanical repair',
          'Feedback may overcome some resistance, but cannot restore damaged surfaces or eliminate an unsuitable assembly.'
        ]
      ])
    );
  }
  function frictionControls() {
    const f = state.friction;
    let html = '';
    if (f.mode === 'stiction')
      html =
        range('friction-static', 'Breakaway threshold', f.staticFriction, 1, 12, 0.5, 'force-span pp') +
        range('friction-sliding', 'Sliding resistance', f.slidingFriction, 0, f.staticFriction, 0.5, 'force-span pp');
    if (f.mode === 'backlash') html = range('friction-backlash', 'Total reversal band', f.backlash, 0, 15, 0.5, 'pp');
    if (f.mode === 'hysteresis')
      html = range('friction-hysteresis', 'Branch separation', f.hysteresis, 0, 12, 0.5, 'pp');
    if (f.mode === 'lag') html = range('friction-tau', 'Time constant', f.tau, 0.2, 6, 0.2, 's');
    $('friction-controls').innerHTML = html;
    const c = C.friction[f.mode];
    $('friction-title').textContent = c.title;
    $('friction-explain').textContent = c.explain;
    $('friction-observe').textContent = c.observe;
    $('friction-model').textContent = c.model;
  }
  function sampleF(dt) {
    const f = state.friction;
    f.motion = M.motionStep(
      f.motion,
      f.command,
      {
        mode: f.mode,
        staticFriction: f.staticFriction,
        slidingFriction: f.slidingFriction,
        backlash: f.backlash,
        hysteresis: f.hysteresis,
        tau: f.tau
      },
      dt
    );
    f.time += dt;
    f.history.push({ t: f.time, command: f.command, travel: f.motion.position, pressure: f.motion.pressure });
    if (f.history.length > 8000) f.history.shift();
  }
  function updateFriction() {
    const f = state.friction;
    if (!f.history.length) sampleF(0);
    const rows = f.history,
      first = rows[0].t,
      last = Math.max(first + 10, rows.at(-1).t);
    $('friction-time').innerHTML = plot(
      'friction-time',
      [
        { name: 'Command', points: rows.map(r => ({ x: r.t, y: r.command })), color: D.colors.command, dash: '6 4' },
        { name: 'Actual travel', points: rows.map(r => ({ x: r.t, y: r.travel })), color: D.colors.travel }
      ],
      {
        xDomain: [first, last],
        yDomain: [0, 100],
        xLabel: 'Simulated time (s)',
        yLabel: 'Command / travel (%)',
        title: 'Command and actual travel versus time'
      }
    );
    let points, xLabel, yLabel, xDomain, yDomain;
    if (f.view === 'pressure') {
      points = rows.map(r => ({ x: r.travel, y: r.pressure }));
      xLabel = 'Actual travel (%)';
      yLabel = 'Command-pressure proxy (psi)';
      xDomain = [0, 100];
      yDomain = [3, 15];
      $('signature-note').textContent =
        'Conceptual pressure–travel signature. Vertical segments show drive pressure changing with little or no travel; real signatures must account for process load and actuator action.';
    } else {
      points = rows.map(r => ({ x: r.command, y: r.travel }));
      xLabel = 'Drive command (%)';
      yLabel = 'Actual travel (%)';
      xDomain = [0, 100];
      yDomain = [0, 100];
      $('signature-note').textContent =
        'Compare against the dashed ideal line. A loop shows path dependence; repeat at slower speed to separate dynamic lag from rate-independent lost motion.';
    }
    $('friction-signature').innerHTML = plot(
      'friction-signature',
      [
        ...(f.view === 'command'
          ? [
              {
                name: 'Ideal',
                points: [
                  { x: 0, y: 0 },
                  { x: 100, y: 100 }
                ],
                color: D.colors.muted,
                dash: '5 5'
              }
            ]
          : []),
        { name: 'Measured path', points, color: D.colors.travel }
      ],
      {
        xDomain,
        yDomain,
        xLabel,
        yLabel,
        title: 'Input output response signature',
        markers: points.length ? [points.at(-1)] : []
      }
    );
    value('friction-command-value', f.command, 1, '%');
    value('friction-travel', f.motion.position, 1, '%');
    value('friction-pressure', f.motion.pressure, 2, 'psi');
    value('friction-error', f.command - f.motion.position, 1, 'pp');
    const st = $('friction-status');
    st.classList.toggle('stuck', f.mode === 'stiction' && f.motion.stuck);
    st.textContent =
      (f.mode === 'stiction'
        ? f.motion.stuck
          ? 'STUCK · below breakaway'
          : 'SLIP · sliding resistance reached'
        : C.friction[f.mode].title) +
      (f.running
        ? ` · ${f.sweep ? 'sweeping' : 'holding command'}`
        : f.mode === 'lag'
          ? ' · paused · Hold & settle lets the lag evolve'
          : ' · paused');
    $('friction-command').value = f.command;
    output('friction-command', f.command.toFixed(1) + ' %');
  }
  function flowPage() {
    const f = state.flow;
    return (
      header('flow') +
      `<div class="grid-main"><div class="stack"><section class="card"><div class="card-top"><h2>Inherent capacity</h2><span class="badge">CONSTANT VALVE ΔP</span></div><div id="cv-chart"></div>${legend(
        [
          ['Linear', 'command'],
          ['Equal percentage', 'travel'],
          ['Quick opening', 'pressure', 'dashed']
        ]
      )}<p class="plot-caption">Absolute Cv versus actual travel. The marker follows the selected characteristic.</p></section><section class="card"><div class="card-top"><h2>Now put it in a system</h2><span class="badge">SINGLE-PHASE LIQUID</span></div><div id="installed-chart"></div>${legend(
        [
          ['Constant valve ΔP', 'command', 'dashed'],
          ['Installed system', 'travel']
        ]
      )}<p class="plot-caption">Both curves use the same selected trim and pressure budget. The installed model assigns part of that budget to piping losses.</p><div class="kpi-grid">${kpi('flow-cv', 'Operating Cv', 'travel')}${kpi('flow-q', 'Actual flow', 'flow', 'gpm')}${kpi('flow-valve-dp', 'Valve ΔP', 'pressure', 'psi')}${kpi('flow-gain', 'Local flow gain', 'flow', 'gpm/pp')}</div><div class="hint" id="flow-insight"></div><div class="small-grid"><div class="fact"><b>Pipe / other losses</b><p id="flow-pipe-dp"></p></div><div class="fact"><b>Authority at this point</b><p id="flow-authority"></p></div></div></section></div><div class="stack"><section class="card"><h2>Change the operating point</h2>${select(
        'flow-characteristic',
        'Inherent characteristic',
        f.characteristic,
        [
          ['equal', 'Equal percentage'],
          ['linear', 'Linear'],
          ['quick', 'Quick opening · illustrative']
        ]
      )}${select('flow-mode', 'System model', f.mode, [
        ['installed', 'Installed · total pressure budget'],
        ['constant', 'Constant valve pressure drop']
      ])}${range('flow-travel', 'Actual valve travel', f.travel, 0, 100, 1, '%')}${range('flow-cvmax', 'Rated maximum Cv', f.cvMax, 10, 400, 5)}${range('flow-rangeability', 'Equal-percentage R', f.rangeability, 10, 100, 5, ':1')}${range('flow-dp', 'Pressure budget', f.dp, 0, 100, 1, 'psi')}${range('flow-sg', 'Liquid specific gravity', f.sg, 0.5, 2, 0.05)}${range('flow-resistance', 'Piping resistance K', f.resistance, 0, 0.02, 0.0005, 'psi/gpm²', false)}<p class="plot-caption">Other-system loss = K × Q². This K is for this model only; it is not a dimensionless fitting-loss coefficient.</p><div class="btn-row">${resetButton()}</div></section><section class="card"><h2>Read the relationship</h2><div class="formula">Q = Cv × √(ΔP<sub>valve</sub> / SG)<small>Q: US gpm · ΔP: psi · SG: water = 1</small></div><p>At fixed ΔP and SG, flow follows Cv. In a real system, opening the valve often increases flow and piping losses, leaving less pressure drop across the valve.</p><div class="hint warning-note">This calculator is an educational turbulent, non-choked, single-phase liquid model. It does not size gas, steam, cavitating, flashing, viscous, or two-phase service.</div>${sourceLink(0)}</section></div></div>` +
      lessons([
        [
          'Linear means linear Cv',
          'Equal travel increments give equal absolute increments of Cv. Flow is linear only if the remaining conditions support it.'
        ],
        [
          'Equal percentage means a ratio',
          'Equal travel increments multiply Cv by the same factor. A 10 pp move with R = 50 multiplies Cv by about 1.48 above the near-seat region.'
        ],
        [
          'Installed gain matters to tuning',
          'A controller sees process response, not an inherent trim curve. Oversizing and changing ΔP can make the loop gain vary across operation.'
        ]
      ]) +
      detail(
        'Equations, shutoff transition, and model boundaries',
        `<p><strong>Linear:</strong> Cv = Cv<sub>max</sub> × x. <strong>Equal percentage:</strong> Cv = Cv<sub>max</sub> × R<sup>x−1</sup> from 5–100% travel, where x is fractional travel. Below 5%, this app uses an explicitly illustrative linear seating transition to zero. The pure exponential does not reach zero at x = 0.</p><p><strong>Quick opening:</strong> Cv/Cv<sub>max</sub> = (1 − e<sup>−4x</sup>)/(1 − e<sup>−4</sup>), an illustrative curve, not a manufacturer capacity table.</p><p><strong>Installed model:</strong> ΔP<sub>total</sub> = SG × (Q/Cv)² + K × Q². Therefore Q = √[ΔP<sub>total</sub> / (SG/Cv² + K)]. The pressure budget is fixed at each setting; real pumps and networks can behave differently.</p><p>Local gain is the finite-difference slope in US gpm per percentage point of actual travel. Authority here is ΔP<sub>valve</sub>/ΔP<sub>total</sub> at the displayed point. Rated rangeability and installed turndown are not interchangeable. Zero indicated travel also does not guarantee leak-tight real equipment.</p>`
      )
    );
  }
  function updateFlow() {
    const f = state.flow,
      cv = M.cvAt(f.travel, f.characteristic, f.cvMax, f.rangeability),
      res = f.mode === 'installed' ? f.resistance : 0,
      q = M.liquidFlow(cv, f.dp, f.sg, res);
    const types = ['linear', 'equal', 'quick'],
      cols = [D.colors.command, D.colors.travel, D.colors.pressure];
    const samples = Array.from({ length: 201 }, (_, i) => i * 0.5);
    $('cv-chart').innerHTML = plot(
      'cv-chart',
      types.map((type, i) => ({
        name: type,
        color: cols[i],
        dash: i === 2 ? '6 4' : null,
        points: samples.map(x => ({ x, y: M.cvAt(x, type, f.cvMax, f.rangeability) }))
      })),
      {
        xLabel: 'Actual travel (%)',
        yLabel: 'Flow coefficient Cv',
        yDomain: [0, f.cvMax],
        title: 'Inherent Cv characteristics versus travel',
        markers: [{ x: f.travel, y: cv, color: cols[types.indexOf(f.characteristic)] }]
      }
    );
    const maxQ = M.liquidFlow(f.cvMax, f.dp, f.sg, 0).flow,
      top = Math.max(10, Math.ceil(maxQ / 10) * 10);
    $('installed-chart').innerHTML = plot(
      'installed-chart',
      [
        {
          name: 'Constant valve pressure drop',
          color: D.colors.command,
          dash: '6 4',
          points: samples.map(x => ({
            x,
            y: M.liquidFlow(M.cvAt(x, f.characteristic, f.cvMax, f.rangeability), f.dp, f.sg, 0).flow
          }))
        },
        {
          name: 'Installed',
          color: D.colors.travel,
          points: samples.map(x => ({
            x,
            y: M.liquidFlow(M.cvAt(x, f.characteristic, f.cvMax, f.rangeability), f.dp, f.sg, f.resistance).flow
          }))
        }
      ],
      {
        xLabel: 'Actual travel (%)',
        yLabel: 'Liquid flow (US gpm)',
        yDomain: [0, top],
        title: 'Constant pressure and installed flow versus travel',
        markers: [{ x: f.travel, y: q.flow, color: f.mode === 'installed' ? D.colors.travel : D.colors.command }]
      }
    );
    const lo = Math.max(0, f.travel - 0.1),
      hi = Math.min(100, f.travel + 0.1),
      gain =
        (M.liquidFlow(M.cvAt(hi, f.characteristic, f.cvMax, f.rangeability), f.dp, f.sg, res).flow -
          M.liquidFlow(M.cvAt(lo, f.characteristic, f.cvMax, f.rangeability), f.dp, f.sg, res).flow) /
        (hi - lo);
    value('flow-cv', cv, 2);
    value('flow-q', q.flow, 1, 'gpm');
    value('flow-valve-dp', q.valveDp, 1, 'psi');
    value('flow-gain', gain, 2, 'gpm/pp');
    $('flow-pipe-dp').textContent = q.pipeDp.toFixed(2) + ' psi';
    $('flow-authority').textContent =
      f.dp === 0 ? 'Undefined with zero pressure budget' : (q.authority * 100).toFixed(1) + '% of the pressure budget';
    $('flow-insight').textContent =
      f.dp === 0
        ? 'No available differential pressure → no flow in this model.'
        : f.travel === 0
          ? 'Seated at 0%: modeled Cv and flow are zero. Real seat leakage is excluded.'
          : f.mode === 'constant'
            ? 'With constant valve ΔP, flow follows the selected Cv characteristic.'
            : q.authority < 0.3
              ? 'Most pressure drop is now outside the valve. Opening farther adds less flow than the inherent Cv curve alone suggests.'
              : 'The system shares its pressure budget between the valve and piping. Change K or rated Cv and watch the installed curve reshape.';
    $('flow-resistance').disabled = f.mode === 'constant';
    $('flow-rangeability').disabled = f.characteristic !== 'equal';
  }
  function trimPage() {
    const t = state.trim;
    return (
      header('trim') +
      `<div class="style-list">${Object.entries(C.styles)
        .map(
          ([id, s]) =>
            `<button class="style-card ${id === t.style ? 'selected' : ''}" data-style="${id}">${D.styleIcon(id, 50)}<strong>${s.name}</strong><small>${s.tag}</small></button>`
        )
        .join(
          ''
        )}</div><div class="grid-equal"><section class="card"><div class="card-top"><h2>Move the closure member</h2><span class="badge">GEOMETRY EXPLORER</span></div><div class="diagram-stage" id="style-diagram"></div>${range('trim-travel', 'Travel / rotation fraction', t.travel, 0, 100, 1, '%')}<div id="style-detail"></div></section><section class="card"><h2>What does “trim” change?</h2>${select(
        'trim-type',
        'Explore a trim choice',
        t.trim,
        Object.entries(C.trims).map(([id, t]) => [id, t.name])
      )}<div id="trim-detail"></div>${detail('Construction choices are independent', `<p>A valve can have an equal-percentage characteristic, reduced capacity, a balanced plug, hard-faced surfaces, and a particular leakage class at the same time. These describe different attributes.</p><p>The selected characteristic is not determined simply by green paint, a globe-shaped body, or whether the actuator is linear or rotary. Use the actual trim and capacity tables.</p>`)}</section></div><section class="card" style="margin-top:22px"><div class="card-top"><h2>Where the pressure goes</h2><span class="badge">LIQUID PRESSURE PROFILE</span></div><div class="pills">${[
        ['normal', 'No vapor formation'],
        ['cavitation', 'Cavitation'],
        ['flashing', 'Flashing'],
        ['staged', 'Staged pressure reduction']
      ]
        .map(([v, n]) => `<button class="pill ${v === t.profile ? 'selected' : ''}" data-profile="${v}">${n}</button>`)
        .join('')}</div><div class="grid-equal"><div><div id="pressure-profile"></div>${legend([
        ['Local liquid pressure', 'command'],
        ['Vapor pressure', 'flow', 'dashed']
      ])}<p class="plot-caption">Illustrative absolute pressures in psia, not sizing results. The horizontal axis is normalized distance along the flow path; x = 0 is upstream and x = 1 downstream.</p></div><div id="profile-detail"></div></div></section>` +
      lessons([
        [
          'Severe service is a selection problem',
          'Fluid properties, temperature, pressure recovery, solids, erosion, noise, and minimum/maximum flow all matter.'
        ],
        [
          'Rotary does not mean friction-free',
          'Shaft packing, bearings, seals, and couplings introduce different sources of friction and lost motion.'
        ],
        [
          'Choking changes the equation',
          'Once flow is choked, reducing downstream pressure further does not increase flow as the simple liquid equation predicts.'
        ]
      ])
    );
  }
  function updateTrim() {
    const t = state.trim,
      s = C.styles[t.style],
      tr = C.trims[t.trim];
    $('style-diagram').innerHTML = D.styleIcon(t.style, t.travel, true);
    $('style-detail').innerHTML =
      `<h3>${s.name}</h3><p>${s.description}</p><div class="fact"><b>Common places to investigate</b><p>${s.watch}</p></div><p>${s.examples}</p><div class="hint">${s.lesson}</div>`;
    $('trim-detail').innerHTML =
      `<h3>${tr.name}</h3><p><strong>${tr.purpose}</strong></p><div class="diagram-stage" style="max-width:270px;margin:auto">${D.trimSketch(t.trim)}</div><p>${tr.how}</p><div class="hint">${tr.tradeoff}</div>${sourceLink(t.trim === 'cavitation' ? 5 : t.trim === 'noise' ? 6 : 2)}`;
    document.querySelectorAll('[data-style]').forEach(b => b.classList.toggle('selected', b.dataset.style === t.style));
    updateProfile();
  }
  function updateProfile() {
    const t = state.trim;
    const profiles = {
      normal: {
        points: [
          [0, 100],
          [0.35, 96],
          [0.55, 50],
          [0.8, 60],
          [1, 60]
        ],
        title: 'Pressure stays above vapor pressure',
        copy: 'No vapor bubbles form in this conceptual profile. There is still a local pressure minimum at the restriction and some downstream recovery.',
        hint: 'A pressure drop is not automatically cavitation. The pressure minimum and vapor pressure matter.'
      },
      cavitation: {
        points: [
          [0, 100],
          [0.35, 96],
          [0.55, 20],
          [0.8, 60],
          [1, 60]
        ],
        title: 'Bubbles form, then collapse',
        copy: 'Pressure falls below the 40 psia vapor-pressure line at the restriction, then recovers above it. Bubble collapse can cause noise, vibration, and material damage.',
        hint: 'Upstream and downstream pressures alone do not show the minimum pressure inside the trim.'
      },
      flashing: {
        points: [
          [0, 100],
          [0.35, 90],
          [0.55, 15],
          [0.8, 25],
          [1, 25]
        ],
        title: 'Vapor persists downstream',
        copy: 'Pressure drops below vapor pressure and the downstream pressure remains below it. The mixture continues downstream as liquid plus vapor; high velocities can produce erosion.',
        hint: 'An anti-cavitation trim cannot guarantee a return to liquid when downstream conditions favor vapor.'
      },
      staged: {
        points: [
          [0, 100],
          [0.2, 74],
          [0.28, 82],
          [0.45, 58],
          [0.55, 70],
          [0.7, 48],
          [0.8, 60],
          [1, 60]
        ],
        title: 'Distribute the pressure reduction',
        copy: 'This conceptual multistage profile keeps each local minimum above vapor pressure while reaching the same 60 psia outlet as the cavitating example.',
        hint: 'An appropriate staged trim can manage cavitation. Actual stages, geometry, plugging risk, and service conditions must be evaluated.'
      }
    };
    const p = profiles[t.profile];
    $('pressure-profile').innerHTML = plot(
      'pressure-profile',
      [
        { name: 'Local pressure', points: p.points.map(([x, y]) => ({ x, y })), color: D.colors.command },
        {
          name: 'Vapor pressure',
          points: [
            { x: 0, y: 40 },
            { x: 1, y: 40 }
          ],
          color: D.colors.flow,
          dash: '6 4'
        }
      ],
      {
        xDomain: [0, 1],
        yDomain: [0, 110],
        xLabel: 'Distance through valve (normalized)',
        yLabel: 'Absolute pressure (psia)',
        title: p.title
      }
    );
    $('profile-detail').innerHTML =
      `<h3>${p.title}</h3><p>${p.copy}</p><div class="hint">${p.hint}</div>${sourceLink(t.profile === 'flashing' ? 7 : 5)}`;
    document
      .querySelectorAll('[data-profile]')
      .forEach(b => b.classList.toggle('selected', b.dataset.profile === t.profile));
  }
  function positionerPage() {
    const p = state.positioner;
    return (
      header('positioner') +
      `<div class="grid-main"><div class="stack"><section class="card"><div class="card-top"><h2>Ask for position. Watch the air.</h2><span class="badge">REDUCED-ORDER MODEL</span></div><div class="pills">${[
        ['ip', 'I/P alone'],
        ['conventional', 'Conventional positioner'],
        ['dvc', 'Digital valve controller']
      ]
        .map(([v, t]) => `<button class="pill ${v === p.type ? 'selected' : ''}" data-positioner="${v}">${t}</button>`)
        .join('')}</div><div id="position-time"></div>${legend([
        ['Travel setpoint', 'command', 'dashed'],
        ['Actual travel', 'travel']
      ])}<div id="position-pressure"></div>${legend([
        ['Actuator pressure', 'pressure'],
        ['Supply ceiling', 'muted', 'dashed']
      ])}<div class="kpi-grid">${kpi('position-setpoint', 'Travel request', 'command', '%')}${kpi('position-travel', 'Actual travel', 'travel', '%')}${kpi('position-output', 'Actuator pressure', 'pressure', 'psi')}${kpi('position-deviation', 'Travel deviation', 'command', 'pp')}</div><div class="btn-row"><button class="primary" data-action="position-step">Step to 70%</button><button data-action="position-run">Run / resume</button><button data-action="pause">Pause</button>${resetButton()}</div><div id="position-status" class="status" style="margin-top:13px"></div></section><section class="card"><h2>Trace the signal path</h2><div id="position-chain" class="signal-chain"></div><div class="hint" id="position-feedback"></div><p class="plot-caption">Each block uses the same live state. A conventional 4–20 mA signal and a single-acting air-to-open assembly are example choices, not universal arrangements.</p></section></div><div class="stack"><section class="card"><h2>Add a challenge</h2>${range('position-command', 'Travel request', p.command, 0, 100, 1, '%')}${range('position-supply', 'Available air supply', p.supply, 5, 30, 1, 'psi')}${range('position-load', 'Opposing load equivalent', p.load, 0, 6, 0.5, 'psi')}<p class="plot-caption">Load is represented as an additional opposing force divided by actuator area. Real process forces vary with pressure, travel, geometry, and flow direction.</p><label class="check-row"><input type="checkbox" id="position-restricted" ${p.restricted ? 'checked' : ''}>Restrict air delivery</label><label class="check-row"><input type="checkbox" id="position-aggressive" ${p.aggressive ? 'checked' : ''}>Use excessive position-loop gain</label><div class="hint">Try 2 psi opposing load. The I/P-only valve loses travel. A feedback positioner raises actuator pressure to correct it—until supply or mechanical limits prevent correction.</div>${detail('What this simulation does and does not compare', `<p>The conventional and digital positioners share the same feedback dynamics here. Digital does not automatically mean faster or better mechanics. The DVC view adds the concept of digital configuration and diagnostics.</p><p>The model includes spring load, an opposing load, pneumatic lag, small friction, actuator inertia/damping, output saturation, and anti-windup. Excessive gain with low damping intentionally produces hunting. These constants are illustrative, not Fisher tuning values.</p><p>At zero supply, a real assembly responds according to spring action and accessories; this panel focuses on positioning while air is available.</p>`)}</section><section class="card"><h2>What a DVC adds</h2><p>A digital valve controller measures travel, runs a position-control algorithm, and drives pneumatic output. Depending on model, configuration, and diagnostic level, it can expose pressures, travel deviation, alerts, and diagnostic tests.</p><p><strong>FIELDVUE</strong> is Fisher’s family; <strong>DVC6200</strong> is a device example. Flowserve Logix and SAMSON digital positioners use the same broad feedback principle with different hardware and features.</p><p>HART communication can carry digital device information alongside an analog current request. The actuator energy still comes from instrument air.</p>${sourceLink(1)}</section></div></div>` +
      detail(
        'Configuration choices that can change the result',
        `<div class="table-wrap"><table><thead><tr><th>Setting / concept</th><th>What it changes</th><th>What it does not establish</th></tr></thead><tbody><tr><td>Input characterization</td><td>Maps command to a travel setpoint, possibly with a nonlinear table.</td><td>The physical trim’s inherent Cv curve does not change.</td></tr><tr><td>Travel limits / cutoffs</td><td>Restrict target travel or force output toward an end condition near configured cutoffs.</td><td>They do not prove correct fail action or leak-tight shutoff.</td></tr><tr><td>Split range</td><td>Allocates portions of one control signal to different valves.</td><td>Overlap, gaps, process gain, and failure behavior still need evaluation.</td></tr><tr><td>Positioner tuning</td><td>Changes the inner loop’s response to travel error.</td><td>It is distinct from process PID tuning and does not fix mechanical damage.</td></tr><tr><td>Travel / pressure fallback</td><td>Some models can change control mode after specified feedback faults.</td><td>Availability and recovery behavior depend on exact hardware, firmware, and configuration.</td></tr></tbody></table></div>`
      ) +
      lessons([
        [
          'DCS output is not a travel measurement',
          'A 60% controller output may map to another travel target through split-ranging, characterization, or limits.'
        ],
        [
          'Feedback location matters',
          'DVC travel can represent a stem, shaft, or actuator mechanism. Downstream lost motion can remain invisible.'
        ],
        [
          'Full stroke is not a small-step test',
          'Fast 0–100% motion does not guarantee response to a 0.5% correction around normal operating travel.'
        ]
      ])
    );
  }
  function sampleP(dt) {
    const p = state.positioner;
    p.motion = M.positionerStep(
      p.motion,
      p.command,
      { type: p.type, supply: p.supply, load: p.load, aggressive: p.aggressive, restricted: p.restricted },
      dt
    );
    p.time += dt;
    p.history.push({
      t: p.time,
      command: p.command,
      travel: p.motion.position,
      pressure: p.motion.pressure,
      supply: p.supply
    });
    if (p.history.length > 8000) p.history.shift();
  }
  function updatePositioner() {
    const p = state.positioner;
    if (!p.history.length) sampleP(0);
    const rows = p.history,
      first = rows[0].t,
      last = Math.max(first + 10, rows.at(-1).t);
    $('position-time').innerHTML = plot(
      'position-time',
      [
        {
          name: 'Travel setpoint',
          color: D.colors.command,
          dash: '6 4',
          points: rows.map(r => ({ x: r.t, y: r.command }))
        },
        { name: 'Actual travel', color: D.colors.travel, points: rows.map(r => ({ x: r.t, y: r.travel })) }
      ],
      {
        xDomain: [first, last],
        xLabel: 'Simulated time (s)',
        yLabel: 'Travel (%)',
        title: 'Positioner travel response'
      }
    );
    $('position-pressure').innerHTML = plot(
      'position-pressure',
      [
        { name: 'Actuator pressure', color: D.colors.pressure, points: rows.map(r => ({ x: r.t, y: r.pressure })) },
        { name: 'Supply ceiling', color: D.colors.muted, dash: '6 4', points: rows.map(r => ({ x: r.t, y: r.supply })) }
      ],
      {
        xDomain: [first, last],
        yDomain: [0, 35],
        xLabel: 'Simulated time (s)',
        yLabel: 'Air pressure (psi)',
        title: 'Actuator pressure and supply limit'
      }
    );
    value('position-setpoint', p.command, 1, '%');
    value('position-travel', p.motion.position, 1, '%');
    value('position-output', p.motion.pressure, 2, 'psi');
    value('position-deviation', p.command - p.motion.position, 1, 'pp');
    const current = 4 + 0.16 * p.command;
    $('position-chain').innerHTML =
      `<div class="signal-block"><small>01 / REQUEST</small><strong>DCS → ${current.toFixed(1)} mA</strong><p>${p.command.toFixed(1)}% requested travel in this example.</p></div><div class="signal-block"><small>02 / CONVERSION</small><strong>${p.type === 'ip' ? 'I/P conversion only' : 'Position control → I/P'}</strong><p>${p.type === 'ip' ? 'Fixed command-to-pressure mapping.' : 'Travel error changes the pneumatic demand.'}</p></div><div class="signal-block"><small>03 / AIR POWER</small><strong>Relay → actuator</strong><p>${p.motion.pressure.toFixed(2)} psi actuator pressure; ${p.supply.toFixed(0)} psi available supply.</p></div><div class="signal-block"><small>04 / MECHANICS</small><strong>Stem → plug → flow area</strong><p>${p.motion.position.toFixed(1)}% actual travel under spring and process loading.</p></div>`;
    $('position-feedback').textContent =
      p.type === 'ip'
        ? 'No travel feedback: an I/P alone converts current to pressure. Additional opposing load can reduce travel at the same command.'
        : `Travel sensor → ${p.type === 'dvc' ? 'digital control algorithm' : 'position-control mechanism'} → adjusted air pressure. Actual travel closes the inner loop; process flow is not its feedback variable.`;
    const limited = p.motion.pressure > p.supply - 0.25 && Math.abs(p.command - p.motion.position) > 2;
    $('position-status').textContent =
      (limited
        ? 'OUTPUT NEAR SUPPLY LIMIT · travel error remains'
        : p.aggressive && p.type !== 'ip'
          ? 'EXCESSIVE GAIN · inspect hunting after a step'
          : p.type === 'ip'
            ? 'OPEN LOOP · no automatic load correction'
            : 'CLOSED POSITION LOOP · correcting travel error') +
      (p.running ? ' · running' : ' · paused · Run / resume to evolve the response');
    document
      .querySelectorAll('[data-positioner]')
      .forEach(b => b.classList.toggle('selected', b.dataset.positioner === p.type));
    $('position-aggressive').disabled = p.type === 'ip';
  }
  function diagnosisPage() {
    const d = state.diagnosis;
    return (
      header('diagnosis') +
      `<div class="grid-main"><section class="card"><div class="card-top"><h2>The evidence</h2><span class="badge">60 s SIMULATED TRACE</span></div>${select(
        'diagnosis-case',
        'Choose a case',
        d.case,
        Object.entries(C.cases).map(([id, c]) => [id, c.name])
      )}<div id="case-travel-chart"></div>${legend([
        ['Command', 'command', 'dashed'],
        ['Actual travel', 'travel']
      ])}<div id="case-pressure-chart"></div>${legend([['Actuator / proxy pressure', 'pressure']])}<div id="case-flow-chart"></div>${legend([['Flow', 'flow']])}<p class="plot-caption">Independent y-axes with explicit units. Packing/backlash pressure is an upstream command proxy, not a feedback-positioner output. All data are generated for teaching.</p></section><div class="stack"><section class="card"><p class="tag-line">MAKE A WORKING HYPOTHESIS</p><h2 id="case-question"></h2><div class="case-options">${C.answerOptions.map(([id, name]) => `<button data-answer="${id}">${name}</button>`).join('')}</div><p id="case-feedback" class="case-feedback" aria-live="polite"></p><div class="btn-row"><button data-action="reveal">Show explanation</button><button class="primary" data-action="next-case">Next case →</button></div><div id="case-answer" class="answer"></div></section><section class="card"><h2>Before you blame the valve</h2><p>A cycling process variable does not prove stiction. Start with command and actual travel, add air pressures, and examine process-side changes.</p><p>A valve signature is evidence under a particular load and temperature. Comparing unlike test conditions can turn a normal load change into an apparent friction change.</p><div class="hint warning-note">These are simulated tests. Online stroking, calibration, fail testing, and disassembly require the site’s operating, isolation, and maintenance procedures.</div>${sourceLink(8)}</section></div></div>`
    );
  }
  function updateDiagnosis() {
    const d = state.diagnosis,
      c = C.cases[d.case],
      rows = M.caseData(d.case);
    $('case-travel-chart').innerHTML = plot(
      'case-travel-chart',
      [
        { name: 'Command', color: D.colors.command, dash: '6 4', points: rows.map(r => ({ x: r.t, y: r.command })) },
        { name: 'Travel', color: D.colors.travel, points: rows.map(r => ({ x: r.t, y: r.travel })) }
      ],
      {
        xDomain: [0, 60],
        yDomain: [0, 100],
        xLabel: 'Time (s)',
        yLabel: 'Command / travel (%)',
        title: 'Diagnostic command and travel'
      }
    );
    $('case-pressure-chart').innerHTML = plot(
      'case-pressure-chart',
      [{ name: 'Pressure', color: D.colors.pressure, points: rows.map(r => ({ x: r.t, y: r.pressure })) }],
      {
        xDomain: [0, 60],
        yDomain: [0, 25],
        xLabel: 'Time (s)',
        yLabel: 'Actuator / proxy pressure (psi)',
        title: 'Diagnostic pressure'
      }
    );
    const high = Math.max(10, Math.ceil(Math.max(...rows.map(r => r.flow)) / 10) * 10);
    $('case-flow-chart').innerHTML = plot(
      'case-flow-chart',
      [{ name: 'Flow', color: D.colors.flow, points: rows.map(r => ({ x: r.t, y: r.flow })) }],
      { xDomain: [0, 60], yDomain: [0, high], xLabel: 'Time (s)', yLabel: 'Flow (US gpm)', title: 'Diagnostic flow' }
    );
    $('case-question').textContent = c.question;
    $('case-feedback').textContent =
      d.answered === null
        ? 'Choose the best fit, then compare the alternatives.'
        : d.answered === c.answer
          ? 'That fits the simulated mechanism. In the field, confirm it with additional evidence.'
          : 'That can be worth investigating, but another mechanism is a closer fit to this constructed case.';
    document.querySelectorAll('[data-answer]').forEach(b => {
      b.classList.toggle('correct', d.revealed && b.dataset.answer === c.answer);
      b.classList.toggle(
        'incorrect',
        d.answered !== null && d.answered !== c.answer && b.dataset.answer === d.answered
      );
    });
    $('case-answer').innerHTML = d.revealed
      ? `<h3>What the case actually modeled</h3><p>${c.explanation}</p><h3>What else could look similar?</h3><p>${c.alternatives}</p><div class="hint"><strong>Next evidence:</strong> ${c.next}</div>`
      : '<p class="empty-answer">The explanation stays hidden until you make a choice or reveal it.</p>';
  }
  function plot(id, lines, opts) {
    const width = $(id).clientWidth || Math.max(280, Math.min(600, (root.innerWidth ?? 1000) - 68));
    const height =
      root.innerWidth <= 920 ? Math.max(140, Math.min(320, $(id).clientHeight || root.innerHeight * 0.29 - 50)) : 270;
    return D.plot(lines, { ...opts, width, height });
  }
  function value(id, v, digits, unit = '') {
    if ($(id)) $(id).innerHTML = Number(v).toFixed(digits) + `<em>${unit}</em>`;
  }
  function output(id, text) {
    if ($(id + '-out')) $(id + '-out').textContent = text;
  }
  function pause() {
    state.friction.running = false;
    state.positioner.running = false;
    state.pid.running = false;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastFrame = 0;
    clock = 0;
  }
  function start() {
    if (frameId === null) {
      lastFrame = 0;
      frameId = requestAnimationFrame(frame);
    }
  }
  function frame(now) {
    frameId = null;
    const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    const active = () => Boolean(state.demo || state.friction.running || state.positioner.running || state.pid.running);
    clock += dt;
    while (clock >= 0.05 && active()) {
      clock -= 0.05;
      if (state.module === 'friction' && state.friction.running) {
        const f = state.friction;
        if (f.sweep) {
          f.command += f.direction * f.speed * 0.05;
          if (f.command >= 90) {
            f.command = 90;
            f.direction = -1;
          }
          if (f.command <= 10) {
            f.command = 10;
            f.direction = 1;
          }
        }
        sampleF(0.05);
      }
      if (state.module === 'positioner' && state.positioner.running) sampleP(0.05);
      if (state.module === 'pid' && state.pid.running) {
        const l = state.pid;
        l.clock += 0.05 * l.speed;
        while (l.clock >= 0.1 && l.running) {
          l.clock -= 0.1;
          sampleL(0.1);
          demoStep(0);
        }
      }
      if (state.module !== 'pid') demoStep(0.05);
    }
    if (now - lastDraw > 150) {
      refresh();
      lastDraw = now;
    }
    if (active()) frameId = requestAnimationFrame(frame);
    else {
      lastFrame = 0;
      clock = 0;
    }
  }
  function render(module, focus = false) {
    pause();
    state.demo = null;
    clock = 0;
    state.module = module;
    const pages = {
      pid: pidPage,
      anatomy: anatomyPage,
      friction: frictionPage,
      flow: flowPage,
      trim: trimPage,
      positioner: positionerPage,
      diagnosis: diagnosisPage
    };
    $('main').innerHTML = pages[module]();
    document.querySelectorAll('[data-module]').forEach(a => {
      a.classList.toggle('active', a.dataset.module === module);
      if (a.dataset.module === module) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const nav = $('module-nav'),
      act = nav?.querySelector('.active');
    if (act && nav.scrollWidth > nav.clientWidth)
      nav.scrollLeft = Math.max(0, act.offsetLeft - nav.offsetLeft - (nav.clientWidth - act.offsetWidth) / 2);
    if (module === 'anatomy') updateAnatomy();
    if (module === 'friction') {
      frictionControls();
      updateFriction();
    }
    if (module === 'flow') updateFlow();
    if (module === 'trim') updateTrim();
    if (module === 'positioner') updatePositioner();
    if (module === 'diagnosis') updateDiagnosis();
    if (module === 'pid') updatePID();
    W.mount(module);
    refresh();
    if (focus) $('main').focus({ preventScroll: true });
  }
  function resources(type) {
    $('dialog-title').textContent = type === 'glossary' ? 'Engineering glossary' : 'References & model assumptions';
    $('dialog-content').innerHTML =
      type === 'glossary'
        ? Object.entries(C.glossary)
            .map(
              ([term, definition]) => `<div class="glossary-item"><strong>${term}</strong><p>${definition}</p></div>`
            )
            .join('')
        : `<p>The diagrams, equations, and test data are original teaching examples. They do not identify a specific plant valve or replace its datasheet, sizing calculation, or instruction manual.</p><h3>Model boundaries</h3><ul><li>Anatomy: unloaded, single-acting air-to-open spring-to-close example; ideal seating and no leak flow.</li><li>Friction: quasi-static static/sliding thresholds, play operators for lost motion, or a first-order lag. Pressure is a labeled command proxy.</li><li>Flow: turbulent non-choked single-phase liquid; fixed pressure budget and quadratic piping loss. Equal-percentage law applies above 5% travel with an illustrative seating transition below.</li><li>Positioner: reduced-order pneumatic and mechanical dynamics; conventional and digital feedback use identical dynamics. Diagnostic/configuration features vary by actual device.</li><li>Troubleshooting: constructed traces isolate mechanisms; real symptoms can have several causes.</li></ul><h3>Primary references</h3>${C.sources.map(s => `<div class="glossary-item"><a href="${s.url}" target="_blank" rel="noopener">${s.title} ↗</a><p>${s.topic}</p></div>`).join('')}<p><a href="https://github.com/DeltaSNull/control-valve-lab/blob/main/docs/model-notes.md" target="_blank" rel="noopener">Detailed model notes and verification ↗</a></p>`;
    $('resource-dialog').showModal();
  }
  function action(name) {
    if (name === 'demo') {
      beginDemo();
      return;
    }
    if (name === 'custom') {
      pause();
      state.demo = null;
      W.mode(false, 'Custom · press Run to evolve a dynamic simulation.');
      refresh();
      return;
    }
    if (name.startsWith('pid-')) {
      state.demo = null;
      W.mode(false, 'Custom PID controls');
      pidAction(name);
      return;
    }
    const mod = state.module,
      f = state.friction,
      p = state.positioner,
      d = state.diagnosis;
    if (name === 'references' || name === 'glossary') {
      resources(name);
      return;
    }
    if (name === 'close-dialog') {
      $('resource-dialog').close();
      return;
    }
    if (name === 'reset') {
      pause();
      state.demo = null;
      if (mod === 'pid') state.pid = defaultL();
      if (mod === 'anatomy') state.anatomy = { command: 40, component: 'packing', airLost: false };
      if (mod === 'friction') state.friction = defaultF();
      if (mod === 'flow')
        state.flow = {
          travel: 50,
          characteristic: 'equal',
          cvMax: 80,
          rangeability: 50,
          dp: 25,
          sg: 1,
          resistance: 0.003,
          mode: 'installed'
        };
      if (mod === 'trim') state.trim = { style: 'globe', travel: 50, trim: 'characterized', profile: 'cavitation' };
      if (mod === 'positioner') state.positioner = defaultP();
      if (mod === 'diagnosis') state.diagnosis = { case: 'packing', answered: null, revealed: false };
      render(mod);
      return;
    }
    if (name === 'air-fail') {
      state.anatomy.airLost = !state.anatomy.airLost;
      updateAnatomy();
    }
    if (name === 'pause') {
      pause();
      state.demo = null;
      W.mode(false, 'Paused · Run / resume continues; Run demo restarts.');
      if (mod === 'pid') updatePID();
      if (mod === 'friction') updateFriction();
      if (mod === 'positioner') updatePositioner();
    }
    if (name === 'step-up' || name === 'step-down') {
      pause();
      f.command = M.clamp(f.command + (name === 'step-up' ? 1 : -1));
      sampleF(0.1);
      updateFriction();
    }
    if (name === 'sweep') {
      pause();
      f.command = 10;
      f.motion = { position: 10 };
      f.direction = 1;
      f.time = 0;
      f.history = [];
      sampleF(0);
      f.running = true;
      f.sweep = true;
      updateFriction();
      start();
    }
    if (name === 'settle') {
      f.sweep = false;
      f.running = true;
      updateFriction();
      start();
    }
    if (name === 'position-step') {
      p.command = 70;
      $('position-command').value = 70;
      output('position-command', '70 %');
      p.running = true;
      sampleP(0.02);
      updatePositioner();
      start();
    }
    if (name === 'position-run') {
      p.running = true;
      start();
    }
    if (name === 'reveal') {
      d.revealed = true;
      updateDiagnosis();
    }
    if (name === 'next-case') {
      const ids = Object.keys(C.cases);
      d.case = ids[(ids.indexOf(d.case) + 1) % ids.length];
      d.answered = null;
      d.revealed = false;
      $('diagnosis-case').value = d.case;
      updateDiagnosis();
    }
  }
  document.addEventListener('click', event => {
    const panel = event.target.closest('[data-panel]');
    if (panel) {
      W.setPanel(panel.dataset.panel);
      return;
    }
    const el = event.target.closest(
      '[data-module],[data-action],[data-component],[data-friction],[data-style],[data-profile],[data-positioner],[data-answer]'
    );
    if (!el) return;
    if (el.dataset.module) {
      event.preventDefault();
      state.demo = null;
      const module = el.dataset.module;
      if (location.hash !== '#' + module) history.pushState(null, '', '#' + module);
      render(module, true);
      return;
    }
    if (el.dataset.action) {
      action(el.dataset.action);
      return;
    }
    if (state.demo) {
      pause();
      state.demo = null;
      W.mode(false, 'Custom · demonstration stopped.');
    }
    if (el.dataset.component) {
      state.anatomy.component = el.dataset.component;
      updateAnatomy();
    }
    if (el.dataset.friction) {
      pause();
      const f = state.friction;
      f.mode = el.dataset.friction;
      f.motion = { position: f.command };
      f.time = 0;
      f.history = [];
      document.querySelectorAll('[data-friction]').forEach(b => b.classList.toggle('selected', b === el));
      frictionControls();
      updateFriction();
    }
    if (el.dataset.style) {
      state.trim.style = el.dataset.style;
      updateTrim();
    }
    if (el.dataset.profile) {
      state.trim.profile = el.dataset.profile;
      updateProfile();
    }
    if (el.dataset.positioner) {
      pause();
      const p = state.positioner;
      p.type = el.dataset.positioner;
      p.history = [];
      p.time = 0;
      p.motion = { position: 50, pressure: 9, integral: 0, velocity: 0 };
      updatePositioner();
    }
    if (el.dataset.answer) {
      state.diagnosis.answered = el.dataset.answer;
      state.diagnosis.revealed = true;
      updateDiagnosis();
    }
    W.syncSelections();
  });
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.svg-part')) {
      event.preventDefault();
      const c = event.target.dataset.component;
      state.anatomy.component = c;
      updateAnatomy();
      document.querySelector(`.svg-part[data-component="${c}"]`)?.focus();
    }
  });
  function onInput(event) {
    const el = event.target,
      id = el.id;
    if (id === 'workspace-plot') {
      W.setPlot(el.value);
      refresh();
      return;
    }
    if (state.demo) {
      pause();
      state.demo = null;
      W.mode(false, 'Custom · demonstration stopped.');
    }
    if (id?.startsWith('pid-')) {
      pidInput(el);
      return;
    }
    if (
      !id ||
      (!id.startsWith('anatomy-') &&
        !id.startsWith('friction-') &&
        !id.startsWith('flow-') &&
        !id.startsWith('trim-') &&
        !id.startsWith('position-') &&
        !id.startsWith('diagnosis-'))
    )
      return;
    const n = Number(el.value);
    if (el.type === 'range')
      output(
        id,
        el.value +
          ' ' +
          ({
            'anatomy-command': '%',
            'friction-command': '%',
            'friction-static': 'force-span pp',
            'friction-sliding': 'force-span pp',
            'friction-backlash': 'pp',
            'friction-hysteresis': 'pp',
            'friction-tau': 's',
            'friction-speed': 'pp/s',
            'flow-travel': '%',
            'flow-dp': 'psi',
            'flow-rangeability': ':1',
            'flow-resistance': 'psi/gpm²',
            'trim-travel': '%',
            'position-command': '%',
            'position-supply': 'psi',
            'position-load': 'psi'
          }[id] ?? '')
      );
    if (id === 'anatomy-command') {
      state.anatomy.command = n;
      state.anatomy.airLost = false;
      updateAnatomy();
    }
    const f = state.friction;
    if (id === 'friction-command') {
      pause();
      f.command = n;
      sampleF(0.1);
      updateFriction();
    }
    if (id === 'friction-static') {
      f.staticFriction = n;
      f.slidingFriction = Math.min(f.slidingFriction, n);
      $('friction-sliding').max = n;
      $('friction-sliding').value = f.slidingFriction;
      output('friction-sliding', f.slidingFriction + ' force-span pp');
    }
    if (id === 'friction-sliding') f.slidingFriction = n;
    if (id === 'friction-backlash') f.backlash = n;
    if (id === 'friction-hysteresis') f.hysteresis = n;
    if (id === 'friction-tau') f.tau = n;
    if (id === 'friction-speed') f.speed = n;
    if (id === 'friction-view') {
      f.view = el.value;
      updateFriction();
    }
    const flowKeys = {
      'flow-travel': 'travel',
      'flow-cvmax': 'cvMax',
      'flow-rangeability': 'rangeability',
      'flow-dp': 'dp',
      'flow-sg': 'sg',
      'flow-resistance': 'resistance',
      'flow-characteristic': 'characteristic',
      'flow-mode': 'mode'
    };
    if (flowKeys[id]) {
      state.flow[flowKeys[id]] = el.tagName === 'SELECT' ? el.value : n;
      updateFlow();
    }
    if (id === 'trim-travel') {
      state.trim.travel = n;
      $('style-diagram').innerHTML = D.styleIcon(state.trim.style, n, true);
    }
    if (id === 'trim-type') {
      state.trim.trim = el.value;
      updateTrim();
    }
    const posKeys = {
      'position-command': 'command',
      'position-supply': 'supply',
      'position-load': 'load',
      'position-aggressive': 'aggressive',
      'position-restricted': 'restricted'
    };
    if (posKeys[id]) {
      state.positioner[posKeys[id]] = el.type === 'checkbox' ? el.checked : n;
      updatePositioner();
    }
    if (id === 'diagnosis-case') {
      state.diagnosis.case = el.value;
      state.diagnosis.answered = null;
      state.diagnosis.revealed = false;
      updateDiagnosis();
    }
  }
  document.addEventListener('input', event => {
    if (event.target.tagName !== 'SELECT' && event.target.type !== 'checkbox') onInput(event);
  });
  document.addEventListener('change', event => {
    if (event.target.tagName === 'SELECT' || event.target.type === 'checkbox') onInput(event);
  });
  root.addEventListener('resize', () => {
    if (state.module === 'friction') updateFriction();
    if (state.module === 'flow') updateFlow();
    if (state.module === 'positioner') updatePositioner();
    if (state.module === 'trim') updateProfile();
    if (state.module === 'diagnosis') updateDiagnosis();
    if (state.module === 'pid') updatePID();
  });
  root.addEventListener('hashchange', () => {
    const mod = location.hash.slice(1);
    if (titles[mod]) render(mod, true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
      state.demo = null;
      W.mode(false, 'Paused while app is in the background.');
      if (state.module === 'pid') updatePID();
      if (state.module === 'friction') updateFriction();
      if (state.module === 'positioner') updatePositioner();
    }
  });
  root.ValveLab = { getState: () => state, pause };
  render(titles[location.hash.slice(1)] ? location.hash.slice(1) : 'anatomy');
})(window);
