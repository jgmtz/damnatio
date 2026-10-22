// Painted effects (pedidos-de-arte 4 and 5.8): cuts the AI's grids of frames into clean sprite
// strips the game can animate. Usage: npm run art:fx   (reads tools/fx-sheets.json)
//
// For each sheet: the grid is split into equal cells (inset a little, to drop divider lines), each
// cell gets transparency, and the frames are laid side by side in one PNG with equal cells,
// aligned on an anchor so the animation doesn't jump:
// - "bottom": the base of the drawing (flames, smoke) sits on the same point in every frame;
// - "center": the drawing is centered (embers, signs);
// - "thread": the cell is kept whole and moved so its cord crosses every frame at the same height
//   (the knot, the tangle, the shears); the cord's ends fade out at the cell's sides.
// Transparency: "black" (drawing on black; thin dark lines kept), "luma" (light lines on dark:
// alpha by brightness), "ink" (black ink on white: alpha by darkness, painted black).
// Writes src/systems/fxSheets.json (frame layout and anchors) and adds the ids to the manifest.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { removeBlack } from './mask.ts';

interface SheetConfig {
  id: string;
  /** One or more images; their frames are concatenated in order. */
  src: string | string[];
  dest: string;
  /** Columns and rows of the grid in each source image. */
  grid: [number, number];
  /** Pixels dropped at each cell's border (divider lines). */
  inset?: number;
  alpha: 'black' | 'luma' | 'ink' | 'groove' | 'none';
  anchor: 'bottom' | 'center' | 'thread' | 'none';
  /**
   * Newer versions of the art, tried first (the first whose files all exist wins); the sheet's own
   * `src`/`grid` are the fallback, so the game keeps working while new art is being made.
   */
  prefer?: { src: string | string[]; grid: [number, number] }[];
  /** Only these frames (indices after concatenation), in this order. */
  frames?: number[];
  /** Output scale (e.g. 0.5 to keep big pictures light). */
  scale?: number;
  /** "black" mode: darkness threshold and the width of lines that survive. */
  threshold?: number;
  lineRadius?: number;
  /** "black" mode: enclosed dark areas at least this big become see-through (loops of a knot). */
  minHole?: number;
  /** "thread" anchor: px over which the cord fades at the cell's sides. */
  feather?: number;
  modulate?: { hue?: number; saturation?: number; brightness?: number };
}

interface Frame {
  data: Buffer;
  w: number;
  h: number;
  /** Bounding box of the opaque pixels. */
  box: { x0: number; y0: number; x1: number; y1: number };
  /** "thread": the cord's height in the cell. */
  cordY?: number;
  /** "thread": the cord's thickness. */
  cord?: number;
}

const root = join(import.meta.dirname, '..');
const config: { sheets: SheetConfig[] } = JSON.parse(readFileSync(join(import.meta.dirname, 'fx-sheets.json'), 'utf8'));
const PAD = 6;

function gold(data: Buffer, i: number): boolean {
  const r = data[i * 4]!;
  const g = data[i * 4 + 1]!;
  const b = data[i * 4 + 2]!;
  return data[i * 4 + 3]! > 128 && r > 110 && r - b > 35 && g > 70;
}

/** Height and thickness of the cord where it enters and leaves the cell (median of both sides). */
function measureCord(f: Frame): { y: number; thickness: number } | null {
  const runs: { y: number; t: number }[] = [];
  for (const x of [3, 8, f.w - 9, f.w - 4]) {
    let y0 = -1;
    for (let y = 0; y <= f.h; y++) {
      const on = y < f.h && gold(f.data, y * f.w + x);
      if (on && y0 < 0) y0 = y;
      if (!on && y0 >= 0) {
        if (y - y0 >= 2 && y - y0 <= 30) runs.push({ y: (y0 + y - 1) / 2, t: y - y0 });
        y0 = -1;
      }
    }
  }
  if (!runs.length) return null;
  runs.sort((a, b) => a.y - b.y);
  const mid = runs[runs.length >> 1]!;
  return { y: mid.y, thickness: mid.t };
}

