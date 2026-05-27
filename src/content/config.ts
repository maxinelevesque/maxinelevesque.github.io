import { defineCollection, z } from 'astro:content';

const writing = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.string(),
    category: z.enum(['article', 'fiction', 'note']),
    readTime: z.string(),
    formerName: z.string().optional(),
    // Index into the dynamical systems library (0-12)
    system: z.number().default(0),
  }),
});

const dialogues = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.string(),
    readTime: z.string(),
    coauthor: z.string().default('Claude'),
    // Index into the dynamical systems library (0-12)
    system: z.number().default(2),
  }),
});

export const collections = { writing, dialogues };
