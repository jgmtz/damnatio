// Pour the oil (Vigília, Rito da Noite): Lívia's arms tilt the amphora to feed the flame in the cup.
// Too little oil and the flame shrinks; too much and it chokes and flares. Keep it inside the
// golden "calm zone" while the wind gusts.
//
// params: { hint?: string key, duration?: seconds (8), difficulty?: 0.5..2 (1), amphoraArt?: art id }
// outcomes: "careful" | "uneven" | "clumsy"

import { drawFlame } from '../flame';
import { drawFrame, loopFrame } from '../fxSprites';
import { drawYarn } from '../yarn';
import { drawArm, drawCup, drawLimb } from './arms';
import { ACTION } from './input';
import { Tutorial } from './tutorial';
import {
  clamp,
  drawHints,
  drawTimeThread,
  lerp,
  tutorialLabels,
  type Minigame,
  type MinigameContext,
  type MinigameFactory,
} from './types';

export interface PourState {
  /** Flame strength (0.6–1.05 = calm). */
  flame: number;
  /** Current amphora tilt, 0 (upright) to 1 (fully poured). */
  tilt: number;
  /** Seconds spent with the flame in the calm band. */
  calm: number;
  elapsed: number;
}

export const POUR_BAND = { min: 0.6, max: 1.05 };

/** Oil flow for a tilt: nothing until the oil reaches the lip, then grows fast. */
export function pourFlow(tilt: number): number {
  return clamp((tilt - 0.25) / 0.75, 0, 1) ** 1.5;
}

/** Wind gusts that push the flame down: smooth, deterministic, stronger with difficulty. */
export function pourGust(time: number, difficulty: number): number {
  const g = Math.max(0, Math.sin(time * 0.9) * Math.sin(time * 2.3 + 1.1));
  return g * 0.55 * difficulty;
}

export function pourBand(relaxed: boolean): { min: number; max: number } {
  return relaxed ? { min: POUR_BAND.min - 0.15, max: POUR_BAND.max + 0.2 } : POUR_BAND;
}

/** One simulation step. `tiltTarget` comes from the player (0..1). */
export function stepPour(
  s: PourState,
  tiltTarget: number,
  dt: number,
  difficulty: number,
  relaxed: boolean,
): PourState {
  const tilt = lerp(s.tilt, clamp(tiltTarget, 0, 1), Math.min(1, dt * 5));
  const feed = pourFlow(tilt) * 2.1;
  const gust = pourGust(s.elapsed, relaxed ? difficulty * 0.4 : difficulty);
  // The flame drifts toward what the oil can sustain, minus the wind.
  const target = feed - gust + 0.15;
  const flame = clamp(s.flame + (target - s.flame) * Math.min(1, dt * 1.4), 0.05, 1.9);
  const band = pourBand(relaxed);
  const calm = s.calm + (flame >= band.min && flame <= band.max ? dt : 0);
  return { flame, tilt, calm, elapsed: s.elapsed + dt };
}

export function pourOutcome(calm: number, duration: number): 'careful' | 'uneven' | 'clumsy' {
  const ratio = calm / duration;
  if (ratio >= 0.6) return 'careful';
  if (ratio >= 0.3) return 'uneven';
  return 'clumsy';
}

const RIM = { x: 1040, y: 640 };
const FLAME_SIZE = 190;
const AMPHORA_PIVOT = { x: 740, y: 380 };
const MAX_ANGLE = 1.35;

/** Flame height on screen for an intensity (matches drawFlame's proportions). */
const flameHeight = (intensity: number) => FLAME_SIZE * 1.5 * intensity;

function rotate(p: { x: number; y: number }, angle: number): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: AMPHORA_PIVOT.x + p.x * cos - p.y * sin, y: AMPHORA_PIVOT.y + p.x * sin + p.y * cos };
}

/** The artwork amphora (props/oleo.png): bounding box center and mouth, in source pixels. */
const AMPHORA_ART = { cx: 701, cy: 383, mouthX: 1338, scale: 0.37 };

