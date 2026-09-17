# SPEC — content source & presentation split

Canonical content for this site lives in the public repo **`maxinelevesque/writing`**
(one `pieces/<slug>/index.md` per piece, semantic frontmatter only: `title`,
`subtitle?`, `date`, `updated?`, `kind` ∈ {essay, fiction, note, dialogue},
`coauthor?`, `formerName?`, `summary?`, `canonical`). This site is a **downstream
consumer**: at build time `scripts/generate-content.mjs` shallow-clones that repo
(or uses a local checkout via `WRITING_SRC`) and generates
`src/content/{writing,dialogues}/<slug>.md`, routing by `kind` (`dialogue` →
dialogues, else → writing). Presentation that is purely about *how this site
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
