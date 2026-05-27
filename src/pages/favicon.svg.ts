import type { APIRoute } from 'astro';

/**
 * Site favicon — a short trace of the double pendulum (system 0). Uses
 * the same math as src/lib/simulate-system.ts but runs a tiny ~120-frame
 * sim so the resulting SVG path stays compact (~5 KB) for use as a
 * favicon, rather than the full 1800-frame attractor we render into OG.
 */
export const GET: APIRoute = async () => {
  const W = 64;
  const H = 64;
  const g = 9.81;
  const l1 = 0.4;
  const l2 = 0.4;
  const m1 = 1;
  const m2 = 1;
  const scale = Math.min(W, H) * 0.42;
  const cx = W * 0.5;
  const cy = H * 0.3;
  const dt = 0.004;
  let th1 = 0.85 * Math.PI;
  let th2 = 0.45 * Math.PI;
  let w1 = 0;
  let w2 = 0;

  const segs: string[] = [];
  for (let frame = 0; frame < 120; frame++) {
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
  <path d="${d}" stroke="#dba0a0" stroke-width="0.6" fill="none" opacity="0.55"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
};