/** Amphora lying along +x (mouth to the right), rotated by the tilt. Returns the spout tip. */
function drawAmphora(c: CanvasRenderingContext2D, angle: number, img: HTMLImageElement | null): { x: number; y: number } {
  if (img) {
    const s = AMPHORA_ART.scale;
    c.save();
    c.translate(AMPHORA_PIVOT.x, AMPHORA_PIVOT.y);
    c.rotate(angle);
    c.drawImage(img, -AMPHORA_ART.cx * s, -AMPHORA_ART.cy * s, img.naturalWidth * s, img.naturalHeight * s);
    c.restore();
    return rotate({ x: (AMPHORA_ART.mouthX - AMPHORA_ART.cx) * s, y: 0 }, angle);
  }
  c.save();
  c.translate(AMPHORA_PIVOT.x, AMPHORA_PIVOT.y);
  c.rotate(angle);
  c.lineWidth = 6;
  c.strokeStyle = '#0c0907';
  c.fillStyle = '#c8743a';
  // Handles (behind the body).
  c.lineWidth = 14;
  c.beginPath();
  c.moveTo(105, -34);
  c.quadraticCurveTo(70, -150, -20, -100);
  c.moveTo(105, 34);
  c.quadraticCurveTo(70, 150, -20, 100);
  c.stroke();
  c.strokeStyle = '#c8743a';
  c.lineWidth = 7;
  c.stroke();
  c.strokeStyle = '#0c0907';
  c.lineWidth = 6;
  // Belly.
  c.beginPath();
  c.ellipse(-60, 0, 190, 110, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  // Neck and lip.
  c.beginPath();
  c.rect(100, -34, 70, 68);
  c.fill();
  c.stroke();
  c.beginPath();
  c.rect(166, -46, 16, 92);
  c.fill();
  c.stroke();
  // Black-figure bands on the belly.
  c.fillStyle = '#0c0907';
  c.fillRect(-200, -20, 240, 12);
  c.fillRect(-200, 10, 240, 6);
  c.restore();
  return rotate({ x: 182, y: 0 }, angle);
}

export const createPour: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const duration = Number(params.duration ?? 8);
  const difficulty = Number(params.difficulty ?? 1);
  const band = pourBand(ctx.relaxed);
  const input = ctx.input;
  let s: PourState = { flame: 0.8, tilt: 0, calm: 0, elapsed: 0 };
  let tiltTarget = 0;
  let tutorialCalm = 0;
  let finished = false;

  const tutorial = ctx.tutorial
    ? new Tutorial(
        [
          { text: ctx.t('mg.pour.tut1'), done: () => s.tilt > 0.45 },
          { text: ctx.t('mg.pour.tut2'), done: () => tutorialCalm >= 1.2 },
          { text: ctx.t('mg.pour.tut3'), done: () => input.consume(ACTION) || input.consumeClick() },
        ],
        tutorialLabels(ctx.t),
      )
    : null;

  return {
    update(dt) {
      if (input.mouse.moved) {
        // Mouse higher on screen = amphora tilted further.
        tiltTarget = clamp((900 - input.mouse.y) / 650, 0, 1);
        input.mouse.moved = false;
      }
      tiltTarget = clamp(tiltTarget - input.vertical * dt * 0.9, 0, 1);

      if (tutorial?.active) {
        // Practice: no wind, no clock. The flame still reacts so the player can learn it.
        s = stepPour({ ...s, elapsed: 0 }, tiltTarget, dt, 0, ctx.relaxed);
        if (s.flame >= band.min && s.flame <= band.max) tutorialCalm += dt;
        tutorial.update(dt, input.consume(['Enter']));
        if (!tutorial.active) s = { ...s, calm: 0, elapsed: 0 };
        input.endFrame();
        return null;
      }

      s = stepPour(s, tiltTarget, dt, difficulty, ctx.relaxed);
      input.endFrame();
      if (!finished && s.elapsed >= duration) {
        finished = true;
        return { outcome: pourOutcome(s.calm, duration), earned: [] };
      }
      return null;
    },
    draw(c, time) {
      c.fillStyle = '#0c0907';
      c.fillRect(0, 0, 1920, 1080);

      // The calm zone: two strands of the sacred thread stretched at the right flame heights; they
      // light up while the flame burns between them.
      const yMin = RIM.y - flameHeight(band.min);
      const yMax = RIM.y - flameHeight(band.max);
      const calmNow = s.flame >= band.min && s.flame <= band.max;
      for (const y of [yMin, yMax]) {
        const sag = (x: number) => y + Math.sin((x - RIM.x) * 0.02 + time * 1.5) * 2;
        const pts: [number, number][] = [];
        for (let x = RIM.x - 220; x <= RIM.x + 220; x += 20) pts.push([x, sag(x)]);
        drawYarn(c, pts, { width: 5, alpha: calmNow ? 0.95 : 0.55, glow: calmNow, ...(calmNow ? { fx: { time, state: 'tie' as const, intensity: 0.7 } } : {}) });
      }

      const angle = s.tilt * MAX_ANGLE;
      // Arms behind the amphora's far side are drawn first, then the amphora, then the near arm.
      const img = typeof params.amphoraArt === 'string' ? ctx.image(params.amphoraArt) : null;
      // The painted hands (pedidos 5.4): the left palm carries the belly, the right hand grips the neck.
      const under = rotate({ x: -90, y: 96 }, angle);
      if (!drawLimb(c, 'fp.livia.amphora.base', { x: under.x - 420, y: 1400 }, under, 270, false)) {
        drawArm(c, { x: 380, y: 1180 }, rotate({ x: -80, y: 118 }, angle), { width: 104, scars: 4 });
      }
      const spout = drawAmphora(c, angle, img);
      const neck = rotate({ x: img ? 150 : 120, y: img ? -10 : -20 }, angle);
      if (!drawLimb(c, 'fp.livia.amphora.neck', { x: neck.x + 60, y: 1400 }, neck, 250, false)) {
        drawArm(c, { x: 820, y: 1190 }, rotate({ x: img ? 150 : 120, y: img ? 52 : 42 }, angle), { width: 96, scars: 3 });
      }

      const flow = pourFlow(s.tilt);
      if (flow > 0.01) {
        c.save();
        c.strokeStyle = 'rgba(214, 164, 64, 0.9)';
        c.lineCap = 'round';
        c.lineWidth = 3 + flow * 16;
        c.beginPath();
        c.moveTo(spout.x, spout.y);
        const wob = Math.sin(time * 9) * 6;
        c.quadraticCurveTo(spout.x + 40 + wob, (spout.y + RIM.y) / 2, RIM.x - 30 + wob, RIM.y - 4);
        c.stroke();
        c.restore();
      }
      drawCup(c, RIM, 1);
      drawFlame(c, RIM.x, RIM.y - 2, FLAME_SIZE, s.flame, time, 3, 'cup');

      // Feedback in words, under the cup.
      c.save();
      c.textAlign = 'center';
      c.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
      const label = s.flame < band.min ? ctx.t('mg.pour.more') : s.flame > band.max ? ctx.t('mg.pour.less') : ctx.t('mg.pour.good');
      c.fillStyle = calmNow ? '#ffd36a' : '#e0664a';
      c.fillText(label, RIM.x, RIM.y + 290);
      c.restore();

      // A choking, too-big flame spits smoke.
      if (s.flame > band.max + 0.25) {
        // The painted smoke (pedidos 4.6): curls rising from the flame, flipped like drawn animation.
        const choke = Math.min(0.85, (s.flame - band.max) * 1.1);
        if (!drawFrame(c, 'fx.smoke', loopFrame('fx.smoke', time, 5), RIM.x, RIM.y - flameHeight(s.flame) * 0.7, 0.75, { alpha: choke })) {
          c.save();
          c.globalAlpha = Math.min(0.6, (s.flame - band.max) * 0.8);
          c.fillStyle = '#5a4a40';
          for (let i = 0; i < 4; i++) {
            c.beginPath();
            c.arc(RIM.x + Math.sin(time * 3 + i) * 40, RIM.y - 380 - i * 50 - ((time * 80) % 60), 30 + i * 8, 0, Math.PI * 2);
            c.fill();
          }
          c.restore();
        }
      }

      if (tutorial?.active) {
        tutorial.draw(c, time);
      } else {
        drawHints(c, ctx.t(String(params.hint ?? 'mg.pour.hint')), ctx.t('mg.pour.controls'));
        drawTimeThread(c, 1 - s.elapsed / duration);
      }
    },
  };
};
