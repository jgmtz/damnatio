// Save the embers (flashback, O Dia da Chama): the flame went out; the child gathers every ember
// still glowing, with bare hands, into the middle of the bowl, and the flame is reborn from them.
// The screen whitens with pain as she does. Always relights.
//
// Untimed by default (the author's call: the point is that she takes them all, whatever it costs).
// With `timed: true` the embers die one by one and the outcome depends on how many were saved.
//
// params: {
//   hint?: string key, count?: number (8), timed?: boolean (false),
//   bowlArt?: art id of the brazier seen from above (drawn "cover"),
//   positions?: [{ x, y }]  embers' positions in the bowl image's pixels (e.g. on embers painted in it),
//   center?: { x, y }       where gathered embers go, in the image's pixels (default: image center)
// }
// outcomes: "many" (untimed: always) | "some" | "few"

import { drawFlame } from '../flame';
import { drawFrame } from '../fxSprites';
import { drawArm } from './arms';
import { ACTION } from './input';
import { Tutorial } from './tutorial';
import {
  clamp,
  drawHints,
  drawImageFit,
  fitPoint,
  H,
  prng,
  tutorialLabels,
  W,
  type Minigame,
  type MinigameContext,
  type MinigameFactory,
} from './types';

export interface Ember {
  x: number;
  y: number;
  /** Where the ember was lying (an ash mark stays there once it is gone). */
  homeX: number;
  homeY: number;
  /** Seconds of glow left. */
  life: number;
  maxLife: number;
  taken: boolean;
}

const DEFAULT_CENTER = { x: W / 2, y: 600 };
const GRAB_RADIUS = 70;
const HAND_SPEED = 700;

/** Embers at the given screen positions, or scattered around the center. */
export function makeEmbers(
  count: number,
  seed: number,
  relaxed: boolean,
  positions?: { x: number; y: number }[],
  center = DEFAULT_CENTER,
): Ember[] {
  const rand = prng(seed);
  const n = positions?.length ?? count;
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 + rand() * 0.5;
    const dist = 170 + rand() * 170;
    const maxLife = (2.5 + rand() * 4) * (relaxed ? 1.7 : 1);
    const p = positions?.[i] ?? { x: center.x + Math.cos(angle) * dist * 1.5, y: center.y + Math.sin(angle) * dist * 0.75 };
    return { x: p.x, y: p.y, homeX: p.x, homeY: p.y, life: maxLife, maxLife, taken: false };
  });
}

/** Tries to grab the ember nearest to (x, y). Returns true if one was taken. */
export function grabEmber(embers: Ember[], x: number, y: number): boolean {
  let best: Ember | null = null;
  let bestDist = GRAB_RADIUS;
  for (const e of embers) {
    if (e.taken || e.life <= 0) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d <= bestDist) {
      best = e;
      bestDist = d;
    }
  }
  if (best) best.taken = true;
  return best !== null;
}

export function embersOutcome(taken: number, count: number): 'many' | 'some' | 'few' {
  if (taken >= count * 0.6) return 'many';
  if (taken >= count * 0.3) return 'some';
  return 'few';
}

/** Ash covering the spot where an ember lay (hides embers painted in the artwork too). */
/** Painted embers (pedidos 4.5): frames 0–2 alive, 3–5 dying, 6–8 cold ash. */
const EMBER_SCALE = 0.36;

