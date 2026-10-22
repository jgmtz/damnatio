// Descend in the dark (Rito da Noite → galleries): first person on a narrow stair, only the cup's light.
// W/↑ or click: one step down. S/↓ or right click: one step back (at the top, you leave).
// At the bottom, two eyes reflect the flame, and the player answers with an action:
//   ↑ / click: raise the cup (see him) · ↓ / right click: back away · do nothing: he comes closer.
//
// With art, he is there from the first step: standing at the bottom of the stairs, in the dark doorway.
// Each step moves the view toward him; first only his eyes catch the cup's light, then his shape
// comes out of the dark little by little.
//
// params: {
//   hint?: string key, steps?: number (10),
//   stairsArt?: art id (the stairs seen from the top step),
//   figureArt?: art id (the creature cut out on transparency, head and shoulders)
//   portals?: true    nobody waits below: the stairs end in the chamber of the three portals
//                     (eye, waves, blank); the flame leans toward the blank one
// }
// outcomes: "retreat" (went back up) | "raise" | "still" | "back" | "arrive" (portals)

import { drawFlame } from '../flame';
import { art } from '../artRegistry';
import { drawFrame, SIGN } from '../fxSprites';
import { drawArm, drawCup } from './arms';
import { ACTION } from './input';
import { Tutorial } from './tutorial';
import {
  clamp,
  drawHints,
  drawImageFit,
  fitPoint,
  H,
  tutorialLabels,
  W,
  type Minigame,
  type MinigameContext,
  type MinigameFactory,
} from './types';

export type DescentPhase = 'stairs' | 'encounter' | 'ending';

export interface DescentState {
  phase: DescentPhase;
  step: number;
  /** Smoothly animated position (for drawing). */
  shown: number;
  cooldown: number;
  /** Seconds since the encounter started. */
  waited: number;
  outcome: 'retreat' | 'raise' | 'still' | 'back' | 'arrive' | null;
  /** Seconds left of the ending animation. */
  ending: number;
}

const STEP_COOLDOWN = 0.32;
const WAIT_FOR_STILL = 6;

/** The bottom of the stairs in the stairs picture (its pixels): the dark doorway at the top. */
const DOOR = { left: 606, right: 810, top: 0, floor: 192 };
/** How wide the creature stands at the bottom, in the stairs picture's pixels. */
const FIGURE_WIDTH = 262;
/** His eyes, in the figure picture's pixels. */
const FIGURE_EYES = [
  { x: 590, y: 305 },
  { x: 845, y: 305 },
];
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function stepDescent(
  s: DescentState,
  steps: number,
  /** down/up: held or pressed (stairs); downPress/upPress: new presses only (encounter). */
  input: { down: boolean; up: boolean; downPress: boolean; upPress: boolean },
  dt: number,
  relaxed: boolean,
): DescentState {
  const next = { ...s, cooldown: Math.max(0, s.cooldown - dt) };
  next.shown += (next.step - next.shown) * Math.min(1, dt * 6);
  if (next.phase === 'stairs') {
    if (input.down && next.cooldown === 0) {
      next.step += 1;
      next.cooldown = STEP_COOLDOWN;
      if (next.step >= steps) {
        next.phase = 'encounter';
        next.waited = 0;
      }
    } else if (input.up && next.cooldown === 0) {
      if (next.step === 0) return { ...next, phase: 'ending', outcome: 'retreat', ending: 0.4 };
      next.step -= 1;
      next.cooldown = STEP_COOLDOWN;
    }
  } else if (next.phase === 'encounter') {
    next.waited += dt;
    // "Down" (forward) at the bottom means raising the cup toward him.
    if (input.downPress && next.waited > 0.6) return { ...next, phase: 'ending', outcome: 'raise', ending: 2.2 };
    if (input.upPress && next.waited > 0.6) return { ...next, phase: 'ending', outcome: 'back', ending: 1.2 };
    if (next.waited >= WAIT_FOR_STILL * (relaxed ? 1.5 : 1)) return { ...next, phase: 'ending', outcome: 'still', ending: 2 };
  } else {
    next.ending -= dt;
  }
  return next;
}

