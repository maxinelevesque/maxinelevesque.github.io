import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { makeOG } from '../../../lib/og';

export async function getStaticPaths() {
  const entries = await getCollection('writing');
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const entry = props.entry as CollectionEntry<'writing'>;
  const tag =
    entry.data.category === 'fiction'
      ? `Story · ${entry.data.date}`
      : entry.data.category === 'article'
        ? `Article · ${entry.data.date}`
        : `Note · ${entry.data.date}`;

  const png = await makeOG({
    title: entry.data.title,
    subtitle: entry.data.subtitle ?? '',
    tag,
    theme: 'solo',
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
