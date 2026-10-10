const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const { JSDOM } = require('jsdom');
const M = require('../js/models.js');
const STORE = 'control-valve-lab:progress:v1';
// Boot the app, optionally with saved progress already in this browser's storage.
function boot(hash = '', saved) {
  const d = new JSDOM(fs.readFileSync('index.html', 'utf8'), {
    url: 'https://example.test/' + hash,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const w = d.window;
  w.matchMedia = () => ({ matches: false });
  w.requestAnimationFrame = () => 0;
  w.cancelAnimationFrame = () => {};
  if (saved !== undefined) w.localStorage.setItem(STORE, saved);
  for (const f of ['models', 'pid', 'content', 'diagrams', 'workspace', 'app'])
    vm.runInContext(fs.readFileSync(`js/${f}.js`, 'utf8'), d.getInternalVMContext());
  const doc = w.document;
  return {
    d,
    w,
    doc,
    state: () => w.ValveLab.getState(),
    click(q) {
      const el = doc.querySelector(q);
      assert.ok(el, q);
      el.click();
    },
    text: id => doc.getElementById(id).textContent,
    saved: () => w.localStorage.getItem(STORE)
  };
}
const C = (() => {
  const ctx = {};
  vm.runInNewContext(fs.readFileSync('js/content.js', 'utf8'), ctx);
  return ctx.ValveContent;
})();
function finishLesson(b, id) {
  b.click(`#module-nav [data-module="${id}"]`);
  for (let i = 0; i < C.guides[id].length - 1; i++) b.click('[data-action="guide-next"]');
  b.click(`[data-guide-step="${C.guides[id].length - 1}"]`);
  // Marking the last step done: Show me would also work, but Next is not offered on the last step.
  b.state().guide[id].done.push(C.guides[id].length - 1);
  C.quizzes[id].forEach((q, qi) => b.click(`[data-quiz="${qi}:${q.answer}"]`));
}

test('every lesson has three well-formed knowledge-check questions', () => {
  for (const id of Object.keys(C.modules)) {
    assert.equal(C.quizzes[id].length, 3, id);
    for (const q of C.quizzes[id]) {
      assert.ok(q.q.endsWith('?'), q.q);
      assert.ok(q.options.length >= 3 && Number.isInteger(q.answer) && q.options[q.answer], q.q);
      assert.equal(new Set(q.options).size, q.options.length, 'distinct options');
      assert.ok(q.explain.length > 30, q.q);
    }
  }
});

test('numbers quoted in knowledge-check explanations match the models', () => {
  const flow = travel => M.liquidFlow(M.cvAt(travel, 'equal', 80, 50), 25, 1, 0.003);
  assert.equal(flow(50).valveDp.toFixed(1), '18.1');
  assert.equal(flow(75).valveDp.toFixed(1), '6.7');
  assert.ok(M.cvAt(75, 'equal', 80, 50) / M.cvAt(50, 'equal', 80, 50) > 2.5, 'nearly triples Cv');
  assert.equal(Math.round(((flow(75).flow / flow(50).flow - 1) * 100) / 10) * 10, 60, 'about 60% more flow');
  const big = M.liquidFlow(M.cvAt(25, 'linear', 300, 50), 25, 1, 0.003).flow,
    max = M.liquidFlow(300, 25, 1, 0.003).flow;
  assert.deepEqual([Math.round(big), Math.round(max)], [89, 91]);
  let s = { position: 50, pressure: 9, integral: 0, velocity: 0 };
  for (let t = 0; t < 20; t += 0.05) s = M.positionerStep(s, 50, { type: 'ip', load: 2 }, 0.05);
  assert.equal(Math.round(s.position), 34);
  for (const id of ['flow', 'positioner'])
    assert.ok(
      C.quizzes[id].some(q => /\d/.test(q.explain)),
      id
    );
});

test('answering a knowledge check gives feedback, keeps score and allows another try', () => {
  const b = boot('#friction');
  const q = C.quizzes.friction[0],
    wrong = (q.answer + 1) % q.options.length;
  b.click(`[data-quiz="0:${wrong}"]`);
  assert.match(b.text('quiz-feedback-0'), /Not quite/);
  assert.ok(b.doc.querySelector(`[data-quiz="0:${wrong}"]`).classList.contains('incorrect'));
  assert.match(b.text('quiz-score'), /0 of 3 correct/);
  b.click(`[data-quiz="0:${q.answer}"]`);
  assert.match(b.text('quiz-feedback-0'), /^Correct\./);
  assert.ok(b.text('quiz-feedback-0').includes(q.explain));
  assert.equal(b.doc.querySelector(`[data-quiz="0:${q.answer}"]`).getAttribute('aria-pressed'), 'true');
  assert.match(b.text('quiz-score'), /1 of 3 correct/);
  b.d.window.close();
});

test('progress is saved in this browser and restored on the next visit', () => {
  const a = boot('#trim');
  a.click('[data-action="guide-next"]');
  a.click(`[data-quiz="1:${C.quizzes.trim[1].answer}"]`);
  const saved = a.saved();
  a.d.window.close();
  assert.ok(saved, 'progress written to storage');
  const b = boot('#trim', saved);
  assert.match(b.doc.querySelector('.kicker').textContent, /step 2 of 4/);
  assert.ok(b.doc.querySelector('[data-guide-step="0"]').classList.contains('done'));
  assert.match(b.text('quiz-score'), /1 of 3 correct/);
  b.click('#module-nav [data-module="home"]');
  assert.match(b.doc.querySelector('.progress-panel').textContent, /0 of 7 lessons complete/);
  assert.match(b.doc.querySelector('.lesson-card[data-module="trim"] .lesson-status').textContent, /steps 1\/4/);
  b.d.window.close();
});

test('corrupt or out-of-range saved progress is ignored safely', () => {
  const corrupt = boot('#flow', '{not json');
  assert.equal(corrupt.state().module, 'flow');
  assert.deepEqual(
    JSON.parse(JSON.stringify(corrupt.state().guide.flow)),
    { step: 0, done: [], quiz: {} },
    'unreadable storage starts fresh'
  );
  corrupt.d.window.close();
  const odd = boot(
    '#flow',
    JSON.stringify({ lessons: { flow: { step: 99, done: [7, -1, 'x', 1, 1], quiz: { 5: 0, 0: 9, 1: 0 } } } })
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(odd.state().guide.flow)),
    { step: 0, done: [1], quiz: { 1: 0 } },
    'only valid entries survive'
  );
  odd.d.window.close();
});
test('a lesson completes with all steps and answers, the home page offers Continue, and reset needs two taps', () => {
  const b = boot('#anatomy');
  finishLesson(b, 'anatomy');
  assert.match(b.text('quiz-score'), /Lesson complete/);
  b.click('#module-nav [data-module="home"]');
  assert.match(b.doc.querySelector('.progress-panel').textContent, /1 of 7 lessons complete/);
  assert.ok(b.doc.querySelector('.lesson-card[data-module="anatomy"]').classList.contains('is-complete'));
  assert.equal(b.doc.querySelector('.progress-panel .button.primary').dataset.module, 'friction');
  b.click('[data-action="reset-progress"]');
  assert.ok(b.doc.querySelector('.progress-panel'), 'first tap only asks for confirmation');
  assert.match(b.doc.querySelector('[data-action="reset-progress"]').textContent, /again/);
  b.click('[data-action="reset-progress"]');
  assert.equal(b.doc.querySelector('.progress-panel'), null);
  assert.deepEqual(JSON.parse(b.saved()).lessons, {});
  b.d.window.close();
});

test('the managers & trainers page has session plans, team questions and a training record', () => {
  const b = boot('#training');
  assert.equal(b.state().module, 'training');
  assert.match(b.doc.querySelector('h1').textContent, /team/);
  assert.equal(b.doc.querySelectorAll('.impact-card').length, C.training.impact.length);
  assert.equal(b.doc.querySelectorAll('.format-card').length, 3);
  assert.equal(b.doc.querySelectorAll('.team-questions li').length, C.training.questions.length);
  assert.equal(b.doc.querySelectorAll('#training-record tbody tr').length, 7);
  const name = b.doc.getElementById('learner-name');
  name.value = 'A. Technician';
  name.dispatchEvent(new b.w.Event('input', { bubbles: true }));
  assert.match(b.text('record-print-line'), /Name: A\. Technician/);
  assert.equal(JSON.parse(b.saved()).learner, 'A. Technician');
  assert.ok(b.doc.querySelector('#module-nav [data-module="training"]').classList.contains('active'));
  b.d.window.close();
});

test('every lesson prints all four guided steps, and the release label matches package.json', () => {
  const b = boot('#flow');
  assert.equal(b.doc.querySelectorAll('.print-steps li').length, C.guides.flow.length);
  assert.ok(b.doc.querySelector('[data-action="print"]'));
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.equal(C.release.version, pkg.version);
  assert.match(b.text('app-version'), new RegExp(pkg.version.replace(/\./g, '\\.')));
  b.d.window.close();
});
