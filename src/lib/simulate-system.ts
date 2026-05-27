/**
 * Headless simulators for the 13 dynamical systems, mirroring the math
 * in src/components/dynamical-systems.js. Returns a list of normalized
 * points / lines that fit a target w × h band, plus a render kind hint
 * so the SVG renderer can pick the right primitive.
 *
 * Used by src/lib/og.ts to bake a static attractor render into each
 * OG image header.
 */

type Point = { x: number; y: number };
type Segment = { x1: number; y1: number; x2: number; y2: number };

export interface SystemRender {
  kind: 'dots' | 'lines' | 'rects';
  items: Point[] | Segment[];
}

/* ─── 0: Double Pendulum ─────────────────────────────────────────
   Matches the home-page rendering: every frame draws the *full link*
   (origin → joint1 → joint2). Layered at low opacity these overlap into
   the characteristic cluster of pendulum positions, not just a tip
   trajectory polyline. */
function doublePendulum(w: number, h: number): SystemRender {
  const g = 9.81,
    l1 = 0.4,
    l2 = 0.4,
    m1 = 1,
    m2 = 1;
  const scale = Math.min(w, h) * 0.46;
  const cx = w * 0.5,
    cy = h * 0.28;
  const dt = 0.003;
  let th1 = 0.85 * Math.PI,
    th2 = 0.45 * Math.PI;
  let w1 = 0,
    w2 = 0;
  const segs: Segment[] = [];
  // Shorter sim than the live home-page draw loop — keeps the link
  // cluster sparse enough that the internal structure stays visible
  // when layered into a single still.
  for (let frame = 0; frame < 1800; frame++) {
    const sd = Math.sin(th1 - th2),
      cd = Math.cos(th1 - th2);
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
    segs.push({ x1: cx, y1: cy, x2: x1, y2: y1 });
    segs.push({ x1: x1, y1: y1, x2: x2, y2: y2 });
  }
  return { kind: 'lines', items: segs };
}

/* ─── Generic ODE-based dot system ──────────────────────────────── */
function odeSystem(
  w: number,
  h: number,
  init: () => { x: number; y: number; z: number },
  step: (s: { x: number; y: number; z: number }) => void,
  project: (s: { x: number; y: number; z: number }, cx: number, cy: number, sc: number) => Point,
  sc: number,
  cy_frac: number,
  iters: number,
): SystemRender {
  const cx = w * 0.5,
    cy = h * cy_frac;
  const state = init();
  const pts: Point[] = [];
  for (let i = 0; i < iters; i++) {
    step(state);
    pts.push(project(state, cx, cy, sc));
  }
  return { kind: 'dots', items: pts };
}

/* ─── 1: Lorenz ─────────────────────────────────────────────────── */
function lorenz(w: number, h: number): SystemRender {
  const sigma = 10,
    rho = 28,
    beta = 8 / 3,
    dt = 0.005;
  return odeSystem(
    w,
    h,
    () => ({ x: 0.3, y: 0, z: 0 }),
    (s) => {
      const dx = sigma * (s.y - s.x) * dt;
      const dy = (s.x * (rho - s.z) - s.y) * dt;
      const dz = (s.x * s.y - beta * s.z) * dt;
      s.x += dx;
      s.y += dy;
      s.z += dz;
    },
    (s, cx, cy, sc) => ({ x: cx + s.x * sc, y: cy - s.z * sc + 20 * sc }),
    Math.min(w, h) * 0.011,
    0.55,
    7200,
  );
}

/* ─── 2: Rössler ────────────────────────────────────────────────── */
function rossler(w: number, h: number): SystemRender {
  const a = 0.2,
    b = 0.2,
    c = 5.7,
    dt = 0.02;
  return odeSystem(
    w,
    h,
    () => ({ x: 2, y: 1, z: 0 }),
    (s) => {
      const dx = (-s.y - s.z) * dt;
      const dy = (s.x + a * s.y) * dt;
      const dz = (b + s.z * (s.x - c)) * dt;
      s.x += dx;
      s.y += dy;
      s.z += dz;
    },
    (s, cx, cy, sc) => ({ x: cx + s.x * sc, y: cy + s.y * sc }),
    Math.min(w, h) * 0.022,
    0.45,
    24000,
  );
}

