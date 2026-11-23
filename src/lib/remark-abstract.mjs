// Preserve the existing portable `> **Abstract.** …` source convention while
// distinguishing an abstract from an ordinary quotation in the site renderer.
export default function remarkAbstract() {
  return (tree) => {
    const visit = (node) => {
      const lead = node.children?.[0]?.children?.[0];
      if (node.type === 'blockquote' && node.children[0]?.type === 'paragraph'
        && lead?.type === 'strong' && lead.children.length === 1
        && lead.children[0].type === 'text' && /^abstract[.:]?$/i.test(lead.children[0].value.trim())) {
        node.data = {
          ...node.data,
          hName: 'aside',
          hProperties: { ...node.data?.hProperties, className: ['abstract'], ariaLabel: 'Abstract' },
        };
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
  };
}
