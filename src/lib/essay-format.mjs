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
//
//   <!-- page-switch -->     where the page switch (e.g. the calculus) is
//                            introduced; it sticks to the top from there on.
//
//   <!-- cards -->           before a bulleted list whose items each start with
//                            a picture and a bold heading: a grid of cards.
//
// A paragraph that starts on the line right after a display (math or code),
// with no blank line between, continues the paragraph before it and is not
// indented, as in LaTeX. Links to Lean files are proof links (or definition links).

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

const continues = (display, next) => next?.type === 'paragraph'
  && display.position && next.position && next.position.start.line === display.position.end.line + 1;

export function remarkEssayFormat({ collections = ESSAY_COLLECTIONS, always = false } = {}) {
  return (tree, file) => {
    if (!always && !inEssayCollection(file, collections)) return;
    const ids = new Set();
    let switchSlot = false;
    const nodes = tree.children;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if ((node.type === 'math' || node.type === 'code') && continues(node, nodes[i + 1])) {
        const next = nodes[i + 1];
        next.data = { ...next.data, hProperties: { ...next.data?.hProperties, className: ['continues'] } };
      }
      if (node.type === 'html' && /^<!--\s*page-switch\s*-->\s*$/.test(node.value.trim())) {
        if (switchSlot) file.fail('Only one <!-- page-switch --> marker per piece.', node);
        switchSlot = true;
        nodes[i] = { type: 'pageSwitchSlot', data: { hName: 'div', hProperties: { className: ['page-switch-slot'] } } };
        continue;
      }
      if (node.type === 'html' && /^<!--\s*cards\s*-->\s*$/.test(node.value.trim())) {
        const list = nodes[i + 1];
        if (list?.type !== 'list' || list.ordered) file.fail('<!-- cards --> must be followed by a bulleted list, one card per item.', node);
        for (const item of list.children) {
          const [picture, ...rest] = item.children[0]?.type === 'paragraph' ? item.children[0].children : [];
          const heading = rest.find((c) => !(c.type === 'text' && !c.value.trim()));
          if (picture?.type !== 'image' || !picture.alt?.trim() || heading?.type !== 'strong') {
            file.fail('Each card starts with its picture (an image with alt text), then its bold heading.', item);
          }
          picture.data = { ...picture.data, hProperties: { ...picture.data?.hProperties, className: ['card-picture'] } };
          item.data = { ...item.data, hProperties: { ...item.data?.hProperties, className: ['card'] } };
        }
        list.data = { ...list.data, hProperties: { ...list.data?.hProperties, className: ['cards'] } };
        nodes.splice(i, 1); // the list is next
        i--;
        continue;
      }
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
          // From the marker to the caption, so a comment on the figure has source lines.
          position: node.position && caption.position && { start: node.position.start, end: caption.position.end },
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
        // [!DETAILS] is the collapsible box, under whatever label the piece gives it;
        // [!ESTABLISHED] is its older name, kept so existing sources still build.
        const match = /^\[!(THEOREM|DETAILS|ESTABLISHED)\] (.+)$/.exec(first.children[0].value);
        if (!match) continue;
        const [, kind, label] = match;
        const disclosure = kind !== 'THEOREM';
        node.data = { hName: disclosure ? 'details' : 'aside', hProperties: { className: [disclosure ? 'disclosure' : 'theorem'], ...(!disclosure && { ariaLabel: label }) } };
        first.data = { hName: disclosure ? 'summary' : 'p', hProperties: { className: ['container-lead'] } };
        first.children = [text(disclosure ? label : `Theorem. ${label}`)];
      }
    }
  };
}

// Links to Lean source files are proof links: the linked text is the proved
// statement, shown with a faint dotted underline and closed by a small ⊢ (hidden
// from screen readers, which hear "machine-checked proof in Lean" instead). A
// Lean link whose title begins "Definition:" links a name to its definition and
// is closed by := instead ("definition in Lean"). Tables get a wrapper so a wide
// one can take room from the margins (the page script decides) or scroll.
export const PROOF_LINK = /\.lean(?:#L\d+(?:-L\d+)?)?$/;
export const DEFINITION_TITLE = /^\s*Definition:/i;
export function rehypeEssayBlocks({ collections = ESSAY_COLLECTIONS, always = false } = {}) {
  return (tree, file) => {
    if (!always && !inEssayCollection(file, collections)) return;
    const visit = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.tagName === 'table') {
          return element('div', { className: ['table-wrap'] }, [child]);
        }
        if (child.tagName === 'a' && PROOF_LINK.test(String(child.properties?.href ?? '').split('?')[0])) {
          const definition = DEFINITION_TITLE.test(String(child.properties.title ?? ''));
          child.properties.className = [...(child.properties.className ?? []), 'proof-link', ...(definition ? ['definition'] : [])];
          child.children = [...child.children,
            element('span', { className: ['proof-mark'], ariaHidden: 'true' }, [text(definition ? ':=' : '⊢')]),
            element('span', { className: ['visually-hidden'] }, [text(definition ? ' (definition in Lean)' : ' (machine-checked proof in Lean)')])];
        }
        visit(child);
        return child;
      });
    };
    visit(tree);
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
