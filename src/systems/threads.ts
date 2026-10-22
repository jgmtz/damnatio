// Fate threads (GDD 5.3): when a marked choice is taken, an ink thread crosses the screen and is
// tied, cut or tangled. Pure canvas drawing driven by time; play() resolves when the animation ends.

import type { ThreadKind } from '../engine/types';
import { drawEmblem, drawEmblemOnThread, emblemFrames, emblemGap, emblemLoaded } from './threadEmblems';
import type { ThreadState } from './threadFx';
import { drawYarn, type YarnEmblem } from './yarn';

const WIDTH = 1920;
const CENTER_X = WIDTH / 2;
const CENTER_Y = 470;
const DURATION: Record<ThreadKind, number> = { tie: 3.0, cut: 2.2, tangle: 3.0 };
const SAMPLE_STEP = 8;
/** Thickness of the fate thread on screen (the emblems are scaled to match it). */
const THREAD_WIDTH = 11;

type Point = [number, number];

interface ActiveThread {
  kind: ThreadKind;
  startedAt: number | null;
  resolve: () => void;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (v: number) => 1 - (1 - v) ** 3;
/** Progress of `p` inside the [from, to] window, 0..1. */
const window01 = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));

/** Gentle living wave so the thread never looks like a ruler line. */
function waveY(x: number, time: number, amplitude: number): number {
  return CENTER_Y + Math.sin(x * 0.008 + time * 2.4) * amplitude;
}

function horizontal(fromX: number, toX: number, time: number, amplitude = 6): Point[] {
  const points: Point[] = [];
  const dir = Math.sign(toX - fromX) || 1;
  for (let x = fromX; dir > 0 ? x <= toX : x >= toX; x += dir * SAMPLE_STEP) points.push([x, waveY(x, time, amplitude)]);
  points.push([toX, waveY(toX, time, amplitude)]);
  return points;
}

/** The thread itself: a twisted golden cord (src/systems/yarn.ts), glowing a little. */
function strokeThread(ctx: CanvasRenderingContext2D, points: Point[], alpha: number, time = 0, state: ThreadState = 'normal', emblem?: YarnEmblem): void {
  const seed = points.length > 0 ? Math.round(points[0]![0]) : 0;
  drawYarn(ctx, points, { width: THREAD_WIDTH, alpha, glow: true, fx: { time, state, seed }, ...(emblem ? { emblem } : {}) });
}

/** Distance along the path to where it crosses x (the emblem's place in the middle). */
function distanceToX(points: Point[], x: number): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]!;
    const [bx, by] = points[i]!;
    const len = Math.hypot(bx - ax, by - ay);
    if (bx >= x) return d + len * ((x - ax) / ((bx - ax) || 1));
    d += len;
  }
  return d;
}

/**
 * The knot being tied by the thread itself: from the left tip, the cord runs around a figure-eight
 * (∞) one and a half times and leaves by the right tip, as in the painted knot. `k` = how much of
 * it is laid (0..1); `tight` shrinks the loops as it is pulled.
 */
function knotPath(left: Point, right: Point, k: number, tight: number, time: number): Point[] {
  const cx = (left[0] + right[0]) / 2;
  const cy = (left[1] + right[1]) / 2;
  const half = ((right[0] - left[0]) / 2) * (1 - 0.12 * tight);
  // Loops a little taller than a pure lemniscate, like the painting; breathing slightly as it moves.
  const tall = 1.25 * (1 - 0.15 * tight) * (1 + 0.04 * Math.sin(time * 5));
  const points: Point[] = [left];
  const end = Math.PI + Math.PI * 3 * k;
  for (let a = Math.PI; a <= end + 1e-6; a += 0.06) {
    const d = 1 + Math.sin(a) ** 2;
    points.push([cx + (half * Math.cos(a)) / d, cy + (half * tall * Math.sin(a) * Math.cos(a)) / d]);
  }
  if (k >= 1) points.push(right);
  return points;
}

/**
 * The drawn animations (pedidos 5.8): the frames of a knot being tied, a tangle forming or the
 * shears cutting, as part of the thread (the cord of each frame continues the drawn cord).
 * `frameAt` = frame number (fractional is floored); `appear` fades the painting in.
 */
