import type { APIRoute } from 'astro';
import { makeOG } from '../../lib/og';

export const GET: APIRoute = async () => {
  const png = await makeOG({
    title: "Maxine's dream machine",
    subtitle: "Live free. Don't join.",
    theme: 'solo',
    system: 0,
    footer: 'compact',
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
