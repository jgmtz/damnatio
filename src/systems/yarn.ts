// The fate thread as a real thread (GDD 5.3): a twisted cord of spun gold, not a flat line.
// With the painted strip loaded (art id "thread.strip"), the strip is laid along the path;
// before that, a code drawing: dark outline, the cord's body, twist marks, a highlight and loose
// fibres. Deterministic (same path, same look), so it doesn't flicker.

import { art } from './artRegistry';
import { drawEmblem, emblemGap, emblemHeight, emblemLoaded, type EmblemKind, type EmblemSize } from './threadEmblems';
import { drawThreadFx, haloPulse, type ThreadFxOptions } from './threadFx';

export type YarnPoint = [number, number];

/** A painted emblem tied into the thread (see drawYarn). */
export interface YarnEmblem {
  kind: EmblemKind;
  /** Distance along the path of the emblem's anchor; negative = from the end. */
  at: number;
  /** 0..1: fading in (the drawn thread shows through until 1). */
  alpha?: number;
  /** Extra turn on top of the thread's direction (radians). */
  rotation?: number;
  grow?: number;
  maxHeight?: number;
  /** Frame of an animated emblem (the knot being tied, the shears closing). */
  frame?: number;
  /** While fading in, keep drawing the plain thread under it (default true). Off when the caller draws its own (a knot being tied). */
  bridge?: boolean;
}

export interface YarnStyle {
  /** Thickness of the cord in pixels. */
  width: number;
  alpha?: number;
  /** Body and light colors of the fibres. */
  color?: string;
  light?: string;
  /** Loose fibres sticking out (default true). */
  fibres?: boolean;
  /** Glow around the cord (e.g. the thread being drawn now). */
  glow?: boolean;
  /** The sacred light on top (halo, aura, wave, sparks; threadFx.ts). Omitted = plain thread. */
  fx?: Omit<ThreadFxOptions, 'width'>;
  /** A knot, shears or tangle that is part of this thread. */
  emblem?: YarnEmblem;
  /**
   * Draw only part of it: 'body' (the cord and its emblem, which can be cached) or 'light' (the
   * moving sacred light, drawn every frame over a cached body). Default: both.
   */
  layer?: 'body' | 'light';
}

const BODY = '#b8873a';
const LIGHT = '#f6dc96';
const SHADE = 'rgba(70, 40, 12, 0.85)';

/** Hash of a number into 0..1 (stable "random" for the fibres). */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Points every `step` px along the path, with the unit normal and the distance from the start. */
function walk(points: YarnPoint[], step: number): { x: number; y: number; nx: number; ny: number; d: number }[] {
  const out: { x: number; y: number; nx: number; ny: number; d: number }[] = [];
  let carried = 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]!;
    const [bx, by] = points[i]!;
    const len = Math.hypot(bx - ax, by - ay);
    if (len === 0) continue;
    const tx = (bx - ax) / len;
    const ty = (by - ay) / len;
    for (let t = carried; t < len; t += step) {
      out.push({ x: ax + tx * t, y: ay + ty * t, nx: -ty, ny: tx, d: total + t });
    }
    carried = (carried - len) % step;
    if (carried < 0) carried += step;
    total += len;
  }
  return out;
}

function trace(c: CanvasRenderingContext2D, points: YarnPoint[]): void {
  c.beginPath();
  c.moveTo(points[0]![0], points[0]![1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i]![0], points[i]![1]);
}

/**
 * The painted thread (pedidos-de-arte 1.1): a horizontal strip of spun gold, in image pixels.
 * Rows [y0, y0 + h] hold the thread (its core is `core` px thick); columns [x0, x0 + period] are
 * sampled along the path, wrapping around.
 */
const STRIP = { x0: 40, period: 1290, y0: 350, h: 68, core: 57 };

