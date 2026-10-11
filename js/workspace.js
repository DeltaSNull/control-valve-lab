(function (root) {
  'use strict';
  // Shared lesson layout. Every lesson uses the same structure so learners only learn it once:
  // a live view (view buttons, plot, key numbers, run controls) beside a guided activity and the controls.
  const $ = id => document.getElementById(id);
  const C = root.ValveContent;
  const learningModes = {};
  function learning(mode = learningModes[document.body.dataset.page] || 'guided') {
    learningModes[document.body.dataset.page] = mode;
    document
      .querySelectorAll('[data-learning]')
      .forEach(el => el.setAttribute('aria-pressed', String(el.dataset.learning === mode)));
    const guide = document.querySelector('.guide');
    if (guide) guide.hidden = mode !== 'guided';
    const controls = document.querySelector('.lab-controls');
    if (controls) controls.hidden = mode !== 'explore';
  }
  function lab(o) {
    const views = o.views;
    const switcher =
      views.length > 1
        ? `<div class="view-switch" role="group" aria-label="Choose what to show">${views
            .map((v, i) => `<button type="button" data-view="${i}" aria-pressed="${i === 0}">${v.label}</button>`)
            .join('')}</div>`
        : `<p class="view-title">${views[0].label}</p>`;
    return `<div class="lab">
      <section class="lab-observation" aria-label="Live view">
        <div class="live-head">${switcher}</div>
        <div class="observation-plots">${views
          .map(
            (v, i) =>
              `<div class="observation-panel" data-observation="${i}" aria-label="${v.label}"${i ? ' hidden' : ''}>${v.html}</div>`
          )
          .join('')}</div>
        ${o.metrics ? `<div class="observation-metrics"><div class="kpi-grid">${o.metrics}</div>${o.extra ?? ''}</div>` : ''}
        ${o.transport || o.status ? `<div class="live-foot">${o.transport ?? ''}${o.status ?? ''}</div>` : ''}
      </section>
      <div class="lab-side">
        <div class="learning-switch segmented" role="group" aria-label="How would you like to learn?">
          <button type="button" data-learning="guided" aria-pressed="true">Learn step by step</button>
          <button type="button" data-learning="explore" aria-pressed="false">Explore controls</button>
        </div>
        <div class="demo-row card" aria-label="Automated demonstration">
          <button type="button" data-action="demo">▶ Watch the full demo</button>
          <button type="button" data-action="demo-toggle" hidden>❚❚ Pause demo</button>
          <button type="button" data-action="custom" hidden>■ Stop demo</button>
          <progress id="demo-progress" max="100" value="0" aria-label="Demo progress" hidden></progress>
          <span id="demo-status" role="status"></span>
        </div>
        <section class="card guide" aria-labelledby="guide-title">
          <div id="guide-step"></div>
        </section>
        ${o.feedback || ''}
        <section class="card lab-controls" aria-labelledby="controls-title">
          <h2 id="controls-title" class="section-label">Controls</h2>
          ${o.controls}
          ${
            o.settings
              ? `<details class="settings"><summary>More settings</summary><div class="settings-body">${o.settings}</div></details>`
              : ''
          }
        </section>
      </div>
    </div>`;
  }
  // One guided step: what to do, what to look for, and why it matters, with step navigation.
  function guide(module, index, done, next) {
    const steps = C.guides[module],
      s = steps[index],
      last = index === steps.length - 1;
    const dots = steps
      .map(
        (step, i) =>
          `<li><button type="button" data-guide-step="${i}" class="${done.includes(i) ? 'done' : ''}"${
            i === index ? ' aria-current="step"' : ''
          } aria-label="Step ${i + 1}: ${step.title}${done.includes(i) ? ' (done)' : ''}">${done.includes(i) ? '✓' : i + 1}</button></li>`
      )
      .join('');
    const forward = last
      ? next
        ? `<a class="button" href="#${next}" data-module="${next}">Next lesson →</a>`
        : `<a class="button" href="#home" data-module="home">All lessons →</a>`
      : `<button type="button" data-action="guide-next">Next step →</button>`;
    return `<div class="guide-top"><p class="kicker">Guided activity · step ${index + 1} of ${steps.length}</p><ol class="guide-dots" aria-label="Guided steps">${dots}</ol></div>
      <h2 id="guide-title">${s.title}</h2>
      <dl class="guide-body">
        <div><dt>Try it</dt><dd>${s.do}</dd></div>
        <div><dt>Look for</dt><dd>${s.look}</dd></div>
        <div><dt>Why it matters</dt><dd>${s.why}</dd></div>
      </dl>
      <p id="guide-note" class="guide-note" role="status"></p>
      <div class="guide-actions">
        <button type="button" class="primary" data-action="guide-show">Show me</button>
        <button type="button" data-action="guide-prev"${index === 0 ? ' disabled' : ''}>← Back</button>
        ${forward}
      </div>`;
  }
  function setPlot(index) {
    document
      .querySelectorAll('[data-observation]')
      .forEach(el => (el.hidden = el.dataset.observation !== String(index)));
    document
      .querySelectorAll('[data-view]')
      .forEach(el => el.setAttribute('aria-pressed', String(el.dataset.view === String(index))));
  }
  function currentPlot() {
    return Number(document.querySelector('[data-view][aria-pressed="true"]')?.dataset.view ?? 0);
  }
  function syncSelections() {
    document
      .querySelectorAll(
        'button[data-component],button[data-friction],button[data-style],button[data-profile],button[data-positioner]'
      )
      .forEach(el => el.setAttribute('aria-pressed', String(el.classList.contains('selected'))));
  }
  // Demo state: the Stop button only appears while a demo runs; the status line narrates it.
  function mode(demo, text, progress = 0, paused = false) {
    const focused = document.activeElement;
    const bar = $('demo-progress');
    if (bar) {
      bar.hidden = !demo;
      bar.value = progress;
    }
    const toggle = document.querySelector('[data-action="demo-toggle"]');
    if (toggle) {
      toggle.hidden = !demo;
      toggle.textContent = paused ? '▶ Resume demo' : '❚❚ Pause demo';
    }
    const status = $('demo-status');
    if (status && status.textContent !== text) status.textContent = text;
    const play = document.querySelector('[data-action="demo"]'),
      stop = document.querySelector('[data-action="custom"]');
    if (play) {
      play.hidden = demo;
      play.setAttribute('aria-pressed', String(demo));
    }
    if (stop) {
      stop.hidden = !demo;
      stop.setAttribute('aria-pressed', String(!demo));
    }
    if (focused?.hidden && [play, stop, toggle].includes(focused))
      (demo ? toggle : play)?.focus({ preventScroll: true });
  }
  root.ValveWorkspace = { lab, guide, setPlot, currentPlot, syncSelections, mode, learning };
})(window);
