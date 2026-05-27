import type { APIRoute } from 'astro';
import { makeOG } from '../../lib/og';

export const GET: APIRoute = async () => {
  const png = await makeOG({
    title: 'Teaching',
    subtitle: 'Talks and notes on the mathematics of mind.',
    theme: 'solo',
    system: 5,
    footer: 'compact',
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
