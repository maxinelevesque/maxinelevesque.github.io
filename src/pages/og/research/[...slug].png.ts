import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { makeOG, type OGOptions } from '../../../lib/og';

export async function getStaticPaths() {
  const entries = await getCollection('research');
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

// Per-slug overrides for the system-render panel.
const OVERRIDES: Record<string, Partial<OGOptions>> = {};

export const GET: APIRoute = async ({ props }) => {
  const entry = props.entry as CollectionEntry<'research'>;
  const byline = entry.data.coauthor ? `Research report × ${entry.data.coauthor}` : 'Research report';
  const png = await makeOG({
    title: entry.data.title,
    subtitle: entry.data.subtitle ?? '',
    tag: `${byline} · ${entry.data.date}`,
    theme: 'research',
    system: entry.data.system ?? 9,
    footer: 'compact',
    ...OVERRIDES[entry.slug],
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
