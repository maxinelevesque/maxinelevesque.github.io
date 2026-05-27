import type { APIRoute } from 'astro';
import { Resvg } from '@resvg/resvg-js';

/**
 * Site favicon — a short double-pendulum trace rendered to PNG.
 *
 * Rendered server-side at 128×128. The browser downscales to 16/32px
 * for tab favicons, which preserves the alpha layering of overlapping
 * pendulum links. (Linking an SVG directly causes browsers to rasterize
 * the SVG at the final favicon size, where the overlapping strokes
 * saturate and the trace blows out.)
 */
export const GET: APIRoute = async () => {
  // Simulate the pendulum on the same coordinate system the OG render
  // uses, but for a much shorter exposure so the trace stays sparse at
  // favicon size.
  const W = 64;
  const H = 64;
  const g = 9.81;
  const l1 = 0.4;
  const l2 = 0.4;
  const m1 = 1;
  const m2 = 1;
  const scale = Math.min(W, H) * 0.42;
  const cx = W * 0.5;
  const cy = H * 0.4;
  const dt = 0.014;
  let th1 = 0.85 * Math.PI;
  let th2 = 0.45 * Math.PI;
  let w1 = 0;
  let w2 = 0;

  const segs: string[] = [];
  for (let frame = 0; frame < 160; frame++) {
    const sd = Math.sin(th1 - th2);
    const cd = Math.cos(th1 - th2);
    const den = 2 * m1 + m2 - m2 * Math.cos(2 * (th1 - th2));
    const a1 =
      (-g * (2 * m1 + m2) * Math.sin(th1) -
        m2 * g * Math.sin(th1 - 2 * th2) -
        2 * sd * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * cd)) /
      (l1 * den);
    const a2 =
      (2 *
        sd *
        (w1 * w1 * l1 * (m1 + m2) +
          g * (m1 + m2) * Math.cos(th1) +
          w2 * w2 * l2 * m2 * cd)) /
      (l2 * den);
    w1 += a1 * dt;
    w2 += a2 * dt;
    th1 += w1 * dt;
    th2 += w2 * dt;
    const x1 = cx + l1 * scale * Math.sin(th1);
    const y1 = cy + l1 * scale * Math.cos(th1);
    const x2 = x1 + l2 * scale * Math.sin(th2);
    const y2 = y1 + l2 * scale * Math.cos(th2);
    segs.push(
      `M${cx.toFixed(1)} ${cy.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`,
    );
  }
  const d = segs.join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="10" fill="#2e1420"/>
    <path d="${d}" stroke="#dba0a0" stroke-width="0.55" fill="none" opacity="0.5" stroke-linecap="round"/>
  </svg>`;

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 128 },
  })
    .render()
    .asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
};
