// Generates the app icons from one drawing: the standard P&ID control-valve symbol
// (diaphragm actuator dome, stem, bow-tie globe body, pipe connections) in the app colors.
// Run with `npm run icons` where Playwright/Chromium is available. Output is committed, so
// ordinary builds and CI do not need a browser.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(base, 'icons');
const GREEN = '#143b32';
const LEAF = '#d9ec9f';

// Symbol in a 512 × 512 space, centered on (256, 256).
export function valveSymbol(fill = LEAF) {
  return `<g fill="${fill}">
    <path d="M164 202a92 92 0 0 1 184 0z"/>
    <rect x="160" y="196" width="192" height="16" rx="5"/>
    <rect x="246" y="206" width="20" height="124"/>
    <path d="M118 254L256 328L118 402zM394 254L256 328L394 402z"/>
    <rect x="64" y="316" width="62" height="24" rx="7"/>
    <rect x="386" y="316" width="62" height="24" rx="7"/>
  </g>`;
}
function icon({ rounded = false, scale = 1 }) {
  const shift = 256 * (1 - scale);
  const backdrop = rounded
    ? `<rect width="512" height="512" rx="112" fill="${GREEN}"/>`
    : `<rect width="512" height="512" fill="${GREEN}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${backdrop}<g transform="translate(${shift} ${shift}) scale(${scale})">${valveSymbol()}</g></svg>\n`;
}
// "any" icons are rounded tiles; maskable and Apple icons are full-bleed because the platform
// applies its own mask. Maskable content stays inside the 80% safe zone.
const variants = {
  'icon.svg': icon({ rounded: true }),
  'maskable.svg': icon({ scale: 0.8 }),
  'apple-touch.svg': icon({ scale: 0.86 })
};
const renders = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['maskable.svg', 'maskable-192.png', 192],
  ['maskable.svg', 'maskable-512.png', 512],
  ['apple-touch.svg', 'apple-touch-icon.png', 180]
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(out, { recursive: true });
  for (const [name, svg] of Object.entries(variants)) await writeFile(path.join(out, name), svg);
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    try {
      // Fall back to a globally installed Playwright.
      const { createRequire } = await import('node:module');
      const { execSync } = await import('node:child_process');
      const globalRoot = execSync('npm root -g').toString().trim();
      ({ chromium } = createRequire(path.join(globalRoot, 'noop.js'))('playwright'));
    } catch {
      console.error('SVG icons written. PNG rendering needs Playwright (npm i -g playwright).');
      process.exit(1);
    }
  }
  const browser = await chromium.launch();
  for (const [source, file, size] of renders) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${variants[source]}`
    );
    await page.screenshot({ path: path.join(out, file), omitBackground: true });
    await page.close();
  }
  await browser.close();
  console.log(`Wrote ${Object.keys(variants).length} SVG and ${renders.length} PNG icons to icons/`);
}
