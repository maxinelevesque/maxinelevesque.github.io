import type { APIRoute } from 'astro';
import { makeOG } from '../../lib/og';

export const GET: APIRoute = async () => {
  const png = await makeOG({
    title: 'Maxine Levesque, PhD',
    theme: 'solo',
    system: 4,
    footer: 'handle',
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
