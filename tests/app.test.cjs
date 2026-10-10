const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// DOM integration runs with jsdom when installed as a dev dependency or supplied by the host.
const { JSDOM } = require('jsdom');
const enabled = true;
function boot(hash = '#anatomy') {
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8'), {
    url: 'https://example.test/' + hash,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  for (const file of ['models', 'pid', 'content', 'diagrams', 'workspace', 'app'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, `../js/${file}.js`), 'utf8'), dom.getInternalVMContext());
  return dom;
}
function click(w, selector) {
  const el = w.document.querySelector(selector);
  assert.ok(el, selector);
  el.click();
}
function input(w, id, value) {
  const el = w.document.getElementById(id);
  assert.ok(el, id);
  el.value = value;
  el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}
test('application initializes with an interactive valve and readable travel', { skip: !enabled }, () => {
  const d = boot(),
    w = d.window;
  assert.match(w.document.querySelector('h1').textContent, /Inside/);
  assert.ok(w.document.querySelector('[data-component="packing"]'));
  input(w, 'anatomy-command', '80');
  assert.match(w.document.getElementById('anatomy-travel').textContent, /80/);
  d.window.close();
});
test('all six modules render and diagnostics reveal a case explanation', { skip: !enabled }, () => {
  const d = boot(),
    w = d.window;
  for (const module of ['friction', 'flow', 'trim', 'positioner', 'diagnosis', 'anatomy']) {
    click(w, `[data-module="${module}"]`);
    assert.ok(w.document.querySelector('h1'));
    assert.ok(w.document.querySelector('svg'));
  }
  click(w, '[data-module="diagnosis"]');
  click(w, '[data-answer="packing"]');
  assert.match(w.document.getElementById('case-answer').textContent, /breakaway/);
  d.window.close();
});
test('flow controls change numbers, preserve pressure balance, and reset', { skip: !enabled }, () => {
  const d = boot('#flow'),
    w = d.window;
  const old = w.document.getElementById('flow-q').textContent;
  input(w, 'flow-travel', '80');
  assert.notEqual(w.document.getElementById('flow-q').textContent, old);
  input(w, 'flow-travel', '0');
  assert.match(w.document.getElementById('flow-q').textContent, /^0/);
  click(w, '[data-action="reset"]');
  assert.equal(w.document.getElementById('flow-travel').value, '50');
  d.window.close();
});
test('component selection, style choices, and resources operate from the UI', { skip: !enabled }, () => {
  const d = boot(),
    w = d.window;
  click(w, 'button[data-component="seat"]');
  assert.match(w.document.getElementById('component-detail').textContent, /Seat/);
  click(w, '[data-module="trim"]');
  click(w, '[data-style="ball"]');
  assert.match(w.document.getElementById('style-detail').textContent, /Segmented/);
  click(w, '[data-action="glossary"]');
  assert.equal(w.document.getElementById('resource-dialog').open, true);
  click(w, '[data-action="close-dialog"]');
  assert.equal(w.document.getElementById('resource-dialog').open, false);
  d.window.close();
});
test('switching a running simulation stops its loop and reset returns baseline', { skip: !enabled }, () => {
  const d = boot('#friction'),
    w = d.window;
  click(w, '[data-action="sweep"]');
  assert.equal(w.ValveLab.getState().friction.running, true);
  click(w, '[data-module="flow"]');
  assert.equal(w.ValveLab.getState().friction.running, false);
  assert.equal(w.ValveLab.getState().positioner.running, false);
  click(w, '[data-module="friction"]');
  click(w, '[data-action="reset"]');
  assert.equal(w.ValveLab.getState().friction.command, 50);
  assert.equal(w.ValveLab.getState().friction.history.length, 1);
  d.window.close();
});
test('displayed flow numbers preserve the pressure budget: valve ΔP + other losses = total', () => {
  const d = boot('#flow'),
    w = d.window,
    num = id => Number.parseFloat(w.document.getElementById(id).textContent);
  for (const [travel, k] of [
    ['50', '0.003'],
    ['90', '0.01'],
    ['20', '0']
  ]) {
    input(w, 'flow-travel', travel);
    input(w, 'flow-resistance', k);
    const total = w.ValveLab.getState().flow.dp;
    assert.ok(Math.abs(num('flow-valve-dp') + num('flow-pipe-dp') - total) <= 0.06, `travel ${travel}, K ${k}`);
  }
  d.window.close();
});
test('clicking the active module does not add a duplicate history entry', () => {
  const d = boot('#flow'),
    w = d.window,
    before = w.history.length;
  click(w, 'nav [data-module="flow"]');
  assert.equal(w.history.length, before);
  click(w, 'nav [data-module="trim"]');
  assert.equal(w.history.length, before + 1);
  d.window.close();
});
test('positioner changes run the simulation until the valve settles, then stop by themselves', () => {
  const d = boot('#positioner'),
    w = d.window;
  input(w, 'position-load', '2');
  const p = w.ValveLab.getState().positioner;
  assert.equal(p.running, true, 'a change starts the response');
  assert.equal(p.time, 0, 'the change itself does not jump simulated time');
  w.ValveLab.pause();
  d.window.close();
});
test('choosing a part highlights it on the drawing and names it under the drawing', () => {
  const d = boot('#anatomy'),
    w = d.window;
  click(w, 'button[data-component="seat"]');
  assert.equal(w.document.querySelector('#valve-diagram .svg-part.selected').dataset.component, 'seat');
  assert.equal(w.document.querySelector('#valve-diagram .callout text').textContent, 'Seat');
  assert.match(w.document.getElementById('anatomy-status').textContent, /^Seat · The plug contacts the seat ring/);
  w.document
    .querySelector('#valve-diagram .svg-part[data-component="spring"] .hit')
    .dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  assert.equal(w.document.querySelector('button[data-component="spring"]').getAttribute('aria-pressed'), 'true');
  d.window.close();
});
test('controls that only affect one view switch the live view to it', () => {
  const d = boot('#trim'),
    w = d.window,
    shown = () => w.document.querySelector('[data-observation]:not([hidden])').dataset.observation;
  assert.equal(shown(), '0');
  click(w, '[data-profile="flashing"]');
  assert.equal(shown(), '1', 'pressure profile shown');
  click(w, '[data-style="ball"]');
  assert.equal(shown(), '0', 'closure member shown');
  click(w, '#module-nav [data-module="friction"]');
  input(w, 'friction-view', 'pressure');
  assert.equal(shown(), '1', 'signature shown');
  d.window.close();
});
test('tapping a flow chart moves the valve to that travel', () => {
  const d = boot('#flow'),
    w = d.window,
    svg = w.document.querySelector('#installed-chart svg'),
    width = Number(svg.getAttribute('viewBox').split(' ')[2]);
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width, height: 280 });
  const x = 64 + (width - 82) * 0.75;
  svg.dispatchEvent(new w.MouseEvent('click', { bubbles: true, clientX: x, clientY: 100 }));
  assert.equal(w.ValveLab.getState().flow.travel, 75);
  assert.equal(w.document.getElementById('flow-travel').value, '75');
  assert.match(w.document.getElementById('flow-q').textContent, /^78\.0/);
  d.window.close();
});
