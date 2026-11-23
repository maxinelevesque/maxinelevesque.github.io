// Stage a static, self-contained copy for Tailscale Serve. Serving this copy
// needs no Node/dev-server process and is independent of future dist/ builds.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = join(root, 'dist');
const destination = join(root, '.local-demo', 'site');
const demo = 'research/essay-format-sample.html';
if (!existsSync(join(source, demo))) throw new Error('Build first: WRITING_SRC=../writing node scripts/build-essay-sample.mjs');
rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });

const fonts = join(destination, '_demo-fonts');
mkdirSync(fonts, { recursive: true });
let fontCSS = '';
for (const weight of [400, 500, 600]) {
  for (const style of ['normal', 'italic']) {
    const name = `eb-garamond-latin-${weight}-${style}.woff2`;
    cpSync(join(root, 'node_modules/@fontsource/eb-garamond/files', name), join(fonts, name));
    fontCSS += `@font-face{font-family:'EB Garamond';font-style:${style};font-weight:${weight};font-display:swap;src:url('/_demo-fonts/${name}') format('woff2')}\n`;
  }
}
writeFileSync(join(fonts, 'fonts.css'), fontCSS);
cpSync(join(root, 'node_modules/@fontsource/eb-garamond/LICENSE'), join(fonts, 'EB-Garamond-LICENSE.txt'));
cpSync(join(root, 'node_modules/katex/dist/katex.min.css'), join(fonts, 'katex.min.css'));
cpSync(join(root, 'node_modules/katex/dist/fonts'), join(fonts, 'fonts'), { recursive: true });

for (const relative of readdirSync(destination, { recursive: true })) {
  const path = join(destination, relative);
  if (!statSync(path).isFile()) continue;
  if (relative.endsWith('.css')) {
    // Font URLs contain semicolons inside quotes (weight/style tuples), so the
    // whole quoted URL must be consumed before finding the rule terminator.
    const css = readFileSync(path, 'utf8').replace(/@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;/g,
      (rule) => /https?:\/\//.test(rule) ? '' : rule);
    writeFileSync(path, css);
  }
  if (!relative.endsWith('.html')) continue;
  let html = readFileSync(path, 'utf8');
  // Keep private hosts and paths out of third-party font/CDN requests. Local
  // copies use the same family/weights as the current public site.
  html = html.replace(/<link\b(?=[^>]*rel="stylesheet")(?=[^>]*href="https?:)[^>]*>/g, '')
    .replace(/<link\b(?=[^>]*rel="(?:canonical|site\.standard\.[^"]+)")[^>]*>/g, '')
    .replace(/<meta\b(?=[^>]*name="robots")[^>]*>/g, '')
    .replace('</head>', '<meta name="robots" content="noindex, nofollow"><link rel="stylesheet" href="/_demo-fonts/fonts.css"><link rel="stylesheet" href="/_demo-fonts/katex.min.css"></head>');
  writeFileSync(path, html);
  // Tailscale's file server serves directory indexes. Retain clean Astro links
  // without depending on the GitHub Pages extension rewrite.
  if (!relative.endsWith('index.html')) {
    const clean = join(destination, relative.replace(/\.html$/, ''), 'index.html');
    if (!existsSync(clean)) {
      mkdirSync(dirname(clean), { recursive: true });
      writeFileSync(clean, html);
    }
  }
}
mkdirSync(join(destination, 'current-site'), { recursive: true });
cpSync(join(destination, 'index.html'), join(destination, 'current-site', 'index.html'));
cpSync(join(destination, demo), join(destination, 'index.html'));
writeFileSync(join(destination, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`Private demo staged at ${destination}`);
console.log('Serve this snapshot on localhost:4381, then: tailscale serve --bg --https=9443 http://127.0.0.1:4381');
console.log('See prototypes/essay-format/HOSTING.md for the managed local demo server (local only, gitignored).');