/** Draws the thread with the painted strip laid along the path, slice by slice. */
function drawStrip(c: CanvasRenderingContext2D, img: HTMLImageElement, points: YarnPoint[], style: YarnStyle): void {
  const scale = style.width / STRIP.core;
  const dh = STRIP.h * scale;
  c.save();
  c.globalAlpha *= style.alpha ?? 1;
  // A soft dark bed under the gold, so it reads on any background.
  c.lineCap = 'round';
  c.lineJoin = 'round';
  trace(c, points);
  c.strokeStyle = 'rgba(10, 5, 2, 0.55)';
  c.lineWidth = style.width * 1.35;
  c.stroke();
  if (style.glow) {
    // A soft golden bed instead of a blur (shadowBlur on every slice cost too much).
    trace(c, points);
    c.strokeStyle = 'rgba(255, 180, 70, 0.16)';
    c.lineWidth = style.width * 2.6;
    c.stroke();
    c.strokeStyle = 'rgba(255, 190, 90, 0.22)';
    c.lineWidth = style.width * 1.8;
    c.stroke();
  }
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]!;
    const [bx, by] = points[i]!;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 0.3) continue;
    // Ping-pong along the strip: every other pass is read backwards (mirrored), so the strip's
    // ends never meet in a seam.
    const u = (dist / scale) % (STRIP.period * 2);
    const mirrored = u >= STRIP.period;
    const local = mirrored ? STRIP.period * 2 - u : u;
    // A hair of overlap between slices hides the joins.
    const sw = Math.min((len + 1.2) / scale, STRIP.period);
    const sx = STRIP.x0 + (mirrored ? Math.max(0, local - sw) : Math.min(local, STRIP.period - sw));
    c.save();
    c.translate(ax, ay);
    c.rotate(Math.atan2(by - ay, bx - ax));
    if (mirrored) {
      c.translate(len + 1.2, 0);
      c.scale(-1, 1);
    }
    c.drawImage(img, sx, STRIP.y0, sw, STRIP.h, 0, -dh / 2, len + 1.2, dh);
    c.restore();
    dist += len;
  }
  c.restore();
}

/** Cumulative distances along the path. */
function lengths(points: YarnPoint[]): number[] {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1]! + Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]));
  }
  return cum;
}

/** The stretch of the path between two distances from its start. */
function subPath(points: YarnPoint[], cum: number[], from: number, to: number): YarnPoint[] {
  const out: YarnPoint[] = [];
  const point = (d: number): YarnPoint => {
    let i = 1;
    while (i < cum.length - 1 && cum[i]! < d) i++;
    const a = points[i - 1]!;
    const b = points[i]!;
    const seg = cum[i]! - cum[i - 1]! || 1;
    const t = Math.min(1, Math.max(0, (d - cum[i - 1]!) / seg));
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  if (to <= from) return out;
  out.push(point(from));
  for (let i = 0; i < points.length; i++) if (cum[i]! > from && cum[i]! < to) out.push(points[i]!);
  out.push(point(to));
  return out;
}

/** The cord itself (painted strip, or the code drawing until it loads), without the light. */
function drawBody(c: CanvasRenderingContext2D, points: YarnPoint[], style: YarnStyle): void {
  if (points.length < 2) return;
  const strip = art('thread.strip');
  if (strip) drawStrip(c, strip, points, style);
  else drawCodeYarn(c, points, style);
}

/**
 * Draws the thread. With `emblem`, the painted knot, shears or tangle becomes part of the cord:
 * the drawn thread stops where the painting's own thread takes over (crossfading while the emblem
 * fades in), the emblem turns with the thread, and the sacred light runs over both, the emblem
 * glowing with the same pulse as the halo.
 */
export function drawYarn(c: CanvasRenderingContext2D, points: YarnPoint[], style: YarnStyle): void {
  if (points.length < 2) return;
  const fx = style.fx && style.layer !== 'body' ? { ...style.fx, width: style.width, intensity: (style.fx.intensity ?? 1) * (style.alpha ?? 1) } : null;
  const body = style.layer !== 'light';
  const emblem = style.emblem && emblemLoaded(style.emblem.kind) ? style.emblem : null;
  if (!emblem) {
    if (body) drawBody(c, points, style);
    if (fx) drawThreadFx(c, points, fx);
    return;
  }
  const cum = lengths(points);
  const total = cum[cum.length - 1]!;
  const d = Math.min(total, Math.max(0, emblem.at < 0 ? total + emblem.at : emblem.at));
  const size: EmblemSize = { threadWidth: style.width, grow: emblem.grow, maxHeight: emblem.maxHeight, frame: emblem.frame };
  const [before, after] = emblemGap(emblem.kind, size);
  const shown = Math.min(1, Math.max(0, emblem.alpha ?? 1));
  if (body) drawBody(c, subPath(points, cum, 0, d - before), style);
  if (body) drawBody(c, subPath(points, cum, d + after, total), style);
  // The stretch the painting replaces fades out as the emblem fades in.
  if (body && shown < 1 && emblem.bridge !== false) drawBody(c, subPath(points, cum, d - before - 1, d + after + 1), { ...style, alpha: (style.alpha ?? 1) * (1 - shown) });

  const near = subPath(points, cum, Math.max(0, d - 4), Math.min(total, d + 4));
  const a = near[0] ?? points[0]!;
  const b = near[near.length - 1] ?? points[1]!;
  const centre = subPath(points, cum, d, d + 0.01)[0] ?? a;
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) + (emblem.rotation ?? 0);
  const height = emblemHeight(emblem.kind, size);
  const alpha = (style.alpha ?? 1) * shown;
  if (body) drawEmblem(c, emblem.kind, centre[0], centre[1], height, alpha, angle, undefined, emblem.frame ?? 0);
  if (fx) {
    drawThreadFx(c, points, fx);
    // The emblem breathes with the thread's light: a golden bloom around its shape, and its own
    // gold brightened, both on the halo's pulse.
    const pulse = haloPulse(fx.state ?? 'normal', fx.time, fx.seed ?? 0) * (fx.intensity ?? 1);
    c.save();
    drawEmblem(c, emblem.kind, centre[0], centre[1], height, alpha * 0.3 * pulse, angle, 'lighter', emblem.frame ?? 0);
    c.restore();
  }
}