/* ─── 3: Thomas ─────────────────────────────────────────────────── */
function thomas(w: number, h: number): SystemRender {
  const b = 0.208186,
    dt = 0.04;
  return odeSystem(
    w,
    h,
    () => ({ x: 1.3, y: 1.1, z: -0.01 }),
    (s) => {
      const dx = (-b * s.x + Math.sin(s.y)) * dt;
      const dy = (-b * s.y + Math.sin(s.z)) * dt;
      const dz = (-b * s.z + Math.sin(s.x)) * dt;
      s.x += dx;
      s.y += dy;
      s.z += dz;
    },
    (s, cx, cy, sc) => ({ x: cx + s.x * sc, y: cy + s.y * sc }),
    Math.min(w, h) * 0.09,
    0.45,
    28000,
  );
}

/* ─── 4: Aizawa ─────────────────────────────────────────────────── */
function aizawa(w: number, h: number): SystemRender {
  const a = 0.95,
    b = 0.7,
    c = 0.6,
    d = 3.5,
    e = 0.25,
    f = 0.1,
    dt = 0.007;
  return odeSystem(
    w,
    h,
    () => ({ x: 0.15, y: 0, z: 0 }),
    (s) => {
      const dx = ((s.z - b) * s.x - d * s.y) * dt;
      const dy = (d * s.x + (s.z - b) * s.y) * dt;
      const dz =
        (c +
          a * s.z -
          (s.z * s.z * s.z) / 3 -
          (s.x * s.x + s.y * s.y) * (1 + e * s.z) +
          f * s.z * s.x * s.x * s.x) *
        dt;
      s.x += dx;
      s.y += dy;
      s.z += dz;
    },
    (s, cx, cy, sc) => ({ x: cx + s.x * sc, y: cy - s.z * sc }),
    Math.min(w, h) * 0.16,
    0.48,
    35200,
  );
}

/* ─── 5: Halvorsen ──────────────────────────────────────────────── */
function halvorsen(w: number, h: number): SystemRender {
  const a = 1.89,
    dt = 0.003;
  return odeSystem(
    w,
    h,
    () => ({ x: -1.48, y: -1.51, z: 2.04 }),
    (s) => {
      const dx = (-a * s.x - 4 * s.y - 4 * s.z - s.y * s.y) * dt;
      const dy = (-a * s.y - 4 * s.z - 4 * s.x - s.z * s.z) * dt;
      const dz = (-a * s.z - 4 * s.x - 4 * s.y - s.x * s.x) * dt;
      s.x += dx;
      s.y += dy;
      s.z += dz;
    },
    (s, cx, cy, sc) => ({ x: cx + s.x * sc, y: cy + s.y * sc }),
    Math.min(w, h) * 0.023,
    0.45,
    22000,
  );
}

/* ─── 6: Chen ───────────────────────────────────────────────────── */
function chen(w: number, h: number): SystemRender {
  const a = 40,
    b = 3,
    c = 28,
    dt = 0.002;
  return odeSystem(
    w,
    h,
    () => ({ x: -0.1, y: 0.5, z: -0.6 }),
    (s) => {
      const dx = a * (s.y - s.x) * dt;
      const dy = ((c - a) * s.x - s.x * s.z + c * s.y) * dt;
      const dz = (s.x * s.y - b * s.z) * dt;
      s.x += dx;
      s.y += dy;
      s.z += dz;
    },
    (s, cx, cy, sc) => ({ x: cx + s.x * sc, y: cy - s.z * sc + 25 * sc }),
    Math.min(w, h) * 0.008,
    0.55,
    12000,
  );
}

