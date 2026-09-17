import { defineCollection, z } from 'astro:content';

// Content files under src/content/{writing,dialogues} are GENERATED at build
// time by scripts/generate-content.mjs from the canonical `maxinelevesque/writing`
// repo, merged with presentation.json (system index + readTime, keyed by slug).
// See SPEC.md. `kind` is the semantic category carried over from the source repo
// (essay|fiction|note → writing, dialogue → dialogues); `readTime` and `system`
// are injected from the presentation sidecar, so they still live in frontmatter
// where the pages and OG routes read them.

const writing = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.string(),
    updated: z.string().optional(),
    kind: z.enum(['essay', 'fiction', 'note']),
    readTime: z.string(),
    formerName: z.string().optional(),
    summary: z.string().optional(),
    // Index into the dynamical systems library (0-12), from presentation.json
    system: z.number().default(0),
  }),
});

const dialogues = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.string(),
    updated: z.string().optional(),
    // Dialogues always carry kind: dialogue; kept optional so the site-local
    // straw-holes stub (no kind) still validates until it's promoted upstream.
    kind: z.literal('dialogue').optional(),
    readTime: z.string(),
    coauthor: z.string().default('Claude'),
    summary: z.string().optional(),
    // Index into the dynamical systems library (0-12), from presentation.json
    system: z.number().default(2),
  }),
});

export const collections = { writing, dialogues };
