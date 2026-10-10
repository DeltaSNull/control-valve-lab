import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let html = await readFile(path.join(base, 'index.html'), 'utf8');
const css = await readFile(path.join(base, 'styles.css'), 'utf8');
const files = ['models', 'pid', 'content', 'diagrams', 'workspace', 'app'];
const scripts = await Promise.all(files.map(f => readFile(path.join(base, `js/${f}.js`), 'utf8')));
html = html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`);
html = html.replace(/\s*<script defer src="js\/[^\"]+"><\/script>/g, '');
html = html.replace(
  '</body>',
  `<script>\n${scripts.join('\n').replace(/<\/script/gi, '<\\/script')}\n</script>\n</body>`
);
// Embed the tab and iPhone home-screen icons so the single file works on its own.
const iconSvg = await readFile(path.join(base, 'icons/icon.svg'));
const touchIcon = await readFile(path.join(base, 'icons/apple-touch-icon.png'));
html = html.replace('href="icons/icon.svg"', `href="data:image/svg+xml;base64,${iconSvg.toString('base64')}"`);
html = html.replace(
  'href="icons/apple-touch-icon.png"',
  `href="data:image/png;base64,${touchIcon.toString('base64')}"`
);
// The manifest and its icons sit beside dist/index.html so a hosted dist folder can be saved as an app.
await mkdir(path.join(base, 'dist/icons'), { recursive: true });
await writeFile(path.join(base, 'dist/index.html'), html);
const manifest = JSON.parse(await readFile(path.join(base, 'manifest.webmanifest'), 'utf8'));
await copyFile(path.join(base, 'manifest.webmanifest'), path.join(base, 'dist/manifest.webmanifest'));
for (const icon of manifest.icons) await copyFile(path.join(base, icon.src), path.join(base, 'dist', icon.src));
console.log(
  `Packaged dist/index.html (${Buffer.byteLength(html).toLocaleString()} bytes; no external runtime dependencies; manifest and ${manifest.icons.length} icons copied)`
);
