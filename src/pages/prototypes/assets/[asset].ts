import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { portableMarkdown } from '../../../lib/essay-prototype.mjs';

export function getStaticPaths() {
  return import.meta.env.DEV || process.env.ESSAY_PROTOTYPE === '1'
    ? ['fraction-bar.svg', 'read-aloud.txt', 'reader.md'].map((asset) => ({ params: { asset } })) : [];
}

export const GET: APIRoute = ({ params }) => {
  const files = {
    'fraction-bar.svg': ['fraction-bar.svg', 'image/svg+xml'],
    'read-aloud.txt': ['read-aloud.txt', 'text/plain; charset=utf-8'],
    'reader.md': ['index.md', 'text/markdown; charset=utf-8'],
  };
  const entry = files[params.asset as keyof typeof files];
  if (!entry) return new Response('Not found', { status: 404 });
  const [file, contentType] = entry;
  const source = readFileSync(new URL(`../../../../prototypes/essay-format/${file}`, import.meta.url), 'utf8');
  return new Response(params.asset === 'reader.md' ? portableMarkdown(source) : source, {
    headers: { 'Content-Type': contentType, 'X-Robots-Tag': 'noindex, nofollow' },
  });
};
