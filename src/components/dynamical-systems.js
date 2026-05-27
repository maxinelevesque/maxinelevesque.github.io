/**
 * Dynamical Systems Library for maxine.science
 * Each system draws onto a canvas element with low-opacity traces.
 * Usage: initSystem(canvasElement, systemIndex, color)
 */

const SYSTEM_NAMES = [
  "Double Pendulum", "Lorenz Attractor", "Rössler Attractor",
  "Thomas Attractor", "Aizawa Attractor", "Halvorsen Attractor",
  "Chen Attractor", "Clifford Attractor", "Duffing Oscillator",
  "Hénon Map", "Sprott B Attractor", "Three-Body Problem",
  "Logistic Bifurcation",
];

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w, h };
}

// ─── 0: Double Pendulum ──────────────────────────────────────
function doublePendulum(ctx, w, h, color) {
  const g = 9.81, l1 = 0.4, l2 = 0.4, m1 = 1, m2 = 1;
  const scale = Math.min(w, h) * 0.46;
  const cx = w * 0.5, cy = h * 0.28;
  const dt = 0.003;
  let th1 = Math.random() * Math.PI + 0.3 * Math.PI;
  let th2 = Math.random() * Math.PI + 0.5 * Math.PI;
  let w1 = 0, w2 = 0;
  let frame = 0, animId;
  function step() {
    const sd = Math.sin(th1 - th2), cd = Math.cos(th1 - th2);
    const den = 2 * m1 + m2 - m2 * Math.cos(2 * (th1 - th2));
    const a1 = (-g * (2 * m1 + m2) * Math.sin(th1) - m2 * g * Math.sin(th1 - 2 * th2)
      - 2 * sd * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * cd)) / (l1 * den);
    const a2 = (2 * sd * (w1 * w1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(th1)
      + w2 * w2 * l2 * m2 * cd)) / (l2 * den);
    w1 += a1 * dt; w2 += a2 * dt; th1 += w1 * dt; th2 += w2 * dt;
    const x1 = cx + l1 * scale * Math.sin(th1);
    const y1 = cy + l1 * scale * Math.cos(th1);
    const x2 = x1 + l2 * scale * Math.sin(th2);
    const y2 = y1 + l2 * scale * Math.cos(th2);
    return { x1, y1, x2, y2 };
  }
  function draw() {
    const p = step();
    ctx.strokeStyle = color; ctx.globalAlpha = 0.06; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke();
    frame++;
    if (frame < 4000) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 1: Lorenz Attractor ─────────────────────────────────────
function lorenz(ctx, w, h, color) {
  const sigma = 10, rho = 28, beta = 8 / 3, dt = 0.005;
  let x = 0.1 + Math.random() * 0.5, y = 0, z = 0;
  const sc = Math.min(w, h) * 0.011;
  const cx = w * 0.5, cy = h * 0.55;
  let frame = 0, animId;
  function draw() {
    for (let i = 0; i < 6; i++) {
      x += sigma * (y - x) * dt; y += (x * (rho - z) - y) * dt; z += (x * y - beta * z) * dt;
      ctx.globalAlpha = 0.04; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy - z * sc + 20 * sc, 0.9, 0, Math.PI * 2); ctx.fill();
    }
    frame++;
    if (frame < 1200) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 2: Rössler Attractor ────────────────────────────────────
function rossler(ctx, w, h, color) {
  const a = 0.2, b = 0.2, c = 5.7, dt = 0.008;
  let x = 1 + Math.random() * 2, y = 1, z = 0;
  const sc = Math.min(w, h) * 0.022;
  const cx = w * 0.5, cy = h * 0.45;
  let frame = 0, animId;
  function draw() {
    for (let i = 0; i < 24; i++) {
      const dx = (-y - z) * dt, dy = (x + a * y) * dt, dz = (b + z * (x - c)) * dt;
      x += dx; y += dy; z += dz;
      ctx.globalAlpha = 0.035; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, 0.9, 0, Math.PI * 2); ctx.fill();
    }
    frame++;
    if (frame < 1000) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 3: Thomas Attractor ─────────────────────────────────────
function thomas(ctx, w, h, color) {
  const b = 0.208186, dt = 0.04;
  let x = 1.1 + Math.random() * 0.5, y = 1.1, z = -0.01;
  const sc = Math.min(w, h) * 0.09;
  const cx = w * 0.5, cy = h * 0.45;
  let frame = 0, animId;
  function draw() {
    for (let i = 0; i < 24; i++) {
      const dx = (-b * x + Math.sin(y)) * dt;
      const dy = (-b * y + Math.sin(z)) * dt;
      const dz = (-b * z + Math.sin(x)) * dt;
      x += dx; y += dy; z += dz;
      ctx.globalAlpha = 0.04; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, 1, 0, Math.PI * 2); ctx.fill();
    }
    frame++;
    if (frame < 1200) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 4: Aizawa Attractor ─────────────────────────────────────
function aizawa(ctx, w, h, color) {
  const a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1;
  const dt = 0.007;
  let x = 0.1 + Math.random() * 0.1, y = 0, z = 0;
  const sc = Math.min(w, h) * 0.16;
  const cx = w * 0.5, cy = h * 0.48;
  let frame = 0, animId;
  function draw() {
    for (let i = 0; i < 32; i++) {
      const dx = ((z - b) * x - d * y) * dt;
      const dy = (d * x + (z - b) * y) * dt;
      const dz = (c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x) * dt;
      x += dx; y += dy; z += dz;
      ctx.globalAlpha = 0.035; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy - z * sc, 0.8, 0, Math.PI * 2); ctx.fill();
    }
    frame++;
    if (frame < 1100) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 5: Halvorsen Attractor ──────────────────────────────────
function halvorsen(ctx, w, h, color) {
  const a = 1.89, dt = 0.003;
  let x = -1.48 + Math.random() * 0.3, y = -1.51, z = 2.04;
  const sc = Math.min(w, h) * 0.023;
  const cx = w * 0.5, cy = h * 0.45;
  let frame = 0, animId;
  function draw() {
    for (let i = 0; i < 20; i++) {
      const dx = (-a * x - 4 * y - 4 * z - y * y) * dt;
      const dy = (-a * y - 4 * z - 4 * x - z * z) * dt;
      const dz = (-a * z - 4 * x - 4 * y - x * x) * dt;
      x += dx; y += dy; z += dz;
      ctx.globalAlpha = 0.035; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, 0.8, 0, Math.PI * 2); ctx.fill();
    }
    frame++;
    if (frame < 1100) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 6: Chen Attractor ───────────────────────────────────────
function chen(ctx, w, h, color) {
  const a = 40, b = 3, c = 28, dt = 0.002;
  let x = -0.1 + Math.random() * 0.5, y = 0.5, z = -0.6;
  const sc = Math.min(w, h) * 0.008;
  const cx = w * 0.5, cy = h * 0.55;
  let frame = 0, animId;
  function draw() {
    for (let i = 0; i < 10; i++) {
      const dx = (a * (y - x)) * dt;
      const dy = ((c - a) * x - x * z + c * y) * dt;
      const dz = (x * y - b * z) * dt;
      x += dx; y += dy; z += dz;
      ctx.globalAlpha = 0.04; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy - z * sc + 25 * sc, 0.9, 0, Math.PI * 2); ctx.fill();
    }
    frame++;
    if (frame < 1200) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 7: Clifford Attractor ───────────────────────────────────
function clifford(ctx, w, h, color) {
  const params = [
    { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    { a: 1.7, b: 1.7, c: 0.6, d: 1.2 },
    { a: -1.7, b: 1.3, c: -0.1, d: -1.2 },
  ];
  const p = params[Math.floor(Math.random() * params.length)];
  let x = 0.1, y = 0.1;
  const sc = Math.min(w, h) * 0.12;
  const cx = w * 0.5, cy = h * 0.45;
  let frame = 0, animId;
  function draw() {
    for (let i = 0; i < 20; i++) {
      const nx = Math.sin(p.a * y) + p.c * Math.cos(p.a * x);
      const ny = Math.sin(p.b * x) + p.d * Math.cos(p.b * y);
      x = nx; y = ny;
      ctx.globalAlpha = 0.025; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, 0.7, 0, Math.PI * 2); ctx.fill();
    }
    frame++;
    if (frame < 1500) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 8: Duffing Oscillator ───────────────────────────────────
function duffing(ctx, w, h, color) {
  const alpha = 1, beta = -1, delta = 0.2, gamma = 0.3, omega = 1.2;
  const dt = 0.008;
  let x = 0.5 + Math.random() * 0.3, v = 0, t = 0;
  const sc = Math.min(w, h) * 0.3;
  const cx = w * 0.5, cy = h * 0.45;
  let frame = 0, animId;
  function draw() {
    for (let i = 0; i < 20; i++) {
      const dx = v * dt;
      const dv = (-delta * v - alpha * x - beta * x * x * x + gamma * Math.cos(omega * t)) * dt;
      x += dx; v += dv; t += dt;
      ctx.globalAlpha = 0.035; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy + v * sc, 0.8, 0, Math.PI * 2); ctx.fill();
    }
    frame++;
    if (frame < 1200) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 9: Hénon Map ────────────────────────────────────────────
function henon(ctx, w, h, color) {
  const a = 1.4, b = 0.3;
  let x = 0.1 + Math.random() * 0.1, y = 0.1;
  const sc = Math.min(w, h) * 0.7;
  const cx = w * 0.32, cy = h * 0.35;
  let frame = 0, animId;
  for (let i = 0; i < 200; i++) {
    const nx = 1 - a * x * x + y; const ny = b * x; x = nx; y = ny;
  }
  function draw() {
    for (let i = 0; i < 40; i++) {
      const nx = 1 - a * x * x + y; const ny = b * x; x = nx; y = ny;
      if (Math.abs(x) < 5 && Math.abs(y) < 5) {
        ctx.globalAlpha = 0.07; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc * 4, 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    frame++;
    if (frame < 1200) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 10: Sprott B ────────────────────────────────────────────
function sprottB(ctx, w, h, color) {
  const dt = 0.015;
  let x = 0.5 + Math.random() * 0.3, y = 0.5, z = 0;
  const sc = Math.min(w, h) * 0.1;
  const cx = w * 0.5, cy = h * 0.45;
  let frame = 0, animId;
  function draw() {
    for (let i = 0; i < 8; i++) {
      const dx = (y * z) * dt; const dy = (x - y) * dt; const dz = (1 - x * y) * dt;
      x += dx; y += dy; z += dz;
      ctx.globalAlpha = 0.04; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy + z * sc, 0.9, 0, Math.PI * 2); ctx.fill();
    }
    frame++;
    if (frame < 1100) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 11: Three-Body Problem ──────────────────────────────────
function threeBody(ctx, w, h, color) {
  const G = 1;
  const sc = Math.min(w, h) * 0.18;
  const cx = w * 0.5, cy = h * 0.42;
  const dt = 0.001;
  const softening = 0.5;
  const rnd = () => (Math.random() - 0.5) * 0.3;
  const bodies = [
    { x: -1 + rnd(), y: 0 + rnd(), vx: 0.35 + rnd() * 0.15, vy: -0.2 + rnd() * 0.15, m: 1 },
    { x: 1 + rnd(), y: 0 + rnd(), vx: -0.1 + rnd() * 0.15, vy: 0.4 + rnd() * 0.15, m: 1 },
    { x: 0 + rnd(), y: 1.5 + rnd(), vx: -0.25 + rnd() * 0.15, vy: -0.2 + rnd() * 0.15, m: 1 },
  ];
  let frame = 0, animId;
  function step() {
    for (let a = 0; a < 3; a++) {
      let ax = 0, ay = 0;
      for (let b = 0; b < 3; b++) {
        if (a === b) continue;
        const dx = bodies[b].x - bodies[a].x;
        const dy = bodies[b].y - bodies[a].y;
        const r2 = dx * dx + dy * dy + softening * softening;
        const r = Math.sqrt(r2);
        const f = G * bodies[b].m / r2;
        ax += f * dx / r; ay += f * dy / r;
      }
      bodies[a].vx += ax * dt; bodies[a].vy += ay * dt;
    }
    for (let a = 0; a < 3; a++) {
      bodies[a].x += bodies[a].vx * dt; bodies[a].y += bodies[a].vy * dt;
    }
  }
  function draw() {
    for (let s = 0; s < 6; s++) step();
    const pts = bodies.map(b => ({ x: cx + b.x * sc, y: cy + b.y * sc }));
    ctx.strokeStyle = color; ctx.globalAlpha = 0.02; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.stroke();
    frame++;
    if (frame < 1200) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── 12: Logistic Bifurcation ────────────────────────────────
function logisticBifurcation(ctx, w, h, color) {
  const rMin = 2.5, rMax = 4.0;
  const totalCols = Math.floor(w);
  let col = 0, animId;
  function draw() {
    const colsPerFrame = 2;
    for (let c = 0; c < colsPerFrame && col < totalCols; c++, col++) {
      const r = rMin + (rMax - rMin) * col / totalCols;
      let x = 0.5 + (Math.random() - 0.5) * 0.01;
      for (let i = 0; i < 200; i++) x = r * x * (1 - x);
      ctx.fillStyle = color;
      for (let i = 0; i < 80; i++) {
        x = r * x * (1 - x);
        const py = h - x * h * 0.85 - h * 0.07;
        ctx.globalAlpha = 0.08;
        ctx.fillRect(col, py, 1, 1);
      }
    }
    if (col < totalCols) animId = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(animId);
}

// ─── Registry ────────────────────────────────────────────────
const SYSTEMS = [
  doublePendulum, lorenz, rossler,
  thomas, aizawa, halvorsen,
  chen, clifford, duffing,
  henon, sprottB, threeBody,
  logisticBifurcation,
];

/**
 * Initialize a dynamical system on a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {number} systemIndex - 0–12
 * @param {string} color - CSS color string
 * @returns {Function} cleanup function to cancel animation
 */
export function initSystem(canvas, systemIndex, color) {
  const { ctx, w, h } = setupCanvas(canvas);
  const idx = systemIndex % SYSTEMS.length;
  return SYSTEMS[idx](ctx, w, h, color);
}

export { SYSTEM_NAMES };
