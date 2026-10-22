// The sacred light of the fate thread, drawn in code over the painted strip (yarn.ts):
// - a golden halo that pulses, blended additively;
// - aura particles that are born on the thread, drift a few pixels and fade;
// - a wave of light running along the thread;
// - twinkling sparks, using the six sprites painted in fio_centelhas.png.
// Everything is placed by distance along the path, so it follows any curve. Stateless: every frame
// is computed from `time` (no particle bookkeeping), so the same thread looks the same wherever it
// is drawn. It reacts to the thread's state: tied (calm, strong, the wave going back and forth),
// cut (flickering, fading, particles falling, no wave) and tangled (irregular pulse, stuttering
// wave, particles swirling).

import { art } from './artRegistry';

export type ThreadState = 'normal' | 'tie' | 'cut' | 'tangle';

export interface ThreadFxOptions {
  /** Seconds (animation clock). */
  time: number;
  /** Thread width on screen (px). */
  width: number;
  state?: ThreadState;
  /** 0..1+: how strong the light is (e.g. faint for paths walked in other playthroughs). */
  intensity?: number;
  /** Varies particles and waves between threads drawn at the same time. */
  seed?: number;
  /** Speed of the wave of light (px/s, default 340): calmer or more urgent depending on the scene. */
  waveSpeed?: number;
}

type P = [number, number];

/** The six sprites of fio_centelhas.png (image pixels): big star, star, small star, dot, round, dot. */
const SPARKS = [
  { x: 184, y: 183, w: 144, h: 146 },
  { x: 705, y: 193, w: 126, h: 126 },
  { x: 736, y: 479, w: 65, h: 66 },
  { x: 242, y: 497, w: 28, h: 29 },
  { x: 215, y: 751, w: 82, h: 82 },
  { x: 751, y: 775, w: 35, h: 34 },
];
const STARS = [0, 1, 2];
const MOTES = [3, 4, 5];

/** Stable pseudo-random 0..1 from a number. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Cumulative length along the path, to place things by distance. */
interface Measured {
  points: P[];
  cum: number[];
  length: number;
}

function measure(points: P[]): Measured {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1]! + Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]));
  }
  return { points, cum, length: cum[cum.length - 1] ?? 0 };
}

/** Position and unit normal at distance `s` along the path. */
function at(m: Measured, s: number): { x: number; y: number; nx: number; ny: number } {
  const d = Math.min(Math.max(0, s), m.length);
  let lo = 0;
  let hi = m.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (m.cum[mid]! < d) lo = mid;
    else hi = mid;
  }
  const a = m.points[lo]!;
  const b = m.points[hi] ?? a;
  const seg = m.cum[hi]! - m.cum[lo]! || 1;
  const t = (d - m.cum[lo]!) / seg;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return { x: a[0] + dx * t, y: a[1] + dy * t, nx: -dy / len, ny: dx / len };
}

export function drawSpark(c: CanvasRenderingContext2D, index: number, x: number, y: number, size: number, alpha: number, rotation = 0): boolean {
  const img = art('thread.sparks');
  const sp = SPARKS[index % SPARKS.length]!;
  if (!img || size <= 0.5 || alpha <= 0.01) return false;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.rotate(rotation);
  const s = size / Math.max(sp.w, sp.h);
  c.drawImage(img, sp.x, sp.y, sp.w, sp.h, (-sp.w / 2) * s, (-sp.h / 2) * s, sp.w * s, sp.h * s);
  c.restore();
  return true;
}

function stroke(c: CanvasRenderingContext2D, points: P[]): void {
  c.beginPath();
  c.moveTo(points[0]![0], points[0]![1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i]![0], points[i]![1]);
  c.stroke();
}

