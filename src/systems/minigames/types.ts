// Contract shared by the first-person minigames (GDD 10.4 `minigame` node).
// Each game keeps its rules in small pure functions (testable) and draws itself on a 1920x1080 canvas.

import { drawSpark } from '../threadFx';
import type { Effect } from '../../engine/types';
import { drawYarn } from '../yarn';
import type { MinigameInput } from './input';

export interface MinigameResult {
  /** Outcome id; the host falls back to the node's first outcome if the content doesn't define it. */
  outcome: string;
  /** Effects earned while playing (e.g. revealed marks). */
  earned: Effect[];
}

export interface MinigameContext {
  input: MinigameInput;
  /** String lookup (params carry string keys). */
  t: (key: string) => string;
  /** Accessibility (no time pressure): wider margins, gentler rules. Mirrors the "timed choices" setting. */
  relaxed: boolean;
  /** First time this kind of scene is played: run the guided tutorial before the real thing. */
  tutorial: boolean;
  /** Asterion's beast level (0–5; 0 outside his fragments): the beast pulls harder in his scenes. */
  fera: number;
  /** Art by id (params name them, e.g. `surfaceArt`). Null until loaded: games fall back to code drawing. */
  image: (artId: string) => HTMLImageElement | null;
}

/**
 * Draws an image filling the screen. "cover" crops, "contain" letterboxes.
 * `zoom` > 1 enlarges around `focus` (screen point), e.g. to move forward into a picture.
 */
export function drawImageFit(
  c: CanvasRenderingContext2D,
  img: HTMLImageElement,
  mode: 'cover' | 'contain' = 'cover',
  zoom = 1,
  focus: { x: number; y: number } = { x: W / 2, y: H / 2 },
): void {
  const base = mode === 'cover' ? Math.max(W / img.naturalWidth, H / img.naturalHeight) : Math.min(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * base;
  const h = img.naturalHeight * base;
  const x = (W - w) / 2;
  const y = (H - h) / 2;
  c.save();
  c.translate(focus.x, focus.y);
  c.scale(zoom, zoom);
  c.translate(-focus.x, -focus.y);
  c.drawImage(img, x, y, w, h);
  c.restore();
}

/** Where a point of the source image lands on screen when drawn with drawImageFit (no zoom). */
export function fitPoint(
  img: { naturalWidth: number; naturalHeight: number },
  mode: 'cover' | 'contain',
  sx: number,
  sy: number,
): { x: number; y: number } {
  const base = mode === 'cover' ? Math.max(W / img.naturalWidth, H / img.naturalHeight) : Math.min(W / img.naturalWidth, H / img.naturalHeight);
  return { x: W / 2 + (sx - img.naturalWidth / 2) * base, y: H / 2 + (sy - img.naturalHeight / 2) * base };
}

/** Labels for the tutorial panel, resolved from strings. */
export function tutorialLabels(t: (key: string) => string): { step: (n: number, total: number) => string; skip: string } {
  return {
    step: (n, total) => t('mg.tutorial.step').replace('{n}', String(n)).replace('{total}', String(total)),
    skip: t('mg.tutorial.skip'),
  };
}

export interface Minigame {
  /** Advance the simulation. Returns a result when the game is over. */
  update(dt: number, time: number): MinigameResult | null;
  draw(ctx: CanvasRenderingContext2D, time: number): void;
}

export type MinigameFactory = (params: Record<string, unknown>, ctx: MinigameContext) => Minigame;

export const W = 1920;
export const H = 1080;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic PRNG so layouts (cracks, embers) are stable and testable. */
export function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Hint text at the top and an optional control reminder at the bottom, in the game's style. */
export function drawHints(ctx: CanvasRenderingContext2D, top: string, bottom?: string): void {
  ctx.save();
  ctx.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
  drawLabel(ctx, top, W / 2, 110, '#d9b45a');
  if (bottom) {
    ctx.font = '26px "Cormorant Garamond", Georgia, serif';
    drawLabel(ctx, bottom, W / 2, H - 70, 'rgba(241, 227, 207, 0.85)');
  }
  ctx.restore();
}

/**
 * A line of text on a dark band (in the current font), so it reads over pale scenes (Théron's
 * white-ground art) as well as dark ones. `align` is where `x` is: the text's center, left or right.
 */
export function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'center'): void {
  const width = ctx.measureText(text).width;
  const size = parseInt(/(\d+)px/.exec(ctx.font)?.[1] ?? '30', 10);
  const left = align === 'center' ? x - width / 2 : align === 'right' || align === 'end' ? x - width : x;
  ctx.save();
  ctx.fillStyle = 'rgba(12, 9, 7, 0.62)';
  ctx.fillRect(left - 18, y - size * 0.95, width + 36, size * 1.35);
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 8;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** A golden thread that shortens as time passes (the diegetic timer used across the game). */
export function drawTimeThread(ctx: CanvasRenderingContext2D, remaining01: number): void {
  const width = 900 * clamp(remaining01, 0, 1);
  const x0 = (W - 900) / 2;
  const y = H - 120;
  ctx.save();
  if (width > 2) drawYarn(ctx, [[x0, y], [x0 + width, y]], { width: 9 });
  // The burning end: a painted spark.
  if (!drawSpark(ctx, 0, x0 + width, y, 34, 0.95, performance.now() / 400)) {
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(x0 + width, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
