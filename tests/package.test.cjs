const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs');
const { JSDOM } = require('jsdom');
test('standalone package boots the PID workspace without external runtime scripts', () => {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/);
  const d = new JSDOM(html, { url: 'https://example.test/#pid', runScripts: 'dangerously', pretendToBeVisual: true });
  assert.ok(d.window.ValvePID);
  assert.ok(d.window.document.getElementById('pid-trend'));
  assert.ok(d.window.document.querySelector('.lab-observation'));
  d.window.close();
});
