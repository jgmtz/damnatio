// Removes the solid black background from AI-generated red-figure art (GDD 8.5 "Limpeza das imagens").
// Usage: npm run art:clean   (reads tools/art-clean.json; sources in originais/ stay untouched)
//
// Why not a simple "black -> transparent" key: the ink lines inside the figure are black too.
// Instead, background = dark areas wide enough to fit a disk of `lineRadius` (a morphological
// opening), connected to the image border or large enough to be a hole (e.g. between arm and body).
// Thin dark strokes (outlines, hatching, belt) are narrower than the disk, so they survive.
// For files marked `groundLine`, long light horizontal runs near the bottom are removed.

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';
import { keepBackgroundComponents, morph } from './mask.ts';

interface Config {
  /** Pixels with max(R,G,B) <= threshold count as dark (JPEG noise included). */
  threshold: number;
  /** Strokes thinner than 2*lineRadius+1 px are kept as part of the figure. */
  lineRadius: number;
  /** Enclosed dark regions at least this big (px) are treated as background holes. */
  minHoleArea: number;
  /**
   * groundLine: remove a painted ground line under the feet (only where the art has one).
   * holes: false keeps enclosed dark areas (use for close-ups, where a big black iris could pass for a hole).
   * background: "black" (default, red-figure on black) or "auto": the background color is sampled
   *   from the image border (e.g. Asterion's black-figure art on terracotta, Théron's white-ground art).
   * tolerance: color distance still counted as background in "auto" mode (default 48).
   * copy: true = no background removal; just copy/convert (full-frame backgrounds and close-ups).
   * darkFigure: true = cut out a black-figure painting from the terracotta panel of a vase (the
   *   Asterion close-up): keeps the largest dark shape inside the panel, with its incised lines and
   *   enclosed details (eyes), and drops the panel and the vase around it.
   */
  files: {
    src: string;
    dest: string;
    groundLine?: boolean;
    holes?: boolean;
    background?: 'black' | 'auto';
    tolerance?: number;
    copy?: boolean;
    /** copy mode: brightness multiplier (e.g. 0.5 to push a wall back so figures read in front of it). */
    brightness?: number;
    darkFigure?: boolean;
    /** Color correction before anything else (e.g. emblems matched to the thread strip's straw gold). */
    modulate?: { hue?: number; saturation?: number; brightness?: number };
    /** Keep only these rows opaque (drops loose specks above and below a strip). */
    keepRows?: [number, number];
    /** copy mode: output the image followed by its mirror, so it tiles side by side without a seam. */
    mirrorTile?: boolean;
    /** Drawn on white paper with nothing white in it (hands, arms): every bit of paper goes, even between strands of fur. */
    paper?: boolean;
    /** Use only this part of the source (e.g. one of two hands painted in one picture). */
    extract?: { left: number; top: number; width: number; height: number };
    /**
     * copy mode: cover parts of the picture with other parts of it (a clone stamp), e.g. the cups
     * painted on the barrel top, so the minigame can move its own. Edges are feathered.
     */
    patches?: { from: { left: number; top: number; width: number; height: number }; to: { left: number; top: number }; flop?: boolean; feather?: number }[];
    /**
     * Cut out a colored object from a pale, greyish ground (the orange cup on the wood): keeps the
     * largest shape whose saturation is at least this (0..1), with its outline and enclosed details.
     */
    saturated?: number;
    /** A bust cut off by the bottom edge: pale cloth touching that edge is not background. */
    cutAtBottom?: boolean;
    /** White paper: how close to the paper's color a pocket touching the background must be to go (26). */
    fringe?: number;
  }[];
}

const root = join(import.meta.dirname, '..');
const config: Config = JSON.parse(readFileSync(join(import.meta.dirname, 'art-clean.json'), 'utf8'));

/** Light pixels in long horizontal runs within the bottom 8% of the image (a painted ground line). */
function groundLineMask(dark: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  const minRun = Math.round(w * 0.3);
  for (let y = Math.floor(h * 0.92); y < h; y++) {
    let runStart = -1;
    for (let x = 0; x <= w; x++) {
      const light = x < w && !dark[y * w + x];
      if (light && runStart < 0) runStart = x;
      if (!light && runStart >= 0) {
        if (x - runStart >= minRun) for (let k = runStart; k < x; k++) out[y * w + k] = 1;
        runStart = -1;
      }
    }
  }
  // Grow vertically by 2px to catch the anti-aliased edges of the line.
  return morph(out, w, h, 2, 'dilate');
}