function strokeAnimated(ctx: CanvasRenderingContext2D, kind: 'tieFrames' | 'tangleFrames' | 'cutFrames', state: ThreadState, frame: number, alpha: number, time: number, appear = 1, width = THREAD_WIDTH, grow = 1, rotation = 0): void {
  const points = horizontal(0, WIDTH, time);
  const seed = 1;
  drawYarn(ctx, points, {
    width,
    alpha,
    glow: true,
    fx: { time, state, seed },
    emblem: { kind, frame, at: distanceToX(points, CENTER_X), alpha: appear, bridge: false, grow, rotation },
  });
}

function drawTie(ctx: CanvasRenderingContext2D, p: number, time: number, alpha: number): void {
  if (emblemLoaded('tieFrames')) {
    // The two ends come in, then the cord ties itself into the ∞, frame by frame, and pulls tight.
    const [before, after] = emblemGap('tieFrames', { threadWidth: THREAD_WIDTH, frame: 0 });
    const reach = easeOut(window01(p, 0, 0.26));
    const n = emblemFrames('tieFrames');
    const tying = window01(p, 0.26, 0.74);
    if (p < 0.26) {
      strokeThread(ctx, horizontal(0, (CENTER_X - before) * reach, time), alpha, time);
      strokeThread(ctx, horizontal(WIDTH, WIDTH - (WIDTH - CENTER_X - after) * reach, time), alpha, time);
      return;
    }
    strokeAnimated(ctx, 'tieFrames', p > 0.74 ? 'tie' : 'normal', tying * (n - 0.001), alpha, time, Math.min(1, window01(p, 0.24, 0.3)));
    const spark = window01(p, 0.72, 0.9);
    if (spark > 0 && spark < 1) drawEmblem(ctx, 'spark', CENTER_X + 40, CENTER_Y - 40, 90 * Math.sin(spark * Math.PI), alpha, spark * 2);
    return;
  }
  const reach = easeOut(window01(p, 0, 0.32));
  const lay = window01(p, 0.3, 0.66);
  const pull = easeOut(window01(p, 0.62, 0.8));
  const painted = emblemLoaded('tie');
  // The two ends come to the knot's tips: where the painted knot's own thread begins.
  const [before, after] = painted ? emblemGap('tie', { threadWidth: THREAD_WIDTH }) : [70, 70];
  const leftTip: Point = [CENTER_X - before, waveY(CENTER_X - before, time, 6)];
  const rightTip: Point = [CENTER_X + after, waveY(CENTER_X + after, time, 6)];
  const tied: ThreadState = p > 0.66 ? 'tie' : 'normal';

  // Once laid and pulled, the painted knot takes over from the drawn loops (crossfade), the whole
  // thread lit as one; the knot then rests, breathing with the light.
  const handOver = painted ? window01(p, 0.72, 0.86) : 0;
  if (handOver > 0) {
    const points = horizontal(0, WIDTH, time);
    strokeThread(ctx, points, alpha, time, 'tie', {
      kind: 'tie',
      at: distanceToX(points, CENTER_X),
      alpha: handOver,
      bridge: false,
      grow: 1 + 0.025 * Math.sin(time * 3.2) * window01(p, 0.86, 1),
    });
  } else {
    strokeThread(ctx, horizontal(0, leftTip[0] * reach, time), alpha, time, tied);
    strokeThread(ctx, horizontal(WIDTH, WIDTH - (WIDTH - rightTip[0]) * reach, time), alpha, time, tied);
  }
  if (lay > 0 && handOver < 1) {
    strokeThread(ctx, knotPath(leftTip, rightTip, easeOut(lay), pull, time), alpha * (1 - handOver), time, tied);
  }
  // A spark where the knot closes.
  const spark = window01(p, 0.76, 0.94);
  if (spark > 0 && spark < 1) drawEmblem(ctx, 'spark', CENTER_X + 40, CENTER_Y - 40, 90 * Math.sin(spark * Math.PI), alpha, spark * 2);
}

