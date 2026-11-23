import { defineCollection, z } from 'astro:content';

// Content files under src/content/{writing,dialogues,research} are GENERATED at build
// time by scripts/generate-content.mjs from the canonical `maxinelevesque/writing`
// repo, merged with presentation.json (system index + readTime, keyed by slug).
// See SPEC.md. `kind` is the semantic category carried over from the source repo
// (essay|fiction|note → writing, dialogue → dialogues, report → research);
// `readTime` and `system`
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
    // One or two sentences hung as a footnote off the coauthor byline (SCHEMA.md upstream).
    coauthorNote: z.string().optional(),
    summary: z.string().optional(),
    // Index into the dynamical systems library (0-12), from presentation.json
    system: z.number().default(2),
  }),
});

// Research reports: long-form technical pieces, optionally co-written, with
// per-contributor roles and an optional read-aloud companion.
const research = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.string(),
    updated: z.string().optional(),
    kind: z.literal('report'),
    readTime: z.string(),
    coauthor: z.string().optional(),
    coauthorNote: z.string().optional(),
    summary: z.string().optional(),
    // Resolved by the generator from the writing repo's personas.json.
    contributors: z.array(z.object({ name: z.string(), role: z.string().optional() })).default([]),
    // Site path of the read-aloud companion, copied into public/ by the generator.
    readAloud: z.string().optional(),
    // The page-level switch (e.g. ?calc=), from presentation.json.
    pageSwitch: z.object({
      param: z.string().regex(/^[a-z][a-z0-9]*$/),
      label: z.string(),
      default: z.string(),
      options: z.array(z.object({ value: z.string(), label: z.string() })).min(2),
    }).optional(),
    system: z.number().default(9),
  }),
});

export const collections = { writing, dialogues, research };
