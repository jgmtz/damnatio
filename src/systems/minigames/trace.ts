// Trace the letters (Asterion, "O Escriba"): run a finger along letters scratched in the wall,
// following the groove. That is how he learned to read, and how the stone gives back memories.
// Hold the left mouse button: the fingertip, pressed to the stone, glides after the pointer (never
// jumping, even to a press far away); released, it lifts and traces nothing. Each stroke starts at a glint;
// tracing advances while the finger stays in the groove; slipping out only costs accuracy.
// With `heal: true` the groove closes behind the finger: the stone won't keep that name.
//
// params: {
//   hint?: string key,
//   letters: string            Greek capitals with known strokes (see GLYPHS), e.g. "ΑΣΤΕΡ"
//   heal?: boolean             the traced letters vanish (the erased name)
// }
// outcomes: "clean" | "shaky" (or "healed" when heal is on)

import { drawFrame, SIGN } from '../fxSprites';
import { hatchVignette } from '../hatch';
import { art } from '../artRegistry';
import { drawYarn } from '../yarn';
import { drawLimb, limbDirection } from './arms';

/** Width of his forearm on screen (he is huge); `params.handWidth` changes it (the boy's is smaller). */
const HAND_WIDTH = 230;
import { ACTION } from './input';
import { Tutorial } from './tutorial';
import { clamp, drawHints, drawImageFit, H, tutorialLabels, W, type Minigame, type MinigameContext, type MinigameFactory } from './types';

type P = [number, number];

/** Arc points in a unit box: center (cx, cy), radii, from angle a0 to a1 (radians, y down). */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 14): P[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as P;
  });
}

/** Strokes of each letter in a unit box (x right, y down), in writing order. */
export const GLYPHS: Record<string, P[][]> = {
  Α: [[[0.05, 1], [0.5, 0], [0.95, 1]], [[0.25, 0.62], [0.75, 0.62]]],
  Σ: [[[0.92, 0.04], [0.1, 0.04], [0.55, 0.5], [0.1, 0.96], [0.92, 0.96]]],
  Τ: [[[0.04, 0.04], [0.96, 0.04]], [[0.5, 0.04], [0.5, 1]]],
  Ε: [[[0.88, 0.04], [0.12, 0.04], [0.12, 0.96], [0.88, 0.96]], [[0.12, 0.5], [0.7, 0.5]]],
  Ρ: [[[0.15, 1], [0.15, 0.04], ...arc(0.45, 0.28, 0.38, 0.24, -Math.PI / 2, Math.PI / 2, 10), [0.15, 0.52]]],
  Θ: [arc(0.5, 0.5, 0.42, 0.48, -Math.PI / 2, (Math.PI * 3) / 2, 20), [[0.28, 0.5], [0.72, 0.5]]],
  Η: [[[0.12, 0], [0.12, 1]], [[0.88, 0], [0.88, 1]], [[0.12, 0.5], [0.88, 0.5]]],
  Ω: [[[0.06, 1], [0.32, 1], ...arc(0.5, 0.48, 0.38, 0.44, (Math.PI * 2) / 3, (Math.PI * 7) / 3, 18), [0.68, 1], [0.94, 1]]],
  Ν: [[[0.12, 1], [0.12, 0], [0.88, 1], [0.88, 0]]],
  Ι: [[[0.5, 0], [0.5, 1]]],
  Μ: [[[0.08, 1], [0.08, 0], [0.5, 0.6], [0.92, 0], [0.92, 1]]],
};

/**
 * The carved letters (fx_letras_entalhadas, pedidos 4.8): frame of each letter in the strip and the
 * letter's box inside its cell (image px). The carving is stretched over the letter's place on the wall.
 */
const CARVED: Record<string, { frame: number; box: [number, number, number, number] }> = {
  Α: { frame: 0, box: [75, 60, 235, 215] },
  Σ: { frame: 1, box: [74, 65, 204, 215] },
  Τ: { frame: 2, box: [58, 62, 193, 215] },
  Ε: { frame: 3, box: [57, 62, 162, 215] },
  Ρ: { frame: 4, box: [105, 39, 205, 191] },
  Ι: { frame: 5, box: [119, 39, 159, 191] },
  Ο: { frame: 6, box: [53, 39, 198, 191] },
  Ν: { frame: 7, box: [32, 39, 182, 191] },
  Θ: { frame: 8, box: [85, 20, 230, 167] },
  Η: { frame: 9, box: [74, 20, 214, 167] },
  Ω: { frame: 10, box: [48, 20, 208, 167] },
  Μ: { frame: 11, box: [22, 20, 197, 167] },
};

