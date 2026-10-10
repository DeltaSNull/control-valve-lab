const test = require('node:test'),
  assert = require('node:assert/strict');
const fs = require('node:fs');
const P = fs.existsSync(require('node:path').join(__dirname, '../js/pid.js')) ? require('../js/pid.js') : {};
test('A/B/C differ in immediate SP kick and share PV response', () => {
  const base = { op: 50, integral: 0, bias: 50, prevD: 0, derivative: 0 };
  const cfg = { kc: 2, ti: 1, td: 0.1, action: 'reverse' };
  const a = P.controllerStep(
    P.trackController(base, 50, 50, { ...cfg, equation: 'A' }),
    60,
    50,
    { ...cfg, equation: 'A' },
    0.1
  );
  const b = P.controllerStep(
    P.trackController(base, 50, 50, { ...cfg, equation: 'B' }),
    60,
    50,
    { ...cfg, equation: 'B' },
    0.1
  );
  const c = P.controllerStep(
    P.trackController(base, 50, 50, { ...cfg, equation: 'C' }),
    60,
    50,
    { ...cfg, equation: 'C' },
    0.1
  );
  assert.ok(a.op > b.op);
  assert.ok(b.op > 69);
  assert.ok(c.op < 51);
  const outputs = ['A', 'B', 'C'].map(equation => {
    const setup = { ...cfg, equation };
    return P.controllerStep(P.trackController(base, 50, 50, setup), 50, 51, setup, 0.1).op;
  });
  assert.ok(Math.abs(outputs[0] - outputs[1]) < 1e-8);
  assert.ok(Math.abs(outputs[1] - outputs[2]) < 1e-8);
});
test('manual tracking and auto transfer are bumpless even at error', () => {
  const cfg = { kc: 2, ti: 1, td: 0, equation: 'B', action: 'reverse' };
  const tracked = P.trackController({ op: 37, integral: 0, bias: 50 }, 60, 44, cfg);
  const next = P.controllerStep(tracked, 60, 44, cfg, 0);
  assert.equal(next.op, 37);
});
test('saturated controller rejects outward integration and recovers', () => {
  const cfg = { kc: 10, ti: 0.1, td: 0, equation: 'B', action: 'reverse' };
  let s = { op: 50, bias: 50, integral: 0, prevD: 0, derivative: 0 };
  for (let i = 0; i < 100; i++) s = P.controllerStep(s, 100, 0, cfg, 0.1);
  assert.equal(s.op, 100);
  assert.equal(s.integral, 0);
  s = P.controllerStep(s, 0, 100, cfg, 0.1);
  assert.equal(s.op, 0);
});
function response(k = 1) {
  return Array.from({ length: 1401 }, (_, i) => {
    const t = i * 0.1;
    return { t, op: t < 10 ? 50 : 60, pv: 50 + k * 10 * (t <= 14 ? 0 : 1 - Math.exp(-(t - 14) / 20)) };
  });
}
test('identification recovers gain, lag and delay from recorded crossings', () => {
  for (const k of [1, -0.8]) {
    const r = P.identifyStep(response(k), 10, 50, 60);
    assert.equal(r.ok, true);
    assert.ok(Math.abs(r.gain - k) < 0.01);
    assert.ok(Math.abs(r.tau - 20) < 0.4);
    assert.ok(Math.abs(r.delay - 4) < 0.4);
  }
});
test('no motion and unsettled traces are rejected', () => {
  assert.equal(P.identifyStep(response(0), 10, 50, 60).ok, false);
  assert.equal(P.identifyStep(response().slice(0, 400), 10, 50, 60).ok, false);
});
test('SIMC tuning returns minute-valued PI and correct sign of action', () => {
  const r = P.suggestPI({ gain: -2, tau: 30, delay: 5 }, 10);
  assert.equal(r.kc, 1);
  assert.equal(r.ti, 0.5);
  assert.equal(r.td, 0);
  assert.equal(r.action, 'direct');
});
test('plant separates OP travel and PV and delays a step', () => {
  let s = P.initial();
  const cfg = { gain: 1, tau: 20, delay: 4, defect: 'none', load: 0 };
  for (let i = 0; i < 30; i++) s = P.plantStep(s, 60, cfg, 0.1);
  assert.equal(s.pv, 50);
  assert.ok(s.travel > 59);
  for (let i = 0; i < 1200; i++) s = P.plantStep(s, 60, cfg, 0.1);
  assert.ok(Math.abs(s.pv - 60) < 0.1);
});
test('stiction prevents a small command and limited travel clips large commands', () => {
  let a = P.initial(),
    b = P.initial();
  for (let i = 0; i < 100; i++) {
    a = P.plantStep(a, 52, { gain: 1, tau: 20, delay: 0, defect: 'stiction', load: 0 }, 0.1);
    b = P.plantStep(b, 90, { gain: 1, tau: 20, delay: 0, defect: 'limited', load: 0 }, 0.1);
  }
  assert.equal(a.travel, 50);
  assert.ok(b.travel <= 55);
  assert.ok(b.pv < 55);
});
test('known travel clipping cannot produce a valid tuning recommendation', () => {
  const rows = response().map(r => ({ ...r, travel: Math.min(r.op, 55) }));
  assert.equal(P.identifyStep(rows, 10, 50, 60).ok, false);
});
test('baseline drift invalidates a step fit', () => {
  const rows = response();
  for (const r of rows) if (r.t < 10) r.pv = 45 + r.t;
  assert.equal(P.identifyStep(rows, 10, 50, 60).ok, false);
});