/** How bright the halo is right now (0..1): calm when tied, flickering when cut, irregular when tangled. */
export function haloPulse(state: ThreadState, t: number, seed: number): number {
  return state === 'tie'
    ? 0.75 + 0.25 * Math.sin(t * 1.6 + seed)
    : state === 'tangle'
      ? 0.55 + 0.25 * Math.sin(t * 3.1 + seed) + 0.2 * Math.sin(t * 7.3 + seed * 2)
      : state === 'cut'
        ? 0.35 * (0.6 + 0.4 * Math.sin(t * 23 + seed)) * (hash(Math.floor(t * 12) + seed) > 0.25 ? 1 : 0.2)
        : 0.6 + 0.4 * Math.sin(t * 2.4 + seed);
}

export function drawThreadFx(c: CanvasRenderingContext2D, points: P[], o: ThreadFxOptions): void {
  if (points.length < 2) return;
  const m = measure(points);
  if (m.length < 4) return;
  const state = o.state ?? 'normal';
  const k = o.intensity ?? 1;
  const w = o.width;
  const seed = o.seed ?? 0;
  const t = o.time;

  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // 1. The halo: a soft golden glow breathing around the thread.
  const pulse = haloPulse(state, t, seed);
  const strength = k * pulse * (state === 'tie' ? 1.4 : 1);
  // Two wide faint strokes instead of a blur (cheaper, same soft halo).
  c.strokeStyle = `rgba(255, 175, 70, ${0.07 * strength})`;
  c.lineWidth = w * (4.2 + 1.2 * pulse);
  stroke(c, points);
  c.strokeStyle = `rgba(255, 175, 70, ${0.1 * strength})`;
  c.lineWidth = w * (2.8 + 0.8 * pulse);
  stroke(c, points);
  c.strokeStyle = `rgba(255, 220, 140, ${0.16 * strength})`;
  c.lineWidth = w * 1.5;
  stroke(c, points);

  // 2. The wave of light running along the thread (none once it is cut).
  if (state !== 'cut') {
    // Short stretches get a smaller, dimmer wave (many of them light up at once on the map).
    const half = Math.min(110, m.length * 0.2);
    const reach = Math.min(1, m.length / 400);
    const span = m.length + half * 2;
    let pos: number;
    if (state === 'tie') {
      // Back and forth, like a heartbeat passing through the knot.
      const p = (t * 0.45 + hash(seed)) % 2;
      pos = (p < 1 ? p : 2 - p) * m.length;
    } else {
      const base = o.waveSpeed ?? 340;
      const speed = state === 'tangle' ? base * 0.75 * (0.4 + Math.abs(Math.sin(t * 2.7 + seed))) : base;
      pos = ((t * speed + hash(seed) * span) % span) - half;
    }
    for (let i = 1; i < m.points.length; i++) {
      const mid = (m.cum[i]! + m.cum[i - 1]!) / 2;
      const dist = Math.abs(mid - pos);
      if (dist > half) continue;
      const a = (1 - dist / half) ** 2 * 0.42 * k * (0.4 + 0.6 * reach);
      c.strokeStyle = `rgba(255, 220, 140, ${a})`;
      c.lineWidth = w * (0.9 + 0.7 * (1 - dist / half));
      c.beginPath();
      c.moveTo(m.points[i - 1]![0], m.points[i - 1]![1]);
      c.lineTo(m.points[i]![0], m.points[i]![1]);
      c.stroke();
    }
  }

  // 3. Aura particles: born on the thread, drifting off a few pixels, fading away.
  const count = Math.max(4, Math.floor(m.length / 22));
  for (let i = 0; i < count; i++) {
    const h1 = hash(i * 3.1 + seed);
    const h2 = hash(i * 7.7 + seed * 1.3);
    const life = 1.4 + h2 * 1.2;
    const clock = t + h1 * life * 9;
    const cycle = Math.floor(clock / life);
    const phase = (clock / life) % 1;
    // A new place on the thread every time the particle is reborn.
    const s = hash(i * 13.3 + cycle * 1.7 + seed) * m.length;
    const p = at(m, s);
    const side = hash(i + cycle * 3.3) < 0.5 ? -1 : 1;
    let x = p.x;
    let y = p.y;
    const drift = (state === 'tie' ? 6 : 12) * Math.min(1, w / 9);
    if (state === 'tangle') {
      const a = phase * Math.PI * 3 * side + h1 * 6;
      x += Math.cos(a) * (w * 0.6 + phase * 14);
      y += Math.sin(a) * (w * 0.6 + phase * 14);
    } else if (state === 'cut') {
      x += p.nx * side * w * 0.5;
      y += p.ny * side * w * 0.5 + phase * phase * 34; // falling
    } else {
      x += p.nx * side * (w * 0.5 + phase * drift);
      y += p.ny * side * (w * 0.5 + phase * drift) - phase * 4;
    }
    const alpha = Math.sin(phase * Math.PI) * 0.85 * k * (state === 'cut' ? 0.6 : 1);
    if (alpha <= 0.02) continue;
    if (drawSpark(c, MOTES[i % MOTES.length]!, x, y, (5 + h2 * 5) * Math.min(1.4, Math.max(0.7, w / 7)), alpha)) continue;
    const r = 1.6 + h2 * 2.2;
    const g = c.createRadialGradient(x, y, 0, x, y, r * 2.4);
    g.addColorStop(0, `rgba(255, 236, 170, ${alpha})`);
    g.addColorStop(1, 'rgba(255, 180, 80, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r * 2.4, 0, Math.PI * 2);
    c.fill();
  }

  // 3b. Cut: loose fibres at both ends, swaying and drooping.
  if (state === 'cut') {
    c.globalCompositeOperation = 'source-over';
    for (const end of [0, m.length]) {
      const p = at(m, end);
      const dirSign = end === 0 ? -1 : 1;
      const tan = { x: p.ny, y: -p.nx };
      for (let f = 0; f < 7; f++) {
        const hf = hash(f * 4.3 + seed + end);
        const len = w * (1.2 + hf * 1.8);
        const sway = Math.sin(t * 2.2 + f * 1.3 + end) * 0.5;
        const spread = (hf - 0.5) * 1.4 + sway;
        const ex = p.x + (tan.x * dirSign + p.nx * spread) * len;
        const ey = p.y + (tan.y * dirSign + p.ny * spread) * len + len * 0.35; // drooping
        c.strokeStyle = `rgba(240, 200, 120, ${0.75 * k})`;
        c.lineWidth = Math.max(0.7, w * 0.12);
        c.beginPath();
        c.moveTo(p.x + p.nx * (hf - 0.5) * w * 0.8, p.y + p.ny * (hf - 0.5) * w * 0.8);
        c.quadraticCurveTo(p.x + tan.x * dirSign * len * 0.6, p.y + tan.y * dirSign * len * 0.6, ex, ey);
        c.stroke();
      }
    }
    c.globalCompositeOperation = 'lighter';
  }

  // 4. Sparks: the painted stars light up here and there along the thread, briefly.
  const sparks = Math.max(1, Math.floor(m.length / 170));
  for (let i = 0; i < sparks; i++) {
    const h = hash(i * 5.9 + seed * 2.1);
    const speed = state === 'tangle' ? 1.4 : 0.8;
    const clock = t * speed + h * 10;
    const cycle = Math.floor(clock);
    const tw = Math.max(0, Math.sin((clock % 1) * Math.PI)) ** 3;
    if (tw < 0.05) continue;
    const s = hash(i * 2.3 + cycle * 0.37 + seed) * m.length;
    const p = at(m, s);
    const size = (state === 'tie' ? 30 : 22) * tw * (0.7 + h * 0.6) * Math.min(1.2, w / 9);
    const alpha = tw * k * (state === 'cut' ? 0.4 : 1);
    drawSpark(c, STARS[i % STARS.length]!, p.x, p.y, size, alpha, t * 0.6 + h * 6);
  }
  c.restore();
}
