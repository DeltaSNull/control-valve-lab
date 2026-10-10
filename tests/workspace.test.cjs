const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const { JSDOM } = require('jsdom');
function boot(hash = '#pid') {
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
    if (fs.existsSync('js/' + file + '.js'))
      vm.runInContext(fs.readFileSync('js/' + file + '.js', 'utf8'), d.getInternalVMContext());
  return {
    d,
    w,
    tick(seconds, hz = 60) {
      for (let i = 0; i < seconds * hz; i++) {
        now += 1000 / hz;
        const batch = [...callbacks.values()];
        callbacks.clear();
        batch.forEach(f => f(now));
      }
    },
    click(q) {
      const el = w.document.querySelector(q);
      assert.ok(el, q);
      el.click();
    },
    input(id, value) {
      const el = w.document.getElementById(id);
      assert.ok(el, id);
      el.value = value;
      el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    }
  };
}
test('every module offers demo/custom and a separate observation and controls workspace', () => {
  const b = boot('#anatomy');
  for (const m of ['anatomy', 'friction', 'flow', 'trim', 'positioner', 'diagnosis', 'pid']) {
    b.click('[data-module="' + m + '"]');
    assert.ok(b.w.document.querySelector('.lab-observation'));
    assert.ok(b.w.document.querySelector('[data-action="demo"]'));
    assert.ok(b.w.document.querySelector('[data-action="custom"]'));
    b.click('[data-action="demo"]');
    b.tick(0.3);
    b.click('[data-action="custom"]');
    assert.equal(b.w.ValveLab.getState().demo, null);
  }
  b.d.window.close();
});
test('PID one-button step test estimates measured process and transfers minute tuning', () => {
  const b = boot();
  b.click('[data-action="demo"]');
  b.tick(20);
  const s = b.w.ValveLab.getState();
  assert.equal(s.pid.running, false);
  assert.equal(s.pid.estimate.ok, true);
  assert.ok(Math.abs(s.pid.estimate.gain - 1) < 0.03);
  b.click('[data-action="pid-apply"]');
  assert.equal(s.pid.stage, 'tune');
  assert.ok(s.pid.cfg.ti > 0.2 && s.pid.cfg.ti < 0.5);
  const before = s.pid.op;
  b.click('[data-action="pid-auto"]');
  assert.equal(s.pid.controller.op, before);
  b.tick(0.1);
  b.input('pid-sp', '60');
  b.tick(2);
  assert.ok(s.pid.controller.op > before);
  b.click('[data-action="pid-manual"]');
  assert.equal(s.pid.mode, 'manual');
  b.d.window.close();
});
test('custom cancels demo and module navigation pauses PID', () => {
  const b = boot();
  b.click('[data-action="demo"]');
  b.tick(1);
  b.click('[data-action="custom"]');
  const t = b.w.ValveLab.getState().pid.plant.t;
  b.tick(1);
  assert.equal(b.w.ValveLab.getState().pid.plant.t, t);
  b.click('[data-action="pid-run"]');
  b.click('[data-module="flow"]');
  b.tick(1);
  assert.equal(b.w.ValveLab.getState().pid.running, false);
  b.d.window.close();
});
test('fixed-rate friction record retains a complete slow sweep at 30 and 120 Hz', () => {
  for (const hz of [30, 120]) {
    const b = boot('#friction');
    b.input('friction-speed', '1');
    b.click('[data-action="sweep"]');
    b.tick(161, hz);
    const rows = b.w.ValveLab.getState().friction.history;
    assert.ok(rows.some(r => r.command > 89));
    assert.ok(rows.some(r => r.t < 2));
    assert.ok(rows.length < 4000);
    b.d.window.close();
  }
});
test('view buttons and settings preserve control identity and expose pressed state', () => {
  const b = boot('#flow');
  const doc = b.w.document;
  assert.equal(doc.querySelectorAll('#flow-cvmax').length, 1, 'controls are never duplicated');
  assert.ok(doc.getElementById('flow-rangeability').closest('details.settings'), 'advanced settings are folded away');
  b.click('[data-view="1"]');
  assert.equal(doc.querySelector('[data-view="1"]').getAttribute('aria-pressed'), 'true');
  assert.equal(doc.querySelector('[data-observation="1"]').hidden, false);
  assert.equal(doc.querySelector('[data-observation="0"]').hidden, true);
  b.input('flow-travel', '80');
  assert.match(doc.getElementById('flow-q').textContent, /\d/);
  b.d.window.close();
});
test('positioner edits run until settled and report it', () => {
  const b = boot('#positioner');
  b.input('position-load', '2');
  b.tick(20);
  const p = b.w.ValveLab.getState().positioner;
  assert.equal(p.running, false, 'the loop stops once the valve settles');
  assert.ok(Math.abs(p.motion.position - 50) < 0.5, 'feedback restores the requested travel');
  assert.match(b.w.document.getElementById('position-status').textContent, /settled/);
  b.d.window.close();
});
test('a view change does not cancel a running demo', () => {
  const b = boot('#friction');
  b.click('[data-action="demo"]');
  b.tick(0.5);
  b.click('[data-view="1"]');
  assert.ok(b.w.ValveLab.getState().demo, 'demo keeps running');
  assert.equal(b.w.document.querySelector('[data-action="custom"]').hidden, false, 'Stop is offered while running');
  b.click('[data-action="custom"]');
  assert.equal(b.w.ValveLab.getState().demo, null);
  assert.equal(b.w.document.querySelector('[data-action="demo"]').hidden, false);
  b.d.window.close();
});
test('a load change invalidates a step recording and its old estimate', () => {
  const b = boot();
  b.click('[data-action="pid-record"]');
  b.tick(0.5);
  b.click('[data-action="pid-step"]');
  const s = b.w.ValveLab.getState();
  assert.ok(s.pid.test);
  b.click('[data-action="pid-load"]');
  assert.equal(s.pid.test, null);
  assert.equal(s.pid.estimate, null);
  b.click('[data-action="pid-estimate"]');
  assert.equal(s.pid.estimate.ok, false);
  b.d.window.close();
});
test('derivative preset enables A/B comparison while PI preset disables derivative', () => {
  const b = boot();
  b.click('[data-action="pid-stage-tune"]');
  b.click('[data-action="pid-preset-derivative"]');
  assert.ok(b.w.ValveLab.getState().pid.cfg.td > 0);
  b.click('[data-action="pid-preset-pi"]');
  assert.equal(b.w.ValveLab.getState().pid.cfg.td, 0);
  b.d.window.close();
});
