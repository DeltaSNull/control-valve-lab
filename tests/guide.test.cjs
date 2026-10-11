const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const { JSDOM } = require('jsdom');
// Fake animation clock so guided "Show me" steps can be run to a known simulated time.
function boot(hash = '') {
  const d = new JSDOM(fs.readFileSync('index.html', 'utf8'), {
    url: 'https://example.test/' + hash,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const w = d.window;
  let now = 1000,
    callbacks = new Map(),
    id = 0;
  w.requestAnimationFrame = f => {
    callbacks.set(++id, f);
    return id;
  };
  w.cancelAnimationFrame = i => callbacks.delete(i);
  w.matchMedia = () => ({ matches: false });
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  for (const file of ['models', 'pid', 'content', 'diagrams', 'workspace', 'app'])
    vm.runInContext(fs.readFileSync('js/' + file + '.js', 'utf8'), d.getInternalVMContext());
  const doc = w.document;
  return {
    d,
    w,
    doc,
    state: () => w.ValveLab.getState(),
    tick(seconds, hz = 60) {
      for (let i = 0; i < seconds * hz; i++) {
        now += 1000 / hz;
        const batch = [...callbacks.values()];
        callbacks.clear();
        batch.forEach(f => f(now));
      }
    },
    click(q) {
      const el = doc.querySelector(q);
      assert.ok(el, q);
      el.click();
    },
    show(step) {
      doc.querySelector(`[data-guide-step="${step}"]`).click();
      doc.querySelector('[data-action="guide-show"]').click();
    },
    num: id => Number.parseFloat(doc.getElementById(id).textContent)
  };
}
const C = (() => {
  const ctx = {};
  vm.runInNewContext(fs.readFileSync('js/content.js', 'utf8'), ctx);
  return ctx.ValveContent;
})();

test('the app opens on a home page that maps the signal-to-flow chain and role paths to lessons', () => {
  const b = boot();
  assert.equal(b.state().module, 'home');
  assert.match(b.doc.querySelector('h1').textContent, /control valve/i);
  const chain = [...b.doc.querySelectorAll('.chain a')].map(a => a.dataset.module);
  assert.equal(chain.length, 7);
  assert.equal(b.doc.querySelectorAll('.path-card').length, 4);
  const cards = [...b.doc.querySelectorAll('.lesson-card')].map(a => a.dataset.module);
  assert.deepEqual(cards, Object.keys(C.modules));
  for (const m of new Set([...chain, ...C.roles.flatMap(r => r.path)])) assert.ok(C.modules[m], m);
  b.click('.lesson-card[data-module="flow"]');
  assert.equal(b.state().module, 'flow');
  b.d.window.close();
});

test('every lesson has a key idea, role notes and a guided activity whose steps all run', () => {
  const b = boot('#anatomy');
  for (const m of Object.keys(C.modules)) {
    b.click(`#module-nav [data-module="${m}"]`);
    assert.ok(b.doc.querySelector('.key-idea').textContent.length > 60, m);
    assert.equal(b.doc.querySelectorAll('.on-the-job .role-card').length, 4, m);
    assert.equal(C.onTheJob[m].length, C.roles.length, m);
    const steps = C.guides[m];
    assert.ok(steps.length >= 3, m);
    steps.forEach((s, i) => {
      for (const k of ['title', 'do', 'look', 'why']) assert.ok(s[k], `${m} step ${i} ${k}`);
      b.show(i);
      b.tick(0.3);
      assert.match(b.doc.getElementById('guide-title').textContent, new RegExp(s.title.slice(0, 8)), m);
    });
    b.w.ValveLab.pause();
  }
  b.d.window.close();
});

test('guide navigation marks progress and the last step links to the next lesson', () => {
  const b = boot('#trim');
  assert.equal(b.doc.querySelector('[data-action="guide-prev"]').disabled, true);
  b.click('[data-action="guide-next"]');
  assert.match(b.doc.querySelector('.kicker').textContent, /step 2 of 4/);
  assert.ok(b.doc.querySelector('[data-guide-step="0"]').classList.contains('done'));
  b.click('[data-action="guide-prev"]');
  assert.match(b.doc.querySelector('.kicker').textContent, /step 1 of 4/);
  b.click('[data-guide-step="3"]');
  b.click('.guide-actions a[data-module="positioner"]');
  assert.equal(b.state().module, 'positioner');
  b.click('#module-nav [data-module="trim"]');
  assert.match(b.doc.querySelector('.kicker').textContent, /step 4 of 4/, 'progress is kept per lesson');
  b.d.window.close();
});

test('anatomy and friction guide numbers match the models', () => {
  const b = boot('#anatomy');
  b.show(0);
  assert.equal(b.num('anatomy-pressure'), 12.6);
  assert.equal(b.num('anatomy-force'), 252);
  assert.equal(b.num('anatomy-lift'), 0.6);
  b.show(1);
  assert.equal(b.num('anatomy-travel'), 0);
  b.click('#module-nav [data-module="friction"]');
  b.show(0);
  b.tick(6.5);
  assert.equal(b.state().friction.command, 56);
  assert.equal(b.num('friction-travel'), 54.5);
  const rows = b.state().friction.history;
  assert.ok(
    rows.filter(r => r.command > 50 && r.command < 56).every(r => r.travel === 50),
    'five steps hold'
  );
  b.d.window.close();
});

test('flow guide numbers match the installed-flow model', () => {
  const b = boot('#flow');
  b.show(0);
  assert.equal(b.num('flow-cv').toFixed(1), '30.1');
  assert.equal(b.num('flow-q'), 78);
  assert.equal(b.num('flow-valve-dp'), 6.7);
  b.show(1);
  assert.equal(Math.round(b.num('flow-q')), 39);
  b.show(3);
  assert.equal(Math.round(b.num('flow-q')), 89);
  assert.equal(b.state().flow.cvMax, 300);
  b.d.window.close();
});

test('positioner guide outcomes match the reduced-order model', () => {
  const b = boot('#positioner');
  b.show(0);
  b.tick(20);
  assert.equal(Math.round(b.state().positioner.motion.position), 34);
  assert.equal(b.num('position-output'), 9);
  b.show(1);
  b.tick(20);
  assert.equal(Math.round(b.state().positioner.motion.position), 50);
  assert.equal(Math.round(b.state().positioner.motion.pressure), 11);
  b.show(2);
  b.tick(20);
  assert.equal(Math.round(b.state().positioner.motion.position), 58);
  assert.match(b.doc.getElementById('position-status').textContent, /supply limit/);
  b.show(3);
  b.tick(15);
  const tail = b
    .state()
    .positioner.history.filter(r => r.t > 10)
    .map(r => r.travel);
  assert.ok(Math.min(...tail) < 30 && Math.max(...tail) > 95, 'excessive gain hunts');
  assert.equal(b.state().positioner.running, true, 'a hunting loop never reports settled');
  b.w.ValveLab.pause();
  b.d.window.close();
});

test('PID guide: measured step test, model-based tuning, then a stiction limit cycle', () => {
  const b = boot('#pid');
  b.show(0);
  b.tick(25);
  const est = b.state().pid.estimate;
  assert.ok(est?.ok, 'the step test produces an estimate');
  assert.ok(Math.abs(est.gain - 1) < 0.05 && Math.abs(est.tau - 20) < 2 && Math.abs(est.delay - 4) < 1);
  b.show(1);
  assert.ok(b.state().pid.estimate.ok);
  b.show(2);
  const l = b.state().pid;
  assert.equal(l.mode, 'auto');
  assert.equal(l.sp, 55);
  b.tick(40);
  const after = l.history.filter(r => r.t > 30);
  assert.ok(Math.max(...after.map(r => r.pv)) < 55.6, 'little or no overshoot');
  assert.ok(Math.abs(l.plant.measured - 55) < 0.3, 'PV reaches the new setpoint');
  b.show(3);
  assert.equal(b.state().pid.defect, 'stiction');
  b.tick(80);
  const s = b.state().pid,
    late = s.history.filter(r => r.t > s.plant.t - 200);
  const pv = late.map(r => r.pv),
    op = late.map(r => r.op);
  assert.ok(Math.max(...pv) - Math.min(...pv) > 1, 'PV keeps cycling');
  assert.ok(Math.max(...op) - Math.min(...op) > 3, 'OP saw-tooths');
  b.w.ValveLab.pause();
  b.d.window.close();
});

test('PID tuning step refuses to invent a model without a measured step test', () => {
  const b = boot('#pid');
  b.show(2);
  assert.match(b.doc.getElementById('guide-note').textContent, /measured step test/);
  assert.equal(b.state().pid.mode, 'manual');
  b.d.window.close();
});

test('lesson pager walks the lessons in order and returns home after the last', () => {
  const b = boot('#anatomy');
  const order = [];
  for (let i = 0; i < 7; i++) {
    order.push(b.state().module);
    b.click('.pager-link.next');
  }
  assert.deepEqual(order, Object.keys(C.modules));
  assert.equal(b.state().module, 'home');
  b.d.window.close();
});

test('guide buttons keep keyboard focus after use', () => {
  const b = boot('#flow');
  b.click('[data-action="guide-show"]');
  assert.equal(b.doc.activeElement?.dataset.action, 'guide-show');
  b.click('[data-action="guide-next"]');
  assert.equal(b.doc.activeElement?.dataset.action, 'guide-next');
  b.click('[data-action="guide-prev"]');
  assert.equal(b.doc.activeElement?.dataset.guideStep, '0', 'disabled Back hands focus to the current step');
  b.d.window.close();
});

test('learning mode switches preserve the demo, and pause/resume preserves its progress', () => {
  const b = boot('#flow');
  b.click('[data-action="demo"]');
  b.tick(2);
  b.click('[data-learning="explore"]');
  assert.equal(b.doc.querySelector('.guide').hidden, true);
  assert.equal(b.doc.querySelector('.lab-controls').hidden, false);
  const t = b.state().demo.time;
  b.click('[data-action="demo-toggle"]');
  b.tick(2);
  assert.equal(b.state().demo.time, t);
  assert.match(b.doc.querySelector('[data-action="demo-toggle"]').textContent, /Resume/);
  b.click('[data-action="demo-toggle"]');
  b.tick(1);
  assert.ok(b.state().demo.time > t);
  assert.ok(b.doc.getElementById('demo-progress').value > 0);
  b.d.window.close();
});

test('guided breakaway exposes each held command before the slip', () => {
  const b = boot('#friction');
  b.show(0);
  b.tick(5.2);
  assert.equal(b.state().friction.command, 55);
  assert.equal(b.state().friction.motion.position, 50);
  b.tick(1.1);
  assert.equal(b.state().friction.command, 56);
  assert.equal(b.state().friction.motion.position, 54.5);
  b.d.window.close();
});

test('requesting a PID estimate during the guided recording does not stop it', () => {
  const b = boot('#pid');
  b.show(0);
  b.tick(1);
  const demo = b.state().demo;
  b.show(1);
  assert.equal(b.state().demo, demo);
  assert.equal(b.state().pid.running, true);
  assert.match(b.doc.getElementById('guide-note').textContent, /still running/);
  b.d.window.close();
});

test('PID next action walks a measured recording into Auto and preserves exploration through rerender', () => {
  const b = boot('#pid');
  b.click('[data-learning="explore"]');
  b.click('#pid-next');
  assert.equal(b.state().pid.running, true);
  assert.equal(b.doc.getElementById('pid-next').disabled, true);
  b.tick(1);
  assert.match(b.doc.getElementById('pid-next').textContent, /Step OP/);
  b.click('#pid-next');
  assert.ok(b.state().pid.test);
  b.tick(20);
  assert.match(b.doc.getElementById('pid-next').textContent, /Estimate from/);
  b.click('#pid-next');
  assert.ok(b.state().pid.estimate.ok);
  b.click('#pid-next');
  assert.equal(b.state().pid.stage, 'tune');
  assert.equal(b.doc.querySelector('.lab-controls').hidden, false);
  b.click('#pid-next');
  assert.equal(b.state().pid.mode, 'auto');
  b.d.window.close();
});

test('manual button changes end automation and revealed feedback is visible in guided mode', () => {
  const b = boot('#friction');
  b.show(0);
  b.tick(2);
  b.click('[data-learning="explore"]');
  b.click('[data-action="step-up"]');
  assert.equal(b.state().demo, null);
  b.click('#module-nav [data-module="diagnosis"]');
  b.show(2);
  const answer = b.doc.getElementById('case-answer');
  assert.ok(answer.textContent.length > 30);
  assert.equal(answer.closest('[hidden]'), null);
  b.d.window.close();
});
