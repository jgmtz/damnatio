// Chama da Verdade (GDD 4.2): move the flame over a dark surface; holding the light over a hidden
// mark for a moment makes it burn into gold. What the player finds becomes the consequence.
// The price is on screen: cracks grow from the edges while the gift is active (faith corroding).
//
// params: {
//   surface: "stone" | "book" | "cloak",   (procedural fallback)
//   surfaceArt?: art id of the surface image, fit?: "cover" | "contain",
//   hint?: string key,
//   targets: [{ id, x, y, r?, glyph?: "eye"|"key"|"coin"|"text", label: string key, effects?: Effect[] }],
//   limit?: seconds (25),
//   guided?: boolean        // involuntary use: the flame pulls itself toward the first mark
//   suspicionAfter?: seconds, suspicionEffects?: Effect[]   // someone is watching
// }
// outcomes: "all" | "some" | "none" (the host falls back to the first outcome if one is missing)

import type { Effect } from '../../engine/types';
import { drawFlame } from '../flame';
import {
  clamp,
  drawHints,
  drawLabel,
  drawTimeThread,
  H,
  drawImageFit,
  prng,
  tutorialLabels,
  W,
  type Minigame,
  type MinigameContext,
  type MinigameFactory,
} from './types';
import { art } from '../artRegistry';
import { drawFrame, SIGN, SIGN_RING_RADIUS } from '../fxSprites';
import { engraveDarkness } from '../hatch';
import { drawArm, drawCup } from './arms';
import { ACTION } from './input';
import { Tutorial } from './tutorial';

interface Target {
  id: string;
  x: number;
  y: number;
  r?: number;
  glyph?: 'eye' | 'key' | 'coin' | 'text';
  label: string;
  effects?: Effect[];
}

/** Seconds the light must stay on a mark to reveal it. */
export const REVEAL_TIME = 1.0;
const LIGHT_RADIUS = 210;
/** After the search, the revealed lines stay at least this long before a key can close the scene. */
const READ_MIN = 1.5;
const LIGHT_SPEED = 620;

/** Progress of each mark after `dt` with the light at (lx, ly). Returns ids that were just revealed. */
export function stepReveal(
  targets: { x: number; y: number; r?: number }[],
  progress: number[],
  lx: number,
  ly: number,
  dt: number,
): number[] {
  const revealedNow: number[] = [];
  targets.forEach((t, i) => {
    if (progress[i]! >= 1) return;
    const near = Math.hypot(t.x - lx, t.y - ly) <= (t.r ?? 90);
    // Progress fades slowly when the light leaves, so sweeping fast doesn't count.
    progress[i] = clamp(progress[i]! + (near ? dt / REVEAL_TIME : -dt * 0.4), 0, 1);
    if (progress[i]! >= 1) revealedNow.push(i);
  });
  return revealedNow;
}

export function revealOutcome(found: number, total: number): 'all' | 'some' | 'none' {
  if (found === 0) return 'none';
  return found === total ? 'all' : 'some';
}

function drawSurface(c: CanvasRenderingContext2D, surface: string, rand: () => number): void {
  if (surface === 'book') {
    c.fillStyle = '#b89a66';
    c.fillRect(260, 120, 1400, 860);
    // Faded script lines.
    c.strokeStyle = 'rgba(60, 40, 20, 0.35)';
    c.lineWidth = 3;
    for (let y = 200; y < 940; y += 46) {
      c.beginPath();
      let x = 320;
      c.moveTo(x, y);
      while (x < 1600) {
        x += 20 + rand() * 30;
        c.lineTo(x, y + (rand() - 0.5) * 8);
      }
      c.stroke();
    }
    // Burned edges.
    const burn = c.createRadialGradient(960, 540, 300, 960, 540, 900);
    burn.addColorStop(0, 'rgba(20, 10, 4, 0)');
    burn.addColorStop(1, 'rgba(20, 10, 4, 0.95)');
    c.fillStyle = burn;
    c.fillRect(260, 120, 1400, 860);
  } else if (surface === 'cloak') {
    c.fillStyle = '#5c3a22';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(20, 10, 5, 0.6)';
    c.lineWidth = 6;
    for (let x = 80; x < W; x += 110 + rand() * 60) {
      c.beginPath();
      c.moveTo(x, 0);
      c.bezierCurveTo(x + 60, 300, x - 60, 700, x + 30, H);
      c.stroke();
    }
  } else {
    // Stone: blocks with mortar lines and engraving-like hatching.
    c.fillStyle = '#6b4a34';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(25, 14, 8, 0.7)';
    c.lineWidth = 5;
    for (let row = 0, y = 0; y < H; row++, y += 180) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
      for (let x = row % 2 ? 0 : 160; x < W; x += 320) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + 180);
        c.stroke();
      }
    }
    c.strokeStyle = 'rgba(25, 14, 8, 0.25)';
    c.lineWidth = 2;
    for (let i = 0; i < 400; i++) {
      const x = rand() * W;
      const y = rand() * H;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 14, y + 8);
      c.stroke();
    }
  }
}