const LETTER_W = 190;
const LETTER_H = 270;
const GAP = 70;
const TOP = 330;
/** Distance (px) at which the finger counts as in the groove. */
const RADIUS = 48;
/** Top speed of the finger (px/s) and how quickly it closes on the pointer (1/s). */
const FINGER_SPEED = 900;
const FINGER_EASE = 9;
/** Seconds a traced groove stays visible before the stone closes it (heal mode). */
const HEAL_DELAY = 0.7;
const MAX_SECONDS = 60;

interface Stroke {
  /** Which letter of the word it belongs to. */
  letter: number;
  points: P[];
  /** Index of the farthest point traced. */
  done: number;
  /** Time each point was traced (for healing). */
  tracedAt: number[];
}

/** Lays out a word centered on the wall; each stroke sampled every ~8 px. */
export function layoutStrokes(letters: string): Stroke[] {
  const chars = [...letters].filter((ch) => GLYPHS[ch]);
  const total = chars.length * LETTER_W + (chars.length - 1) * GAP;
  const x0 = (W - total) / 2;
  const strokes: Stroke[] = [];
  chars.forEach((ch, i) => {
    const ox = x0 + i * (LETTER_W + GAP);
    for (const stroke of GLYPHS[ch]!) {
      const pts: P[] = [];
      for (let k = 1; k < stroke.length; k++) {
        const [ax, ay] = stroke[k - 1]!;
        const [bx, by] = stroke[k]!;
        const a: P = [ox + ax * LETTER_W, TOP + ay * LETTER_H];
        const b: P = [ox + bx * LETTER_W, TOP + by * LETTER_H];
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8));
        for (let j = k === 1 ? 0 : 1; j <= n; j++) pts.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
      }
      strokes.push({ letter: i, points: pts, done: -1, tracedAt: pts.map(() => -1) });
    }
  });
  return strokes;
}

/**
 * Moves the trace forward if the finger is near the next stretch of the groove.
 * Returns true if the finger is in the groove.
 */
export function advanceStroke(stroke: Stroke, finger: P, time: number, radius = RADIUS): boolean {
  const from = Math.max(0, stroke.done);
  let best = -1;
  // Look a little ahead only: the finger has to follow the groove, not jump to its end.
  for (let i = from; i < Math.min(stroke.points.length, from + 9); i++) {
    const [x, y] = stroke.points[i]!;
    if (Math.hypot(x - finger[0], y - finger[1]) <= radius) best = i;
  }
  if (stroke.done < 0) {
    // Not started: the finger must touch the start.
    const [sx, sy] = stroke.points[0]!;
    if (Math.hypot(sx - finger[0], sy - finger[1]) > radius) return false;
    best = Math.max(best, 0);
  }
  if (best > stroke.done) {
    for (let i = stroke.done + 1; i <= best; i++) stroke.tracedAt[i] = time;
    stroke.done = best;
  }
  return best >= 0 || stroke.done >= 0 ? nearGroove(stroke, finger, radius) : false;
}

function nearGroove(stroke: Stroke, finger: P, radius: number): boolean {
  const i = Math.max(0, stroke.done);
  const [x, y] = stroke.points[i]!;
  return Math.hypot(x - finger[0], y - finger[1]) <= radius * 1.6;
}