function drawCodeYarn(c: CanvasRenderingContext2D, points: YarnPoint[], style: YarnStyle): void {
  const w = style.width;
  c.save();
  c.globalAlpha *= style.alpha ?? 1;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // Outline and body.
  trace(c, points);
  if (style.glow) {
    c.shadowColor = 'rgba(255, 170, 60, 0.6)';
    c.shadowBlur = w * 2.2;
  }
  c.strokeStyle = 'rgba(20, 10, 4, 0.85)';
  c.lineWidth = w + Math.max(2, w * 0.45);
  c.stroke();
  c.shadowBlur = 0;
  c.strokeStyle = style.color ?? BODY;
  c.lineWidth = w;
  c.stroke();
  // Highlight along one side: the round of the cord catching the light.
  const side = walk(points, Math.max(2, w * 0.5));
  if (side.length > 1) {
    c.beginPath();
    side.forEach((p, i) => {
      const x = p.x + p.nx * w * 0.2;
      const y = p.y + p.ny * w * 0.2;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    });
    c.strokeStyle = style.light ?? LIGHT;
    c.globalAlpha *= 0.75;
    c.lineWidth = Math.max(1, w * 0.28);
    c.stroke();
    c.globalAlpha /= 0.75;
  }
  // Twist: slanted grooves across the cord, like the plies of a spun thread.
  if (w >= 3) {
    c.strokeStyle = SHADE;
    c.lineWidth = Math.max(0.8, w * 0.16);
    c.beginPath();
    for (const p of walk(points, w * 0.85)) {
      const tx = p.ny;
      const ty = -p.nx;
      const half = w * 0.48;
      c.moveTo(p.x - p.nx * half - tx * w * 0.32, p.y - p.ny * half - ty * w * 0.32);
      c.lineTo(p.x + p.nx * half + tx * w * 0.32, p.y + p.ny * half + ty * w * 0.32);
    }
    c.stroke();
  }
  // Loose fibres.
  if (style.fibres !== false && w >= 3) {
    c.strokeStyle = style.light ?? LIGHT;
    c.globalAlpha *= 0.6;
    c.lineWidth = Math.max(0.6, w * 0.09);
    c.beginPath();
    for (const p of walk(points, w * 3.2)) {
      const r = hash(Math.round(p.d * 10) / 10 + p.x * 0.001);
      if (r < 0.45) continue;
      const sideSign = r > 0.72 ? 1 : -1;
      const len = w * (0.35 + r * 0.55);
      const bx = p.x + p.nx * sideSign * w * 0.45;
      const by = p.y + p.ny * sideSign * w * 0.45;
      c.moveTo(bx, by);
      c.quadraticCurveTo(
        bx + p.nx * sideSign * len * 0.6 + p.ny * len * 0.4,
        by + p.ny * sideSign * len * 0.6 - p.nx * len * 0.4,
        bx + p.nx * sideSign * len * 0.5 + p.ny * len,
        by + p.ny * sideSign * len * 0.5 - p.nx * len,
      );
    }
    c.stroke();
  }
  c.restore();
}

/**
 * A horizontal strip of thread as a data URL, for CSS (title-card ornaments, scene transitions):
 * `background: var(--yarn) repeat-x`. Made once at startup.
 */
export function yarnStripUrl(width = 256, height = 24, thickness = 8): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext('2d');
  if (!c) return '';
  // Slightly longer than the strip so the ends tile without caps.
  drawYarn(c, [[-thickness, height / 2], [width + thickness, height / 2]], { width: thickness, fibres: true });
  return canvas.toDataURL('image/png');
}
