import type { APIRoute } from 'astro';
import { makeOG } from '../../lib/og';

// Home subtitle is mixed-style: "Live free." upright, "Don't join."
// italic. Built as a satori children array — the parent subtitle div in
// og.ts sets fontStyle: italic, so the second span inherits italic and
// the first overrides back to normal.
const homeSubtitle = [
  {
    type: 'span',
    props: {
      style: { fontStyle: 'normal', display: 'flex' },
      children: 'Live free.',
    },
  },
  {
    type: 'span',
    props: {
      style: { display: 'flex' },
      children: "Don't join.",
    },
  },
];

export const GET: APIRoute = async () => {
  const png = await makeOG({
    title: "Maxine's dream machine",
    subtitle: homeSubtitle,
    subtitleSize: 40,
    theme: 'solo',
    system: 0,
    footer: 'compact',
    systemSize: 620,
    systemOpacity: 1.0,
    systemTop: 10,
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
