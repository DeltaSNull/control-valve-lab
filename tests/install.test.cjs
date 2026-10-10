const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
// PNG header: width/height at bytes 16–23, color type at byte 25 (2 = RGB, 6 = RGBA).
function png(file) {
  const b = fs.readFileSync(file);
  assert.equal(b.toString('ascii', 1, 4), 'PNG', file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), alpha: b[25] === 6 };
}
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

test('the web app manifest describes an installable, standalone app with the valve icon', () => {
  assert.equal(manifest.name, 'Control Valve Lab');
  assert.ok(manifest.short_name.length <= 12, 'short name fits under a home-screen icon');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.match(html, new RegExp(`name="theme-color" content="${manifest.theme_color}"`));
  for (const [size, purpose] of [
    ['192x192', 'any'],
    ['512x512', 'any'],
    ['512x512', 'maskable']
  ])
    assert.ok(
      manifest.icons.some(i => i.sizes === size && i.purpose === purpose && i.type === 'image/png'),
      `${purpose} ${size}`
    );
  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(icon.src), icon.src);
    if (icon.type !== 'image/png') continue;
    const p = png(icon.src),
      [w, h] = icon.sizes.split('x').map(Number);
    assert.deepEqual([p.width, p.height], [w, h], icon.src);
    if (icon.purpose === 'maskable') assert.equal(p.alpha, false, 'maskable icons are full-bleed');
  }
});

test('the page links the valve icon for browser tabs, iPhone home screens and installs', () => {
  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="icons\/icon.svg">/);
  assert.match(html, /<link rel="manifest" href="manifest.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon.png">/);
  assert.match(html, /name="apple-mobile-web-app-title" content="Valve Lab"/);
  const touch = png('icons/apple-touch-icon.png');
  assert.deepEqual([touch.width, touch.height, touch.alpha], [180, 180, false], 'iOS wants an opaque 180 px icon');
  // Every icon draws the same control-valve symbol: dome actuator, stem and bow-tie body.
  for (const f of ['icon.svg', 'maskable.svg', 'apple-touch.svg']) {
    const svg = fs.readFileSync(path.join('icons', f), 'utf8');
    assert.match(svg, /a92 92 0 0 1 184 0z/, `${f} actuator dome`);
    assert.match(svg, /M118 254L256 328L118 402zM394 254L256 328L394 402z/, `${f} bow-tie body`);
  }
});

test('the standalone build embeds its icons and ships the manifest beside it', () => {
  const dist = fs.readFileSync('dist/index.html', 'utf8');
  assert.doesNotMatch(dist, /href="icons\//, 'single file has no icon file references');
  assert.match(dist, /rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml;base64,/);
  assert.match(dist, /rel="apple-touch-icon" href="data:image\/png;base64,/);
  assert.deepEqual(JSON.parse(fs.readFileSync('dist/manifest.webmanifest', 'utf8')), manifest);
  for (const icon of manifest.icons)
    assert.ok(fs.readFileSync(path.join('dist', icon.src)).equals(fs.readFileSync(icon.src)), icon.src);
});

test('the app does not zoom: viewport, touch-action, 16 px fields and blocked pinch gestures', () => {
  assert.match(html, /name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/);
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /html \{\s*touch-action: pan-x pan-y;/, 'no pinch or double-tap zoom on touch screens');
  assert.match(css, /input,\s*select,\s*textarea \{\s*font-size: 16px !important;/, 'phones do not zoom into fields');
  const { JSDOM } = require('jsdom'),
    vm = require('node:vm');
  const d = new JSDOM(html, { url: 'https://example.test/#flow', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = d.window;
  w.matchMedia = () => ({ matches: false });
  for (const f of ['models', 'pid', 'content', 'diagrams', 'workspace', 'app'])
    vm.runInContext(fs.readFileSync(`js/${f}.js`, 'utf8'), d.getInternalVMContext());
  const fire = (type, init) => {
    const ev = new w.Event(type, { bubbles: true, cancelable: true });
    Object.assign(ev, init);
    w.document.body.dispatchEvent(ev);
    return ev.defaultPrevented;
  };
  assert.equal(fire('gesturestart', {}), true, 'Safari pinch blocked');
  const zoomWheel = new w.WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true });
  w.document.body.dispatchEvent(zoomWheel);
  assert.equal(zoomWheel.defaultPrevented, true, 'trackpad pinch / Ctrl+wheel blocked');
  const scrollWheel = new w.WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
  w.document.body.dispatchEvent(scrollWheel);
  assert.equal(scrollWheel.defaultPrevented, false, 'ordinary scrolling still works');
  d.window.close();
});