function drawGlyph(c: CanvasRenderingContext2D, t: Target, glow: number, label: string): void {
  c.save();
  c.globalAlpha = glow;
  c.strokeStyle = '#ffd36a';
  c.fillStyle = '#ffd36a';
  c.shadowColor = '#ff9a2a';
  c.shadowBlur = 24 * glow;
  c.lineWidth = 6;
  const { x, y } = t;
  const painted = { eye: 0, key: 1, coin: 2 }[t.glyph as 'eye' | 'key' | 'coin'];
  if (painted !== undefined && drawFrame(c, 'fx.marks', painted, x, y, 0.62, { alpha: glow })) {
    // The painted mark, with its own light added on top as it comes through.
    drawFrame(c, 'fx.marks', painted, x, y, 0.66, { alpha: glow * 0.5, composite: 'lighter' });
  } else switch (t.glyph ?? 'text') {
    case 'eye':
      c.beginPath();
      c.arc(x, y, 70, 0, Math.PI * 2);
      c.moveTo(x - 70, y);
      c.lineTo(x + 70, y);
      c.stroke();
      break;
    case 'key':
      c.beginPath();
      c.arc(x - 50, y, 26, 0, Math.PI * 2);
      c.moveTo(x - 24, y);
      c.lineTo(x + 70, y);
      c.moveTo(x + 50, y);
      c.lineTo(x + 50, y + 26);
      c.moveTo(x + 70, y);
      c.lineTo(x + 70, y + 20);
      c.stroke();
      break;
    case 'coin':
      c.beginPath();
      c.arc(x, y, 36, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(x, y, 20, 0, Math.PI * 2);
      c.stroke();
      break;
    default:
      break;
  }
  // Label: for "text" it is the mark itself; otherwise a caption under the glyph.
  const isText = (t.glyph ?? 'text') === 'text';
  c.textAlign = 'center';
  c.font = isText ? 'italic 44px "Cormorant Garamond", Georgia, serif' : 'italic 30px "Cormorant Garamond", Georgia, serif';
  wrap(c, label, x, isText ? y : y + 120, isText ? 700 : 520, isText ? 52 : 38);
  c.restore();
}

function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > maxWidth && line) {
      c.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) c.fillText(line, x, yy);
}