/** Median color of the image border: the background color in "auto" mode. */
function borderColor(data: Buffer, w: number, h: number): [number, number, number] {
  const samples: [number, number, number][] = [];
  const add = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    samples.push([data[i]!, data[i + 1]!, data[i + 2]!]);
  };
  for (let x = 0; x < w; x += 4) {
    add(x, 0);
    add(x, h - 1);
  }
  for (let y = 0; y < h; y += 4) {
    add(0, y);
    add(w - 1, y);
  }
  const median = (k: 0 | 1 | 2) => samples.map((s) => s[k]).sort((a, b) => a - b)[samples.length >> 1]!;
  return [median(0), median(1), median(2)];
}

/** Black figure on a terracotta vase panel -> alpha mask of the figure (see Config.darkFigure). */
function darkFigureMask(data: Buffer, w: number, h: number): Uint8Array {
  const at = (i: number) => [data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!] as const;
  const orange = (i: number) => {
    const [r, , b] = at(i);
    return r > 140 && r - b > 60;
  };
  // The panel: on each row, between the first and the last terracotta pixel.
  const dark = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let first = -1;
    let last = -1;
    for (let x = 0; x < w; x++) {
      if (orange(y * w + x)) {
        if (first < 0) first = x;
        last = x;
      }
    }
    if (first < 0 || last - first < w * 0.2) continue;
    for (let x = first; x <= last; x++) dark[y * w + x] = Math.max(...at(y * w + x)) < 95 ? 1 : 0;
  }
  // Closing: incised lines inside the figure become figure again.
  const closed = morph(morph(dark, w, h, 4, 'dilate'), w, h, 4, 'erode');
  // Keep the largest connected dark shape (the figure).
  const label = new Int32Array(w * h).fill(-1);
  let best: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (!closed[start] || label[start] !== -1) continue;
    const pixels: number[] = [];
    const stack = [start];
    label[start] = start;
    while (stack.length) {
      const i = stack.pop()!;
      pixels.push(i);
      const x = i % w;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (n >= 0 && n < w * h && closed[n] && label[n] === -1) {
          label[n] = start;
          stack.push(n);
        }
      }
    }
    if (pixels.length > best.length) best = pixels;
  }
  const figure = new Uint8Array(w * h);
  for (const i of best) figure[i] = 1;
  // Fill enclosed holes (eyes, nostrils): background is what the image border can reach.
  const outside = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (outside[i] || figure[i]) continue;
    outside[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  for (let i = 0; i < w * h; i++) if (!outside[i]) figure[i] = 1;
  return figure;
}

/** Largest shape of saturated color (plus its dark outline and enclosed details) -> mask (see Config.saturated). */
function saturatedMask(data: Buffer, w: number, h: number, minSaturation: number): Uint8Array {
  const raw = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4]!, g = data[i * 4 + 1]!, b = data[i * 4 + 2]!;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    raw[i] = max > 0 && (max - min) / max >= minSaturation ? 1 : 0;
  }
  // Closing joins the highlights and the strokes inside the object; the dilation adds the outline.
  const closed = morph(morph(raw, w, h, 4, 'dilate'), w, h, 4, 'erode');
  // The largest connected shape.
  const seen = new Uint8Array(w * h);
  let best: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (!closed[start] || seen[start]) continue;
    const pixels: number[] = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      pixels.push(i);
      const x = i % w;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (n >= 0 && n < w * h && closed[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    if (pixels.length > best.length) best = pixels;
  }
  const shape = new Uint8Array(w * h);
  for (const i of best) shape[i] = 1;
  // Fill what the border can't reach (the dark mouth of the cup), then take in the outline.
  const outside = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (outside[i] || shape[i]) continue;
    outside[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  for (let i = 0; i < w * h; i++) if (!outside[i]) shape[i] = 1;
  return morph(shape, w, h, 2, 'dilate');
}

/** Clone-stamp patches with feathered edges (see Config.patches). */
async function applyPatches(png: Buffer, patches: NonNullable<Config['files'][number]['patches']>): Promise<Buffer> {
  const layers: OverlayOptions[] = [];
  for (const p of patches) {
    const feather = p.feather ?? 12;
    let piece = sharp(png).extract(p.from);
    if (p.flop) piece = piece.flop();
    const { data, info } = await piece.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    // Alpha ramps up over `feather` px from every edge.
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const d = Math.min(x, y, info.width - 1 - x, info.height - 1 - y);
        data[(y * info.width + x) * 4 + 3] = Math.round(255 * Math.min(1, d / feather));
      }
    }
    layers.push({ input: await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer(), left: p.to.left, top: p.to.top });
  }
  return sharp(png).composite(layers).png().toBuffer();
}

