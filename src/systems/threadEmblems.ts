// The sacred emblems of the fate thread (pedidos-de-arte 1.2–1.7), cut out of the painted pieces:
// the knot (tie, ∞), the Moirai's shears (cut), the tangle, the broken ends, the spindle, a spark.
// Each crop has an anchor: the point that goes where the thread is tied, cut or tangled.
//
// Emblems are part of the thread, not stickers on it: each painting has its own short stretch of
// thread on both sides (the "stubs"), whose outer ends are faded out, and a `gap` where the drawn
// thread must stop (yarn.ts leaves that stretch to the painting). So the drawn cord runs into the
// painted cord and the painted knot is what holds them together.
// Returns false while the image is still loading, so callers can fall back to code drawings.

import type { ThreadKind } from '../engine/types';
import { art } from './artRegistry';
import { sheet } from './fxSprites';

/**
 * Still emblems, plus the drawn animations of a knot being tied, a tangle forming and the shears
 * cutting (pedidos 5.8; sheets cut by tools/fx-sheets.ts): those take a frame number.
 */
export type EmblemKind = ThreadKind | 'broken' | 'spindle' | 'spark' | 'tieFrames' | 'tangleFrames' | 'cutFrames';

const FRAME_SHEETS: Partial<Record<EmblemKind, string>> = {
  tieFrames: 'thread.frames.tie',
  tangleFrames: 'thread.frames.tangle',
  cutFrames: 'thread.frames.cut',
};

/** Number of frames of an emblem (1 for the still ones). */
export function emblemFrames(kind: EmblemKind): number {
  const id = FRAME_SHEETS[kind];
  return id ? (sheet(id)?.frames ?? 1) : 1;
}

/** The crop for an emblem (and frame): a frame of a sheet is a cell whose cord runs through it. */
function cropOf(kind: EmblemKind, frame = 0): Crop | null {
  const id = FRAME_SHEETS[kind];
  if (!id) return CROPS[kind as keyof typeof CROPS];
  const sh = sheet(id);
  if (!sh) return null;
  const i = Math.max(0, Math.min(sh.frames - 1, Math.floor(frame)));
  const x = i * sh.w;
  // The drawn thread stops where the cell's own cord is fully painted (past the faded sides).
  const feather = sh.feather ?? 0;
  return { art: id, x, y: 0, w: sh.w, h: sh.h, ax: x + sh.ax, ay: sh.ay, thread: sh.thread ?? 6, gap: [x + feather, x + sh.w - feather], baked: true };
}

interface Crop {
  art: string;
  /** Source rectangle, in image pixels (with the painted thread stubs on both sides). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The anchor inside the source image (on the thread line). */
  ax: number;
  ay: number;
  /** Thickness of the thread in this picture (px), measured at the edges; matched to the drawn thread. */
  thread?: number;
  /** Source x range where the drawn thread stops and the painting takes over. */
  gap?: [number, number];
  /** Source px over which the stubs fade out at the crop's left and right edges. */
  feather?: number;
  /** The sides are already faded in the image (sheets from tools/fx-sheets.ts). */
  baked?: boolean;
}

const CROPS: Record<'tie' | 'cut' | 'tangle' | 'broken' | 'spindle' | 'spark', Crop> = {
  tie: { art: 'thread.tie', x: 420, y: 280, w: 540, h: 210, ax: 687, ay: 384, thread: 28, gap: [462, 912], feather: 40 },
  cut: { art: 'thread.cut', x: 380, y: 0, w: 860, h: 560, ax: 654, ay: 384, thread: 17, gap: [560, 850], feather: 34 },
  tangle: { art: 'thread.tangle', x: 380, y: 125, w: 620, h: 520, ax: 684, ay: 385, thread: 21, gap: [440, 935], feather: 40 },
  broken: { art: 'thread.broken', x: 380, y: 250, w: 620, h: 270, ax: 688, ay: 385, thread: 47, gap: [470, 905], feather: 44 },
  spindle: { art: 'thread.spindle', x: 120, y: 40, w: 180, h: 690, ax: 285, ay: 384, thread: 12 },
  spark: { art: 'thread.sparks', x: 184, y: 183, w: 144, h: 146, ax: 256, ay: 256 },
};

/** Crops with their stub ends faded, made once per emblem when its image has loaded. */
const feathered = new Map<EmblemKind, HTMLCanvasElement>();