export const createTrace: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const heal = params.heal === true;
  const word = String(params.letters ?? 'ΑΣΤΕΡ');
  const strokes = layoutStrokes(word);
  const chars = [...word].filter((ch) => GLYPHS[ch]);
  const layoutX0 = (W - (chars.length * LETTER_W + (chars.length - 1) * GAP)) / 2;
  const radius = RADIUS * (ctx.relaxed ? 1.3 : 1);
  const input = ctx.input;
  const finger: P = [W / 2, H - 200];
  let current = 0;
  let elapsed = 0;
  let slip = 0;
  let ending: number | null = null;
  /** The finger is pressed to the stone (left button held). */
  let pressed = false;

  const tutorial = ctx.tutorial
    ? new Tutorial(
        [
          { text: ctx.t('mg.trace.tut1'), done: () => (strokes[0]?.done ?? -1) >= 0 },
          { text: ctx.t('mg.trace.tut2'), done: () => current >= 1 },
          { text: ctx.t('mg.trace.tut3'), done: () => input.consume(ACTION) },
        ],
        tutorialLabels(ctx.t),
      )
    : null;

  return {
    update(dt) {
      elapsed += dt;
      input.mouse.moved = false;
      // The finger only moves while the left button is held (pressed to the stone), and glides
      // toward the pointer: a press far away brings it there gently, it never jumps.
      pressed = input.mouse.down;
      if (pressed) {
        const dx = input.mouse.x - finger[0];
        const dy = input.mouse.y - finger[1];
        const dist = Math.hypot(dx, dy);
        // Eases in on the pointer, but never faster than a hand would move.
        const step = Math.min(dist, Math.max(dist * Math.min(1, dt * FINGER_EASE), 0), FINGER_SPEED * dt);
        if (dist > 0.5) {
          finger[0] = clamp(finger[0] + (dx / dist) * step, 0, W);
          finger[1] = clamp(finger[1] + (dy / dist) * step, 0, H);
        }
      }
      const stroke = strokes[current];
      if (stroke && ending === null && pressed) {
        const inGroove = advanceStroke(stroke, finger, elapsed, radius);
        // Slipping only counts once the stroke has started and isn't finished.
        if (!inGroove && stroke.done >= 0 && !(tutorial?.active)) slip += dt;
        if (stroke.done >= stroke.points.length - 2) {
          stroke.done = stroke.points.length - 1;
          stroke.tracedAt[stroke.done] = elapsed;
          current++;
        }
      }
      if (tutorial?.active) {
        tutorial.update(dt, input.consume(['Enter']));
        input.endFrame();
        return null;
      }
      input.endFrame();
      if (ending === null && (current >= strokes.length || elapsed > MAX_SECONDS)) ending = heal ? 1.8 : 0.9;
      if (ending !== null) {
        ending -= dt;
        if (ending <= 0) return { outcome: heal ? 'healed' : slip < 2.5 ? 'clean' : 'shaky', earned: [] };
      }
      return null;
    },
    draw(c, time) {
      // The wall: the painted one (pedidos-de-arte 2.9), darkened so the grooves stand out;
      // without it, dark stone blocks drawn in code.
      const wall = ctx.image('closeup.wall.letters');
      if (wall) {
        drawImageFit(c, wall, 'cover');
        c.fillStyle = 'rgba(12, 6, 3, 0.45)';
        c.fillRect(0, 0, W, H);
        // The edges fall into engraved shadow.
        if (!hatchVignette(c, 0.95, '#080402', 0.42)) {
          const sides = c.createRadialGradient(W / 2, H / 2, W * 0.22, W / 2, H / 2, W * 0.62);
          sides.addColorStop(0, 'rgba(8, 4, 2, 0)');
          sides.addColorStop(1, 'rgba(8, 4, 2, 0.75)');
          c.fillStyle = sides;
          c.fillRect(0, 0, W, H);
        }
      }
      c.fillStyle = '#21160f';
      if (!wall) c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      c.lineWidth = 4;
      for (let row = 0; row < (wall ? 0 : 7); row++) {
        const y = row * 170 + 40;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
        for (let col = 0; col < 7; col++) {
          const x = col * 300 + (row % 2) * 150;
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x, y + 170);
          c.stroke();
        }
      }

      // The carved letters themselves, stretched over each letter's place (in heal mode they fade as
      // the stone closes over them).
      const carved = ctx.image('fx.letters') ? chars : [];
      carved.forEach((ch, li) => {
        const art = CARVED[ch];
        if (!art) return;
        const [x0, y0, x1, y1] = art.box;
        const sy = LETTER_H / (y1 - y0);
        const sx = Math.min(LETTER_W / (x1 - x0), sy * 1.4);
        const own = strokes.filter((st) => st.letter === li);
        const healed = heal ? own.reduce((n, st) => n + st.tracedAt.filter((t) => t >= 0 && elapsed - t > HEAL_DELAY).length, 0) / Math.max(1, own.reduce((n, st) => n + st.points.length, 0)) : 0;
        const cx = layoutX0 + li * (LETTER_W + GAP) + LETTER_W / 2;
        c.save();
        c.globalAlpha = 0.95 * (1 - healed);
        c.translate(cx, TOP);
        c.scale(sx, sy);
        // Anchor 0,0 of the strip frame is the cell's corner: move so the box's top-center lands here.
        drawFrame(c, 'fx.letters', art.frame, -(x0 + x1) / 2, -y0, 1);
        c.restore();
      });

      c.lineCap = 'round';
      c.lineJoin = 'round';
      strokes.forEach((stroke, si) => {
        // The groove still to trace (in heal mode, traced parts close up).
        c.beginPath();
        stroke.points.forEach(([x, y], i) => {
          const closed = heal && stroke.tracedAt[i]! >= 0 && elapsed - stroke.tracedAt[i]! > HEAL_DELAY;
          if (i === 0 || closed) c.moveTo(x, y);
          else c.lineTo(x, y);
        });
        if (!carved.length) {
          c.strokeStyle = '#0b0604';
          c.lineWidth = 22;
          c.stroke();
        }
        c.strokeStyle = 'rgba(200, 116, 58, 0.35)';
        c.lineWidth = 3;
        c.stroke();
        // What the finger traced: a strand of the sacred thread laid in the groove (in heal mode it
        // fades as the stone closes).
        if (stroke.done > 0) {
          const runs: P[][] = [];
          let run: P[] = [];
          let runAlpha = 1;
          for (let i = 0; i <= stroke.done; i++) {
            const age = elapsed - stroke.tracedAt[i]!;
            const alpha = heal ? clamp(1 - (age - HEAL_DELAY * 0.4) / HEAL_DELAY, 0, 1) : 1;
            if (alpha <= 0) {
              if (run.length > 1) runs.push(run);
              run = [];
              continue;
            }
            runAlpha = Math.min(runAlpha, alpha);
            run.push(stroke.points[i]!);
          }
          if (run.length > 1) runs.push(run);
          for (const r of runs) drawYarn(c, r, { width: 9, alpha: runAlpha, glow: true, fx: { time, state: 'normal', intensity: 0.6 } });
        }
        // Where the current stroke starts: a painted star.
        if (si === current && stroke.done < 0) {
          const [sx, sy] = stroke.points[0]!;
          drawFrame(c, 'fx.signs', SIGN.star, sx, sy, 0.16, { alpha: 0.6 + Math.sin(time * 6) * 0.35, composite: 'lighter', rotation: time * 0.5 });
        }
      });

      // His hand: the painted finger (pedidos-de-arte 2.6), or a code drawing until it loads.
      // Lifted off the stone (button released), the hand rises a little.
      const lift = pressed ? 0 : 16;
      const base: P = [finger[0] + 260, H + 120 - lift];
      // The hand: the scene's own (the boy's), else the man's. `nailArt` (with `nailAnchor`, the
      // nail's point as a fraction of the picture) comes first when it exists: he scratches with the nail.
      const nail = params.nailAnchor as { x: number; y: number } | undefined;
      const hands = [
        ...(typeof params.nailArt === 'string' ? [{ id: params.nailArt, tip: nail }] : []),
        ...(typeof params.fingerArt === 'string' ? [{ id: params.fingerArt, tip: undefined }] : []),
        { id: 'fp.asterion.finger', tip: undefined },
      ];
      // The arm comes from the direction it has in its own picture, so the hand is never turned
      // (it follows the trace without twisting the wrist).
      const handDrawn = hands.some((h) => {
        const dir = limbDirection(h.id);
        const from = dir ? { x: finger[0] + dir.x * 900, y: finger[1] - lift + dir.y * 900 } : { x: base[0], y: base[1] };
        if (!art(h.id)) return false;
        // (The picture ends at the forearm; the whole arm is on order: pedidos-de-arte 8.)
        const handWidth = Number(params.handWidth ?? HAND_WIDTH);
        return drawLimb(c, h.id, from, { x: finger[0], y: finger[1] - lift }, handWidth, false, h.tip);
      });
      if (handDrawn) {
        // The hand hides part of the word: the stretch still to trace in the current stroke is
        // shown over it as a ghost of the thread, with the star where it starts.
        const now = strokes[current];
        if (now && ending === null) {
          const rest = now.points.slice(Math.max(0, now.done));
          if (rest.length > 1) drawYarn(c, rest, { width: 4, alpha: 0.4, fibres: false });
          if (now.done < 0) {
            const [sx, sy] = now.points[0]!;
            drawFrame(c, 'fx.signs', SIGN.star, sx, sy, 0.16, { alpha: 0.6 + Math.sin(time * 6) * 0.35, composite: 'lighter', rotation: time * 0.5 });
          }
        }
        if (tutorial?.active) tutorial.draw(c, time);
        else drawHints(c, ctx.t(String(params.hint ?? 'mg.trace.hint')), ctx.t('mg.trace.controls'));
        return;
      }
      c.save();
      c.lineCap = 'round';
      c.strokeStyle = '#0a0705';
      c.lineWidth = 120;
      c.beginPath();
      c.moveTo(base[0], base[1]);
      c.lineTo(finger[0] + 40, finger[1] + 70);
      c.stroke();
      c.lineWidth = 34;
      c.beginPath();
      c.moveTo(finger[0] + 40, finger[1] + 70);
      c.lineTo(finger[0], finger[1]);
      c.stroke();
      c.strokeStyle = 'rgba(200, 140, 70, 0.6)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(base[0] - 30, base[1] - 60);
      c.lineTo(finger[0] + 30, finger[1] + 90);
      c.stroke();
      c.restore();

      if (tutorial?.active) tutorial.draw(c, time);
      else drawHints(c, ctx.t(String(params.hint ?? 'mg.trace.hint')), ctx.t('mg.trace.controls'));
    },
  };
};
