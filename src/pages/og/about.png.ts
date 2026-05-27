import type { APIRoute } from 'astro';
import { makeOG } from '../../lib/og';

export const GET: APIRoute = async () => {
  const png = await makeOG({
    title: 'Maxine Levesque, PhD',
    subtitle:
      'Physician-scientist in training. Math, mind, and the relational architecture of consciousness.',
    tag: 'About',
    theme: 'solo',
  });
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' },
  });
};