/** Cracks grow from the corners while the gift is used: the price, made visible. */
function drawCracks(c: CanvasRenderingContext2D, amount: number, seed: number): void {
  // The painted cracks (pedidos 4.9), uncovered from the edges inward as the price grows.
  const painted = art('fx.cracks');
  if (painted) {
    if (amount <= 0.01) return;
    const reach = 1.25 - amount * 0.95;
    c.save();
    c.beginPath();
    c.rect(0, 0, W, H);
    c.ellipse(W / 2, H / 2, (W / 2) * reach, (H / 2) * reach, 0, 0, Math.PI * 2);
    c.clip('evenodd');
    c.globalAlpha = Math.min(1, amount * 2.5) * 0.85;
    c.drawImage(painted, 0, 0, W, H);
    c.restore();
    return;
  }
  const rand = prng(seed);
  c.save();
  c.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  c.lineWidth = 3;
  const starts = [
    [0, 0],
    [W, 0],
    [0, H],
    [W, H],
    [W / 2, 0],
    [0, H / 2],
  ];
  for (const [sx, sy] of starts) {
    let x = sx!;
    let y = sy!;
    const steps = Math.floor(amount * 16);
    c.beginPath();
    c.moveTo(x, y);
    for (let i = 0; i < steps; i++) {
      x += (W / 2 - sx!) * 0.035 + (rand() - 0.5) * 60;
      y += (H / 2 - sy!) * 0.035 + (rand() - 0.5) * 60;
      c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
}

export const createReveal: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const targets = (params.targets ?? []) as Target[];
  const surface = String(params.surface ?? 'stone');
  const limit = Number(params.limit ?? 25) * (ctx.relaxed ? 1.6 : 1);
  const guided = Boolean(params.guided);
  const suspicionAfter = params.suspicionAfter === undefined ? null : Number(params.suspicionAfter);
  const suspicionEffects = (params.suspicionEffects ?? []) as Effect[];
  const progress = targets.map(() => 0);
  const light = { x: W / 2, y: H * 0.62 };
  const input = ctx.input;
  let elapsed = 0;
  let finishIn: number | null = null;
  /** Seconds since the reading pause began (null = still searching). */
  let reading: number | null = null;
  let moved = 0;
  let last = { ...light };

  const tutorial =
    ctx.tutorial && !guided
      ? new Tutorial(
          [
            { text: ctx.t('mg.reveal.tut1'), done: () => moved > 350 },
            { text: ctx.t('mg.reveal.tut2'), done: () => progress.some((p) => p >= 1) },
            { text: ctx.t('mg.reveal.tut3'), done: () => input.consume(ACTION) || input.consumeClick() },
          ],
          tutorialLabels(ctx.t),
        )
      : null;

  /** 0..1: how close the light is to the nearest hidden mark (for the tremor cue). */
  const nearness = () => {
    let best = 0;
    targets.forEach((t, i) => {
      if (progress[i]! >= 1) return;
      const d = Math.hypot(t.x - light.x, t.y - light.y);
      best = Math.max(best, clamp(1 - d / ((t.r ?? 90) * 3), 0, 1));
    });
    return best;
  };

  // The surface is static: draw it once (procedural first, the artwork as soon as it has loaded).
  const surfaceCanvas = document.createElement('canvas');
  surfaceCanvas.width = W;
  surfaceCanvas.height = H;
  const surfaceCtx = surfaceCanvas.getContext('2d')!;
  drawSurface(surfaceCtx, surface, prng(7));
  const surfaceArt = typeof params.surfaceArt === 'string' ? params.surfaceArt : null;
  const surfaceFit = params.fit === 'contain' ? 'contain' : 'cover';
  let artDrawn = false;
  const ensureArt = () => {
    if (artDrawn || !surfaceArt) return;
    const img = ctx.image(surfaceArt);
    if (!img) return;
    surfaceCtx.fillStyle = '#050302';
    surfaceCtx.fillRect(0, 0, W, H);
    drawImageFit(surfaceCtx, img, surfaceFit);
    artDrawn = true;
  };
  const dark = document.createElement('canvas');
  dark.width = W;
  dark.height = H;
  const darkCtx = dark.getContext('2d')!;

  const result = () => {
    const found = progress.filter((p) => p >= 1).length;
    const earned: Effect[] = targets.flatMap((t, i) => (progress[i]! >= 1 ? (t.effects ?? []) : []));
    if (suspicionAfter !== null && elapsed > suspicionAfter) earned.push(...suspicionEffects);
    return { outcome: revealOutcome(found, targets.length), earned };
  };

  return {
    update(dt) {
      if (input.mouse.moved) {
        light.x = input.mouse.x;
        light.y = input.mouse.y;
      }
      light.x = clamp(light.x + input.horizontal * LIGHT_SPEED * dt, 0, W);
      light.y = clamp(light.y + input.vertical * LIGHT_SPEED * dt, 0, H);
      moved += Math.hypot(light.x - last.x, light.y - last.y);
      last = { ...light };

      if (tutorial?.active) {
        // Practice: the clock, the price and the watcher wait until the tutorial is over.
        stepReveal(targets, progress, light.x, light.y, dt);
        tutorial.update(dt, input.consume(['Enter']));
        input.mouse.moved = false;
        input.endFrame();
        return null;
      }
      elapsed += dt;
      if (guided) {
        // The flame pulls itself toward the first hidden mark.
        const next = targets.find((_, i) => progress[i]! < 1);
        if (next) {
          light.x += (next.x - light.x) * Math.min(1, dt * 1.2);
          light.y += (next.y - light.y) * Math.min(1, dt * 1.2);
        }
      }
      stepReveal(targets, progress, light.x, light.y, dt);
      input.mouse.moved = false;

      // Reading: once the search is over, what was revealed stays on screen, lit, until the player
      // has read it and asks to go on (the lines used to vanish 1.6 s after the last mark).
      if (reading !== null) {
        reading += dt;
        const next = reading > READ_MIN && (input.consume(ACTION) || input.consumeClick() || input.consumeRightClick());
        input.endFrame();
        return next ? result() : null;
      }
      const allFound = progress.every((p) => p >= 1);
      const stop = !guided && elapsed > 1 && (input.consume(ACTION) || input.consumeRightClick());
      input.endFrame();
      if (finishIn === null && (allFound || stop || elapsed >= limit)) finishIn = allFound ? 0.8 : 0.2;
      if (finishIn !== null) {
        finishIn -= dt;
        if (finishIn <= 0) {
          if (progress.some((p) => p >= 1)) reading = 0;
          else return result();
        }
      }
      return null;
    },
    draw(c, time) {
      ensureArt();
      c.drawImage(surfaceCanvas, 0, 0);
      // Marks being revealed (under the darkness, so they glow inside the light).
      targets.forEach((t, i) => {
        if (progress[i]! > 0) drawGlyph(c, t, progress[i]!, ctx.t(t.label));
      });
      // Darkness with a hole of light around the flame.
      darkCtx.globalCompositeOperation = 'source-over';
      darkCtx.clearRect(0, 0, W, H);
      // While reading, the dark lifts a little so every revealed line can be read in place.
      const lifted = reading === null ? 0 : Math.min(1, reading / 0.8);
      darkCtx.fillStyle = `rgba(5, 3, 2, ${0.94 - 0.3 * lifted})`;
      darkCtx.fillRect(0, 0, W, H);
      darkCtx.globalCompositeOperation = 'destination-out';
      // Near something hidden, the light trembles harder: the cue to stop and hold.
      const near = nearness();
      const flicker = 1 + Math.sin(time * (11 + near * 25)) * (0.03 + near * 0.09);
      const hole = darkCtx.createRadialGradient(light.x, light.y, 0, light.x, light.y, LIGHT_RADIUS * flicker);
      hole.addColorStop(0, 'rgba(0,0,0,1)');
      hole.addColorStop(0.6, 'rgba(0,0,0,0.85)');
      hole.addColorStop(1, 'rgba(0,0,0,0)');
      darkCtx.fillStyle = hole;
      darkCtx.fillRect(0, 0, W, H);
      // The edge of the light is engraved: hatching where the dark begins.
      engraveDarkness(darkCtx, 'medium', 0.5);
      c.drawImage(dark, 0, 0);
      // Revealed marks keep glowing through the dark.
      targets.forEach((t, i) => {
        if (progress[i]! >= 1) drawGlyph(c, t, 0.85, ctx.t(t.label));
      });
      // Progress ring while a mark is being revealed.
      const current = Math.max(0, ...progress.filter((p) => p < 1));
      if (current > 0.02 && art('fx.signs')) {
        // The painted brush ring, uncovered like a clock hand as the mark comes through.
        c.save();
        c.beginPath();
        c.moveTo(light.x, light.y);
        c.arc(light.x, light.y, 200, -Math.PI / 2, -Math.PI / 2 + current * Math.PI * 2);
        c.closePath();
        c.clip();
        drawFrame(c, 'fx.signs', SIGN.ring, light.x, light.y, 120 / SIGN_RING_RADIUS, { composite: 'lighter' });
        c.restore();
      } else if (current > 0.02) {
        c.save();
        c.strokeStyle = '#ffd36a';
        c.lineWidth = 6;
        c.shadowColor = '#ff9a2a';
        c.shadowBlur = 12;
        c.beginPath();
        c.arc(light.x, light.y, 120, -Math.PI / 2, -Math.PI / 2 + current * Math.PI * 2);
        c.stroke();
        c.restore();
      }
      // Lívia's hand holding the cup up to the surface.
      const rim = { x: light.x, y: light.y + 44 };
      drawArm(c, { x: light.x + 430, y: H + 140 }, { x: rim.x + 26, y: rim.y + 72 }, { width: 110, scars: 4 });
      drawCup(c, rim, 0.34);
      drawFlame(c, rim.x, rim.y, 72, 1.3 + near * 0.4, time, 5, 'cup');
      drawCracks(c, clamp(elapsed / limit, 0, 1), 11);
      // While reading, what was found is repeated on dark bands above everything: in place, the
      // hand and the cup could cover part of it.
      if (reading !== null) {
        c.save();
        c.globalAlpha = Math.min(1, reading / 0.5);
        c.font = 'italic 40px "Cormorant Garamond", Georgia, serif';
        targets
          .filter((_, i) => progress[i]! >= 1)
          .forEach((t, i) => drawLabel(c, ctx.t(t.label), W / 2, 190 + i * 72, '#ffd36a'));
        c.restore();
      }
      if (tutorial?.active) {
        tutorial.draw(c, time);
      } else if (reading !== null) {
        drawHints(c, ctx.t(String(params.hint ?? 'mg.reveal.hint')), reading > READ_MIN ? ctx.t('mg.readContinue') : undefined);
      } else {
        drawHints(
          c,
          ctx.t(String(params.hint ?? 'mg.reveal.hint')),
          guided ? undefined : ctx.t('mg.reveal.controls'),
        );
        drawTimeThread(c, 1 - elapsed / limit);
      }
    },
  };
};
