// Deliberately scoped to the opt-in prototype route. This is a format proposal,
// not an extension to writing's schema or the site's production Markdown.
export const figureDirective = /^::figure\{#([a-z][a-z0-9-]*) component="(fraction-bar)" value="(\d+\/\d+)"\}$/;

const text = (value) => ({ type: 'text', value });
const element = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });

export function portableMarkdown(source) {
  return source.replace(/^::figure\{[^\n]*\}\s*$/gm, '')
    .replace(/^> \[!THEOREM\] (.+)$/gm, '> **Theorem — $1.**')
    .replace(/^> \[!ESTABLISHED\] (.+)$/gm, '> **$1.**');
}

export function remarkEssayPrototype({ figureLayouts = {} } = {}) {
  return (tree, file) => {
    const ids = new Set();
    const nodes = tree.children;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const first = node.children?.[0];
      if (node.type === 'paragraph' && first?.type === 'text' && first.value.startsWith('::figure')) {
        const match = node.children.length === 1 && figureDirective.exec(first.value);
        if (!match) file.fail('Unsupported prototype figure directive.', node);
        const [, id, component, value] = match;
        const layout = figureLayouts[id] ?? 'left';
        if (!['center', 'left', 'full'].includes(layout)) file.fail(`Unknown figure layout: ${layout}`, node);
        if (ids.has(id)) file.fail(`Duplicate figure id: ${id}`, node);
        ids.add(id);
        const image = nodes[i + 1];
        const caption = nodes[i + 2];
        if (image?.type !== 'paragraph' || image.children.length !== 1 || image.children[0].type !== 'image' || !image.children[0].alt) {
          file.fail('A prototype figure requires an ordinary Markdown image with alt text.', node);
        }
        if (caption?.type !== 'paragraph') file.fail('A prototype figure requires a Markdown caption.', node);
        nodes.splice(i, 3, {
          type: 'essayFigure',
          data: { hName: 'figure', hProperties: { id, className: ['interactive-figure'], dataFigure: component, dataValue: value, dataLayout: layout } },
          children: [image, { ...caption, data: { hName: 'figcaption' } }],
        });
      }
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

// Ordinary endnotes are the static/mobile default. Empty margin lists identify
// each note's first referring block; the desktop enhancement moves the same
// list items there, preserving one copy and all reference/backlink IDs.
export function rehypeColumnNotes() {
  return (tree) => {
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
