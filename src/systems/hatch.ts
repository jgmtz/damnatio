// Engraved darkness (pedidos-de-arte 4.4): shadows are drawn as hatching, like the engraving in
// the figures, instead of smooth gradients. Three painted tiles (light, medium, dense cross-hatching
// in black ink, transparent between the strokes) are used as canvas patterns.
//
// Performance (browser canvas): copying one full-screen canvas onto another every frame is the
// expensive operation here (it cost ~26 ms each and brought the game down to ~7 fps). So:
// - the darkness is engraved inside its own layer, with one pattern fill (engraveDarkness), and
//   that layer is the only full-screen image drawn per frame;
// - the vignettes are hatched once, at half resolution, and only redrawn with an opacity.

import { art } from './artRegistry';

export type HatchDensity = 'light' | 'medium' | 'dense';

const cache = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern>>();

function patternFor(c: CanvasRenderingContext2D, key: string, make: () => CanvasImageSource | null): CanvasPattern | null {
  let byCtx = cache.get(c);
  if (!byCtx) {
    byCtx = new Map();
    cache.set(c, byCtx);
  }
  const hit = byCtx.get(key);
  if (hit) return hit;
  const source = make();
  if (!source) return null;
  const pattern = c.createPattern(source, 'repeat');
  if (pattern) byCtx.set(key, pattern);
  return pattern;
}

/** A repeating hatch pattern for this context (null while the tile is loading). */
export function hatchPattern(c: CanvasRenderingContext2D, density: HatchDensity, tint?: string): CanvasPattern | null {
  return patternFor(c, `${density}|${tint ?? ''}`, () => {
    const img = art(`fx.hatch.${density}`);
    if (!img || !tint) return img;
    // The same strokes in another ink (e.g. the beast's red).
    const t = document.createElement('canvas');
    t.width = img.naturalWidth;
    t.height = img.naturalHeight;
    const tc = t.getContext('2d')!;
    tc.drawImage(img, 0, 0);
    tc.globalCompositeOperation = 'source-in';
    tc.fillStyle = tint;
    tc.fillRect(0, 0, t.width, t.height);
    return t;
  });
}

/**
 * The gaps between the strokes, as a pattern: opaque (by `amount`) where the tile has no ink.
 * Erasing it from a darkness layer leaves the strokes darker than the spaces between them.
 */
function gapsPattern(c: CanvasRenderingContext2D, density: HatchDensity, amount: number): CanvasPattern | null {
  return patternFor(c, `gaps|${density}|${amount}`, () => {
    const img = art(`fx.hatch.${density}`);
    if (!img) return null;
    const t = document.createElement('canvas');
    t.width = img.naturalWidth;
    t.height = img.naturalHeight;
    const tc = t.getContext('2d')!;
    tc.fillStyle = `rgba(0, 0, 0, ${amount})`;
    tc.fillRect(0, 0, t.width, t.height);
    tc.globalCompositeOperation = 'destination-out';
    tc.drawImage(img, 0, 0);
    return t;
  });
}

/**
 * Engraves a darkness layer in place (its alpha = how dark): the spaces between the hatch strokes
 * are lightened by `amount`, so the shadow reads as engraving lines, denser where it is darker.
 * One pattern fill, no extra canvas. `offsetX` anchors the strokes to the world (camera).
 */
export function engraveDarkness(dark: CanvasRenderingContext2D, density: HatchDensity, amount: number, offsetX = 0): boolean {
  const gaps = gapsPattern(dark, density, amount);
  if (!gaps) return false;
  gaps.setTransform(new DOMMatrix().translate(-(offsetX % 512), 0));
  const { width: w, height: h } = dark.canvas;
  dark.save();
  dark.globalCompositeOperation = 'destination-out';
  dark.fillStyle = gaps;
  dark.fillRect(0, 0, w, h);
  dark.restore();
  return true;
}

/** Hatched vignettes, made once per ink and opening, at half resolution. */
const vignettes = new Map<string, HTMLCanvasElement>();
const VIGNETTE_W = 960;
const VIGNETTE_H = 540;

function vignette(tint: string, inner: number): HTMLCanvasElement | null {
  const key = `${tint}|${inner}`;
  const hit = vignettes.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = VIGNETTE_W;
  canvas.height = VIGNETTE_H;
  const c = canvas.getContext('2d')!;
  const medium = hatchPattern(c, 'medium', tint);
  const dense = hatchPattern(c, 'dense', tint);
  if (!medium || !dense) return null;
  // The tiles at half size too, so the strokes keep their width once the vignette is stretched.
  medium.setTransform(new DOMMatrix().scale(0.5));
  dense.setTransform(new DOMMatrix().scale(0.5).translate(211, 0));
  const r = Math.hypot(VIGNETTE_W, VIGNETTE_H) / 2;
  const mask = (power: number) => {
    const g = c.createRadialGradient(VIGNETTE_W / 2, VIGNETTE_H / 2, r * (inner + (power - 1) * 0.15), VIGNETTE_W / 2, VIGNETTE_H / 2, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    return g;
  };
  // Medium strokes from `inner` outward, dense strokes only near the edges.
  const layer = (pattern: CanvasPattern, power: number) => {
    const l = document.createElement('canvas');
    l.width = VIGNETTE_W;
    l.height = VIGNETTE_H;
    const lc = l.getContext('2d')!;
    lc.fillStyle = pattern;
    lc.fillRect(0, 0, VIGNETTE_W, VIGNETTE_H);
    lc.globalCompositeOperation = 'destination-in';
    lc.fillStyle = mask(power);
    lc.fillRect(0, 0, VIGNETTE_W, VIGNETTE_H);
    c.drawImage(l, 0, 0);
  };
  layer(medium, 1);
  layer(dense, 2);
  vignettes.set(key, canvas);
  return canvas;
}

/**
 * Edges of the screen closing in with hatching (the beast's red, the dark of a memory): strokes
 * thicken toward the corners, from `inner` (fraction of the half-diagonal) outward. Returns false
 * while the tiles load (callers keep their old gradient then).
 */
export function hatchVignette(target: CanvasRenderingContext2D, strength: number, tint: string, inner = 0.45): boolean {
  // A few openings are enough (the fury widens it in steps no one sees).
  const v = vignette(tint, Math.round(inner * 20) / 20);
  if (!v) return false;
  target.save();
  target.globalAlpha *= Math.max(0, Math.min(1, strength));
  target.drawImage(v, 0, 0, target.canvas.width, target.canvas.height);
  target.restore();
  return true;
}
