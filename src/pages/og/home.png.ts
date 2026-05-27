import type { APIRoute } from 'astro';
import { makeOG } from '../../lib/og';

export const GET: APIRoute = async () => {
  const png = await makeOG({
    title: "Maxine's dream machine",
    subtitle: "Live free. Don't join.",
    theme: 'solo',
    system: 0,
    footer: 'compact',
    systemSize: 620,
    systemOpacity: 0.85,
    systemTop: 60,
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