/* ─── 7: Clifford (2D map) ──────────────────────────────────────── */
function clifford(w: number, h: number): SystemRender {
  const p = { a: -1.4, b: 1.6, c: 1.0, d: 0.7 };
  let x = 0.1,
    y = 0.1;
  const sc = Math.min(w, h) * 0.12;
  const cx = w * 0.5,
    cy = h * 0.45;
  const pts: Point[] = [];
  for (let i = 0; i < 30000; i++) {
    const nx = Math.sin(p.a * y) + p.c * Math.cos(p.a * x);
    const ny = Math.sin(p.b * x) + p.d * Math.cos(p.b * y);
    x = nx;
    y = ny;
    pts.push({ x: cx + x * sc, y: cy + y * sc });
  }
  return { kind: 'dots', items: pts };
}

/* ─── 8: Duffing ────────────────────────────────────────────────── */
function duffing(w: number, h: number): SystemRender {
  const alpha = 1,
    beta = -1,
    delta = 0.2,
    gamma = 0.3,
    omega = 1.2,
    dt = 0.008;
  let x = 0.6,
    v = 0,
    t = 0;
  const sc = Math.min(w, h) * 0.3;
  const cx = w * 0.5,
    cy = h * 0.45;
  const pts: Point[] = [];
  for (let i = 0; i < 24000; i++) {
    const dx = v * dt;
    const dv =
      (-delta * v - alpha * x - beta * x * x * x + gamma * Math.cos(omega * t)) * dt;
    x += dx;
    v += dv;
    t += dt;
    pts.push({ x: cx + x * sc, y: cy + v * sc });
  }
  return { kind: 'dots', items: pts };
}

/* ─── 9: Hénon Map ──────────────────────────────────────────────── */
function henon(w: number, h: number): SystemRender {
  const a = 1.4,
    b = 0.3;
  let x = 0.15,
    y = 0.1;
  const sc = Math.min(w, h) * 0.7;
  const cx = w * 0.32,
    cy = h * 0.35;
  // burn-in
  for (let i = 0; i < 200; i++) {
    const nx = 1 - a * x * x + y;
    const ny = b * x;
    x = nx;
    y = ny;
  }
  const pts: Point[] = [];
  for (let i = 0; i < 48000; i++) {
    const nx = 1 - a * x * x + y;
    const ny = b * x;
    x = nx;
    y = ny;
    if (Math.abs(x) < 5 && Math.abs(y) < 5) {
      pts.push({ x: cx + x * sc, y: cy + y * sc * 4 });
    }
  }
  return { kind: 'dots', items: pts };
}

/* ─── 10: Sprott B ──────────────────────────────────────────────── */
function sprottB(w: number, h: number): SystemRender {
  const dt = 0.015;
  return odeSystem(
    w,
    h,
    () => ({ x: 0.6, y: 0.5, z: 0 }),
    (s) => {
      const dx = s.y * s.z * dt;
      const dy = (s.x - s.y) * dt;
      const dz = (1 - s.x * s.y) * dt;
      s.x += dx;
      s.y += dy;
      s.z += dz;
    },
    (s, cx, cy, sc) => ({ x: cx + s.x * sc, y: cy + s.z * sc }),
    Math.min(w, h) * 0.1,
    0.45,
    8800,
  );
}

