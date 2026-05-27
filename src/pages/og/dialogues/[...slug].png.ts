import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { makeOG } from '../../../lib/og';

export async function getStaticPaths() {
  const entries = await getCollection('dialogues');
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

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
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
