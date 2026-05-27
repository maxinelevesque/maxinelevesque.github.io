import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { makeOG, type OGOptions } from '../../../lib/og';

export async function getStaticPaths() {
  const entries = await getCollection('dialogues');
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

// Per-slug overrides for the system-render panel.
const OVERRIDES: Record<string, Partial<OGOptions>> = {
  'the-floor-is-here': { systemOpacity: 0.55 },
  'deus-ex-machina': { systemTop: -100, systemRight: -120 },
};

export const GET: APIRoute = async ({ props }) => {
  const entry = props.entry as CollectionEntry<'dialogues'>;
  const coauthor = entry.data.coauthor ?? 'Claude';
  const png = await makeOG({
    title: entry.data.title,
    subtitle: entry.data.subtitle ?? '',
    tag: `Dialogue × ${coauthor} · ${entry.data.date}`,
    theme: 'dial',
    system: entry.data.system ?? 2,
    footer: 'compact',
    ...OVERRIDES[entry.slug],
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