/* ─── 11: Three-Body — triangle edges per frame ─────────────────── */
function threeBody(w: number, h: number): SystemRender {
  const G = 1;
  const sc = Math.min(w, h) * 0.18;
  const cx = w * 0.5,
    cy = h * 0.42;
  const dt = 0.001;
  const softening = 0.5;
  const bodies = [
    { x: -1, y: 0, vx: 0.35, vy: -0.2, m: 1 },
    { x: 1, y: 0, vx: -0.1, vy: 0.4, m: 1 },
    { x: 0, y: 1.5, vx: -0.25, vy: -0.2, m: 1 },
  ];
  const segs: Segment[] = [];
  // Shorter exposure than the home-page sim — the per-frame triangle
  // overlay accumulates quickly into a dense silhouette otherwise.
  for (let f = 0; f < 400; f++) {
    for (let s = 0; s < 6; s++) {
      for (let a = 0; a < 3; a++) {
        let ax = 0,
          ay = 0;
        for (let b = 0; b < 3; b++) {
          if (a === b) continue;
          const dx = bodies[b].x - bodies[a].x;
          const dy = bodies[b].y - bodies[a].y;
          const r2 = dx * dx + dy * dy + softening * softening;
          const r = Math.sqrt(r2);
          const fmag = (G * bodies[b].m) / r2;
          ax += (fmag * dx) / r;
          ay += (fmag * dy) / r;
        }
        bodies[a].vx += ax * dt;
        bodies[a].vy += ay * dt;
      }
      for (let a = 0; a < 3; a++) {
        bodies[a].x += bodies[a].vx * dt;
        bodies[a].y += bodies[a].vy * dt;
      }
    }
    const pts = bodies.map((b) => ({ x: cx + b.x * sc, y: cy + b.y * sc }));
    segs.push({ x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y });
    segs.push({ x1: pts[1].x, y1: pts[1].y, x2: pts[2].x, y2: pts[2].y });
    segs.push({ x1: pts[2].x, y1: pts[2].y, x2: pts[0].x, y2: pts[0].y });
  }
  return { kind: 'lines', items: segs };
}

/* ─── 12: Logistic Bifurcation ──────────────────────────────────── */
function logisticBifurcation(w: number, h: number): SystemRender {
  const rMin = 2.5,
    rMax = 4.0;
  const totalCols = Math.floor(w);
  const pts: Point[] = [];
  for (let col = 0; col < totalCols; col++) {
    const r = rMin + ((rMax - rMin) * col) / totalCols;
    let x = 0.5;
    for (let i = 0; i < 200; i++) x = r * x * (1 - x);
    for (let i = 0; i < 80; i++) {
      x = r * x * (1 - x);
      const py = h - x * h * 0.85 - h * 0.07;
      pts.push({ x: col, y: py });
    }
  }
  return { kind: 'dots', items: pts };
}

const SYSTEMS = [
  doublePendulum,
  lorenz,
  rossler,
  thomas,
  aizawa,
  halvorsen,
  chen,
  clifford,
  duffing,
  henon,
  sprottB,
  threeBody,
  logisticBifurcation,
];

export function simulateSystem(index: number, w: number, h: number): SystemRender {
  const fn = SYSTEMS[index % SYSTEMS.length];
  return fn(w, h);
}

/* ─── SVG renderer ──────────────────────────────────────────────── */
export function renderSystemSVG(
  index: number,
  w: number,
  h: number,
  color: string,
  opacity: number = 0.5,
): string {
  const r = simulateSystem(index, w, h);
  let inner = '';
  if (r.kind === 'lines') {
    const segs = r.items as Segment[];
    // Build a single path for efficiency
    const d = segs
      .map((s) => `M${s.x1.toFixed(1)} ${s.y1.toFixed(1)}L${s.x2.toFixed(1)} ${s.y2.toFixed(1)}`)
      .join('');
    inner = `<path d="${d}" stroke="${color}" stroke-width="0.6" fill="none" opacity="${opacity * 0.5}" />`;
  } else {
    const pts = r.items as Point[];
    // Use a single path of zero-length lines for the dots — much smaller than <circle> per point.
    // We use a tiny circle radius via stroke-linecap='round' on a path of subpixel segments.
    const d = pts
      .map(
        (p) =>
          `M${p.x.toFixed(1)} ${p.y.toFixed(1)}l0 0.01`,
      )
      .join('');
    inner = `<path d="${d}" stroke="${color}" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="${opacity}" />`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
}