function drawStairs(c: CanvasRenderingContext2D, shown: number, steps: number): void {
  const vx = W / 2;
  const vy = 360;
  c.save();
  // Walls and steps converge to the vanishing point; nearer = brighter.
  for (let i = 8; i >= 0; i--) {
    const depth = i + 1 - (shown % 1);
    const remaining = steps - Math.floor(shown) - i;
    if (remaining <= 0) continue;
    const s = 1 / (depth * 0.42 + 0.6);
    const halfW = 700 * s;
    const y = vy + 760 * s;
    const alpha = clamp(1.1 - depth * 0.14, 0, 1);
    c.strokeStyle = `rgba(200, 116, 58, ${alpha})`;
    c.lineWidth = Math.max(1.5, 5 * s);
    c.beginPath();
    c.moveTo(vx - halfW, y);
    c.lineTo(vx + halfW, y);
    c.stroke();
    // Riser
    const s2 = 1 / ((depth + 1) * 0.42 + 0.6);
    c.beginPath();
    c.moveTo(vx - halfW, y);
    c.lineTo(vx - 700 * s2, vy + 760 * s2);
    c.moveTo(vx + halfW, y);
    c.lineTo(vx + 700 * s2, vy + 760 * s2);
    c.stroke();
    // Scratched letters on the walls every few steps.
    if ((Math.floor(shown) + i) % 3 === 1) {
      c.font = `${Math.round(40 * s)}px "Cormorant Garamond", Georgia, serif`;
      c.fillStyle = `rgba(200, 116, 58, ${alpha * 0.6})`;
      c.fillText('ΜΙΝΩ', vx - halfW - 40 * s, y - 260 * s);
      c.fillText('ΑΣΤΕΡ', vx + halfW - 120 * s, y - 320 * s);
    }
  }
  c.restore();
}

const ARRIVE_SECONDS = 3.4;

/** 0..1: how far into the arrival at the portals (0 before). */
function arrived(s: DescentState): number {
  return s.outcome === 'arrive' ? clamp((ARRIVE_SECONDS - s.ending) / 1.6, 0, 1) : 0;
}

/**
 * The chamber of the three portals, drawn into the doorway at the bottom of the stairs:
 * the closed eye (Asterion), the waves (Théron's way to the port), and a blank, smooth one.
 * seen = how much the cup's light reaches; lit = the flame revealing the symbols.
 */
