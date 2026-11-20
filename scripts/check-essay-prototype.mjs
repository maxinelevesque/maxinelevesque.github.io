import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { remarkEssayPrototype, rehypeColumnNotes, portableMarkdown } from '../src/lib/essay-prototype.mjs';
import { rational, parseRational, fractionText, complement } from '../src/components/essays/prototype/rational.mjs';
import remarkAbstract from '../src/lib/remark-abstract.mjs';

const processor = await createMarkdownProcessor({
  syntaxHighlight: false, smartypants: false,
  remarkPlugins: [remarkAbstract, [remarkEssayPrototype, JSON.parse(readFileSync(new URL('../prototypes/essay-format/presentation.json', import.meta.url), 'utf8'))]], rehypePlugins: [rehypeColumnNotes],
});
const source = readFileSync(new URL('../prototypes/essay-format/index.md', import.meta.url), 'utf8');
const { code } = await processor.render(source);
assert.match(code, /<figure[^>]*data-value="1\/3"[^>]*><p><img[^>]+alt="[^"]+"/);
assert.match(code, /<figcaption>/);
assert.equal((code.match(/<figure /g) ?? []).length, 3);
for (const [id, layout] of [['thirds-centered', 'center'], ['thirds', 'left'], ['thirds-full', 'full']]) {
  assert.match(code, new RegExp(`<figure id="${id}"[^>]*data-layout="${layout}"`));
}
assert.equal((code.match(/<figcaption>/g) ?? []).length, 3);
assert.equal((code.match(/<img /g) ?? []).length, 3, 'Every layout retains a static image fallback.');
assert.match(code, /<aside class="theorem"/);
assert.match(code, /<details class="established">/);
assert.match(code, /<aside class="abstract" aria-label="Abstract">\s*<p><strong>Abstract\.<\/strong>/);
assert.doesNotMatch(code, /<script|::figure|\[!THEOREM\]|aria-describedby="footnote-label"/);
assert.match(code, /class="footnotes essay-endnotes"/);
assert.match(code, />Notes and footnotes<\/h2>/);
assert.match(code, /data-note-ids="[^"]+"[^>]*hidden/);
assert.ok(code.indexOf('class="footnotes essay-endnotes"') > code.indexOf('No essay has been imported or published.'), 'Notes must follow the complete article by default.');

// Exercise the actual essay-scale note count, including repeated references,
// multiple refs in one paragraph, and backlink destinations.
const refs = Array.from({ length: 32 }, (_, i) => `Note ${i + 1}.[^n${i}]`).join(' ');
const definitions = Array.from({ length: 32 }, (_, i) => `[^n${i}]: Note body ${i + 1}.`).join('\n');
const dense = (await processor.render(`${refs}\n\nRepeated.[^n0]\n\nFinal paragraph.\n\n${definitions}`)).code;
assert.equal((dense.match(/class="column-note"/g) ?? []).length, 32);
assert.ok(dense.indexOf('class="footnotes essay-endnotes"') > dense.indexOf('Final paragraph.'));
const ids = [...dense.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'All note and reference IDs must be unique.');
for (const [, destination] of dense.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(destination), `Missing anchor: ${destination}`);
assert.match(dense, /Back to reference 1-2/);

const portable = portableMarkdown(source);
assert.doesNotMatch(portable, /::figure|\[!THEOREM\]|\[!ESTABLISHED\]/);
assert.match(portable, /\[\^citation\]:/);
assert.match(portable, /!\[A horizontal bar/);
assert.match(portable, /\*\*Figure 1/);
assert.match(portable, /> \*\*Theorem/);
assert.match(portable, /> \*\*Abstract\.\*\*/);
const abstractCases = (await processor.render('> **Abstract.** A summary.\n>\n> A second paragraph.\n\n> **Observation.** An ordinary quotation.\n\n> A quotation about an **Abstract.**')).code;
assert.equal((abstractCases.match(/<aside class="abstract"/g) ?? []).length, 1);
assert.equal((abstractCases.match(/<blockquote>/g) ?? []).length, 2, 'Ordinary quotations retain their styling.');
assert.match(abstractCases, /A second paragraph\.<\/p>\n<\/aside>/);
for (const broken of [
  '::figure{#x component="unknown" value="1/3"}',
  '::figure{#x component="fraction-bar" value="1/3"}',
]) assert.throws(() => remarkEssayPrototype()({ children: [
  { type: 'paragraph', children: [{ type: 'text', value: broken }] },
] }, { fail(message) { throw new Error(message); } }));

assert.equal(fractionText(parseRational('4/12')), '1/3');
assert.equal(fractionText(complement(parseRational('1/3'))), '2/3');
assert.equal(fractionText(rational(0n, 12n)), '0');
assert.equal(fractionText(rational(12n, 12n)), '1');
assert.equal(fractionText(rational(9007199254740993n, 3n)), '3002399751580331');
assert.throws(() => rational(1n, 0n));
for (let units = 0n; units <= 12n; units++) {
  const value = rational(units, 12n);
  const rest = complement(value);
  assert.equal(value.n * rest.d + rest.n * value.d, value.d * rest.d);
}
console.log('Essay prototype checks passed: three figure layouts/fallbacks, bottom footnotes, 32 unique notes, repeated anchors, abstracts, containers, exact fractions.');
