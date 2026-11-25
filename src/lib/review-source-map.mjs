// Source positions for review previews (maxine/review SPEC.md §4). Only with
// REVIEW_SOURCE_MAP=1: production pages are unchanged.
//
// Every rendered block gets data-src="pieces/<slug>/index.md:<start>-<end>", the
// lines of the piece's source in `writing` it came from, so a comment made on the
// rendered page lands on the right source lines.
//
// Astro renders the generated src/content/<collection>/<slug>.md, not the source.
// generate-content only rewrites within lines (relative links, figure layouts) and
// drops the body's leading blank lines, so a rendered line maps to the source by
// one offset per piece: it writes src/data/review-source-map.json,
// { "<slug>": { "path": "pieces/<slug>/index.md", "firstLine": <source line of the
// body's first line> } }.
//
// KaTeX and Shiki replace display math and code blocks, dropping their positions,
// so remarkReviewDisplays records each one's lines first and rehypeReviewSourceMap
// matches them back by content: the TeX (kept in KaTeX's annotation) or the code.
import { readFileSync, existsSync } from 'node:fs';

export const REVIEW_SOURCE_MAP = process.env.REVIEW_SOURCE_MAP === '1';
export const SOURCE_MAP_FILE = new URL('../data/review-source-map.json', import.meta.url);

// Blocks that get data-src (when they have a position), and the ones a reviewer
// can select text in, which must have one.
const BLOCKS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'aside', 'details',
  'summary', 'figure', 'figcaption', 'table', 'tr', 'pre', 'dt', 'dd']);
const MUST = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'summary', 'figcaption', 'pre', 'tr']);

const classes = (node) => node.properties?.className ?? [];
const isDisplayMath = (node) => node.tagName === 'span' && classes(node).includes('katex-display');
const textOf = (node) => node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join('');
const norm = (s) => String(s).replace(/\r\n/g, '\n').trim();

export function loadSourceMap(file = SOURCE_MAP_FILE) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
}

function slugOf(file) {
  const path = (file?.path ?? file?.history?.[0] ?? '').replace(/\\/g, '/');
  return /\/src\/content\/[^/]+\/([^/]+)\.md$/.exec(path)?.[1] ?? null;
}

export function remarkReviewDisplays() {
  return (tree, file) => {
    const displays = [];
    const visit = (node) => {
      if ((node.type === 'math' || node.type === 'code') && node.position) {
        displays.push({ kind: node.type, value: norm(node.value), start: node.position.start.line,
          end: node.position.end.line, used: false });
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
    file.data.reviewDisplays = displays;
  };
}

export function rehypeReviewSourceMap({ map = loadSourceMap() } = {}) {
  return (tree, file) => {
    const slug = slugOf(file);
    const entry = slug && map[slug];
    if (!entry) return;
    // The first body line of what Astro rendered, after any blank lines before it.
    const lead = /^(?:\r?\n)*/.exec(String(file.value ?? ''))[0];
    const bodyLine = (lead.match(/\n/g)?.length ?? 0) + 1;
    const toSource = (line) => line - bodyLine + entry.firstLine;
    const src = (start, end) => `${entry.path}:${toSource(start)}-${toSource(end)}`;
    const displays = file.data.reviewDisplays ?? [];
    const claim = (kind, content) => {
      const d = displays.find((x) => !x.used && x.kind === kind && x.value === norm(content));
      if (d) d.used = true;
      return d;
    };
    const missing = [];

    const visit = (node, inNotesHeading) => {
      for (const child of node.children ?? []) {
        if (child.type !== 'element') continue;
        const props = (child.properties ??= {});
        if (isDisplayMath(child)) {
          let tex = null;
          const find = (n) => {
            if (tex !== null) return;
            if (n.tagName === 'annotation' && n.properties?.encoding === 'application/x-tex') tex = textOf(n);
            else for (const c of n.children ?? []) find(c);
          };
          find(child);
          const d = tex !== null && claim('math', tex);
          if (d) props.dataSrc = src(d.start, d.end);
          else missing.push(`display math ${JSON.stringify((tex ?? '').slice(0, 40))}`);
          continue; // KaTeX's inner spans aren't separate blocks
        }
        if (child.tagName === 'pre' && !child.position) {
          const d = claim('code', textOf(child));
          if (d) props.dataSrc = src(d.start, d.end);
        } else if (BLOCKS.has(child.tagName) && child.position) {
          props.dataSrc = src(child.position.start.line, child.position.end.line);
        }
        // The endnotes' heading ("Notes and footnotes") is the site's, not the piece's.
        const generated = inNotesHeading || (child.tagName === 'h2' && node.properties?.dataFootnotes !== undefined);
        if (MUST.has(child.tagName) && !props.dataSrc && !generated && textOf(child).trim()) {
          missing.push(`<${child.tagName}> ${JSON.stringify(textOf(child).trim().slice(0, 40))}`);
        }
        visit(child, generated);
      }
    };
    visit(tree, false);
    if (missing.length) {
      file.fail(`Review source map: ${missing.length} block(s) have no source lines, so comments on them couldn't be placed: ${missing.slice(0, 5).join('; ')}`);
    }
  };
}