function drawAsh(c: CanvasRenderingContext2D, x: number, y: number, variant = 0): void {
  if (drawFrame(c, 'fx.embers', 6 + (variant % 3), x, y, EMBER_SCALE * 0.85, { alpha: 0.9 })) return;
  const g = c.createRadialGradient(x, y, 0, x, y, 30);
  g.addColorStop(0, 'rgba(70, 58, 50, 1)');
  g.addColorStop(0.7, 'rgba(70, 58, 50, 0.9)');
  g.addColorStop(1, 'rgba(70, 58, 50, 0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, 30, 0, Math.PI * 2);
  c.fill();
}

export const createEmbers: MinigameFactory = (params, ctx: MinigameContext): Minigame => {
  const bowlArt = typeof params.bowlArt === 'string' ? params.bowlArt : null;
  const timed = params.timed === true;
  const hand = { x: W / 2, y: H - 260 };
  const input = ctx.input;
  let embers: Ember[] | null = null;
  let center = DEFAULT_CENTER;
  let ending: number | null = null;
  let moved = 0;
  const startedAt = performance.now();

  /**
   * Embers are laid out once the bowl image is known (positions are given in its pixels).
   * Without artwork, or if it takes too long, they are scattered in code.
   */
  const setup = (): Ember[] | null => {
    if (embers) return embers;
    const img = bowlArt ? ctx.image(bowlArt) : null;
    // Wait (in real time, not game time) for the artwork, so embers land on the ones painted in it.
    if (bowlArt && !img && performance.now() - startedAt < 4000) return null;
    if (img) {
      const c = (params.center as { x: number; y: number } | undefined) ?? { x: img.naturalWidth / 2, y: img.naturalHeight / 2 };
      center = fitPoint(img, 'cover', c.x, c.y);
      const positions = (params.positions as { x: number; y: number }[] | undefined)?.map((p) => fitPoint(img, 'cover', p.x, p.y));
      embers = makeEmbers(Number(params.count ?? 8), 21, ctx.relaxed, positions, center);
    } else {
      embers = makeEmbers(Number(params.count ?? 8), 21, ctx.relaxed);
    }
    return embers;
  };

  const taken = () => (embers ?? []).filter((e) => e.taken).length;

  const tutorial = ctx.tutorial
    ? new Tutorial(
        [
          { text: ctx.t('mg.embers.tut1'), done: () => moved > 250 },
          { text: ctx.t('mg.embers.tut2'), done: () => taken() >= 1 },
          { text: ctx.t('mg.embers.tut3'), done: () => input.consume(ACTION) || input.consumeClick() },
        ],
        tutorialLabels(ctx.t),
      )
    : null;

  return {
    update(dt) {
      const list = setup();
      const before = { ...hand };
      if (input.mouse.moved) {
        hand.x = input.mouse.x;
        hand.y = input.mouse.y;
        input.mouse.moved = false;
      }
      hand.x = clamp(hand.x + input.horizontal * HAND_SPEED * dt, 0, W);
      hand.y = clamp(hand.y + input.vertical * HAND_SPEED * dt, 0, H);
      moved += Math.hypot(hand.x - before.x, hand.y - before.y);
      if (!list) {
        input.endFrame();
        return null;
      }

      if (tutorial?.active) {
        // Practice: the embers wait; grabbing works from the second step on.
        if (tutorial.stepIndex === 1 && (input.consumeClick() || input.consume(ACTION))) grabEmber(list, hand.x, hand.y);
        tutorial.update(dt, input.consume(['Enter']));
        input.endFrame();
        return null;
      }

      if (input.consumeClick() || input.consume(ACTION)) grabEmber(list, hand.x, hand.y);
      input.endFrame();
      if (timed) for (const e of list) if (!e.taken) e.life = Math.max(0, e.life - dt);
      // Taken embers drift to the center of the bowl.
      for (const e of list) {
        if (!e.taken) continue;
        e.x += (center.x - e.x) * Math.min(1, dt * 4);
        e.y += (center.y - e.y) * Math.min(1, dt * 4);
      }
      const done = list.every((e) => e.taken || e.life <= 0);
      if (done && ending === null) ending = 1.6;
      if (ending !== null) {
        ending -= dt;
        if (ending <= 0) return { outcome: embersOutcome(taken(), list.length), earned: [] };
      }
      return null;
    },
    draw(c, time) {
      c.fillStyle = '#0c0907';
      c.fillRect(0, 0, W, H);
      const img = bowlArt ? ctx.image(bowlArt) : null;
      if (img) {
        drawImageFit(c, img, 'cover');
        // Night: the bowl is barely lit.
        c.fillStyle = 'rgba(5, 3, 2, 0.45)';
        c.fillRect(0, 0, W, H);
      } else {
        // Altar top: a wide stone bowl full of ash.
        c.fillStyle = '#2b211b';
        c.strokeStyle = '#c8743a';
        c.lineWidth = 6;
        c.beginPath();
        c.ellipse(center.x, center.y, 620, 330, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = '#3d3029';
        c.beginPath();
        c.ellipse(center.x, center.y, 560, 280, 0, 0, Math.PI * 2);
        c.fill();
      }
      const list = embers ?? [];
      // Embers.
      for (const [i, e] of list.entries()) {
        if (e.taken || e.life <= 0) drawAsh(c, e.homeX, e.homeY, i);
        const glow = e.taken ? 1 : e.life / e.maxLife;
        if (glow <= 0) continue;
        // The painted ember: alive, then dying as its time runs out; it breathes a little light.
        const frame = (glow > 0.45 ? 0 : 3) + (i % 3);
        const breathe = 0.85 + 0.15 * Math.sin(time * 4 + i * 1.9);
        if (drawFrame(c, 'fx.embers', frame, e.x, e.y, EMBER_SCALE * 1.25, { alpha: 0.35 * glow * breathe, composite: 'lighter' })) {
          drawFrame(c, 'fx.embers', frame, e.x, e.y, EMBER_SCALE, { alpha: Math.min(1, 0.4 + glow) });
          continue;
        }
        const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, 46);
        g.addColorStop(0, `rgba(255, 200, 90, ${glow})`);
        g.addColorStop(0.4, `rgba(230, 90, 30, ${glow * 0.8})`);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(e.x, e.y, 46, 0, Math.PI * 2);
        c.fill();
      }
      // The flame is reborn from the gathered embers.
      const n = taken();
      const total = Math.max(1, list.length);
      if (n > 0) drawFlame(c, center.x, center.y + 10, 90 + n * 12, 0.4 + (n / total) * 1.1, time, 2, 'altar');
      // The child's arm reaching in. Each ember taken leaves a burn: this is where the scars come from.
      drawArm(c, { x: hand.x + 300, y: H + 200 }, hand, { width: 74, scars: Math.min(5, n), hand: 'open', limb: 'fp.livia_child.arm' });
      // Pain whitens the screen.
      c.fillStyle = `rgba(255, 245, 225, ${(n / total) * 0.3})`;
      c.fillRect(0, 0, W, H);
      // Where the flame will be reborn, and how many embers are already there.
      if (n < total) {
        const pulse = 0.5 + Math.sin(time * 3) * 0.5;
        // The painted ring of the Greek key, lying flat in the ash.
        if (!drawFrame(c, 'fx.signs', 4, center.x, center.y + 10, 0.62, { stretchY: 0.55, alpha: 0.4 + pulse * 0.35, composite: 'lighter' })) {
        c.save();
        c.strokeStyle = `rgba(255, 190, 90, ${0.35 + pulse * 0.35})`;
        c.lineWidth = 3;
        c.setLineDash([10, 10]);
        c.beginPath();
        c.ellipse(center.x, center.y + 10, 70, 40, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
        }
      }
      if (list.length) {
        c.save();
        c.font = '600 44px Cinzel, Georgia, serif';
        c.textAlign = 'right';
        c.fillStyle = '#f3d9a0';
        c.shadowColor = 'rgba(0, 0, 0, 0.9)';
        c.shadowBlur = 10;
        c.fillText(`${n} / ${total}`, W - 70, 100);
        c.restore();
      }
      if (tutorial?.active) tutorial.draw(c, time);
      else drawHints(c, ctx.t(String(params.hint ?? 'mg.embers.hint')), ctx.t('mg.embers.controls'));
    },
  };
};