async function loadFrames(sheet: SheetConfig): Promise<Frame[]> {
  const frames: Frame[] = [];
  for (const src of Array.isArray(sheet.src) ? sheet.src : [sheet.src]) {
    let img = sharp(join(root, src));
    if (sheet.modulate) img = sharp(await img.modulate(sheet.modulate).toBuffer());
    const meta = await img.metadata();
    const [cols, rows] = sheet.grid;
    const inset = sheet.inset ?? 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = Math.round((meta.width! * c) / cols) + inset;
        const top = Math.round((meta.height! * r) / rows) + inset;
        const w = Math.round((meta.width! * (c + 1)) / cols) - inset - left;
        const h = Math.round((meta.height! * (r + 1)) / rows) - inset - top;
        const { data } = await img.clone().extract({ left, top, width: w, height: h }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        frames.push({ data, w, h, box: { x0: 0, y0: 0, x1: w - 1, y1: h - 1 } });
      }
    }
  }
  return sheet.frames ? sheet.frames.map((i) => frames[i]!) : frames;
}

function applyAlpha(sheet: SheetConfig, f: Frame): void {
  const { data, w, h } = f;
  if (sheet.alpha === 'black') {
    removeBlack(data, w, h, sheet.threshold ?? 40, sheet.lineRadius ?? 3, sheet.minHole ?? 400);
  } else if (sheet.alpha === 'luma') {
    // Light strokes on a dark ground: brightness above the ground is the alpha; the color is kept.
    for (let i = 0; i < w * h; i++) {
      const m = Math.max(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!);
      data[i * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0, (m - 45) / 90)));
    }
  } else if (sheet.alpha === 'groove') {
    // Letters cut in light stone: only the dark grooves stay, with their color.
    for (let i = 0; i < w * h; i++) {
      const lum = (data[i * 4]! + data[i * 4 + 1]! + data[i * 4 + 2]!) / 3;
      data[i * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0, (118 - lum) / 55)));
    }
  } else if (sheet.alpha === 'ink') {
    for (let i = 0; i < w * h; i++) {
      const m = Math.min(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!);
      data[i * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0, (215 - m) / 150)));
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0;
    }
  }
  // Opaque bounding box.
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! > 40) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  }
  f.box = x1 < 0 ? { x0: 0, y0: 0, x1: w - 1, y1: h - 1 } : { x0, y0, x1, y1 };
}

/** Fades the cord out over `px` at the left and right sides of a frame. */
function featherSides(f: Frame, px: number): void {
  for (let y = 0; y < f.h; y++) {
    for (let x = 0; x < px; x++) {
      const k = x / px;
      for (const xx of [x, f.w - 1 - x]) {
        const i = (y * f.w + xx) * 4 + 3;
        f.data[i] = Math.round(f.data[i]! * k);
      }
    }
  }
}

/** The sheet with its preferred newer art, if all of that art's files exist. */
function resolve(sheet: SheetConfig): SheetConfig {
  for (const p of sheet.prefer ?? []) {
    const files = Array.isArray(p.src) ? p.src : [p.src];
    if (files.every((file) => existsSync(join(root, file)))) return { ...sheet, src: p.src, grid: p.grid, frames: undefined };
  }
  return sheet;
}

