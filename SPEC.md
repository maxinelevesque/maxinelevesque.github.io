# SPEC — content source & presentation split

Canonical content for this site lives in the public repo **`maxinelevesque/writing`**
(one `pieces/<slug>/index.md` per piece, semantic frontmatter only: `title`,
`subtitle?`, `date`, `updated?`, `kind` ∈ {essay, fiction, note, dialogue, report},
`coauthor?`, `coauthorNote?`, `formerName?`, `summary?`, `canonical`, `tags?`,
`contributors?`, `readAloud?`). This site is a **downstream
consumer**: at build time `scripts/generate-content.mjs` shallow-clones that repo
(or uses a local checkout via `WRITING_SRC`) and generates
`src/content/{writing,dialogues,research}/<slug>.md`, routing by `kind` (`dialogue` →
dialogues, `report` → research, else → writing). Research reports render in a third,
ochre register at `/research/<slug>`; their contributors are resolved against the
content repo's `personas.json` (with per-piece roles), and their files (`assets/`
and a `readAloud` companion) are copied to `public/files/<slug>/`. Presentation that is purely about *how this site
renders* — the dynamical-system background index and the read-time string — is not
in the content repo; it lives here in `presentation.json`, keyed by slug, and is
**merged into the generated frontmatter at build time** so the existing Astro pages
and OG routes keep reading `system`/`readTime` from `entry.data` unchanged. ISO
`date`s are formatted to the site's human display form during generation. `summary`
falls back to `subtitle` for OG/description until authored.

Rebuilds are triggered two ways: a normal push/`workflow_dispatch`, and
`repository_dispatch` with event type **`content-updated`**, which the `writing`
repo's publish workflow fires (via a `SITE_DISPATCH_TOKEN` PAT it holds) whenever
`pieces/**` changes on its `main`. Generation is idempotent and never touches slugs
absent from `pieces/**`: the site-local `src/content/dialogues/straw-holes.md` stub
is intentionally preserved until straw-holes is promoted into the content repo's
`pieces/`, at which point the generator takes it over automatically. Math is
rendered at build time via `remark-math` + `rehype-katex` (static HTML; KaTeX CSS
is loaded in `Base.astro`), so math-bearing pieces render on static hosting with no
client-side JS.

## Interactive essay format

Research reports use the interactive essay format approved on 2026-11-15
(`prototypes/essay-format/PROPOSAL.md`). `src/lib/essay-format.mjs` applies it to
the `research` collection only; other pieces render exactly as before.

- **Notes:** ordinary Markdown footnotes. On screens 1100 px and wider the page
  script moves each note beside its first referring paragraph, a size smaller
  and without a return link; otherwise, and without JavaScript, they are
  collected at the end as "Notes and footnotes", with return links.
- **Theorem boxes:** `> [!THEOREM] Lead`. **Scope boxes:** `> [!ESTABLISHED] Lead`,
  shown as a disclosure.
- **Figures:** three blocks, in this order:

  ```md
  <!-- figure #fig-reduction component="reduction" calc="tree" -->

  ![Alt text that carries the figure's content.](assets/fig-reduction.svg)

  **Figure 3. Reduction (tree calculus).** Caption …
  ```

  The marker needs an `#id` and a `component`; any other `key="value"` pairs are
  passed to the component. A figure without an image, alt text or caption, a
  repeated id, or an unreadable marker fails the build. Each figure's layout
  (`left`, the default; `center`; `full`) is a site choice, set in
  `presentation.json` under `figureLayouts`, and the generator writes it into the
  marker. Relative links into `assets/` (and to the read-aloud file) are rewritten
  to `/files/<slug>/…`.
