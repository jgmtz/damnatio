// Thread map screen (GDD 5.3), shown at the end of each fragment: the decisions as a flowchart in the
// spirit of Detroit, drawn with the fate thread itself (a twisted cord, src/systems/yarn.ts).
// The story flows left to right: columns of choices; threads run straight, turn on "tracks" between
// columns and enter the next decision (threads heading to the same decision merge). The whole map is
// shown at first; it can be dragged and zoomed like a map (wheel, double click or the buttons).
// This playthrough's thread is gold and is drawn as the screen opens; paths walked in other
// playthroughs are a faint cord; paths never walked are dashed, with "?". Marked choices carry their
// thread: a knot (tie, ∞), a cut, or a tangle; fate events hang on the thread right after the choice.
//
// Layout and graph come from src/engine/pathMap.ts (its "x" is the cross axis, here vertical).
// Option boxes are DOM (text wraps for free) on a sheet moved by a CSS transform; the threads are
// drawn every frame on a canvas underneath, and the ornaments on a canvas above the boxes, both in
// screen space so they stay sharp at any zoom.

import {
  discoveredShare,
  END_KEY,
  laneKey,
  layoutPathGraph,
  optionKey,
  optionX,
  runSteps,
  type PathGraph,
} from '../engine/pathMap';
import type { DecisionRecord } from '../engine/state';
import type { ThreadKind } from '../engine/types';
import { art } from '../systems/artRegistry';
import { drawEmblem, drawEmblemOnThread, emblemLoaded, emblemSpan, type EmblemKind } from '../systems/threadEmblems';
import type { ThreadState } from '../systems/threadFx';
import { drawFrame, SIGN } from '../systems/fxSprites';
import { drawYarn, type YarnEmblem } from '../systems/yarn';
import { el } from './dom';

/** Distance between columns of decisions (the story's direction, x). */
const COL = 640;
/** Distance between options stacked in a column (y). */
const SLOT = 150;
const BOX_W = 220;
const BOX_H = 104;
const START_X = 40;
/** x of the first column of boxes. */
const LEFT = 320;
/**
 * The knot where threads arrive, left of a column; the bar that splits them to the options.
 * The stretch from the bar to a box is long enough to hold the choice's emblem (knot, tangle,
 * broken ends) clear of the box, and so is the stretch out of a box before the first track.
 */
const KNOT_BEFORE = 160;
const BAR_BEFORE = 130;
/** Vertical tracks between columns live in [right + TRACK_FROM, right + TRACK_TO]. */
const TRACK_FROM = 130;
const TRACK_TO = COL - BOX_W - KNOT_BEFORE - 26;
const CORNER = 14;
const MARGIN = 80;
const SEGMENT_SECONDS = 0.32;
/** Thread widths on the map (world px): this playthrough, walked before. Boxes are 104 px tall. */
const RUN_WIDTH = 5;
const KNOWN_WIDTH = 3;
const MAX_ZOOM = 2.6;
/** The map opens at least this big, so the boxes can be read without zooming in. */
const READABLE_ZOOM = 0.62;
/** How much of the map must stay in view while dragging (px of the view). */
const KEEP_VISIBLE = 160;

const GOLD = '#d9b45a';
const BACKDROP = '#0d0906';

type Point = [number, number];
type EdgeLook = 'run' | 'known' | 'unknown';

/** An emblem tied into a segment: at a distance along it (negative = from its end), in a straight stretch `room` px long. */
interface Ornament {
  kind: ThreadKind;
  at: number;
  room: number;
}

interface Segment {
  points: Point[];
  look: EdgeLook;
  /** Emblem tied into this segment once visible. */
  ornament?: Ornament;
  /** Order in the drawing of this playthrough's thread (run segments only). */
  runIndex?: number;
  /** Box that lights up when the run thread reaches it. */
  reaches?: HTMLElement;
  /** How the light behaves on this stretch (the choice's thread, or the fate on the way). */
  state?: ThreadState;
}

export interface PathMapOptions {
  graph: PathGraph;
  history: DecisionRecord[];
  discovered: Set<string>;
  /** This playthrough reached the end of the fragment. */
  ended: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  title: string;
}

