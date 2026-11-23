// The interactive essay format (approved 2026-11-15; contract in SPEC.md,
// "Interactive essay format"). Applied to the collections in ESSAY_COLLECTIONS
// only, so other pieces' footnotes and blockquotes render exactly as before.
//
//   <!-- figure #fig-id component="name" key="value" -->
//
//   ![Alt text carrying the figure's content.](/files/<slug>/assets/still.svg)
//
//   **Figure 1. Title.** Caption …
//
// becomes <figure id="fig-id" data-figure="name" …> holding the still and a
// <figcaption>. The page script mounts the figure's component over the still;
// without JavaScript, or if mounting fails, the still and caption remain.

export const ESSAY_COLLECTIONS = ['research'];
export const LAYOUTS = ['center', 'left', 'full'];
const NAME = /^[a-z][a-z0-9-]*$/;

const text = (value) => ({ type: 'text', value });
const element = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });

function inEssayCollection(file, collections) {
  const path = (file?.path ?? file?.history?.[0] ?? '').replace(/\\/g, '/');
  return collections.some((c) => path.includes(`/src/content/${c}/`));
}

// `<!-- figure … -->` → { id, component, layout, attrs } ; null for any other
// HTML; throws on a figure comment it can't read, so typos fail the build.
export function parseFigureMarker(html) {
  const m = /^<!--\s*figure\b([\s\S]*?)-->\s*$/.exec(html.trim());
  if (!m) return null;
  const out = { id: null, component: null, layout: 'left', attrs: {} };
  const rest = m[1].replace(/\s*(?:#([^\s"]+)|([^\s=]+)="([^"]*)")\s*/g, (_, id, key, value) => {
    if (id !== undefined) {
      if (out.id) throw new Error(`figure marker has two ids: ${html}`);
      out.id = id;
    } else if (key === 'component') out.component = value;
    else if (key === 'layout') out.layout = value;
    else {
      if (!NAME.test(key)) throw new Error(`figure marker attribute "${key}" must be lowercase letters, digits and hyphens`);
      if (key in out.attrs) throw new Error(`figure marker repeats "${key}"`);
      out.attrs[key] = value;
    }
    return '';
  });
  if (rest.trim()) throw new Error(`unreadable figure marker (near "${rest.trim()}"): ${html}`);
  if (!out.id || !NAME.test(out.id)) throw new Error(`figure marker needs an id like #fig-name: ${html}`);
  if (!out.component || !NAME.test(out.component)) throw new Error(`figure marker needs component="name": ${html}`);
  if (!LAYOUTS.includes(out.layout)) throw new Error(`figure layout must be one of ${LAYOUTS.join(', ')}: ${html}`);
  return out;
}

export function remarkEssayFormat({ collections = ESSAY_COLLECTIONS, always = false } = {}) {
  return (tree, file) => {
    if (!always && !inEssayCollection(file, collections)) return;
    const ids = new Set();
    const nodes = tree.children;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type === 'html') {
        let marker;
        try { marker = parseFigureMarker(node.value); } catch (e) { file.fail(e.message, node); }
        if (!marker) continue;
        const { id, component, layout, attrs } = marker;
        if (ids.has(id)) file.fail(`Duplicate figure id: ${id}`, node);
        ids.add(id);
        const image = nodes[i + 1];
        const caption = nodes[i + 2];
        const still = image?.type === 'paragraph' && image.children.length === 1 && image.children[0].type === 'image'
          ? image.children[0] : null;
        if (!still || !still.alt?.trim()) file.fail(`Figure ${id}: the marker must be followed by an image with alt text.`, node);
        if (caption?.type !== 'paragraph' || caption.children[0]?.type === 'image') {
          file.fail(`Figure ${id}: the image must be followed by a caption paragraph.`, node);
        }
        nodes.splice(i, 3, {
          type: 'essayFigure',
          data: {
            hName: 'figure',
            hProperties: {
              id,
              className: ['interactive-figure'],
              dataFigure: component,
              dataLayout: layout,
              ...(Object.keys(attrs).length && { dataFigureAttrs: JSON.stringify(attrs) }),
            },
          },
          children: [
            { ...image, data: { hProperties: { className: ['figure-still'] } } },
            { ...caption, data: { hName: 'figcaption' } },
          ],
        });
        continue;
      }
      const first = node.children?.[0];
      if (node.type === 'blockquote' && first?.type === 'paragraph' && first.children?.[0]?.type === 'text') {
        const match = /^\[!(THEOREM|ESTABLISHED)\] (.+)$/.exec(first.children[0].value);
        if (!match) continue;
        const [, kind, label] = match;
        const disclosure = kind === 'ESTABLISHED';
        node.data = { hName: disclosure ? 'details' : 'aside', hProperties: { className: [disclosure ? 'established' : 'theorem'], ...(!disclosure && { ariaLabel: label }) } };
        first.data = { hName: disclosure ? 'summary' : 'p', hProperties: { className: ['container-lead'] } };
        first.children = [text(disclosure ? label : `Theorem. ${label}`)];
      }
    }
  };
}

// Ordinary endnotes are the static and narrow-screen default. An empty margin
// list follows each note's first referring block; on wide screens the page
// script moves the same list items there, keeping one copy of each note and
// all reference and backlink ids.
export function rehypeColumnNotes({ collections = ESSAY_COLLECTIONS, always = false } = {}) {
  return (tree, file) => {
    if (!always && !inEssayCollection(file, collections)) return;
    const section = tree.children.find((node) => node.tagName === 'section' && node.properties?.dataFootnotes !== undefined);
    if (!section) return;
    const list = section.children.find((node) => node.tagName === 'ol');
    if (!list) return;
    const notes = new Map((list?.children ?? []).filter((node) => node.tagName === 'li').map((node, i) => [node.properties.id, { node, number: i + 1 }]));
    section.properties.className = [...(section.properties.className ?? []), 'essay-endnotes'];
    const heading = section.children.find((node) => node.tagName === 'h2');
    if (heading) {
      heading.children = [text('Notes and footnotes')];
      heading.properties.className = (heading.properties.className ?? []).filter((name) => name !== 'sr-only');
    }
    for (const { node, number } of notes.values()) {
      node.properties.className = ['column-note'];
      node.properties.value = number;
    }
    const used = new Set();
    const refs = (node, result = []) => {
      if (node.tagName === 'a' && node.properties?.dataFootnoteRef !== undefined) {
        const id = String(node.properties.href).slice(1);
        // The endnote heading is hidden when all notes are in the margin.
        for (const key of Object.keys(node.properties)) {
          if (/^aria.?described.?by$/i.test(key)) delete node.properties[key];
        }
        node.properties.ariaLabel = `Read note ${notes.get(id)?.number ?? ''}`.trim();
        node.properties.role = 'doc-noteref';
        result.push(id);
      }
      for (const child of node.children ?? []) refs(child, result);
      return result;
    };
    tree.children = tree.children.flatMap((block) => {
      if (block === section) return [block];
      const blockNotes = [];
      for (const id of refs(block)) {
        if (used.has(id) || !notes.has(id)) continue;
        used.add(id);
        blockNotes.push(id);
      }
      return blockNotes.length ? [element('div', { className: ['noted-block'] }, [block,
        element('ol', { className: ['column-notes'], dataNoteIds: blockNotes.join(' '), ariaLabel: 'Margin notes', hidden: true }, []),
      ])] : [block];
    });
  };
}