/** Flood fill: the background spreads (4-neighbours) into every touching pixel that `paper` accepts. */
function growIntoPaper(background: Uint8Array, w: number, h: number, paper: (i: number) => boolean): void {
  const queue: number[] = [];
  for (let i = 0; i < w * h; i++) if (background[i]) queue.push(i);
  while (queue.length) {
    const i = queue.pop()!;
    const x = i % w;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
      if (j < 0 || j >= w * h || background[j] || !paper(j)) continue;
      background[j] = 1;
      queue.push(j);
    }
  }
}

async function clean(file: Config['files'][number]): Promise<void> {
  const { src, dest, groundLine, holes = true, background: bgMode = 'black', tolerance = 48 } = file;
  mkdirSync(dirname(join(root, dest)), { recursive: true });
  if (file.copy) {
    // Full-frame images: no transparency needed; just convert (JPEG keeps them light).
    let out = sharp(join(root, src));
    if (file.extract) out = sharp(await out.extract(file.extract).toBuffer());
    if (file.brightness !== undefined) out = out.modulate({ brightness: file.brightness });
    if (file.patches) out = sharp(await applyPatches(await out.png().toBuffer(), file.patches));
    if (file.mirrorTile) {
      // [image | mirrored image]: the right edge meets its own reflection, so the pair tiles.
      const base = await out.toBuffer();
      const meta = await sharp(base).metadata();
      const mirrored = await sharp(base).flop().toBuffer();
      out = sharp({ create: { width: meta.width! * 2, height: meta.height!, channels: 3, background: '#000' } }).composite([
        { input: base, left: 0, top: 0 },
        { input: mirrored, left: meta.width!, top: 0 },
      ]);
    }
    await (dest.endsWith('.png') ? out.png({ compressionLevel: 9 }) : out.jpeg({ quality: 88 })).toFile(join(root, dest));
    console.log(`${dest}: copied`);
    return;
  }
  let input = sharp(join(root, src));
  if (file.extract) input = sharp(await input.extract(file.extract).toBuffer());
  if (file.modulate) input = input.modulate(file.modulate);
  const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  if (file.darkFigure || file.saturated !== undefined) {
    const figure = file.darkFigure ? darkFigureMask(data, w, h) : saturatedMask(data, w, h, file.saturated!);
    // Soft 1px edge.
    const inner = morph(figure, w, h, 1, 'erode');
    for (let i = 0; i < w * h; i++) data[i * 4 + 3] = inner[i] ? 255 : figure[i] ? 150 : 0;
    await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(join(root, dest));
    console.log(`${dest}: ${file.darkFigure ? 'dark figure' : 'colored object'} cut out`);
    return;
  }
  const px = (i: number) => Math.max(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!);
  const bg = bgMode === 'auto' ? borderColor(data, w, h) : null;
  /** Distance of a pixel's color to the background color ("auto" mode). */
  const distance = (i: number) =>
    bg ? Math.hypot(data[i * 4]! - bg[0], data[i * 4 + 1]! - bg[1], data[i * 4 + 2]! - bg[2]) : 0;

  // "dark" = looks like background (black in red-figure art, the sampled color otherwise).
  const dark = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) dark[i] = bg ? (distance(i) <= tolerance ? 1 : 0) : px(i) <= config.threshold ? 1 : 0;

  const ground = groundLine ? groundLineMask(dark, w, h) : new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (ground[i]) dark[i] = 1;

  // Opening: only dark areas wider than the disk survive, then restore their original extent.
  // `paper` art (drawn on white paper, with nothing white in it: hands, arms) skips the opening:
  // every patch of paper counts, even the thin gaps between fingers or between strands of fur.
  let background: Uint8Array;
  if (file.paper && bg) {
    background = keepBackgroundComponents(dark, w, h, 12);
  } else {
    const opened = morph(morph(dark, w, h, config.lineRadius, 'erode'), w, h, config.lineRadius, 'dilate');
    for (let i = 0; i < w * h; i++) opened[i] = opened[i]! & dark[i]!;
    background = keepBackgroundComponents(opened, w, h, holes ? config.minHoleArea : Infinity, file.cutAtBottom ?? false);
    // White paper: the opening keeps paper narrower than its disk (between locks of hair, between
    // flakes, along a cloak's edge), and on dark scenes those pockets read as a glowing rim. Grow the
    // background into touching pixels that are almost pure paper (stricter than `tolerance`, so
    // cream skin and white cloth, a little darker than the paper, stay).
    if (bg && (bg[0] + bg[1] + bg[2]) / 3 > 190) growIntoPaper(background, w, h, (i) => distance(i) <= (file.fringe ?? 26));
  }

  // Keep a thin dark contour around the figure (red-figure outline) with a soft outer edge.
  const figure = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) figure[i] = background[i] ? 0 : 1;
  const ring1 = morph(figure, w, h, 1, 'dilate');
  const ring2 = morph(figure, w, h, 2, 'dilate');

  let transparent = 0;
  if (bg) {
    // Colored background: no black outline to keep. Background goes fully transparent and the
    // figure's edge pixels fade by how close their color is to the background (removes the halo).
    // A 2 px band, and the background's color taken out of those pixels ("decontamination"):
    // otherwise a light paper background leaves a pale fringe around the figure on dark scenes.
    // Paper art: a wider band (fur and loose strands are mixed with paper over several pixels),
    // where each pixel is as opaque as it is far from the paper's color.
    const nearBackground = morph(background, w, h, file.paper ? 8 : 2, 'dilate');
    const [br, bgg, bb] = bg;
    // On a light ground (white paper), the outermost pixels are mostly paper mixed with the
    // contour: they are dropped, and the next ring is half transparent.
    const lightGround = (br + bgg + bb) / 3 > 190;
    const ring1 = lightGround ? morph(background, w, h, 1, 'dilate') : null;
    for (let i = 0; i < w * h; i++) {
      let alpha = 255;
      if (background[i] || ring1?.[i]) alpha = 0;
      else if (lightGround && !file.paper && nearBackground[i]) alpha = 150;
      else if (nearBackground[i]) alpha = Math.round(255 * Math.min(1, Math.max(0, (distance(i) - tolerance * 0.6) / (tolerance * 1.6))));
      if (alpha === 0) {
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0;
      } else if (alpha < 255) {
        const a = alpha / 255;
        // observed = color * a + background * (1 - a)  →  color = (observed - background * (1 - a)) / a
        data[i * 4] = Math.max(0, Math.min(255, Math.round((data[i * 4]! - br * (1 - a)) / a)));
        data[i * 4 + 1] = Math.max(0, Math.min(255, Math.round((data[i * 4 + 1]! - bgg * (1 - a)) / a)));
        data[i * 4 + 2] = Math.max(0, Math.min(255, Math.round((data[i * 4 + 2]! - bb * (1 - a)) / a)));
      }
      data[i * 4 + 3] = alpha;
      if (alpha === 0) transparent++;
    }
  } else {
    for (let i = 0; i < w * h; i++) {
      let alpha = 255;
      if (background[i]) alpha = ring1[i] ? 255 : ring2[i] ? 110 : 0;
      if (ground[i] && background[i]) alpha = 0;
      if (alpha < 255) {
        // Outline pixels become pure ink black; fully transparent pixels are zeroed.
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0;
      }
      data[i * 4 + 3] = alpha;
      if (alpha === 0) transparent++;
    }
  }

  if (file.keepRows) {
    const [r0, r1] = file.keepRows;
    for (let y = 0; y < h; y++) {
      if (y >= r0 && y <= r1) continue;
      for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = 0;
    }
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(join(root, dest));
  console.log(`${dest}: ${((transparent / (w * h)) * 100).toFixed(1)}% transparent`);
}

// Optional filter: npm run art:clean -- <part of a file name>
const only = process.argv[2];
for (const file of config.files) {
  if (only && !file.src.includes(only)) continue;
  // Art still being made: skip it (the game keeps using the older picture meanwhile).
  if (!existsSync(join(root, file.src))) {
    console.log(`${file.src}: not there yet, skipped`);
    continue;
  }
  await clean(file);
}