function cropImage(kind: EmblemKind, crop: Crop): CanvasImageSource | null {
  const img = art(crop.art);
  if (!img) return null;
  if (!crop.feather || crop.baked) return img;
  let canvas = feathered.get(kind);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = crop.w;
    canvas.height = crop.h;
    const c = canvas.getContext('2d')!;
    c.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
    c.globalCompositeOperation = 'destination-out';
    for (const side of [0, 1]) {
      const x0 = side ? crop.w : 0;
      const x1 = side ? crop.w - crop.feather : crop.feather;
      const g = c.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(Math.min(x0, x1), 0, crop.feather, crop.h);
    }
    feathered.set(kind, canvas);
  }
  return canvas;
}

/**
 * Draws an emblem with its anchor on (x, y). `size` = on-screen height of the crop.
 * `rotation` turns it with the thread (radians). `composite` = e.g. 'lighter' for its glow.
 */
export function drawEmblem(
  c: CanvasRenderingContext2D,
  kind: EmblemKind,
  x: number,
  y: number,
  size: number,
  alpha = 1,
  rotation = 0,
  composite?: GlobalCompositeOperation,
  frame = 0,
): boolean {
  const crop = cropOf(kind, frame);
  const img = crop ? cropImage(kind, crop) : null;
  if (!crop || !img || alpha <= 0) return false;
  const s = size / crop.h;
  c.save();
  c.globalAlpha *= alpha;
  if (composite) c.globalCompositeOperation = composite;
  c.translate(x, y);
  c.rotate(rotation);
  const dx = (crop.x - crop.ax) * s;
  const dy = (crop.y - crop.ay) * s;
  if (img instanceof HTMLCanvasElement) c.drawImage(img, dx, dy, crop.w * s, crop.h * s);
  else c.drawImage(img, crop.x, crop.y, crop.w, crop.h, dx, dy, crop.w * s, crop.h * s);
  c.restore();
  return true;
}

export interface EmblemSize {
  threadWidth: number;
  /** Frame of an animated emblem. */
  frame?: number;
  grow?: number;
  /** Caps very large pieces (the shears on the small map). */
  maxHeight?: number;
}

/** On-screen height of the crop, so that its own thread is as thick as the drawn thread. */
export function emblemHeight(kind: EmblemKind, size: EmblemSize): number {
  const crop = cropOf(kind, size.frame);
  if (!crop) return 0;
  let height = crop.h * (size.threadWidth / (crop.thread ?? crop.h)) * (size.grow ?? 1);
  if (size.maxHeight !== undefined) height = Math.min(height, size.maxHeight);
  return height;
}

/**
 * Where the drawn thread must stop around the emblem: distances before and after the anchor,
 * along the thread, on screen. [0, 0] for emblems without a painted thread.
 */
export function emblemGap(kind: EmblemKind, size: EmblemSize): [number, number] {
  const crop = cropOf(kind, size.frame);
  if (!crop?.gap) return [0, 0];
  const s = emblemHeight(kind, size) / crop.h;
  return [(crop.ax - crop.gap[0]) * s, (crop.gap[1] - crop.ax) * s];
}

/** On-screen extent of the whole crop along the thread (before and after the anchor). */
export function emblemSpan(kind: EmblemKind, size: EmblemSize): [number, number] {
  const crop = cropOf(kind, size.frame);
  if (!crop) return [0, 0];
  const s = emblemHeight(kind, size) / crop.h;
  return [(crop.ax - crop.x) * s, (crop.x + crop.w - crop.ax) * s];
}

/**
 * Draws an emblem sized so that its own thread is as thick as the drawn thread (`threadWidth`),
 * times `grow`. Standalone (no drawn thread around it); on a thread, use drawYarn's `emblem`.
 */
export function drawEmblemOnThread(
  c: CanvasRenderingContext2D,
  kind: EmblemKind,
  x: number,
  y: number,
  threadWidth: number,
  options: { alpha?: number; rotation?: number; grow?: number; maxHeight?: number; frame?: number } = {},
): boolean {
  const height = emblemHeight(kind, { threadWidth, ...options });
  return drawEmblem(c, kind, x, y, height, options.alpha ?? 1, options.rotation ?? 0, undefined, options.frame ?? 0);
}

export function emblemLoaded(kind: EmblemKind): boolean {
  const crop = cropOf(kind);
  return crop !== null && art(crop.art) !== null;
}
