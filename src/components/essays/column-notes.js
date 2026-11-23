// A single right gutter holds notes and figure captions independently of the
// reading column. Notes retain one DOM copy and return to bottom footnotes on
// narrow screens. Long margin content never increases a paragraph's height.
export function initColumnNotes(contents) {
  for (const content of contents) {
    if (content.dataset.notesReady) continue;
    const section = content.querySelector('.essay-endnotes');
    const endnotes = section?.querySelector('ol');
    const notes = [...(endnotes?.children ?? [])];
    const byId = new Map(notes.map((note) => [note.id, note]));
    const margins = [...content.querySelectorAll('[data-note-ids]')];
    const captions = [...content.querySelectorAll('figure:not([data-layout="full"]) > figcaption')];
    const items = [...content.querySelectorAll('[data-note-ids], figure:not([data-layout="full"]) > figcaption')];
    const wide = window.matchMedia('screen and (min-width: 1100px)');
    let marginMode = false;
    let frame = 0;

    const positionMargins = () => {
      if (!marginMode) return;
      const gap = 16;
      // A full-width figure occupies the gutter too. Notes/captions that would
      // cross it continue below it, rather than drawing over the figure.
      const blocked = [...content.querySelectorAll('figure[data-layout="full"], .table-wrap[data-layout="full"]')]
        .map((figure) => figure.getBoundingClientRect());
      let bottom = -Infinity;
      for (const item of items) {
        if (item.hidden) continue;
        const owner = item.offsetParent;
        if (!owner) continue;
        const rect = owner.getBoundingClientRect();
        const style = getComputedStyle(owner);
        const border = parseFloat(style.borderTopWidth) || 0;
        const isCaption = item.tagName === 'FIGCAPTION';
        // Include the caption's CSS offset in collision detection, then
        // subtract it from `top` so the browser applies that margin once.
        const marginTop = parseFloat(getComputedStyle(item).marginTop) || 0;
        const anchor = rect.top + marginTop + (isCaption ? border + (parseFloat(style.paddingTop) || 0) : 0);
        const height = item.getBoundingClientRect().height;
        let top = Math.max(anchor, bottom + gap);
        for (const obstacle of blocked) {
          if (top + height > obstacle.top - gap && top < obstacle.bottom + gap) top = obstacle.bottom + gap;
        }
        item.style.top = `${top - rect.top - border - marginTop}px`;
        bottom = top + height;
      }
      // Only extend the end of the article if its last margin item outlasts
      // the prose. Internal paragraphs and section positions are unaffected.
      content.style.minHeight = Number.isFinite(bottom)
        ? `${Math.max(0, bottom + gap - content.getBoundingClientRect().top)}px` : '';
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(positionMargins);
    };

    const layout = (inMargin) => {
      marginMode = inMargin;
      const focused = document.activeElement;
      // Restoring in source order also handles a wide → narrow resize and
      // printing, regardless of how notes are grouped beside paragraphs.
      for (const note of notes) endnotes.append(note);
      for (const margin of margins) {
        margin.style.top = '';
        if (inMargin) {
          for (const id of margin.dataset.noteIds.split(' ')) {
            const note = byId.get(id);
            if (note) margin.append(note);
          }
        }
        margin.hidden = margin.children.length === 0;
      }
      for (const caption of captions) caption.style.top = '';
      if (section) section.hidden = endnotes.children.length === 0;
      content.style.minHeight = '';
      positionMargins();
      if (focused instanceof HTMLElement && focused !== document.body && focused.isConnected && document.activeElement !== focused) {
        focused.focus({ preventScroll: true });
      }
    };
    layout(wide.matches);
    wide.addEventListener('change', () => layout(wide.matches));
    window.addEventListener('beforeprint', () => layout(false));
    window.addEventListener('afterprint', () => layout(wide.matches));
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    for (const element of [content, ...margins, ...captions, ...content.querySelectorAll('figure')]) observer.observe(element);
    document.fonts.ready.then(schedule);
    content.dataset.notesReady = 'true';
  }
}
