// Build the site with the interactive essay format's sample report added
// (prototypes/essay-format/, as /research/essay-format-sample), then check the
// built page. Never used by the production build.
//
//   WRITING_SRC=../writing node scripts/build-essay-sample.mjs
//
// WRITING_SRC defaults to ../writing. The sample's figure code is taken from
// the source tree (FIGURES_FROM_SOURCE=1); real reports use a pinned commit.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SAMPLE = join(ROOT, 'prototypes', 'essay-format');
const SLUG = 'essay-format-sample';
const writing = resolve(process.env.WRITING_SRC ?? join(ROOT, '..', 'writing'));
if (!existsSync(join(writing, 'pieces'))) throw new Error(`No pieces/ in ${writing}; set WRITING_SRC.`);

const scratch = mkdtempSync(join(tmpdir(), 'essay-sample-'));
try {
  cpSync(join(writing, 'pieces'), join(scratch, 'pieces'), { recursive: true });
  for (const f of ['personas.json', 'records.json']) {
    if (existsSync(join(writing, f))) cpSync(join(writing, f), join(scratch, f));
  }
  const piece = join(scratch, 'pieces', SLUG);
  for (const f of ['index.md', 'read-aloud.txt', 'assets', 'figures']) {
    cpSync(join(SAMPLE, f), join(piece, f), { recursive: true });
  }
  const env = {
    ...process.env,
    WRITING_SRC: scratch,
    FIGURES_FROM_SOURCE: '1',
    PRESENTATION_OVERLAY: join(SAMPLE, 'presentation.sample.json'),
  };
  execFileSync('node', ['scripts/generate-content.mjs'], { cwd: ROOT, env, stdio: 'inherit' });
  execFileSync('npx', ['astro', 'build'], { cwd: ROOT, env, stdio: 'inherit' });
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

// The built page: figures with stills, the switch, files, and figure code.
const dist = join(ROOT, 'dist');
const html = readFileSync(join(dist, 'research', `${SLUG}.html`), 'utf8');
assert.equal((html.match(/<figure id="thirds[^"]*" class="interactive-figure" data-figure="fraction-bar"/g) ?? []).length, 3);
assert.match(html, /data-layout="center"/);
assert.match(html, /data-layout="full"/);
assert.equal((html.match(/<img src="\/files\/essay-format-sample\/assets\/fraction-bar\.svg"/g) ?? []).length, 3);
assert.match(html, /<div class="page-switch" role="group" aria-label="Notation" data-param="notation" data-default="lowest" hidden[^>]*>/);
assert.match(html, /<div class="page-switch-slot"><\/div>/);
assert.match(html, /class="proof-link"/);
assert.match(html, /class="proof-link definition"[^>]*>the remainder<span class="proof-mark" aria-hidden="true">:=<\/span>/);
assert.equal((html.match(/<li class="card"[^>]*><img src="\/files\/essay-format-sample\/assets\/card-[a-z]+\.svg"[^>]*class="card-picture"/g) ?? []).length, 4);
assert.equal((html.match(/<div class="table-wrap">/g) ?? []).length, 3);
assert.match(html, /<p class="continues"[^>]*>and the paragraph continues/);
assert.match(html, /href="\/files\/essay-format-sample\/read-aloud\.txt"/);
assert.match(html, /class="article-body research essay" data-slug="essay-format-sample"/);
assert.ok(existsSync(join(dist, 'files', SLUG, 'assets', 'fraction-bar.svg')));
assert.ok(existsSync(join(dist, 'files', SLUG, 'read-aloud.txt')));
const chunks = readdirSync(join(dist, '_astro'));
assert.ok(chunks.some((f) => /^fraction-bar\..*\.js$/.test(f)), 'The figure component is bundled as its own chunk.');
assert.ok(!chunks.some((f) => /\.test\./.test(f)), 'Figure tests are not bundled.');
// Review previews (REVIEW_SOURCE_MAP=1) carry each block's source lines, and hand figure state to
// the review overlay; production never does either.
const bridged = chunks.filter((f) => f.endsWith('.js')).some((f) => readFileSync(join(dist, '_astro', f), 'utf8').includes('reviewFigure'));
assert.equal(bridged, process.env.REVIEW_SOURCE_MAP === '1', 'Only review builds hand figure state to the overlay.');
if (process.env.REVIEW_SOURCE_MAP === '1') {
  const at = (re) => assert.match(html, re);
  at(/<figure id="thirds" [^>]*data-src="pieces\/essay-format-sample\/index\.md:\d+-\d+"/);
  at(/<span class="katex-display" data-src="pieces\/essay-format-sample\/index\.md:\d+-\d+"/);
  at(/<pre [^>]*data-src="pieces\/essay-format-sample\/index\.md:\d+-\d+"/);
} else {
  assert.doesNotMatch(html, /data-src=/, 'Production pages carry no source lines.');
}
console.log(`\nSample report built and checked: dist/research/${SLUG}.html${process.env.REVIEW_SOURCE_MAP === '1' ? ', with source lines' : ''}`);