/**
 * Turns a list of corners (only vertical and horizontal moves) into an evenly sampled thread with
 * rounded corners. Sampling keeps the drawing animation smooth.
 */
function orthogonal(corners: Point[]): Point[] {
  const clean = corners.filter((p, i) => i === 0 || p[0] !== corners[i - 1]![0] || p[1] !== corners[i - 1]![1]);
  const out: Point[] = [];
  const line = (a: Point, b: Point) => {
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8));
    for (let i = out.length ? 1 : 0; i <= n; i++) out.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  };
  let from = clean[0]!;
  for (let i = 1; i < clean.length; i++) {
    const corner = clean[i]!;
    const next = clean[i + 1];
    if (!next) {
      line(from, corner);
      break;
    }
    // Shorten both legs by the radius and join them with a quarter circle.
    const inLen = Math.hypot(corner[0] - from[0], corner[1] - from[1]);
    const outLen = Math.hypot(next[0] - corner[0], next[1] - corner[1]);
    const r = Math.min(CORNER, inLen / 2, outLen / 2);
    const din: Point = [(corner[0] - from[0]) / (inLen || 1), (corner[1] - from[1]) / (inLen || 1)];
    const dout: Point = [(next[0] - corner[0]) / (outLen || 1), (next[1] - corner[1]) / (outLen || 1)];
    const a: Point = [corner[0] - din[0] * r, corner[1] - din[1] * r];
    const b: Point = [corner[0] + dout[0] * r, corner[1] + dout[1] * r];
    line(from, a);
    for (let s = 1; s <= 6; s++) {
      const k = s / 6;
      // Quadratic curve through the corner: a smooth rounded turn.
      out.push([
        (1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * corner[0] + k * k * b[0],
        (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * corner[1] + k * k * b[1],
      ]);
    }
    from = b;
  }
  return out;
}



/** Which painted emblem marks a choice on the map (a cut shows the broken ends: the shears are too big here). */
const MAP_EMBLEM: Record<ThreadKind, EmblemKind> = { tie: 'tie', cut: 'broken', tangle: 'tangle' };

/**
 * The emblem tied into a map thread, sized to its thread and shrunk only if it would not fit in
 * the straight stretch it sits on (`room`, px).
 */
function mapEmblem(kind: ThreadKind, width: number, ornament: Ornament, alpha = 1): YarnEmblem {
  const emblem = MAP_EMBLEM[kind];
  const [a, b] = emblemSpan(emblem, { threadWidth: width });
  const grow = Math.min(1, (ornament.room - 8) / (a + b));
  return { kind: emblem, at: ornament.at, grow, alpha };
}

/** This playthrough: a bright cord. Walked before: a thin faint cord. Never walked: a dashed trace. */
function strokePath(
  c: CanvasRenderingContext2D,
  points: Point[],
  look: EdgeLook,
  time?: number,
  state?: ThreadState,
  ornament?: Ornament & { alpha?: number },
  layer?: 'body' | 'light',
): void {
  if (points.length < 2) return;
  const width = look === 'run' ? RUN_WIDTH : KNOWN_WIDTH;
  const painted = ornament && look !== 'unknown' && emblemLoaded(MAP_EMBLEM[ornament.kind]);
  const emblem = painted ? { emblem: mapEmblem(ornament.kind, width, ornament, ornament.alpha) } : {};
  if (look === 'run') {
    const fx = time === undefined ? undefined : { time, state: state ?? 'normal', seed: Math.round(points[0]![0] + points[0]![1]) };
    drawYarn(c, points, { width: RUN_WIDTH, glow: true, ...(fx ? { fx: { ...fx, intensity: 0.8 } } : {}), ...emblem, ...(layer ? { layer } : {}) });
  } else if (look === 'known') {
    drawYarn(c, points, { width: KNOWN_WIDTH, alpha: 0.5, fibres: false, ...emblem });
  } else {
    // Never walked: a ghost of the cord, barely there.
    drawYarn(c, points, { width: 2, alpha: 0.2, fibres: false });
  }
  // Until the paintings load: the code ornament, at the same place.
  if (ornament && look !== 'unknown' && !painted && layer !== 'light') {
    const at = pointAlong(points, ornament.at);
    if (at) drawOrnament(c, ornament.kind, at, look, 0.8);
  }
}

/** The point at a distance along the path (negative = from the end). */
function pointAlong(points: Point[], at: number): Point | null {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
  let d = at < 0 ? total + at : at;
  for (let i = 1; i < points.length; i++) {
    const len = Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
    if (d <= len) {
      const k = d / (len || 1);
      return [points[i - 1]![0] + (points[i]![0] - points[i - 1]![0]) * k, points[i - 1]![1] + (points[i]![1] - points[i - 1]![1]) * k];
    }
    d -= len;
  }
  return points[points.length - 1] ?? null;
}


/** The thread ornaments, as in the fate thread animation (src/systems/threads.ts). */
export function drawOrnament(c: CanvasRenderingContext2D, kind: ThreadKind, [x, y]: Point, look: EdgeLook, size = 1): void {
  // The painted emblems (knot, shears, tangle); the code shapes below only until they load.
  const alpha = look === 'run' ? 1 : 0.6;
  if (drawEmblemOnThread(c, kind, x, y, RUN_WIDTH * size, { alpha, maxHeight: 64 * size })) return;
  const color = look === 'run' ? GOLD : 'rgba(217, 180, 90, 0.55)';
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (kind === 'tie') {
    // Knot: a lemniscate (∞) tied on the thread.
    const r = 20 * size;
    c.fillStyle = BACKDROP;
    c.beginPath();
    c.ellipse(x, y, r * 1.15, r * 0.6, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.08) {
      const d = 1 + Math.sin(a) ** 2;
      const px = x + (r * Math.cos(a)) / d;
      const py = y + (r * Math.sin(a) * Math.cos(a)) / d;
      if (a === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    c.lineWidth = 7 * size;
    c.stroke();
    c.strokeStyle = color;
    c.lineWidth = 3 * size;
    c.stroke();
  } else if (kind === 'cut') {
    // The thread snaps: a gap, two frayed ends, and the blade's slash.
    const gap = 12 * size;
    c.fillStyle = BACKDROP;
    c.fillRect(x - 14 * size, y - gap, 28 * size, gap * 2);
    c.strokeStyle = color;
    c.lineWidth = 1.6 * size;
    for (const side of [-1, 1]) {
      for (const fray of [-5, 0, 5]) {
        c.beginPath();
        c.moveTo(x, y + side * gap);
        c.lineTo(x + fray * size, y + side * (gap - 6 * size));
        c.stroke();
      }
    }
    c.strokeStyle = look === 'run' ? '#f3e2b0' : 'rgba(240, 220, 180, 0.5)';
    c.lineWidth = 3 * size;
    c.beginPath();
    c.moveTo(x - 24 * size, y + 15 * size);
    c.lineTo(x + 24 * size, y - 15 * size);
    c.stroke();
  } else {
    // Tangle: loops knotted around the thread.
    const r = 15 * size;
    c.fillStyle = BACKDROP;
    c.beginPath();
    c.arc(x, y, r * 1.2, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    for (let s = 0; s <= 1; s += 0.01) {
      const a = s * Math.PI * 6;
      const px = x + Math.cos(a * 1.3) * r * Math.sin(s * Math.PI);
      const py = y - r * 1.3 + s * r * 2.6 + Math.sin(a) * r * 0.5;
      if (s === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    c.lineWidth = 6 * size;
    c.stroke();
    c.strokeStyle = color;
    c.lineWidth = 2.4 * size;
    c.stroke();
  }
  c.restore();
}

function knot(c: CanvasRenderingContext2D, [x, y]: Point, look: EdgeLook, radius = 7): void {
  const alpha = look === 'run' ? 1 : look === 'known' ? 0.55 : 0.25;
  if (drawFrame(c, 'fx.signs', SIGN.spiral, x, y, (radius * 2.6) / 145, { alpha })) return;
  c.save();
  c.beginPath();
  c.arc(x, y, radius, 0, Math.PI * 2);
  c.fillStyle = look === 'run' ? GOLD : look === 'known' ? 'rgba(217, 180, 90, 0.45)' : 'rgba(190, 160, 130, 0.25)';
  c.fill();
  c.restore();
}

/** Builds the map element. Returns it and a stop() to end its animation loop. */
export function createPathMap(options: PathMapOptions): { element: HTMLElement; stop: () => void } {
  const { graph, history, discovered, ended, t } = options;
  const layout = layoutPathGraph(graph);
  const steps = runSteps(graph, history);

  const isKnown = (point: string, option: string) => discovered.has(optionKey(graph.fragmentId, point, option));
  const pointKnown = (key: string) =>
    key === END_KEY
      ? discovered.has(optionKey(graph.fragmentId, END_KEY, ''))
      : (graph.points.get(key)?.options.some((o) => isKnown(key, o.id)) ?? false);

  // This playthrough's thread, in drawing order: start (0), then per step: fan (2i+1), edge out (2i+2).
  const runOptions = new Set(steps.map((s) => `${s.point}|${s.option}`));
  const runStart = steps[0]?.point ?? (ended ? END_KEY : null);
  const runOrder = new Map<string, number>();
  steps.forEach((s, i) => {
    if (!runOrder.has(`fan:${s.point}|${s.option}`)) runOrder.set(`fan:${s.point}|${s.option}`, 2 * i + 1);
    const next = steps[i + 1]?.point ?? (ended ? END_KEY : null);
    if (next && !runOrder.has(`edge:${s.point}|${s.option}>${next}`)) runOrder.set(`edge:${s.point}|${s.option}>${next}`, 2 * i + 2);
  });
  const lastRun = Math.max(0, ...runOrder.values());

  // --- Geometry (world pixels; x = the story's direction) ---
  const layerOf = (key: string) => (key === END_KEY ? layout.layers : (layout.points.get(key)?.layer ?? 0));
  const colLeft = (layer: number) => LEFT + layer * COL;
  const colRight = (layer: number) => colLeft(layer) + BOX_W;
  const knotX = (layer: number) => colLeft(layer) - KNOT_BEFORE;

  // Loops (a question asked again) run back along lanes under everything.
  const loops: { from: string; index: number; to: string }[] = [];
  for (const [key, point] of graph.points) {
    point.options.forEach((o, index) => {
      for (const e of o.edges) if (layout.back.has(`${key}>${e.to}`)) loops.push({ from: key, index, to: e.to });
    });
  }
  const vs = [0, layout.endX, ...layout.lanes.values()];
  for (const p of layout.points.values()) {
    const n = graph.points.get(p.key)!.options.length;
    vs.push(p.x - n / 2 + 0.5, p.x + n / 2 - 0.5);
  }
  const minV = Math.min(...vs);
  let maxV = Math.max(...vs);
  const loopV = loops.map((_, i) => maxV + 0.8 + i * 0.18);
  if (loops.length) maxV = Math.max(...loopV);
  const toY = (v: number) => MARGIN + BOX_H / 2 + (v - minV) * SLOT;
  const worldW = knotX(layout.layers) + 260 + MARGIN;
  const worldH = toY(maxV) + BOX_H / 2 + MARGIN;

  const knotAt = (key: string): Point => [knotX(layerOf(key)), toY(key === END_KEY ? layout.endX : layout.points.get(key)!.x)];
  const startPoint: Point = [START_X, toY(0)];
  const endPoint = knotAt(END_KEY);

  // Vertical tracks: in each gap between columns, one track per destination (threads to the same
  // decision share it, so they merge instead of piling up), spread out by the destination's y.
  const destinationY = (target: string, gap: number): number => {
    const col = gap + 1;
    const lane = layout.lanes.get(laneKey(target, col));
    return lane !== undefined && col < layerOf(target) ? toY(lane) : knotAt(target)[1];
  };
  const wanted = new Map<number, Map<string, number>>();
  const want = (gap: number, target: string) => {
    if (!wanted.has(gap)) wanted.set(gap, new Map());
    wanted.get(gap)!.set(target, destinationY(target, gap));
  };
  for (const e of graph.start) want(-1, e.to);
  for (const [key, point] of graph.points) {
    for (const o of point.options) {
      for (const e of o.edges) {
        if (layout.back.has(`${key}>${e.to}`)) continue;
        for (let g = layerOf(key); g < layerOf(e.to); g++) want(g, e.to);
      }
    }
  }
  const trackX = new Map<string, number>();
  for (const [gap, targets] of wanted) {
    const [from, to] = gap < 0 ? [START_X + 30, knotX(0) - 24] : [colRight(gap) + TRACK_FROM, colRight(gap) + TRACK_TO];
    const sorted = [...targets.entries()].sort((a, b) => a[1] - b[1]);
    sorted.forEach(([target], i) =>
      trackX.set(`${gap}|${target}`, sorted.length === 1 ? (from + to) / 2 : from + ((to - from) * i) / (sorted.length - 1)),
    );
  }

  /** Corners of a forward thread from (x, y), leaving after column `fromCol`, to `target`'s knot. */
  const route = (x: number, y: number, fromCol: number, target: string): Point[] => {
    const corners: Point[] = [[x, y]];
    let curY = y;
    for (let g = fromCol; g < layerOf(target); g++) {
      const tx = trackX.get(`${g}|${target}`)!;
      const ny = destinationY(target, g);
      corners.push([tx, curY], [tx, ny]);
      curY = ny;
    }
    corners.push([knotX(layerOf(target)), curY]);
    return orthogonal(corners);
  };

  // --- DOM: a view with a movable sheet of boxes between two screen-space canvases ---
  const view = el('div', { class: 'pathmap-view' });
  const under = el('canvas', { class: 'pathmap-canvas' });
  const over = el('canvas', { class: 'pathmap-canvas over' });
  const sheet = el('div', { class: 'pathmap-sheet' });
  sheet.style.width = `${worldW}px`;
  sheet.style.height = `${worldH}px`;
  view.append(under, sheet, over);

  const segments: Segment[] = [];
  const look = (run: boolean, known: boolean): EdgeLook => (run ? 'run' : known ? 'known' : 'unknown');

  for (const edge of graph.start) {
    const run = edge.to === runStart;
    segments.push({ points: route(startPoint[0], startPoint[1], -1, edge.to), look: look(run, pointKnown(edge.to)), ...(run ? { runIndex: 0 } : {}) });
  }

  for (const [key, p] of layout.points) {
    const point = graph.points.get(key)!;
    const left = colLeft(p.layer);
    const right = colRight(p.layer);
    const k = knotAt(key);
    point.options.forEach((option, i) => {
      const cy = toY(optionX(p.x, point.options.length, i));
      const known = isKnown(key, option.id);
      const inRun = runOptions.has(`${key}|${option.id}`);
      const box = el('div', {
        class: `pathmap-option ${inRun ? 'run' : known ? 'known' : 'unknown'}`,
        text: known || inRun ? (option.label ? t(option.label) : '—') : t('ui.map.unknown'),
        attrs: known || inRun ? {} : { title: t('ui.map.unknownHint') },
      });
      box.style.left = `${left}px`;
      box.style.top = `${cy - BOX_H / 2}px`;
      box.style.width = `${BOX_W}px`;
      box.style.height = `${BOX_H}px`;
      sheet.append(box);

      // The split: from the knot to the bar, along the bar, into the option.
      const fanOrder = runOrder.get(`fan:${key}|${option.id}`);
      segments.push({
        points: orthogonal([k, [left - BAR_BEFORE, k[1]], [left - BAR_BEFORE, cy], [left, cy]]),
        look: look(inRun, known),
        // The emblem sits on the straight stretch between the bar and the box, clear of both.
        ...(option.thread && (known || inRun) ? { ornament: { kind: option.thread, at: -(BAR_BEFORE - CORNER) / 2, room: BAR_BEFORE - CORNER } } : {}),
        ...(fanOrder !== undefined ? { runIndex: fanOrder, reaches: box } : {}),
        ...(option.thread ? { state: option.thread } : {}),
      });

      // Threads out of the option.
      for (const edge of option.edges) {
        const loop = loops.findIndex((l) => l.from === key && l.index === i && l.to === edge.to);
        const target = knotAt(edge.to);
        const pts =
          loop >= 0
            ? orthogonal([
                [right, cy],
                [right + 14, cy],
                [right + 14, toY(loopV[loop]!)],
                [target[0] - 26, toY(loopV[loop]!)],
                [target[0] - 26, target[1]],
                target,
              ])
            : route(right, cy, p.layer, edge.to);
        const edgeOrder = runOrder.get(`edge:${key}|${option.id}>${edge.to}`);
        const segLook = look(edgeOrder !== undefined, known && pointKnown(edge.to));
        segments.push({
          points: pts,
          look: segLook,
          // The consequence (a death, a bond) hangs right after the choice that leads to it.
          ...(edge.fate && segLook !== 'unknown' && loop < 0
            ? { ornament: { kind: edge.fate, at: (TRACK_FROM - CORNER) / 2, room: TRACK_FROM - CORNER } }
            : {}),
          ...(edgeOrder !== undefined ? { runIndex: edgeOrder } : {}),
          ...(edge.fate || option.thread ? { state: (edge.fate ?? option.thread)! } : {}),
        });
      }
    });
  }
  const endBox = el('div', { class: `pathmap-end ${ended ? 'run' : pointKnown(END_KEY) ? 'known' : 'unknown'}`, text: t('ui.map.end') });
  endBox.style.left = `${endPoint[0] + 20}px`;
  endBox.style.top = `${endPoint[1] - 28}px`;
  sheet.append(endBox);

  // --- Camera: screen = world * s + (tx, ty), in CSS pixels of the view ---
  const cam = { s: 1, tx: 0, ty: 0, fit: 1, ready: false };
  let dirty = true;
  const viewSize = () => ({ w: view.clientWidth, h: view.clientHeight });
  const clampCam = () => {
    const { w, h } = viewSize();
    cam.s = Math.min(MAX_ZOOM, Math.max(cam.fit * 0.85, cam.s));
    cam.tx = Math.min(w - KEEP_VISIBLE, Math.max(KEEP_VISIBLE - worldW * cam.s, cam.tx));
    cam.ty = Math.min(h - KEEP_VISIBLE, Math.max(KEEP_VISIBLE - worldH * cam.s, cam.ty));
    sheet.style.transform = `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`;
    dirty = true;
  };
  const fit = () => {
    const { w, h } = viewSize();
    cam.fit = Math.min(w / worldW, h / worldH) * 0.96;
    cam.s = cam.fit;
    cam.tx = (w - worldW * cam.s) / 2;
    cam.ty = (h - worldH * cam.s) / 2;
    clampCam();
  };
  /** Zoom by `factor` keeping the point (x, y) of the view still. */
  const zoomAt = (x: number, y: number, factor: number) => {
    const s = Math.min(MAX_ZOOM, Math.max(cam.fit * 0.85, cam.s * factor));
    cam.tx = x - ((x - cam.tx) * s) / cam.s;
    cam.ty = y - ((y - cam.ty) * s) / cam.s;
    cam.s = s;
    clampCam();
  };
  /** Pointer position in the view's CSS pixels (the whole stage may be scaled). */
  const local = (e: { clientX: number; clientY: number }) => {
    const rect = view.getBoundingClientRect();
    const k = rect.width / (view.clientWidth || 1);
    return { x: (e.clientX - rect.left) / k, y: (e.clientY - rect.top) / k, k };
  };
  let drag: { x: number; y: number; tx: number; ty: number } | null = null;
  view.addEventListener('pointerdown', (e) => {
    const p = local(e);
    drag = { x: p.x, y: p.y, tx: cam.tx, ty: cam.ty };
    view.setPointerCapture(e.pointerId);
    view.classList.add('dragging');
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = local(e);
    cam.tx = drag.tx + (p.x - drag.x);
    cam.ty = drag.ty + (p.y - drag.y);
    clampCam();
  });
  const endDrag = () => {
    drag = null;
    view.classList.remove('dragging');
  };
  view.addEventListener('pointerup', endDrag);
  view.addEventListener('pointercancel', endDrag);
  view.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const p = local(e);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
    },
    { passive: false },
  );
  view.addEventListener('dblclick', (e) => {
    const p = local(e);
    zoomAt(p.x, p.y, 2);
  });
  const zoomButton = (label: string, title: string, action: () => void) =>
    el('button', {
      class: 'pathmap-zoom',
      text: label,
      attrs: { title },
      on: {
        click: (e) => {
          e.stopPropagation();
          action();
        },
        pointerdown: (e) => e.stopPropagation(),
      },
    });
  const center = () => viewSize();
  view.append(
    el('div', { class: 'pathmap-controls' }, [
      zoomButton('+', t('ui.map.zoomIn'), () => zoomAt(center().w / 2, center().h / 2, 1.5)),
      zoomButton('−', t('ui.map.zoomOut'), () => zoomAt(center().w / 2, center().h / 2, 1 / 1.5)),
      zoomButton('⤢', t('ui.map.zoomFit'), fit),
    ]),
  );

  // --- Drawing ---
  // Static layer (paths never walked and walked before, their emblems, the knots): drawn into a
  // cache only when the camera moves. Living layer (this playthrough's thread with its sacred
  // light): every frame, so the halo breathes and the sparks twinkle.
  const under2d = under.getContext('2d');
  const over2d = over.getContext('2d');
  const cache = document.createElement('canvas');
  const cache2d = cache.getContext('2d');
  let frame = 0;
  let startedAt: number | null = null;
  /**
   * This playthrough's segments already fully drawn: their cord is drawn once into the cache and
   * only their light is animated (redrawing every slice of every cord each frame was too slow).
   */
  const settled = new Set<Segment>();
  const draw = (now: number) => {
    frame = requestAnimationFrame(draw);
    if (!under2d || !over2d || !cache2d) return;
    const { w, h } = viewSize();
    if (w === 0) return; // not on screen yet
    if (!cam.ready) {
      cam.ready = true;
      fit();
      // A long fragment fitted whole is too small to read: open at a readable size on its beginning
      // (the story runs left to right); ⤢ still shows it whole.
      if (cam.fit < READABLE_ZOOM) {
        cam.s = READABLE_ZOOM;
        cam.tx = 40;
        cam.ty = (h - worldH * cam.s) / 2;
        clampCam();
      }
    }
    startedAt ??= now;
    const time = (now - startedAt) / 1000;
    const drawn = time / SEGMENT_SECONDS; // run segments completed (fractional)
    // Canvas resolution follows the real size on screen (the stage is scaled to the window).
    const ratio = (view.getBoundingClientRect().width / w) * (window.devicePixelRatio || 1);
    const pw = Math.round(w * ratio);
    const ph = Math.round(h * ratio);
    for (const c of [under, over, cache]) {
      if (c.width !== pw || c.height !== ph) {
        c.width = pw;
        c.height = ph;
        dirty = true;
      }
    }
    const m = [ratio * cam.s, 0, 0, ratio * cam.s, ratio * cam.tx, ratio * cam.ty] as const;
    // The black vase behind the map (pedidos-de-arte 1.8), as the view's background.
    const backdrop = art('thread.map.background');
    if (backdrop && !view.style.backgroundImage) {
      view.style.backgroundImage = `radial-gradient(ellipse at center, rgba(4, 2, 1, 0.6) 0%, rgba(4, 2, 1, 0.35) 55%, rgba(4, 2, 1, 0.1) 100%), url("${backdrop.src}")`;
    }

    if (dirty) {
      dirty = false;
      cache2d.setTransform(1, 0, 0, 1, 0, 0);
      cache2d.clearRect(0, 0, pw, ph);
      if (!backdrop) {
        cache2d.fillStyle = BACKDROP;
        cache2d.fillRect(0, 0, pw, ph);
      }
      cache2d.setTransform(...m);
      for (const sg of segments) if (sg.look === 'unknown') strokePath(cache2d, sg.points, sg.look);
      for (const sg of segments) if (sg.look === 'known') strokePath(cache2d, sg.points, sg.look, undefined, undefined, sg.ornament);
      for (const sg of settled) strokePath(cache2d, sg.points, 'run', 0, sg.state, sg.ornament, 'body');
      if (emblemLoaded('spindle')) drawEmblem(cache2d, 'spindle', startPoint[0], startPoint[1], 130);
      else knot(cache2d, startPoint, runStart ? 'run' : 'known', 10);
      for (const key of layout.points.keys()) {
        const run = steps.some((st) => st.point === key);
        knot(cache2d, knotAt(key), run ? 'run' : pointKnown(key) ? 'known' : 'unknown', 8);
      }
    }

    under2d.setTransform(1, 0, 0, 1, 0, 0);
    under2d.clearRect(0, 0, pw, ph);
    under2d.globalAlpha = Math.min(1, time / 0.6);
    under2d.drawImage(cache, 0, 0);
    under2d.globalAlpha = 1;
    over2d.setTransform(1, 0, 0, 1, 0, 0);
    over2d.clearRect(0, 0, pw, ph);
    under2d.setTransform(...m);
    over2d.setTransform(...m);

    for (const sg of segments) {
      if (sg.look !== 'run') continue;
      if (settled.has(sg)) {
        // Its cord is in the cache: only the sacred light is drawn now.
        strokePath(under2d, sg.points, 'run', time, sg.state, sg.ornament, 'light');
        continue;
      }
      const progress = Math.min(1, Math.max(0, drawn - (sg.runIndex ?? 0)));
      if (progress <= 0) continue;
      const part = sg.points.slice(0, Math.max(2, Math.ceil(sg.points.length * progress)));
      // The emblem is tied in once the thread has passed it, fading in (the plain cord crossfades out).
      const tiedIn = sg.ornament ? Math.min(1, Math.max(0, (drawn - (sg.runIndex ?? 0) - 1) / 1.2)) : 0;
      strokePath(under2d, part, 'run', time, sg.state, sg.ornament && progress >= 1 ? { ...sg.ornament, alpha: tiedIn } : undefined);
      // A spark runs at the tip of the thread being drawn.
      if (progress < 1) {
        const [tx, ty] = part[part.length - 1]!;
        drawEmblem(over2d, 'spark', tx, ty, 22 + Math.sin(time * 14) * 4, 1, time * 3);
      } else {
        sg.reaches?.classList.add('reached');
        // Fully drawn (and its emblem tied in): from now on its cord is cached.
        if (!sg.ornament || tiedIn >= 1) {
          settled.add(sg);
          dirty = true;
        }
      }
    }
    const endReached = ended && drawn > lastRun;
    if (endReached) {
      knot(under2d, endPoint, 'run', 12);
      endBox.classList.add('reached');
    } else {
      knot(under2d, endPoint, pointKnown(END_KEY) ? 'known' : 'unknown', 12);
    }
  };
  frame = requestAnimationFrame(draw);

  // --- Header and legend ---
  const percent = Math.round(discoveredShare(graph, discovered) * 100);
  const legendItem = (label: string, paint: (c: CanvasRenderingContext2D) => void) => {
    const swatch = el('canvas', { class: 'pathmap-swatch' });
    swatch.width = 64;
    swatch.height = 32;
    const c = swatch.getContext('2d');
    if (c) {
      c.fillStyle = BACKDROP;
      c.fillRect(0, 0, 64, 32);
      paint(c);
    }
    return el('span', { class: 'pathmap-legend-item' }, [swatch, label]);
  };
  const line = (lk: EdgeLook) => (c: CanvasRenderingContext2D) => strokePath(c, [[6, 16], [58, 16]], lk);
  const withOrnament = (kind: ThreadKind) => (c: CanvasRenderingContext2D) => {
    strokePath(c, [[0, 16], [64, 16]], 'run', undefined, undefined, { kind, at: 32, room: 60 });
  };
  const legend = el('div', { class: 'pathmap-legend' }, [
    legendItem(t('ui.map.legendRun'), line('run')),
    legendItem(t('ui.map.legendOther'), line('known')),
    legendItem(t('ui.map.legendUnknown'), line('unknown')),
    legendItem(t('ui.map.legendTie'), withOrnament('tie')),
    legendItem(t('ui.map.legendCut'), withOrnament('cut')),
    legendItem(t('ui.map.legendTangle'), withOrnament('tangle')),
  ]);

  const element = el('div', { class: 'pathmap' }, [
    el('div', { class: 'pathmap-header' }, [
      el('h2', { text: options.title }),
      el('div', { class: 'pathmap-percent', text: t('ui.map.discovered', { percent }) }),
    ]),
    legend,
    view,
    el('div', { class: 'pathmap-hint', text: t('ui.map.scroll') }),
  ]);
  return { element, stop: () => cancelAnimationFrame(frame) };
}
