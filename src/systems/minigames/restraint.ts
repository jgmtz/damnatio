// Hold the beast back (Asterion): first person, his enormous hands trembling. A ring of breath grows
// (breathe in) and shrinks (let go). Hold Space / the mouse button while it grows, release while it
// shrinks; breathing against the ring, or surges of rage, fill the fury. There is no failure: holding
// on, barely holding on, or losing control only change what happens next.
//
// params: { hint?: string key, seconds?: number (14), strength?: number (1, how hard the beast pulls) }
// The beast pulls harder with Asterion's current `fera` (MinigameContext.fera).
// outcomes: "held" | "strained" | "lost"

import { drawFrame, SIGN, SIGN_RING_RADIUS } from '../fxSprites';
import { hatchVignette } from '../hatch';
import { drawYarn } from '../yarn';
import { drawLimb } from './arms';
import { ACTION } from './input';
import { Tutorial } from './tutorial';
import { clamp, drawHints, H, prng, tutorialLabels, W, type Minigame, type MinigameContext, type MinigameFactory } from './types';

const CENTER = { x: W / 2, y: 470 };

export interface RestraintState {
  fury: number;
  maxFury: number;
  elapsed: number;
  /** Seconds until the next surge of rage. */
  nextSurge: number;
}

/** Breath phase at `t`: 0..1, the first half grows (breathe in), the second shrinks (let go). */
export function breathPhase(t: number, period: number): number {
  return (t % period) / period;
}

/** One step of the fury: breathing with the ring calms it, against it feeds it, surges spike it. */
export function stepFury(s: RestraintState, holding: boolean, dt: number, period: number, pull: number, surge: number): RestraintState {
  const inhale = breathPhase(s.elapsed, period) < 0.5;
  let change: number;
  if (inhale) change = holding ? -0.32 : 0.1;
  else change = holding ? 0.22 : -0.06;
  const fury = clamp(s.fury + (change + 0.04 * pull) * dt + surge, 0, 1);
  return { ...s, fury, maxFury: Math.max(s.maxFury, fury), elapsed: s.elapsed + dt };
}

export function restraintOutcome(maxFury: number): 'held' | 'strained' | 'lost' {
  if (maxFury >= 1) return 'lost';
  return maxFury < 0.7 ? 'held' : 'strained';
}


