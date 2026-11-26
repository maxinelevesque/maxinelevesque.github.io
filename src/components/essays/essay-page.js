// Page script for pieces in the interactive essay format (SPEC.md,
// "Interactive essay format"): margin notes, the page-level switch, and the
// figure components. Everything here is an enhancement; the page reads
// completely without it.
import { initColumnNotes } from './column-notes.js';

// Figure components come from the writing repo at the commit pinned in
// presentation.json. generate-content copies them to src/figures/<slug>/;
// Vite bundles each one as its own chunk, loaded only on its page.
const modules = import.meta.glob([
  '/src/figures/*/*.{js,mjs}',
  '!/src/figures/**/*.test.*',
  '!/src/figures/**/*.spec.*',
]);

// The page-level switch (e.g. ?calc=tree). Its state lives in the query string
// so the #fragment stays free for figure, section and footnote anchors. An old
// #calc=… link is converted once on load.
function initPageSwitch(control, content) {
  const listeners = new Set();
  const params = {};
  if (!control) {
    return { snapshot: () => ({ ...params }), on: () => () => {} };
  }
  // The piece introduces the switch where its <!-- page-switch --> marker is;
  // from there it sticks to the top of the window. Without a marker it sits
  // above the article.
  const slot = content.querySelector('.page-switch-slot');
  if (slot) slot.replaceWith(control);
  const sentinel = document.createElement('div');
  sentinel.className = 'page-switch-sentinel';
  control.before(sentinel);
  new IntersectionObserver(([entry]) => {
    control.toggleAttribute('data-stuck', !entry.isIntersecting && entry.boundingClientRect.top < 0);
  }).observe(sentinel);

  const name = control.dataset.param;
  const fallback = control.dataset.default;
  const buttons = [...control.querySelectorAll('button[data-value]')];
  const allowed = new Set(buttons.map((b) => b.dataset.value));

  const writeUrl = (next, hash) => {
    const u = new URL(location.href);
    if (next === fallback) u.searchParams.delete(name); else u.searchParams.set(name, next);
    if (hash !== undefined) u.hash = hash;
    history.replaceState(history.state, '', u);
  };

  const url = new URL(location.href);
  let value = url.searchParams.get(name);
  const legacy = new RegExp(`(?:^|[&;])${name}=([^&;]*)`);
  const old = legacy.exec(url.hash.slice(1));
  if (old) value ??= decodeURIComponent(old[1]);
  if (!allowed.has(value)) value = fallback;
  if (old) {
    // #calc=tree or #calc=tree&fig-3 → ?calc=tree#fig-3
    const rest = url.hash.slice(1).replace(legacy, '').replace(/^[&;]+/, '');
    writeUrl(value, rest);
    if (rest) document.getElementById(rest)?.scrollIntoView();
  }

  const apply = (next) => {
    value = next;
    params[name] = value;
    content.dataset[name] = value;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.value === value));
  };
  apply(value);
  for (const b of buttons) b.addEventListener('click', () => {
    if (b.dataset.value === value) return;
    apply(b.dataset.value);
    writeUrl(value);
    for (const fn of listeners) fn(name, value);
  });
  control.hidden = false;

  return {
    snapshot: () => ({ ...params }),
    on(param, fn) {
      const wrapped = (n, v) => { if (n === param) fn(v); };
      listeners.add(wrapped);
      return () => listeners.delete(wrapped);
    },
  };
}

async function mountFigure(figure, slug, page, reducedMotion) {
  const name = figure.dataset.figure;
  const load = modules[`/src/figures/${slug}/${name}.js`] ?? modules[`/src/figures/${slug}/${name}.mjs`];
  if (!load) return; // no code for this figure: the still stays
  const host = document.createElement('div');
  host.className = 'figure-live';
  try {
    const mod = await load();
    if (typeof mod.mount !== 'function') throw new TypeError(`figure component "${name}" has no mount() export`);
    figure.prepend(host);
    const controls = await mod.mount(host, {
      id: figure.id,
      attrs: JSON.parse(figure.dataset.figureAttrs ?? '{}'),
      params: page.snapshot(),
      on: page.on,
      reducedMotion,
    });
    // Hide the still only once a working component is in place.
    for (const still of figure.querySelectorAll(':scope > .figure-still')) still.hidden = true;
    // Review previews only: the overlay saves the figure's state with a comment and
    // restores it for "show me". Production builds drop this (__REVIEW_PREVIEW__ is false).
    if (__REVIEW_PREVIEW__ && typeof controls?.getState === 'function' && typeof controls?.setState === 'function') {
      figure.reviewFigure = { getState: () => controls.getState(), setState: (s) => controls.setState(s) };
    }
    figure.dataset.enhanced = 'true';
  } catch (error) {
    host.remove();
    console.error(`Figure #${figure.id} could not start; keeping its still image.`, error);
  }
}

// A table wider than the text column takes room from the left margin, then
// from both, as figures do; beyond that, or on narrow screens, it scrolls.
// A table inside a collapsible box widens the box instead, open or closed, so
// opening it doesn't change its width.
function initTables(content) {
  const wraps = [...content.querySelectorAll('.table-wrap')];
  if (!wraps.length) return;
  const wide = window.matchMedia('screen and (min-width: 1100px)');
  // The table's natural width. A closed box lays nothing out, so a copy is
  // measured in the article instead, for that moment only.
  const natural = (table) => {
    if (table.getClientRects().length) {
      table.style.width = 'max-content';
      const width = table.offsetWidth;
      table.style.width = '';
      return width;
    }
    const copy = table.cloneNode(true);
    copy.removeAttribute('id');
    for (const el of copy.querySelectorAll('[id]')) el.removeAttribute('id');
    Object.assign(copy.style, { position: 'absolute', visibility: 'hidden', width: 'max-content', left: '0', top: '0' });
    content.append(copy);
    const width = copy.offsetWidth;
    copy.remove();
    return width;
  };
  const layout = () => {
    const boxes = new Map(); // what takes the room → the width its widest table needs
    for (const wrap of wraps) {
      const box = wrap.closest('details') ?? wrap;
      box.removeAttribute('data-layout');
      if (wide.matches) boxes.set(box, Math.max(boxes.get(box) ?? 0, natural(wrap.querySelector('table'))));
    }
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    for (const [box, need] of boxes) {
      const style = getComputedStyle(box);
      const column = box.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
      if (need > column) box.dataset.layout = need > column + 16 * rem ? 'full' : 'left';
    }
  };
  layout();
  wide.addEventListener('change', layout);
  document.fonts.ready.then(layout);
}

export function initEssayPage(content) {
  if (!content || content.dataset.essayReady) return;
  content.dataset.essayReady = 'true';
  initTables(content);
  initColumnNotes([content]);
  const page = initPageSwitch(document.querySelector('.page-switch'), content);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const slug = content.dataset.slug;
  return Promise.all([...content.querySelectorAll('figure[data-figure]')]
    .map((figure) => mountFigure(figure, slug, page, reducedMotion)));
}