function drawCut(ctx: CanvasRenderingContext2D, p: number, time: number, alpha: number): void {
  if (emblemLoaded('cutFrames')) {
    // The thread runs across; the Moirai's shears come down, close on it, and the ends fall.
    const width = 9;
    const n = emblemFrames('cutFrames');
    const run = easeOut(window01(p, 0, 0.28));
    if (p < 0.28) {
      strokeThread(ctx, horizontal(0, WIDTH * run, time), alpha, time);
      return;
    }
    const cutting = window01(p, 0.28, 0.82);
    const frame = cutting * (n - 0.001);
    // The cut is frame 8 (pedidos 6.5): from there the thread's light flickers out, and the screen
    // jolts for a moment as the blades meet.
    const cutAt = Math.min(7, n - 1);
    const jolt = frame >= cutAt && frame < cutAt + 1.2 ? 1 - (frame - cutAt) / 1.2 : 0;
    ctx.save();
    if (jolt > 0) ctx.translate(Math.sin(time * 90) * 5 * jolt, Math.cos(time * 77) * 4 * jolt);
    strokeAnimated(ctx, 'cutFrames', frame >= cutAt ? 'cut' : 'normal', frame, alpha, time, Math.min(1, window01(p, 0.27, 0.34)), width, 0.75);
    ctx.restore();
    return;
  }
  const grow = easeOut(window01(p, 0, 0.35));
  const fall = window01(p, 0.45, 1);
  const shears = window01(p, 0.2, 0.6);
  const painted = emblemLoaded('cut');
  if (fall === 0) {
    // The shears close on the thread: the painting (blades and the frayed cut) takes the middle
    // of the thread as it appears.
    const points = horizontal(0, WIDTH * grow, time);
    const appear = Math.min(1, shears * 3);
    strokeThread(ctx, points, alpha, time, 'normal', painted && shears > 0 ? { kind: 'cut', at: distanceToX(points, CENTER_X), alpha: appear, rotation: -0.08 + shears * 0.12 } : undefined);
    if (painted) return;
  } else {
    // Two halves recoil and sag, as if the tension was released.
    const q = easeOut(fall);
    for (const side of [-1, 1]) {
      const anchorX = side < 0 ? 0 : WIDTH;
      const endX = CENTER_X + side * (10 + 140 * q);
      const endY = CENTER_Y + 300 * q * q;
      const points: Point[] = [];
      for (let i = 0; i <= 40; i++) {
        const s = i / 40;
        const x = anchorX + (endX - anchorX) * s;
        const sag = Math.sin(Math.PI * s * 0.5) * (endY - CENTER_Y) * s;
        points.push([x, waveY(x, time, 6 * (1 - q)) + sag]);
      }
      strokeThread(ctx, points, alpha, time, 'cut');
    }
  }
  // The halves spring apart and the shears withdraw.
  if (shears > 0 && shears < 1 && painted) {
    const appear = Math.min(1, (1 - shears) * 4);
    drawEmblemOnThread(ctx, 'cut', CENTER_X, CENTER_Y, THREAD_WIDTH, { alpha: alpha * appear, rotation: -0.08 + shears * 0.12 });
    return;
  }
  if (painted) return;
  // Without the painting: a bright diagonal slash.
  const slash = window01(p, 0.33, 0.5);
  if (slash > 0 && slash < 1) {
    ctx.save();
    ctx.globalAlpha = alpha * (1 - slash);
    ctx.strokeStyle = '#fff4d0';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(CENTER_X - 50, CENTER_Y - 90);
    ctx.lineTo(CENTER_X + 50, CENTER_Y + 90);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * The middle of the thread winding into a tangle: between the two tips, the cord loops around
 * itself in uneven circles that grow with `k` (0 = straight, 1 = a full knot of loops, about the
 * painted tangle's size). Loops drift a little with time, so it looks alive while it forms.
 */
function tanglePath(left: Point, right: Point, k: number, time: number): Point[] {
  const span = right[0] - left[0];
  const points: Point[] = [];
  const steps = 260;
  const loops = 7;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const envelope = Math.sin(Math.PI * s) ** 0.7;
    // Radius varies loop to loop (messier than a coil), up to ~45% of the span.
    const r = span * 0.42 * k * envelope * (0.55 + 0.45 * Math.sin(s * 17 + 1.3) ** 2);
    const a = s * Math.PI * 2 * loops * k + Math.sin(s * 9 + time * 1.2) * 0.8;
    const x = left[0] + span * s + r * Math.sin(a) * 0.9;
    const y = left[1] + (right[1] - left[1]) * s - r * (1 - Math.cos(a)) * 0.5 + r * 0.25 * Math.sin(a * 0.5 + time);
    points.push([x, y]);
  }
  return points;
}

function drawTangle(ctx: CanvasRenderingContext2D, p: number, time: number, alpha: number): void {
  const grow = easeOut(window01(p, 0, 0.35));
  if (emblemLoaded('tangleFrames')) {
    // The thread crosses, then its middle twists and loops into a tangle, frame by frame; it keeps
    // turning restlessly once knotted.
    const n = emblemFrames('tangleFrames');
    if (p < 0.3) {
      strokeThread(ctx, horizontal(0, WIDTH * grow, time), alpha, time);
      return;
    }
    const knotting = window01(p, 0.3, 0.8);
    const restless = (Math.sin(time * 1.5) * 0.08 + Math.sin(time * 4.3) * 0.02) * window01(p, 0.8, 0.9);
    strokeAnimated(ctx, 'tangleFrames', p > 0.6 ? 'tangle' : 'normal', knotting * (n - 0.001), alpha, time, 1, THREAD_WIDTH, 1, restless);
    return;
  }
  // The painted tangle knots itself in the middle of the thread, turning slowly.
  if (emblemLoaded('tangle')) {
    // The thread crosses, then its middle winds into loops on itself, faster and messier, until
    // the painted tangle takes over; it keeps turning restlessly.
    const [before, after] = emblemGap('tangle', { threadWidth: THREAD_WIDTH });
    const wind = window01(p, 0.28, 0.7);
    const handOver = window01(p, 0.66, 0.82);
    const points = horizontal(0, WIDTH * grow, time);
    const restless = Math.sin(time * 1.5) * 0.12 + Math.sin(time * 4.3) * 0.03;
    if (wind === 0) {
      strokeThread(ctx, points, alpha, time, 'normal');
      return;
    }
    strokeThread(ctx, points, alpha, time, 'tangle', {
      kind: 'tangle',
      at: distanceToX(points, CENTER_X),
      alpha: handOver,
      bridge: false,
      rotation: restless * handOver,
    });
    if (handOver < 1) {
      const left: Point = [CENTER_X - before, waveY(CENTER_X - before, time, 6)];
      const right: Point = [CENTER_X + after, waveY(CENTER_X + after, time, 6)];
      strokeThread(ctx, tanglePath(left, right, easeOut(wind), time), alpha * (1 - handOver), time, 'tangle');
    }
    return;
  }
  const radius = 90 * easeOut(window01(p, 0.3, 0.85));
  const points: Point[] = [];
  for (let s = 0; s <= WIDTH * grow; s += SAMPLE_STEP / 2) {
    // Loops concentrate in the middle of the thread.
    const weight = Math.exp(-(((s - CENTER_X) / 320) ** 2));
    points.push([
      s + weight * radius * Math.cos(s * 0.07 + time * 5),
      waveY(s, time, 6) + weight * radius * Math.sin(s * 0.11 + time * 4),
    ]);
  }
  strokeThread(ctx, points, alpha, time, 'tangle');
}

const DRAW: Record<ThreadKind, typeof drawTie> = { tie: drawTie, cut: drawCut, tangle: drawTangle };

export class ThreadFx {
  private active: ActiveThread | null = null;

  get isPlaying(): boolean {
    return this.active !== null;
  }

  play(kind: ThreadKind): Promise<void> {
    this.active?.resolve();
    return new Promise((resolve) => {
      this.active = { kind, startedAt: null, resolve };
    });
  }

  /** Called every frame by the stage. `time` in seconds. */
  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const active = this.active;
    if (!active) return;
    active.startedAt ??= time;
    const p = (time - active.startedAt) / DURATION[active.kind];
    if (p >= 1) {
      this.active = null;
      active.resolve();
      return;
    }
    const alpha = 1 - window01(p, 0.82, 1);
    DRAW[active.kind](ctx, p, time, alpha);
  }
}