export const createRestraint: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const seconds = Number(params.seconds ?? 14) * (ctx.relaxed ? 0.8 : 1);
  const period = ctx.relaxed ? 4 : 3.2;
  const pull = Number(params.strength ?? 1) * (1 + ctx.fera * 0.25) * (ctx.relaxed ? 0.6 : 1);
  const random = prng(77);
  const input = ctx.input;
  let s: RestraintState = { fury: 0.25, maxFury: 0.25, elapsed: 0, nextSurge: 2 };
  let ending: number | null = null;
  let flash = 0;
  let heldInhale = 0;
  let releasedExhale = 0;
  // The beast's words, separated by | in the strings file.
  const words = ctx.t('mg.restraint.words').split('|');

  const tutorial = ctx.tutorial
    ? new Tutorial(
        [
          { text: ctx.t('mg.restraint.tut1'), done: () => heldInhale > 1 },
          { text: ctx.t('mg.restraint.tut2'), done: () => releasedExhale > 1 },
          { text: ctx.t('mg.restraint.tut3'), done: () => input.consume(['Enter']) },
        ],
        tutorialLabels(ctx.t),
      )
    : null;

  const holding = () => input.held.has(' ') || input.mouse.down || input.vertical < 0;

  return {
    update(dt) {
      const hold = holding();
      if (tutorial?.active) {
        // Practice: breathing only, no surges, and the fury can't run away.
        const inhale = breathPhase(s.elapsed, period) < 0.5;
        if (inhale && hold) heldInhale += dt;
        if (!inhale && !hold && heldInhale > 1) releasedExhale += dt;
        s = { ...stepFury(s, hold, dt, period, 0, 0), maxFury: 0.25, fury: clamp(s.fury, 0.1, 0.6) };
        tutorial.update(dt, input.consume(['Enter']));
        if (!tutorial.active) s = { fury: 0.25, maxFury: 0.25, elapsed: 0, nextSurge: 2 };
        input.endFrame();
        return null;
      }
      input.consume(ACTION);
      input.endFrame();
      if (ending !== null) {
        ending -= dt;
        return ending <= 0 ? { outcome: restraintOutcome(s.maxFury), earned: [] } : null;
      }
      // Surges of rage, more often and harder with the beast awake.
      let surge = 0;
      s.nextSurge -= dt;
      if (s.nextSurge <= 0) {
        surge = (0.1 + random() * 0.08) * pull;
        s.nextSurge = (2.6 - Math.min(1.4, pull * 0.4)) + random();
        flash = 1;
      }
      flash = Math.max(0, flash - dt * 2.5);
      s = stepFury(s, hold, dt, period, pull, surge);
      if (s.fury >= 1) ending = 1.4; // lost control
      else if (s.elapsed >= seconds) ending = 0.6;
      return null;
    },
    draw(c, time) {
      const fury = s.fury;
      const lost = ending !== null && s.maxFury >= 1;
      let paintedRing = false;
      c.fillStyle = '#0d0605';
      c.fillRect(0, 0, W, H);
      // The red closes in with the fury, engraved in red ink from the edges.
      if (!hatchVignette(c, Math.min(1, 0.35 + fury * 0.65 + flash * 0.2), '#a3200e', 0.62 - fury * 0.35)) {
        const g = c.createRadialGradient(CENTER.x, CENTER.y, 120, CENTER.x, CENTER.y, 1100);
        g.addColorStop(0, 'rgba(60, 10, 6, 0)');
        g.addColorStop(1, `rgba(150, 20, 10, ${0.25 + fury * 0.6 + flash * 0.2})`);
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }

      // The ring of breath: the painted brush ring, swelling and shrinking.
      {
        const ph = breathPhase(s.elapsed, period);
        const inh = ph < 0.5;
        const sz = inh ? ph * 2 : 2 - ph * 2;
        if (drawFrame(c, 'fx.signs', SIGN.ring, CENTER.x, CENTER.y, (70 + sz * 170) / SIGN_RING_RADIUS, { alpha: inh ? 0.95 : 0.5, rotation: s.elapsed * 0.4 })) {
          c.save();
          c.fillStyle = 'rgba(240, 205, 120, 0.85)';
          c.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
          c.textAlign = 'center';
          c.fillText(ctx.t(inh ? 'mg.restraint.in' : 'mg.restraint.out'), CENTER.x, CENTER.y + 12);
          c.restore();
          paintedRing = true;
        }
      }

      // The ring of breath.
      const phase = breathPhase(s.elapsed, period);
      const inhale = phase < 0.5;
      const size = inhale ? phase * 2 : 2 - phase * 2;
      const r = 70 + size * 170;
      if (!paintedRing) {
      c.save();
      c.strokeStyle = inhale ? 'rgba(240, 205, 120, 0.9)' : 'rgba(240, 205, 120, 0.45)';
      c.lineWidth = 6;
      c.setLineDash(inhale ? [] : [14, 12]);
      c.beginPath();
      c.arc(CENTER.x, CENTER.y, r, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = 'rgba(240, 205, 120, 0.85)';
      c.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
      c.textAlign = 'center';
      c.fillText(ctx.t(inhale ? 'mg.restraint.in' : 'mg.restraint.out'), CENTER.x, CENTER.y + 12);
      c.restore();
      }

      // His hands, trembling with the fury: huge black-figure hands with chain scars at the wrists.
      const shake = (fury * 14 + flash * 10) * (lost ? 2 : 1);
      for (const side of [-1, 1]) {
        const jx = Math.sin(time * 37 + side) * shake;
        const jy = Math.cos(time * 31 + side * 2) * shake;
        const hx = CENTER.x + side * (420 - fury * 80) + jx;
        const hy = H - 230 + jy;
        // The painted hand (pedidos-de-arte 2.7), tilting inward as the fury grows.
        const from = { x: hx + side * (160 + fury * 120), y: H + 420 };
        if (drawLimb(c, 'fp.asterion.tense', from, { x: hx, y: hy - 60 }, 330, side < 0)) continue;
        c.save();
        c.translate(hx, hy);
        c.scale(side, 1);
        c.fillStyle = '#080504';
        c.strokeStyle = 'rgba(205, 140, 70, 0.7)';
        c.lineWidth = 3;
        // Forearm.
        c.beginPath();
        c.moveTo(-90, 360);
        c.lineTo(-120, 60);
        c.lineTo(120, 40);
        c.lineTo(150, 360);
        c.closePath();
        c.fill();
        // Palm and fingers, half clenched (more clenched with the fury).
        c.beginPath();
        c.ellipse(0, 0, 150, 120, 0, 0, Math.PI * 2);
        c.fill();
        const curl = 40 + fury * 60;
        for (let f = 0; f < 4; f++) {
          const fx = -105 + f * 70;
          c.beginPath();
          c.ellipse(fx, -110 + curl * 0.4, 30, 75 - curl * 0.35, 0, 0, Math.PI * 2);
          c.fill();
          c.beginPath();
          c.moveTo(fx - 12, -150 + curl * 0.6);
          c.lineTo(fx + 12, -150 + curl * 0.6);
          c.stroke();
        }
        // Chain scars around the wrist.
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.ellipse(15, 150 + k * 22, 130, 14, 0.05, 0, Math.PI);
          c.stroke();
        }
        c.restore();
      }

      // The beast's words flicker when the fury is high.
      if (fury > 0.55 || flash > 0.5) {
        c.save();
        c.textAlign = 'center';
        c.font = '600 64px Cinzel, Georgia, serif';
        c.fillStyle = `rgba(210, 60, 35, ${clamp((fury - 0.45) * 2 + flash * 0.6, 0, 1)})`;
        const word = words[Math.floor(time * 2.5) % words.length]!;
        c.fillText(word, CENTER.x + Math.sin(time * 9) * 300, 200 + Math.cos(time * 7) * 40);
        c.restore();
      }

      // The fury: the sacred thread at the bottom, growing as the beast pulls; it frays (cut light)
      // when it is about to snap.
      if (fury > 0.01) {
        const tremble = fury > 0.75 ? Math.sin(time * 40) * 2 : 0;
        drawYarn(c, [[W / 2 - 450, H - 124 + tremble], [W / 2 - 450 + 900 * fury, H - 124 - tremble]], {
          width: 9,
          glow: true,
          fx: { time, state: fury > 0.75 ? 'cut' : 'tangle', intensity: 0.8 },
        });
      }

      if (tutorial?.active) tutorial.draw(c, time);
      else drawHints(c, ctx.t(String(params.hint ?? 'mg.restraint.hint')), ctx.t('mg.restraint.controls'));
    },
  };
};
