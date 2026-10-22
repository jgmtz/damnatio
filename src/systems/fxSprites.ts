// Painted effects as sprite strips (pedidos-de-arte 4 and 5.8), cut by tools/fx-sheets.ts:
// all frames of a sheet side by side in one PNG, in equal cells, aligned on an anchor (the base
// of a flame, the center of an ember, the cord of a knot). The layout is in fxSheets.json.
// Animation is limited, like hand-drawn animation: the frames are flipped at a fixed rate.

import { art } from './artRegistry';
import sheets from './fxSheets.json';

/** The painted signs (fx_sinais, pedidos 4.7): brush ring, star, eye, arch, Greek-key ring, spiral. */
export const SIGN = { ring: 0, star: 1, eye: 2, arch: 3, keyRing: 4, spiral: 5 } as const;
/** Radius of the brush ring (and of the Greek-key ring) and the size of the arch, in the sign picture (px). */
export const SIGN_RING_RADIUS = 100;
export const SIGN_KEY_RING_RADIUS = 108;
export const SIGN_ARCH = { w: 182, h: 214 };

export interface Sheet {
  frames: number;
  /** Cell size and the anchor inside a cell, in image pixels. */
  w: number;
  h: number;
  ax: number;
  ay: number;
  /** Thread sheets: the cord's thickness and how far its ends fade at the cell's sides. */
  thread?: number;
  feather?: number;
}

const SHEETS = sheets as Record<string, Sheet>;

export function sheet(id: string): Sheet | undefined {
  return SHEETS[id];
}

export function sheetLoaded(id: string): boolean {
  return art(id) !== null && SHEETS[id] !== undefined;
}

/** Frame of a looping animation at `fps`, offset by `seed` so neighbours don't flicker in step. */
export function loopFrame(id: string, time: number, fps: number, seed = 0): number {
  const n = SHEETS[id]?.frames ?? 1;
  return Math.floor(time * fps + seed * 7.31) % n;
}

/**
 * A painted panel (assets/art/ui) stretched to a box like CSS border-image: the corners kept, the
 * edges and the middle stretched. `slice` = source px of the border (top, right, bottom, left),
 * `border` = their size on screen.
 */
export function drawPanel(
  c: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  slice: [number, number, number, number],
  border: [number, number, number, number],
): boolean {
  const img = art(id);
  if (!img) return false;
  const [st, sr, sb, sl] = slice;
  const [bt, br, bb, bl] = border;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const sx = [0, sl, iw - sr, iw];
  const sy = [0, st, ih - sb, ih];
  const dx = [x, x + bl, x + w - br, x + w];
  const dy = [y, y + bt, y + h - bb, y + h];
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      const sw = sx[col + 1]! - sx[col]!;
      const sh = sy[r + 1]! - sy[r]!;
      const dw = dx[col + 1]! - dx[col]!;
      const dh = dy[r + 1]! - dy[r]!;
      if (sw > 0 && sh > 0 && dw > 0 && dh > 0) c.drawImage(img, sx[col]!, sy[r]!, sw, sh, dx[col]!, dy[r]!, dw, dh);
    }
  }
  return true;
}

export interface FrameOptions {
  alpha?: number;
  rotation?: number;
  /** Mirror horizontally (around the anchor). */
  flipX?: boolean;
  /** Vertical stretch on top of the scale (e.g. a flame growing taller). */
  stretchY?: number;
  composite?: GlobalCompositeOperation;
}

/**
 * Draws frame `frame` of a sheet with its anchor on (x, y), `scale` = screen px per image px.
 * Returns false while the image is loading.
 */
export function drawFrame(c: CanvasRenderingContext2D, id: string, frame: number, x: number, y: number, scale: number, o: FrameOptions = {}): boolean {
  const s = SHEETS[id];
  const img = art(id);
  if (!s || !img || scale <= 0 || (o.alpha ?? 1) <= 0) return false;
  const i = ((Math.floor(frame) % s.frames) + s.frames) % s.frames;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  if (o.composite) c.globalCompositeOperation = o.composite;
  c.translate(x, y);
  if (o.rotation) c.rotate(o.rotation);
  c.scale(scale * (o.flipX ? -1 : 1), scale * (o.stretchY ?? 1));
  c.drawImage(img, i * s.w, 0, s.w, s.h, -s.ax, -s.ay, s.w, s.h);
  c.restore();
  return true;
}