function drawPortals(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seen: number, lit: number, time: number): void {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = '#060302';
  c.fillRect(x, y, w, h);
  const pw = w * 0.26;
  const ph = h * 0.72;
  const floor = y + h;
  [0.2, 0.5, 0.8].forEach((f, i) => {
    const cx = x + w * f;
    const top = floor - ph;
    c.globalAlpha = seen * (0.35 + lit * 0.65);
    c.fillStyle = '#140b07';
    c.strokeStyle = '#c8743a';
    c.lineWidth = Math.max(1, w * 0.012);
    c.beginPath();
    c.moveTo(cx - pw / 2, floor);
    c.lineTo(cx - pw / 2, top + pw / 2);
    c.arc(cx, top + pw / 2, pw / 2, Math.PI, 0);
    c.lineTo(cx + pw / 2, floor);
    c.fill();
    c.stroke();
    // The symbols show as the flame reaches them; the blank one shows nothing at all.
    c.globalAlpha = seen * lit;
    c.strokeStyle = '#f0c46e';
    const sy = top + ph * 0.42;
    const r = pw * 0.26;
    if (i === 0) {
      c.beginPath();
      c.arc(cx, sy, r, 0, Math.PI * 2);
      c.moveTo(cx - r * 1.3, sy);
      c.lineTo(cx + r * 1.3, sy);
      c.stroke();
    } else if (i === 1) {
      for (let k = -1; k <= 1; k++) {
        c.beginPath();
        for (let t = 0; t <= 1; t += 0.05) {
          const px = cx - r * 1.2 + t * r * 2.4;
          const py = sy + k * r * 0.6 + Math.sin(t * Math.PI * 3 + time) * r * 0.18;
          if (t === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.stroke();
      }
    } else {
      // Smooth stone: only a faint warm sheen where the flame leans.
      const g = c.createRadialGradient(cx, sy, 0, cx, sy, pw * 0.6);
      g.addColorStop(0, `rgba(255, 190, 110, ${0.25 + Math.sin(time * 2) * 0.08})`);
      g.addColorStop(1, 'rgba(255, 190, 110, 0)');
      c.fillStyle = g;
      c.fillRect(cx - pw, sy - pw, pw * 2, pw * 2);
    }
  });
  c.restore();
}

/** Two glints reflecting the flame, at the given screen points. */
function drawEyes(c: CanvasRenderingContext2D, time: number, eyes: { x: number; y: number }[], scale: number, alpha: number): void {
  const blink = Math.sin(time * 0.7) > 0.97 ? 0.15 : 1;
  // The painted star, flattened into an eye's gleam (blinking now and then).
  if (art('fx.signs')) {
    for (const eye of eyes) drawFrame(c, 'fx.signs', SIGN.star, eye.x, eye.y, 0.14 * scale, { alpha, stretchY: 0.5 * blink, composite: 'lighter' });
    return;
  }
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = '#ffcf6a';
  c.shadowColor = '#ff9a2a';
  c.shadowBlur = 30;
  for (const eye of eyes) {
    c.beginPath();
    c.ellipse(eye.x, eye.y, 12 * scale, 7 * scale * blink, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** A huge horned head in silhouette, seen for a moment when the cup is raised. */
function drawSilhouette(c: CanvasRenderingContext2D, alpha: number): void {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = '#1c120c';
  c.strokeStyle = '#c8743a';
  c.lineWidth = 4;
  c.beginPath();
  // Head and broken horns (black-figure style, incised in terracotta).
  c.moveTo(W / 2 - 160, 600);
  c.quadraticCurveTo(W / 2 - 190, 380, W / 2 - 90, 320);
  c.quadraticCurveTo(W / 2 - 260, 250, W / 2 - 230, 160); // left horn, broken tip
  c.lineTo(W / 2 - 200, 170);
  c.quadraticCurveTo(W / 2 - 170, 260, W / 2 - 60, 290);
  c.quadraticCurveTo(W / 2, 270, W / 2 + 60, 290);
  c.quadraticCurveTo(W / 2 + 170, 240, W / 2 + 250, 140); // right horn, intact
  c.quadraticCurveTo(W / 2 + 230, 260, W / 2 + 90, 320);
  c.quadraticCurveTo(W / 2 + 190, 380, W / 2 + 160, 600);
  c.quadraticCurveTo(W / 2, 700, W / 2 - 160, 600);
  c.closePath();
  c.fill();
  c.stroke();
  // Chain scars on the neck.
  c.beginPath();
  for (let i = 0; i < 6; i++) c.arc(W / 2 - 120 + i * 48, 640, 16, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

export const createDescent: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const steps = Number(params.steps ?? 10);
  const portals = params.portals === true;
  let s: DescentState = { phase: 'stairs', step: 0, shown: 0, cooldown: 0, waited: 0, outcome: null, ending: 0 };
  const input = ctx.input;
  let wentBack = false;

  // Learn by doing: go down two steps, come back one, then go on alone.
  const tutorial = ctx.tutorial
    ? new Tutorial(
        [
          { text: ctx.t('mg.descent.tut1'), done: () => s.step >= 2 },
          { text: ctx.t('mg.descent.tut2'), done: () => wentBack },
          { text: ctx.t('mg.descent.tut3'), done: () => input.consume(ACTION) },
        ],
        tutorialLabels(ctx.t),
      )
    : null;

  return {
    update(dt) {
      if (tutorial?.active) {
        tutorial.update(dt, input.consume(['Enter']));
        const before = s.step;
        const downPress = input.consumeUp() || input.consumeClick();
        const upPress = tutorial.stepIndex >= 1 && (input.consumeDown() || input.consumeRightClick());
        // During the tutorial you can't leave the stairs (no retreat at the top, no bottom yet).
        if (!(upPress && s.step === 0) && !(downPress && s.step >= steps - 1)) {
          s = stepDescent(s, steps, { down: downPress, up: upPress, downPress, upPress }, dt, ctx.relaxed);
        }
        if (s.step < before) wentBack = true;
        input.endFrame();
        return null;
      }
      const downPress = input.consumeUp() || input.consumeClick();
      const upPress = input.consumeDown() || input.consumeRightClick();
      const down = downPress || input.vertical < 0;
      const up = upPress || input.vertical > 0;
      s = stepDescent(s, steps, { down, up, downPress, upPress }, dt, ctx.relaxed);
      // No one below: the bottom of the stairs is the chamber of the three portals.
      if (portals && s.phase === 'encounter') s = { ...s, phase: 'ending', outcome: 'arrive', ending: ARRIVE_SECONDS };
      input.endFrame();
      if (s.phase === 'ending' && s.ending <= 0 && s.outcome) return { outcome: s.outcome, earned: [] };
      return null;
    },
    draw(c, time) {
      c.fillStyle = '#050302';
      c.fillRect(0, 0, W, H);
      const depth01 = clamp(s.shown / steps, 0, 1);
      const stairsImg = typeof params.stairsArt === 'string' ? ctx.image(params.stairsArt) : null;
      const figureImg = typeof params.figureArt === 'string' ? ctx.image(params.figureArt) : null;
      const encounter = s.phase !== 'stairs' && s.outcome !== 'retreat';
      const fade = s.outcome === 'back' ? clamp(s.ending / 1.2, 0, 1) : 1;
      // How much closer he has come (staying still lets him walk up to her).
      const approach = s.outcome === 'still' ? 1 + (2 - s.ending) * 0.45 : encounter ? 1 + s.waited * 0.025 : 1;
      // How much of him the cup's light reaches: nothing at the top, his shape near the bottom.
      const lit =
        s.outcome === 'raise' ? 0.55 + 0.6 * clamp((2.2 - s.ending) / 0.8, 0, 1) : s.outcome === 'still' ? 0.55 + (2 - s.ending) * 0.12 : 0.08 + 0.47 * smoothstep(0.15, 1, depth01);
      if (stairsImg) {
        // Camera: each step moves toward the doorway at the bottom, which slides to the middle of the view.
        const base = Math.max(W / stairsImg.naturalWidth, H / stairsImg.naturalHeight);
        const door0 = fitPoint(stairsImg, 'cover', (DOOR.left + DOOR.right) / 2, DOOR.floor * 0.55);
        const eased = smoothstep(0, 1, depth01);
        const zoom = 1 + eased * 2.1;
        const door = { x: door0.x + (W / 2 - door0.x) * eased, y: door0.y + (430 - door0.y) * eased };
        const toScreen = (p: { x: number; y: number }) => ({ x: door.x + (p.x - door0.x) * zoom, y: door.y + (p.y - door0.y) * zoom });
        c.save();
        c.translate(door.x, door.y);
        c.scale(zoom, zoom);
        c.translate(-door0.x, -door0.y);
        const w = stairsImg.naturalWidth * base;
        const h = stairsImg.naturalHeight * base;
        c.drawImage(stairsImg, (W - w) / 2, (H - h) / 2, w, h);
        if (portals) {
          const tl = fitPoint(stairsImg, 'cover', DOOR.left, DOOR.top);
          const br = fitPoint(stairsImg, 'cover', DOOR.right, DOOR.floor);
          drawPortals(c, tl.x, tl.y, br.x - tl.x, br.y - tl.y, smoothstep(0.2, 1, depth01), arrived(s), time);
        }
        let eyes: { x: number; y: number }[] = [];
        let eyeScale = 1;
        if (figureImg) {
          // He stands at the bottom of the stairs, seen through the doorway (he comes out of it if he approaches).
          const floor = fitPoint(stairsImg, 'cover', (DOOR.left + DOOR.right) / 2, DOOR.floor);
          const fw = FIGURE_WIDTH * base * approach;
          const fh = (fw * figureImg.naturalHeight) / figureImg.naturalWidth;
          const fx = floor.x - fw / 2;
          const fy = floor.y - fh * 0.94;
          const tl = fitPoint(stairsImg, 'cover', DOOR.left, DOOR.top);
          const br = fitPoint(stairsImg, 'cover', DOOR.right, DOOR.floor + 6);
          c.save();
          if (approach < 1.15) {
            c.beginPath();
            c.rect(tl.x, tl.y - 400, br.x - tl.x, br.y - tl.y + 400);
            c.clip();
          }
          c.globalAlpha = fade * clamp(lit * 1.6, 0, 1);
          c.filter = `brightness(${(0.35 + lit * 0.75).toFixed(2)})`;
          c.drawImage(figureImg, fx, fy, fw, fh);
          c.restore();
          eyes = FIGURE_EYES.map((e) => toScreen({ x: fx + (e.x / figureImg.naturalWidth) * fw, y: fy + (e.y / figureImg.naturalHeight) * fh }));
          eyeScale = (zoom * fw) / 900;
        }
        c.restore();
        // The dark: thicker away from the cup, which lights the near steps.
        c.fillStyle = `rgba(4, 2, 1, ${0.3 + depth01 * 0.3})`;
        c.fillRect(0, 0, W, H);
        // His eyes catch the flame long before the rest of him shows.
        const eyesAlpha = fade * smoothstep(0.05, 0.35, depth01) * (s.outcome === 'raise' ? 1 - clamp((2.2 - s.ending) / 0.8, 0, 1) : 1);
        if (eyes.length && eyesAlpha > 0) drawEyes(c, time, eyes, Math.max(0.4, eyeScale), eyesAlpha);
      } else {
        drawStairs(c, s.shown, steps);
        if (encounter) {
          if (s.outcome === 'raise') drawSilhouette(c, clamp((2.2 - s.ending) / 0.8, 0, 1) * 0.95);
          drawEyes(c, time, [{ x: W / 2 - 38 * approach, y: 380 }, { x: W / 2 + 38 * approach, y: 380 }], approach, fade);
        }
      }
      // Arriving at the portals: the painted chamber (pedidos-de-arte 4.3 B) fades in over the stairs.
      const chamber = portals ? ctx.image('closeup.portals.stairs') : null;
      if (chamber && arrived(s) > 0) {
        c.save();
        c.globalAlpha = arrived(s);
        drawImageFit(c, chamber, 'cover');
        c.fillStyle = 'rgba(4, 2, 1, 0.35)';
        c.fillRect(0, 0, W, H);
        c.restore();
      }
      // Light of the cup: the flame trembles more the deeper she goes.
      const light = c.createRadialGradient(W / 2, H - 140, 0, W / 2, H - 140, 700);
      light.addColorStop(0, 'rgba(255, 170, 70, 0.18)');
      light.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = light;
      c.fillRect(0, 0, W, H);
      // Both hands hold the cup in front; raising it lifts the arms toward him.
      const raised = s.outcome === 'raise' ? clamp((2.2 - s.ending) / 0.6, 0, 1) : 0;
      const bob = s.phase === 'stairs' ? Math.abs(Math.sin(s.shown * Math.PI)) * 14 : 0;
      const rim = { x: W / 2, y: H - 230 - raised * 260 + bob };
      // Left hand: a fist clutching the robe (pedidos 5.3); right hand: the cup.
      drawArm(c, { x: W / 2 - 520, y: H + 160 }, { x: rim.x - 300, y: rim.y + 330 }, { width: 112, scars: 4, limb: 'fp.livia.fist' });
      // The right hand holds the cup by its stem (drawn over the hand, so the long-sleeved hand's
      // fingers don't hide it).
      drawArm(c, { x: rim.x + 260, y: H + 260 }, { x: rim.x + 8, y: rim.y + 130 }, { width: 112, scars: 3 });
      drawCup(c, rim, 0.5);
      // At the portals, the flame leans toward the blank one and stays leaning.
      c.save();
      c.translate(rim.x, rim.y);
      c.rotate(0.38 * arrived(s));
      drawFlame(c, 0, 0, 120, 1 + depth01 * 0.4 + Math.sin(time * 13) * depth01 * 0.15, time, 9, 'cup');
      c.restore();
      if (tutorial?.active) {
        tutorial.draw(c, time);
      } else if (s.phase === 'stairs') {
        drawHints(c, ctx.t(String(params.hint ?? 'mg.descent.hint')), ctx.t('mg.descent.controls'));
      } else if (s.phase === 'encounter') {
        drawHints(c, ctx.t('mg.descent.encounter'), ctx.t('mg.descent.encounterControls'));
      }
    },
  };
};