- **Displays:** `$$…$$` for mathematics, a fenced code block for a long term
  (set as a display, in the register's code colour). A paragraph that starts on
  the line right after a display, with no blank line, continues the paragraph
  before it and is not indented, as in LaTeX; a blank line starts a new one.
- **Proof links:** a link to a Lean file (`….lean`, optionally `#L12` or
  `#L12-L20`) is a proof link: the linked text, the proved statement, gets a
  dashed underline, and screen readers hear "machine-checked proof in Lean".
  Introduce the convention in a note at its first use.
- **Tables:** left-aligned headers over a rule. A table wider than the text
  column takes room from the left margin, then from both, on wide screens (the
  page script measures it); otherwise it scrolls sideways.
- **Page switch:** an optional page-level control declared in `presentation.json`
  (`pageSwitch: { param, label, default, options: [{ value, label }] }`). The
  piece introduces it with a `<!-- page-switch -->` marker where its text
  explains it; the control sits there in the text until scrolled past, then
  sticks to the top of the window. Without a marker it sits above the article. Its state
  lives in the query string (`?calc=tree`), not the fragment, so `#` links to
  figures, sections and notes keep it; the default value is left out of the URL.
  An old `#calc=tree` link is converted once on load. The current value is also
  set on the article as `data-<param>`.
- **Run the checks:** `node scripts/check-essay-format.mjs` (Markdown plugins) and
  `WRITING_SRC=../writing node scripts/build-essay-sample.mjs` (the whole site with
  the sample report at `/research/essay-format-sample`; never part of a
  production build).

### Figure code: pinned, never live

Figure components live with the piece in `writing` (`pieces/<slug>/figures/`, or
`drafts/<slug>/figures/` before publication). The site runs them only from the
`writing` commit named in `presentation.json`:

```json
"localization-semantics-1": { "…": "…", "figures": "<40-character writing commit>" }
```

The generator copies that commit's `figures/` into `src/figures/<slug>/`
(gitignored); Vite bundles each component as its own chunk. A prose merge in
`writing` never changes the code that runs: new figure code reaches readers only
through a reviewed site PR that moves the pin. A report with figures but no pin
builds with its still images only (and a warning). `FIGURES_FROM_SOURCE=1` takes
the code from the source tree instead; it is for the local sample and private
previews, never production.

### Figure components

A component is `figures/<component>.js` (or `.mjs`) exporting `mount`:

```js
export function mount(host, { id, attrs, params, on, reducedMotion }) { … }
```

- `host` is an empty `<div class="figure-live">` already placed in the figure.
  Draw only inside it: no assumptions about `<body>`, global ids or the window's
  width. Size to the host (a `ResizeObserver` on it), not the window.
- `id` is the figure's id, for building unique ids inside it.
- `attrs` holds the marker's extra attributes as strings (e.g. `{ calc: "tree" }`).
- `params` holds the page switch's current values (e.g. `{ calc: "ski" }`), and
  `on(name, fn)` calls `fn(value)` when one changes; it returns an unsubscribe
  function.
- `reducedMotion` is the `(prefers-reduced-motion: reduce)` media query. Honour it.
- `mount` may be async. If it throws or rejects, the page removes the host and
  keeps the still image and caption. The still is hidden only after `mount`
  succeeds.
- `mount` may return `{ getState, setState }`, for review previews only (below):
  `getState()` returns the figure's state as plain JSON (a few hundred bytes at
  most), and `setState(state)` draws it again. A comment on the figure saves its
  state, and "show me" restores it. Production pages never call them.
- A component may import its own modules and CSS from `figures/`. Scope its CSS
  under its own class, and use the page's `--essay-text`, `--essay-muted`,
  `--essay-accent`, `--essay-rule` and `--essay-bg` colours. Labels are HTML text,
  not SVG text.
- Tests live beside the components (`*.test.mjs`); they are never bundled.

The sample component is `prototypes/essay-format/figures/fraction-bar.js`.

## Review previews: source lines

Review previews (maxine/review on the forge) need each rendered block to say which source lines
it came from, so a comment made on the page lands on the right lines in `writing`. With
`REVIEW_SOURCE_MAP=1`:

- `generate-content` writes `src/data/review-source-map.json` (gitignored): each piece's offset
  from the generated file to `pieces/<slug>/index.md`. The generator only rewrites text within
  lines, so a single offset per piece is exact.
- `src/lib/review-source-map.mjs` adds `data-src="pieces/<slug>/index.md:<start>-<end>"` to every
  block: paragraphs, headings, list items, containers, figures (from the marker to the caption),
  tables and their rows, and notes (their definitions' lines). KaTeX and Shiki replace display
  math and code blocks, so those are matched back to their source by content.
- A text block left without lines fails the build.
- The page script hands each figure's `{ getState, setState }` (if its `mount` returned them) to
  the review overlay as `figure.reviewFigure`. This is behind the build-time constant
  `__REVIEW_PREVIEW__` (Vite `define`), so production bundles don't contain it.

Without the variable, neither plugin is loaded, and pages are byte-for-byte as before;
`build-essay-sample.mjs` checks this. Tests: `node scripts/check-review-source-map.mjs`, and
`REVIEW_SOURCE_MAP=1 node scripts/build-essay-sample.mjs` for the full build.

## Site-wide

- **Always dark.** `:root` declares `color-scheme: dark`, so an SVG image's own
  `prefers-color-scheme` rules pick their dark variant here even when the
  reader's system is light (GitHub shows the light variant on its light theme).
- **Code** is set in IBM Plex Mono, self-hosted via `@fontsource/ibm-plex-mono`;
  in the research register it is tinted toward ochre.
- **Hyphenation:** body text hyphenates automatically (words of six letters or
  more); headings, titles, code and math don't.
- **Math size:** inline and display math share one size, 1.1em of the body text.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, the background systems
  draw their finished trace at once instead of animating it, and CSS transitions
  are cut to nothing.
