// Checks for review previews' source map (src/lib/review-source-map.mjs; maxine/review
// SPEC.md §4): every block of the sample report, rendered through the site's own
// plugins, carries the source lines it came from in pieces/<slug>/index.md.
//   node scripts/check-review-source-map.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkAbstract from '../src/lib/remark-abstract.mjs';
import { remarkEssayFormat, rehypeEssayBlocks, rehypeColumnNotes } from '../src/lib/essay-format.mjs';
import { remarkReviewDisplays, rehypeReviewSourceMap } from '../src/lib/review-source-map.mjs';

const raw = readFileSync(new URL('../prototypes/essay-format/index.md', import.meta.url), 'utf8');
const lines = raw.split('\n');
const lineOf = (re, from = 0) => {
  const i = lines.findIndex((l, n) => n >= from && re.test(l));
  assert.ok(i >= 0, `the sample has a line matching ${re}`);
  return i + 1;
};
// What generate-content gives Astro: the body after the frontmatter, leading blank lines dropped.
const close = raw.indexOf('\n---\n', 4) + 5;
const lead = /^\n*/.exec(raw.slice(close))[0].length;
const body = raw.slice(close + lead);
const firstLine = raw.slice(0, close).split('\n').length + lead;
const PATH = 'pieces/sample/index.md';
const map = { sample: { path: PATH, firstLine } };

const processor = await createMarkdownProcessor({
  smartypants: false,
  remarkPlugins: [remarkMath, remarkAbstract, [remarkEssayFormat, { always: true }], remarkReviewDisplays],
  rehypePlugins: [rehypeKatex, [rehypeEssayBlocks, { always: true }], [rehypeColumnNotes, { always: true }],
    [rehypeReviewSourceMap, { map }]],
});
const render = async (md, slug = 'sample') =>
  (await processor.render(md, { fileURL: new URL(`file:///site/src/content/research/${slug}.md`) })).code;

const src = (a, b = a) => `data-src="${PATH}:${a}-${b}"`;
const code = await render(body);

// Headings, the abstract, and the first paragraph of a section.
assert.match(code, new RegExp(`<h2 [^>]*${src(lineOf(/^## 1\. /))}`));
assert.match(code, new RegExp(`<aside class="abstract"[^>]*${src(lineOf(/^> \*\*Abstract/))}`));
// A figure spans its marker to its caption; its still and caption have their own lines.
const fig = lineOf(/^<!-- figure #thirds /);
assert.match(code, new RegExp(`<figure id="thirds" [^>]*${src(fig, lineOf(/^\*\*Figure 2\./))}`));
assert.match(code, new RegExp(`<figcaption ${src(lineOf(/^\*\*Figure 2\./))}`));
// Display math and a code display, which KaTeX and Shiki replace, are matched back by content.
const dollars = lineOf(/^\$\$/);
assert.match(code, new RegExp(`<span class="katex-display" ${src(dollars, lineOf(/^\$\$/, dollars))}`));
const fence = lineOf(/^```text/);
assert.match(code, new RegExp(`<pre [^>]*${src(fence, lineOf(/^```$/, fence))}`));
// Footnotes keep their definitions' lines, wherever the page shows them.
assert.match(code, new RegExp(`<li id="user-content-fn-parts" [^>]*${src(lineOf(/^\[\^parts\]:/))}`));
// The site's own endnote heading isn't from the piece, and doesn't need a line.
assert.match(code, />Notes and footnotes<\/h2>/);

// Every text block has its lines (the plugin fails the build otherwise), and each
// single-line paragraph's lines hold its opening words.
for (const m of code.matchAll(/<p [^>]*data-src="[^:]+:(\d+)-(\d+)"[^>]*>([^<]{12,})/g)) {
  const [whole, a, b, text] = m;
  if (whole.includes('container-lead')) continue; // "Theorem. …" is written by the plugin from "[!THEOREM] …"
  const words = text.trim().split(/\s+/).slice(0, 3).join(' ').replace(/[’]/g, "'");
  const span = lines.slice(a - 1, b).join(' ').replace(/[’]/g, "'");
  assert.ok(span.includes(words), `paragraph at ${a}-${b} starts with "${words}"`);
}

// Astro may hand over the body with blank lines in front; positions still map.
assert.equal(await render('\n\n' + body), code);
// A page with no entry in the map is left alone.
assert.doesNotMatch(await render(body, 'not-in-the-map'), /data-src=/);
// A block that can't be placed fails the build instead of silently taking no comments:
// here display math, without the remark step that records where displays came from.
const bare = await createMarkdownProcessor({
  remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex, [rehypeReviewSourceMap, { map }]],
});
await assert.rejects(bare.render('$$\nx\n$$\n', { fileURL: new URL('file:///site/src/content/research/sample.md') }),
  /no source lines/);

console.log('Review source map: every block of the sample carries its source lines.');
