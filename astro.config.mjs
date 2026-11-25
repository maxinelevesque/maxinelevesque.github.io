import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkAbstract from './src/lib/remark-abstract.mjs';
import { remarkEssayFormat, rehypeEssayBlocks, rehypeColumnNotes } from './src/lib/essay-format.mjs';
import { REVIEW_SOURCE_MAP, remarkReviewDisplays, rehypeReviewSourceMap } from './src/lib/review-source-map.mjs';

// Review previews only (REVIEW_SOURCE_MAP=1): every block carries its source lines
// in `writing` as data-src. Production builds don't load these plugins.
const review = REVIEW_SOURCE_MAP
  ? { remark: [remarkReviewDisplays], rehype: [rehypeReviewSourceMap] }
  : { remark: [], rehype: [] };
// Also for review previews: figure components' state reaches the review overlay
// (essay-page.js). It's a build-time constant, so production bundles leave that code out.
const define = { __REVIEW_PREVIEW__: JSON.stringify(REVIEW_SOURCE_MAP) };

export default defineConfig({
  site: 'https://maxine.science',
  // Serve canonical URLs with NO trailing slash (/writing/<slug>, not /writing/<slug>/)
  // so the site's emitted canonical/og:url match the pieces' `canonical:` frontmatter
  // and the atproto site.standard document `path` — required for standard.site link
  // verification. `format: 'file'` emits /writing/<slug>.html (served without the
  // slash and without a redirect) instead of /writing/<slug>/index.html.
  trailingSlash: 'never',
  vite: { define },
  build: { format: 'file' },
  // If using username.github.io, no base needed
  // If using a custom domain, no base needed
  // If using a repo name like github.com/user/repo, set base: '/repo'
  markdown: {
    // TeX/LaTeX math: remark-math parses `$…$` / `$$…$$`; rehype-katex renders
    // it to static HTML at build time (KaTeX CSS is loaded in Base.astro).
    // No client-side JS — safe for static GitHub Pages hosting.
    // The interactive essay format (figures, theorem boxes, margin notes)
    // applies to research reports only; see src/lib/essay-format.mjs.
    remarkPlugins: [remarkMath, remarkAbstract, remarkEssayFormat, ...review.remark],
    rehypePlugins: [rehypeKatex, rehypeEssayBlocks, rehypeColumnNotes, ...review.rehype],
    shikiConfig: {
      theme: 'css-variables',
    },
  },
});