async function build(config: SheetConfig): Promise<Record<string, unknown>> {
  const sheet = resolve(config);
  console.log(`${sheet.id}: ${JSON.stringify(sheet.src)}`);
  const frames = await loadFrames(sheet);
  for (const f of frames) applyAlpha(sheet, f);

  let cellW: number;
  let cellH: number;
  let ax: number;
  let ay: number;
  const place: { left: number; top: number }[] = [];
  let thread: number | undefined;
  if (sheet.anchor === 'none') {
    // Whole pictures (tiles, overlays): kept as they are.
    cellW = Math.max(...frames.map((f) => f.w));
    cellH = Math.max(...frames.map((f) => f.h));
    ax = 0;
    ay = 0;
    for (let i = 0; i < frames.length; i++) place.push({ left: 0, top: 0 });
  } else if (sheet.anchor === 'thread') {
    for (const f of frames) {
      const cord = measureCord(f);
      f.cordY = cord?.y ?? f.h / 2;
      f.cord = cord?.thickness;
      if (sheet.feather) featherSides(f, sheet.feather);
    }
    const thick = frames.map((f) => f.cord).filter((t): t is number => t !== undefined).sort((a, b) => a - b);
    thread = thick[thick.length >> 1];
    const above = Math.max(...frames.map((f) => f.cordY!));
    const below = Math.max(...frames.map((f) => f.h - f.cordY!));
    cellW = Math.max(...frames.map((f) => f.w));
    cellH = Math.ceil(above + below);
    ax = cellW / 2;
    ay = above;
    for (const f of frames) place.push({ left: Math.round((cellW - f.w) / 2), top: Math.round(above - f.cordY!) });
  } else {
    const bw = Math.max(...frames.map((f) => f.box.x1 - f.box.x0 + 1));
    const bh = Math.max(...frames.map((f) => f.box.y1 - f.box.y0 + 1));
    cellW = bw + PAD * 2;
    cellH = bh + PAD * 2;
    ax = cellW / 2;
    ay = sheet.anchor === 'bottom' ? cellH - PAD : cellH / 2;
    for (const f of frames) {
      const cx = (f.box.x0 + f.box.x1) / 2;
      const left = Math.round(ax - cx);
      const top = sheet.anchor === 'bottom' ? Math.round(ay - f.box.y1) : Math.round(ay - (f.box.y0 + f.box.y1) / 2);
      place.push({ left, top });
    }
  }

  // Lay the frames side by side (each clipped to its own cell).
  const composites = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]!;
    const p = place[i]!;
    const png = await sharp(f.data, { raw: { width: f.w, height: f.h, channels: 4 } }).png().toBuffer();
    // Clip to the cell: the frame may be bigger than the cell on some side.
    const sx = Math.max(0, -p.left);
    const sy = Math.max(0, -p.top);
    const ew = Math.min(f.w - sx, cellW - Math.max(0, p.left));
    const eh = Math.min(f.h - sy, cellH - Math.max(0, p.top));
    if (ew <= 0 || eh <= 0) continue;
    const clipped = await sharp(png).extract({ left: sx, top: sy, width: ew, height: eh }).toBuffer();
    composites.push({ input: clipped, left: i * cellW + Math.max(0, p.left), top: Math.max(0, p.top) });
  }
  let out = sharp({ create: { width: cellW * frames.length, height: cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(composites);
  const scale = sheet.scale ?? 1;
  if (scale !== 1) {
    out = sharp(await out.png().toBuffer()).resize(Math.round(cellW * frames.length * scale), Math.round(cellH * scale));
  }
  mkdirSync(dirname(join(root, sheet.dest)), { recursive: true });
  await out.png({ compressionLevel: 9 }).toFile(join(root, sheet.dest));
  console.log(`${sheet.dest}: ${frames.length} frames of ${Math.round(cellW * scale)}x${Math.round(cellH * scale)}`);
  return {
    frames: frames.length,
    w: Math.round(cellW * scale),
    h: Math.round(cellH * scale),
    ax: Math.round(ax * scale),
    ay: Math.round(ay * scale),
    ...(thread !== undefined ? { thread: Math.round(thread * scale * 10) / 10 } : {}),
    ...(sheet.anchor === 'thread' && sheet.feather ? { feather: Math.round(sheet.feather * scale) } : {}),
  };
}

const metaPath = join(root, 'src/systems/fxSheets.json');
let meta: Record<string, unknown> = {};
try {
  meta = JSON.parse(readFileSync(metaPath, 'utf8'));
} catch {
  // first run
}
const manifestPath = join(root, 'assets/art/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, string>;
const only = process.argv[2];
for (const sheet of config.sheets) {
  if (only && !sheet.id.includes(only) && !JSON.stringify(sheet.src).includes(only)) continue;
  meta[sheet.id] = await build(sheet);
  manifest[sheet.id] = sheet.dest.replace(/^assets\/art\//, '');
}
writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
