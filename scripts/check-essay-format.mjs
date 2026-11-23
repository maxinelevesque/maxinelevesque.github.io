// Unit checks for the interactive essay format's Markdown plugins
// (src/lib/essay-format.mjs). The full pipeline, with the sample report and its
// figure code, is checked by scripts/build-essay-sample.mjs.
//   node scripts/check-essay-format.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import { remarkEssayFormat, rehypeColumnNotes, parseFigureMarker } from '../src/lib/essay-format.mjs';
import remarkAbstract from '../src/lib/remark-abstract.mjs';

const make = (opts) => createMarkdownProcessor({
  syntaxHighlight: false, smartypants: false,
  remarkPlugins: [remarkMath, remarkAbstract, [remarkEssayFormat, opts]],
  rehypePlugins: [[rehypeColumnNotes, opts]],
});
const processor = await make({ always: true });
const render = async (md, p = processor) => (await p.render(md)).code;

// The sample report, with the layouts presentation.json would add.
const sample = readFileSync(new URL('../prototypes/essay-format/index.md', import.meta.url), 'utf8')
  .replace(/^---[\s\S]*?\n---\n/, '')
  .replace('#thirds-centered component="fraction-bar" value="1/3"', '#thirds-centered component="fraction-bar" value="1/3" layout="center"')
  .replace('#thirds-full component="fraction-bar" value="1/3"', '#thirds-full component="fraction-bar" value="1/3" layout="full"');
const code = await render(sample);
assert.equal((code.match(/<figure /g) ?? []).length, 3);
for (const [id, layout] of [['thirds-centered', 'center'], ['thirds', 'left'], ['thirds-full', 'full']]) {
  assert.match(code, new RegExp(`<figure id="${id}" class="interactive-figure" data-figure="fraction-bar" data-layout="${layout}" data-figure-attrs="{&#x22;value&#x22;:&#x22;1/3&#x22;}">`));
}
assert.equal((code.match(/<p class="figure-still"><img [^>]*alt="[^"]+"/g) ?? []).length, 3, 'Every figure keeps its still, with alt text.');
assert.equal((code.match(/<figcaption>/g) ?? []).length, 3);
assert.match(code, /<aside class="theorem" aria-label="Equal parts">\s*<p class="container-lead">Theorem\. Equal parts<\/p>/);
assert.match(code, /<details class="established">\s*<summary class="container-lead">What is established<\/summary>/);
assert.match(code, /<aside class="abstract" aria-label="Abstract">\s*<p><strong>Abstract\.<\/strong>/);
assert.doesNotMatch(code, /<!--\s*figure|\[!THEOREM\]|\[!ESTABLISHED\]|aria-describedby="footnote-label"/);
assert.match(code, /class="footnotes essay-endnotes"/);
assert.match(code, />Notes and footnotes<\/h2>/);
assert.match(code, /data-note-ids="[^"]+"[^>]*hidden/);
assert.ok(code.indexOf('class="footnotes essay-endnotes"') > code.indexOf('This is only a destination'), 'Notes follow the whole article by default.');

// An essay-scale note count, with repeated references and backlinks.
const refs = Array.from({ length: 32 }, (_, i) => `Note ${i + 1}.[^n${i}]`).join(' ');
const definitions = Array.from({ length: 32 }, (_, i) => `[^n${i}]: Note body ${i + 1}.`).join('\n');
const dense = await render(`${refs}\n\nRepeated.[^n0]\n\nFinal paragraph.\n\n${definitions}`);
assert.equal((dense.match(/class="column-note"/g) ?? []).length, 32);
assert.ok(dense.indexOf('class="footnotes essay-endnotes"') > dense.indexOf('Final paragraph.'));
const ids = [...dense.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, 'Note and reference ids are unique.');
for (const [, target] of dense.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), `Missing anchor: ${target}`);
assert.match(dense, /Back to reference 1-2/);

// Abstracts vs. ordinary quotations (site-wide, unchanged).
const abstractCases = await render('> **Abstract.** A summary.\n>\n> A second paragraph.\n\n> **Observation.** An ordinary quotation.\n\n> A quotation about an **Abstract.**');
assert.equal((abstractCases.match(/<aside class="abstract"/g) ?? []).length, 1);
assert.equal((abstractCases.match(/<blockquote>/g) ?? []).length, 2);

// Outside the essay collections, nothing changes: footnotes, comments, and
// [!THEOREM] quotations render as plain Markdown.
const plain = await make({});
const essayLike = '<!-- figure #f component="x" -->\n\n![a](b.svg)\n\nCaption.\n\n> [!THEOREM] T\n>\n> Body.\n\nText.[^a]\n\n[^a]: Note.';
const outside = (await plain.render(essayLike, { fileURL: new URL('file:///site/src/content/writing/x.md') })).code;
assert.doesNotMatch(outside, /<figure|class="theorem"|essay-endnotes|noted-block/);
const inside = (await plain.render(essayLike, { fileURL: new URL('file:///site/src/content/research/x.md') })).code;
assert.match(inside, /<figure id="f"/);
assert.match(inside, /essay-endnotes/);

// Marker grammar.
assert.deepEqual(parseFigureMarker('<!-- figure #fig-reduction component="reduction" calc="tree" -->'),
  { id: 'fig-reduction', component: 'reduction', layout: 'left', attrs: { calc: 'tree' } });
assert.equal(parseFigureMarker('<!-- an ordinary comment -->'), null);
assert.equal(parseFigureMarker('<!-- figures are below -->'), null);
for (const bad of [
  '<!-- figure component="x" -->',                    // no id
  '<!-- figure #f -->',                               // no component
  '<!-- figure #f component="x" layout="wide" -->',   // unknown layout
  '<!-- figure #f component="x" calc=tree -->',       // unquoted value
  '<!-- figure #f #g component="x" -->',              // two ids
  '<!-- figure #f component="x" a="1" a="2" -->',     // repeated attribute
]) assert.throws(() => parseFigureMarker(bad), undefined, bad);

// Incomplete figures fail the build.
for (const broken of [
  '<!-- figure #f component="x" -->\n\nNo image here.\n\nCaption.',
  '<!-- figure #f component="x" -->\n\n![](still.svg)\n\nCaption.',            // empty alt
  '<!-- figure #f component="x" -->\n\n![Alt.](still.svg)',                      // no caption
  '<!-- figure #f component="x" -->\n\n![A.](a.svg)\n\nC.\n\n<!-- figure #f component="x" -->\n\n![A.](a.svg)\n\nC.', // duplicate id
]) await assert.rejects(render(broken), undefined, broken);

console.log('Essay format checks passed: figure markers and fallbacks, layouts, containers, abstracts, 32 margin notes, collection scoping.');
